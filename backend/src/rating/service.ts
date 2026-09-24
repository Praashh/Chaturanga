import { prisma } from '../db';
import {
  calculateGlickoMatch,
  GLICKO_CONSTANTS,
  type PlayerRatingState,
} from './glicko';

export interface SettleGameInput {
  gameId: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  winner: 'white' | 'black' | 'draw';
  endReason: 'checkmate' | 'bare_king' | 'resignation' | 'stalemate' | 'abandoned' | 'timeout';
  category?: string;
  isRated?: boolean;
}

export interface PlayerSettlementSummary {
  userId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  ratingDeviationBefore: number;
  ratingDeviationAfter: number;
}

export interface SettlementResult {
  alreadyProcessed: boolean;
  gameId: string;
  isRated: boolean;
  winner: 'white' | 'black' | 'draw';
  endReason: string;
  white?: PlayerSettlementSummary;
  black?: PlayerSettlementSummary;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string;
  picture: string | null;
  rating: number;
  ratingDeviation: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesDrawn: number;
  gamesLost: number;
  winRate: number;
}

export class RatingService {
  /**
   * Settles a game atomically with strict idempotency and concurrency protection.
   *
   * Guarantees:
   * 1. Exactly-once rating updates via database transactions and row-level locks.
   * 2. No lost updates under concurrent game completions.
   * 3. No deadlocks by acquiring locks in deterministic (alphabetical) order of player IDs.
   * 4. Immutable rating history creation.
   * 5. Unrated/casual games bypass rating adjustments.
   */
  public static async settleGame(input: SettleGameInput): Promise<SettlementResult> {
    const {
      gameId,
      whitePlayerId,
      blackPlayerId,
      winner,
      endReason,
      category = 'standard',
      isRated = true,
    } = input;

    // Both players must be registered users for a rated game
    const canBeRated =
      isRated &&
      !!whitePlayerId &&
      !!blackPlayerId &&
      whitePlayerId !== blackPlayerId &&
      !whitePlayerId.startsWith('guest-') &&
      !blackPlayerId.startsWith('guest-') &&
      !whitePlayerId.startsWith('bot-') &&
      !blackPlayerId.startsWith('bot-');

    return await prisma.$transaction(async (tx) => {
      // 1. Ensure game record exists and lock it
      let game = await tx.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        const [whiteUserExists, blackUserExists] = await Promise.all([
          whitePlayerId ? tx.user.findUnique({ where: { id: whitePlayerId }, select: { id: true } }) : null,
          blackPlayerId ? tx.user.findUnique({ where: { id: blackPlayerId }, select: { id: true } }) : null,
        ]);

        game = await tx.game.create({
          data: {
            id: gameId,
            category,
            isRated: canBeRated && !!whiteUserExists && !!blackUserExists,
            whitePlayerId: whiteUserExists ? whitePlayerId : null,
            blackPlayerId: blackUserExists ? blackPlayerId : null,
            status: 'in_progress',
          },
        });
      }

      // Lock game row using FOR UPDATE to serialize concurrent settlement attempts
      const lockedGameRows = await tx.$queryRaw<Array<{ id: string; ratingProcessed: boolean }>>`
        SELECT "id", "ratingProcessed"
        FROM "game"
        WHERE "id" = ${gameId}
        FOR UPDATE
      `;

      if (lockedGameRows.length > 0 && lockedGameRows[0]?.ratingProcessed) {
        // Idempotency: Game has already been settled!
        console.log(`[RatingService] Game ${gameId} has already been settled. Returning existing settlement.`);
        const histories = await tx.ratingHistory.findMany({
          where: { gameId },
        });

        const whiteHist = histories.find((h) => h.userId === whitePlayerId);
        const blackHist = histories.find((h) => h.userId === blackPlayerId);

        return {
          alreadyProcessed: true,
          gameId,
          isRated: game.isRated,
          winner,
          endReason,
          white: whiteHist
            ? {
              userId: whiteHist.userId,
              ratingBefore: whiteHist.ratingBefore,
              ratingAfter: whiteHist.ratingAfter,
              ratingChange: whiteHist.ratingChange,
              ratingDeviationBefore: whiteHist.ratingDeviationBefore,
              ratingDeviationAfter: whiteHist.ratingDeviationAfter,
            }
            : undefined,
          black: blackHist
            ? {
              userId: blackHist.userId,
              ratingBefore: blackHist.ratingBefore,
              ratingAfter: blackHist.ratingAfter,
              ratingChange: blackHist.ratingChange,
              ratingDeviationBefore: blackHist.ratingDeviationBefore,
              ratingDeviationAfter: blackHist.ratingDeviationAfter,
            }
            : undefined,
        };
      }

      // Handle Unrated / Casual match
      if (!canBeRated || !whitePlayerId || !blackPlayerId) {
        await tx.game.update({
          where: { id: gameId },
          data: {
            winner,
            endReason,
            status: 'completed',
            isRated: false,
            completedAt: new Date(),
          },
        });

        console.log(`[RatingService] Game ${gameId} settled as UNRATED (${endReason}, winner: ${winner}).`);
        return {
          alreadyProcessed: false,
          gameId,
          isRated: false,
          winner,
          endReason,
        };
      }

      // 2. Deadlock-free locking: Sort user IDs alphabetically
      const [firstUserId, secondUserId] = [whitePlayerId, blackPlayerId].sort();

      // Ensure both players exist in user table
      const [whiteUser, blackUser] = await Promise.all([
        tx.user.findUnique({ where: { id: whitePlayerId } }),
        tx.user.findUnique({ where: { id: blackPlayerId } }),
      ]);

      if (!whiteUser || !blackUser) {
        console.warn(`[RatingService] One or both users not found in DB (${whitePlayerId}, ${blackPlayerId}). Marking unrated.`);
        await tx.game.update({
          where: { id: gameId },
          data: {
            winner,
            endReason,
            status: 'completed',
            isRated: false,
            completedAt: new Date(),
          },
        });
        return {
          alreadyProcessed: false,
          gameId,
          isRated: false,
          winner,
          endReason,
        };
      }

      // Ensure PlayerRating exists for both users in this category
      await Promise.all([
        tx.playerRating.upsert({
          where: { userId_category: { userId: whitePlayerId, category } },
          create: {
            userId: whitePlayerId,
            category,
            rating: whiteUser.rating || GLICKO_CONSTANTS.DEFAULT_RATING,
            ratingDeviation: whiteUser.ratingDeviation || GLICKO_CONSTANTS.DEFAULT_RD,
          },
          update: {},
        }),
        tx.playerRating.upsert({
          where: { userId_category: { userId: blackPlayerId, category } },
          create: {
            userId: blackPlayerId,
            category,
            rating: blackUser.rating || GLICKO_CONSTANTS.DEFAULT_RATING,
            ratingDeviation: blackUser.ratingDeviation || GLICKO_CONSTANTS.DEFAULT_RD,
          },
          update: {},
        }),
      ]);

      // Lock player_rating rows in strictly ordered sequence to prevent deadlocks and lost updates
      await tx.$queryRaw`
        SELECT "id" FROM "player_rating"
        WHERE "userId" IN (${firstUserId}, ${secondUserId}) AND "category" = ${category}
        ORDER BY "userId" ASC
        FOR UPDATE
      `;

      // Read current state
      const [whiteRating, blackRating] = await Promise.all([
        tx.playerRating.findUniqueOrThrow({
          where: { userId_category: { userId: whitePlayerId, category } },
        }),
        tx.playerRating.findUniqueOrThrow({
          where: { userId_category: { userId: blackPlayerId, category } },
        }),
      ]);

      // Calculate elapsed days for RD inactivity decay
      const now = new Date();
      const elapsedDaysWhite = whiteRating.lastRatedGameAt
        ? Math.max(0, (now.getTime() - whiteRating.lastRatedGameAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const elapsedDaysBlack = blackRating.lastRatedGameAt
        ? Math.max(0, (now.getTime() - blackRating.lastRatedGameAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Map outcome to score (White perspective)
      const whiteScore = winner === 'white' ? 1 : winner === 'draw' ? 0.5 : 0;

      // 3. Compute Glicko-1 rating update
      const glickoResult = calculateGlickoMatch(
        { rating: whiteRating.rating, ratingDeviation: whiteRating.ratingDeviation },
        { rating: blackRating.rating, ratingDeviation: blackRating.ratingDeviation },
        whiteScore,
        elapsedDaysWhite,
        elapsedDaysBlack
      );

      // 4. Update player_rating records
      const isWhiteWin = winner === 'white';
      const isBlackWin = winner === 'black';
      const isDraw = winner === 'draw';

      await Promise.all([
        tx.playerRating.update({
          where: { userId_category: { userId: whitePlayerId, category } },
          data: {
            rating: glickoResult.player1.ratingAfter,
            ratingDeviation: glickoResult.player1.ratingDeviationAfter,
            gamesPlayed: { increment: 1 },
            ...(isWhiteWin
              ? { gamesWon: { increment: 1 } }
              : isDraw
                ? { gamesDrawn: { increment: 1 } }
                : { gamesLost: { increment: 1 } }),
            lastRatedGameAt: now,
          },
        }),
        tx.playerRating.update({
          where: { userId_category: { userId: blackPlayerId, category } },
          data: {
            rating: glickoResult.player2.ratingAfter,
            ratingDeviation: glickoResult.player2.ratingDeviationAfter,
            gamesPlayed: { increment: 1 },
            ...(isBlackWin
              ? { gamesWon: { increment: 1 } }
              : isDraw
                ? { gamesDrawn: { increment: 1 } }
                : { gamesLost: { increment: 1 } }),
            lastRatedGameAt: now,
          },
        }),
      ]);

      // 5. Update user table (maintains backward compatibility with all existing app queries)
      await Promise.all([
        tx.user.update({
          where: { id: whitePlayerId },
          data: {
            rating: Math.round(glickoResult.player1.ratingAfter),
            ratingDeviation: glickoResult.player1.ratingDeviationAfter,
            gamesPlayed: { increment: 1 },
            ...(isWhiteWin ? { gamesWon: { increment: 1 } } : {}),
            lastRatedGameAt: now,
          },
        }),
        tx.user.update({
          where: { id: blackPlayerId },
          data: {
            rating: Math.round(glickoResult.player2.ratingAfter),
            ratingDeviation: glickoResult.player2.ratingDeviationAfter,
            gamesPlayed: { increment: 1 },
            ...(isBlackWin ? { gamesWon: { increment: 1 } } : {}),
            lastRatedGameAt: now,
          },
        }),
      ]);

      // 6. Record immutable rating histories (Unique constraint @@unique([gameId, userId]) prevents duplicates)
      await tx.ratingHistory.createMany({
        data: [
          {
            gameId,
            userId: whitePlayerId,
            category,
            ratingBefore: glickoResult.player1.ratingBefore,
            ratingAfter: glickoResult.player1.ratingAfter,
            ratingChange: glickoResult.player1.ratingChange,
            ratingDeviationBefore: glickoResult.player1.ratingDeviationBefore,
            ratingDeviationAfter: glickoResult.player1.ratingDeviationAfter,
            result: whiteScore,
            opponentUserId: blackPlayerId,
            opponentRatingBefore: glickoResult.player2.ratingBefore,
            opponentRDBefore: glickoResult.player2.ratingDeviationBefore,
            ratingSystem: 'glicko-1',
            ratingVersion: 1,
          },
          {
            gameId,
            userId: blackPlayerId,
            category,
            ratingBefore: glickoResult.player2.ratingBefore,
            ratingAfter: glickoResult.player2.ratingAfter,
            ratingChange: glickoResult.player2.ratingChange,
            ratingDeviationBefore: glickoResult.player2.ratingDeviationBefore,
            ratingDeviationAfter: glickoResult.player2.ratingDeviationAfter,
            result: 1 - whiteScore,
            opponentUserId: whitePlayerId,
            opponentRatingBefore: glickoResult.player1.ratingBefore,
            opponentRDBefore: glickoResult.player1.ratingDeviationBefore,
            ratingSystem: 'glicko-1',
            ratingVersion: 1,
          },
        ],
      });

      // 7. Mark game as settled
      await tx.game.update({
        where: { id: gameId },
        data: {
          winner,
          endReason,
          status: 'completed',
          ratingProcessed: true,
          ratingProcessedAt: now,
          completedAt: now,
        },
      });

      // Structured audit logging
      console.log(
        JSON.stringify({
          event: 'RATING_SETTLEMENT_SUCCESS',
          gameId,
          category,
          endReason,
          winner,
          white: {
            userId: whitePlayerId,
            ratingBefore: glickoResult.player1.ratingBefore,
            ratingAfter: glickoResult.player1.ratingAfter,
            change: glickoResult.player1.ratingChange,
            rdBefore: glickoResult.player1.ratingDeviationBefore,
            rdAfter: glickoResult.player1.ratingDeviationAfter,
          },
          black: {
            userId: blackPlayerId,
            ratingBefore: glickoResult.player2.ratingBefore,
            ratingAfter: glickoResult.player2.ratingAfter,
            change: glickoResult.player2.ratingChange,
            rdBefore: glickoResult.player2.ratingDeviationBefore,
            rdAfter: glickoResult.player2.ratingDeviationAfter,
          },
          timestamp: now.toISOString(),
        })
      );

      return {
        alreadyProcessed: false,
        gameId,
        isRated: true,
        winner,
        endReason,
        white: {
          userId: whitePlayerId,
          ratingBefore: glickoResult.player1.ratingBefore,
          ratingAfter: glickoResult.player1.ratingAfter,
          ratingChange: glickoResult.player1.ratingChange,
          ratingDeviationBefore: glickoResult.player1.ratingDeviationBefore,
          ratingDeviationAfter: glickoResult.player1.ratingDeviationAfter,
        },
        black: {
          userId: blackPlayerId,
          ratingBefore: glickoResult.player2.ratingBefore,
          ratingAfter: glickoResult.player2.ratingAfter,
          ratingChange: glickoResult.player2.ratingChange,
          ratingDeviationBefore: glickoResult.player2.ratingDeviationBefore,
          ratingDeviationAfter: glickoResult.player2.ratingDeviationAfter,
        },
      };
    });
  }

  /**
   * Deterministic Leaderboard query reading authoritative stored ratings.
   * Sorting criteria:
   * 1. rating DESC (higher rating first)
   * 2. ratingDeviation ASC (lower uncertainty / more established first)
   * 3. createdAt ASC (earlier registered user first)
   */
  public static async getLeaderboard(params: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; leaderboard: LeaderboardEntry[] }> {
    const category = params.category || 'standard';
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);

    const [total, rows] = await Promise.all([
      prisma.playerRating.count({ where: { category } }),
      prisma.playerRating.findMany({
        where: { category },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              picture: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { ratingDeviation: 'asc' },
          { user: { createdAt: 'asc' } },
        ],
        take: limit,
        skip: offset,
      }),
    ]);

    const leaderboard: LeaderboardEntry[] = rows.map((r, index) => {
      const winRate = r.gamesPlayed > 0 ? Math.round((r.gamesWon / r.gamesPlayed) * 100) : 0;
      return {
        rank: offset + index + 1,
        userId: r.userId,
        username: r.user.username,
        name: r.user.name,
        picture: r.user.picture,
        rating: Math.round(r.rating),
        ratingDeviation: Math.round(r.ratingDeviation * 10) / 10,
        gamesPlayed: r.gamesPlayed,
        gamesWon: r.gamesWon,
        gamesDrawn: r.gamesDrawn,
        gamesLost: r.gamesLost,
        winRate,
      };
    });

    return { total, leaderboard };
  }

  /**
   * Returns immutable rating history for a player.
   */
  public static async getPlayerRatingHistory(
    userId: string,
    limit: number = 30
  ) {
    return await prisma.ratingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        game: {
          select: {
            id: true,
            winner: true,
            endReason: true,
            completedAt: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves player's current authoritative rating state.
   */
  public static async getPlayerRating(
    userId: string,
    category: string = 'standard'
  ): Promise<PlayerRatingState | null> {
    const pr = await prisma.playerRating.findUnique({
      where: { userId_category: { userId, category } },
    });

    if (!pr) return null;
    return {
      rating: pr.rating,
      ratingDeviation: pr.ratingDeviation,
    };
  }
}
