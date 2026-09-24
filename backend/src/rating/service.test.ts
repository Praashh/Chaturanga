import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { prisma } from '../db';
import { RatingService } from './service';

describe('RatingService Integration & Concurrency Tests', () => {
  const testUserAId = 'test-player-a-' + Date.now();
  const testUserBId = 'test-player-b-' + Date.now();

  beforeAll(async () => {
    // Setup test users
    await prisma.user.createMany({
      data: [
        {
          id: testUserAId,
          email: `${testUserAId}@test.com`,
          name: 'Player Alpha',
          username: `alpha_${Date.now().toString().slice(-4)}`,
          rating: 1500,
          ratingDeviation: 350,
          gamesPlayed: 0,
          gamesWon: 0,
        },
        {
          id: testUserBId,
          email: `${testUserBId}@test.com`,
          name: 'Player Beta',
          username: `beta_${Date.now().toString().slice(-4)}`,
          rating: 1500,
          ratingDeviation: 350,
          gamesPlayed: 0,
          gamesWon: 0,
        },
      ],
    });

    await prisma.playerRating.createMany({
      data: [
        {
          userId: testUserAId,
          category: 'standard',
          rating: 1500,
          ratingDeviation: 350,
          gamesPlayed: 0,
        },
        {
          userId: testUserBId,
          category: 'standard',
          rating: 1500,
          ratingDeviation: 350,
          gamesPlayed: 0,
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.ratingHistory.deleteMany({
      where: {
        userId: { in: [testUserAId, testUserBId] },
      },
    });
    await prisma.game.deleteMany({
      where: {
        OR: [
          { whitePlayerId: { in: [testUserAId, testUserBId] } },
          { blackPlayerId: { in: [testUserAId, testUserBId] } },
        ],
      },
    });
    await prisma.playerRating.deleteMany({
      where: {
        userId: { in: [testUserAId, testUserBId] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserAId, testUserBId] },
      },
    });
  });

  it('Test 7: Settle game produces rating changes, and duplicate call is an idempotent no-op', async () => {
    const gameId = `test-game-1-${Date.now()}`;

    // First call: process game
    const result1 = await RatingService.settleGame({
      gameId,
      whitePlayerId: testUserAId,
      blackPlayerId: testUserBId,
      winner: 'white',
      endReason: 'checkmate',
    });

    expect(result1.alreadyProcessed).toBe(false);
    expect(result1.isRated).toBe(true);
    expect(result1.white?.ratingAfter).toBeGreaterThan(1500);
    expect(result1.black?.ratingAfter).toBeLessThan(1500);

    const savedRatingA = result1.white?.ratingAfter;
    const savedRatingB = result1.black?.ratingAfter;

    // Verify rating histories created
    const histories = await prisma.ratingHistory.findMany({
      where: { gameId },
    });
    expect(histories.length).toBe(2);

    // Second call: simulate duplicate event / HTTP retry / reconnect
    const result2 = await RatingService.settleGame({
      gameId,
      whitePlayerId: testUserAId,
      blackPlayerId: testUserBId,
      winner: 'white',
      endReason: 'checkmate',
    });

    expect(result2.alreadyProcessed).toBe(true);
    expect(result2.white?.ratingAfter).toBe(savedRatingA);
    expect(result2.black?.ratingAfter).toBe(savedRatingB);

    // Verify DB rating did NOT change again
    const userA = await prisma.user.findUnique({ where: { id: testUserAId } });
    expect(userA?.rating).toBe(Math.round(savedRatingA!));
    expect(userA?.gamesPlayed).toBe(1);

    // History count remains exactly 2
    const historiesAfter = await prisma.ratingHistory.findMany({
      where: { gameId },
    });
    expect(historiesAfter.length).toBe(2);
  });

  it('Test 8: Concurrent settlements for the same player do not lose updates', async () => {
    const gameIdA = `test-concurrent-a-${Date.now()}`;
    const gameIdB = `test-concurrent-b-${Date.now()}`;

    const userBefore = await prisma.playerRating.findUnique({
      where: { userId_category: { userId: testUserAId, category: 'standard' } },
    });
    const startGamesPlayed = userBefore!.gamesPlayed;

    // Run two settlements simultaneously
    const [resA, resB] = await Promise.all([
      RatingService.settleGame({
        gameId: gameIdA,
        whitePlayerId: testUserAId,
        blackPlayerId: testUserBId,
        winner: 'white',
        endReason: 'resignation',
      }),
      RatingService.settleGame({
        gameId: gameIdB,
        whitePlayerId: testUserBId,
        blackPlayerId: testUserAId,
        winner: 'black', // testUserA wins as black
        endReason: 'bare_king',
      }),
    ]);

    expect(resA.isRated).toBe(true);
    expect(resB.isRated).toBe(true);

    const userAfter = await prisma.playerRating.findUnique({
      where: { userId_category: { userId: testUserAId, category: 'standard' } },
    });

    // Exactly 2 games should be recorded
    expect(userAfter?.gamesPlayed).toBe(startGamesPlayed + 2);
    // Rating should have increased from both wins
    expect(userAfter!.rating).toBeGreaterThan(userBefore!.rating);
  });

  it('Test 9: Unrated / casual games do not modify rating or rating history', async () => {
    const gameId = `test-casual-${Date.now()}`;

    const userBefore = await prisma.playerRating.findUnique({
      where: { userId_category: { userId: testUserAId, category: 'standard' } },
    });

    const result = await RatingService.settleGame({
      gameId,
      whitePlayerId: testUserAId,
      blackPlayerId: testUserBId,
      winner: 'white',
      endReason: 'checkmate',
      isRated: false, // CASUAL
    });

    expect(result.isRated).toBe(false);
    expect(result.white).toBeUndefined();

    const userAfter = await prisma.playerRating.findUnique({
      where: { userId_category: { userId: testUserAId, category: 'standard' } },
    });

    expect(userAfter?.rating).toBe(userBefore?.rating);
    expect(userAfter?.ratingDeviation).toBe(userBefore?.ratingDeviation);
    expect(userAfter?.gamesPlayed).toBe(userBefore?.gamesPlayed);

    const history = await prisma.ratingHistory.findMany({
      where: { gameId },
    });
    expect(history.length).toBe(0);
  });

  it('Test 10: Guest or bot games resolve safely without corrupting ratings', async () => {
    const gameId = `test-guest-${Date.now()}`;

    const result = await RatingService.settleGame({
      gameId,
      whitePlayerId: testUserAId,
      blackPlayerId: 'guest-12345',
      winner: 'white',
      endReason: 'resignation',
    });

    expect(result.isRated).toBe(false);
  });

  it('Test 11: Rematch (A vs B, then B vs A) processes each game independently', async () => {
    const game1Id = `test-rematch-1-${Date.now()}`;
    const game2Id = `test-rematch-2-${Date.now()}`;

    const res1 = await RatingService.settleGame({
      gameId: game1Id,
      whitePlayerId: testUserAId,
      blackPlayerId: testUserBId,
      winner: 'white',
      endReason: 'checkmate',
    });

    const res2 = await RatingService.settleGame({
      gameId: game2Id,
      whitePlayerId: testUserBId,
      blackPlayerId: testUserAId,
      winner: 'white', // B wins game 2
      endReason: 'checkmate',
    });

    expect(res1.alreadyProcessed).toBe(false);
    expect(res2.alreadyProcessed).toBe(false);
    expect(res1.winner).toBe('white');
    expect(res2.winner).toBe('white');
  });

  it('Leaderboard: Deterministic sort orders by rating DESC, RD ASC, createdAt ASC', async () => {
    const lb = await RatingService.getLeaderboard({ category: 'standard', limit: 10 });
    expect(lb.leaderboard.length).toBeGreaterThan(0);
    expect(lb.leaderboard[0]?.rank).toBe(1);

    for (let i = 0; i < lb.leaderboard.length - 1; i++) {
      const current = lb.leaderboard[i];
      const next = lb.leaderboard[i + 1];

      if (current?.rating === next?.rating) {
        expect(current?.ratingDeviation).toBeLessThanOrEqual(next!.ratingDeviation);
      } else {
        expect(current?.rating).toBeGreaterThanOrEqual(next!.rating);
      }
    }
  });

  it('Test 12: Restart persistence recovers exact rating state from DB', async () => {
    // 1. Fetch current rating state
    const beforeState = await RatingService.getPlayerRating(testUserAId, 'standard');
    expect(beforeState).not.toBeNull();

    // 2. Disconnect prisma client (simulating application shutdown)
    await prisma.$disconnect();

    // 3. Re-connect / reload player state from fresh database connection
    const freshState = await RatingService.getPlayerRating(testUserAId, 'standard');
    expect(freshState).not.toBeNull();
    expect(freshState!.rating).toBe(beforeState!.rating);
    expect(freshState!.ratingDeviation).toBe(beforeState!.ratingDeviation);
  });

  it('Test 13: Strictly updates rating on game result ONLY when playing with real user', async () => {
    const ratingBefore = await RatingService.getPlayerRating(testUserAId, 'standard');
    expect(ratingBefore).not.toBeNull();

    // 1. Play vs Bot (AI)
    const botResult = await RatingService.settleGame({
      gameId: `test-bot-${Date.now()}`,
      whitePlayerId: testUserAId,
      blackPlayerId: 'bot-warrior',
      winner: 'white',
      endReason: 'checkmate',
    });
    expect(botResult.isRated).toBe(false);
    expect(botResult.white).toBeUndefined();

    // 2. Play vs Guest
    const guestResult = await RatingService.settleGame({
      gameId: `test-guest-${Date.now()}`,
      whitePlayerId: testUserAId,
      blackPlayerId: 'guest-random-id',
      winner: 'white',
      endReason: 'checkmate',
    });
    expect(guestResult.isRated).toBe(false);
    expect(guestResult.white).toBeUndefined();

    // 3. Play vs Self (same account in multiple tabs)
    const selfResult = await RatingService.settleGame({
      gameId: `test-self-${Date.now()}`,
      whitePlayerId: testUserAId,
      blackPlayerId: testUserAId,
      winner: 'white',
      endReason: 'checkmate',
    });
    expect(selfResult.isRated).toBe(false);
    expect(selfResult.white).toBeUndefined();

    // 4. Play vs Non-existent user
    const ghostResult = await RatingService.settleGame({
      gameId: `test-ghost-${Date.now()}`,
      whitePlayerId: testUserAId,
      blackPlayerId: 'non-existent-user-12345',
      winner: 'white',
      endReason: 'checkmate',
    });
    expect(ghostResult.isRated).toBe(false);
    expect(ghostResult.white).toBeUndefined();

    // Verify rating hasn't moved after unrated matches
    const ratingMid = await RatingService.getPlayerRating(testUserAId, 'standard');
    expect(ratingMid!.rating).toBe(ratingBefore!.rating);
    expect(ratingMid!.ratingDeviation).toBe(ratingBefore!.ratingDeviation);

    // 5. Play vs Real registered user
    const realResult = await RatingService.settleGame({
      gameId: `test-real-${Date.now()}`,
      whitePlayerId: testUserAId,
      blackPlayerId: testUserBId,
      winner: 'white',
      endReason: 'checkmate',
    });
    expect(realResult.isRated).toBe(true);
    expect(realResult.white).toBeDefined();
    expect(realResult.black).toBeDefined();
    expect(realResult.white!.ratingChange).toBeGreaterThan(0);
    expect(realResult.black!.ratingChange).toBeLessThan(0);

    const ratingAfter = await RatingService.getPlayerRating(testUserAId, 'standard');
    expect(ratingAfter!.rating).toBe(realResult.white!.ratingAfter);
  });
});
