import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { RatingService } from './service';
import { prisma } from '../db';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const ratingPlugin = new Elysia({ prefix: '/api' })
  .use(
    jwt({
      name: 'sessionJwt',
      secret: JWT_SECRET,
      exp: '7d',
    })
  )
  .derive(async ({ headers, sessionJwt }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null };
    }
    const token = authHeader.substring(7);
    try {
      const payload = await sessionJwt.verify(token);
      if (payload && payload.sub) {
        return { userId: payload.sub as string };
      }
    } catch {
      // invalid token
    }
    return { userId: null };
  })

  // GET /api/leaderboard - Authoritative player rankings
  .get(
    '/leaderboard',
    async ({ query, set }) => {
      try {
        const category = query.category || 'standard';
        const limit = query.limit ? parseInt(query.limit, 10) : 50;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;

        const data = await RatingService.getLeaderboard({
          category,
          limit,
          offset,
        });

        return {
          success: true,
          category,
          total: data.total,
          leaderboard: data.leaderboard,
        };
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        set.status = 500;
        return { error: 'Failed to fetch leaderboard' };
      }
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/rating/history - Immutable rating history of current player
  .get('/rating/history', async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: 'Unauthorized: Sign in required to view rating history' };
    }

    try {
      const history = await RatingService.getPlayerRatingHistory(userId);
      return {
        success: true,
        history,
      };
    } catch (err: any) {
      console.error(`Error fetching rating history for ${userId}:`, err);
      set.status = 500;
      return { error: 'Failed to fetch rating history' };
    }
  })

  // GET /api/rating/me - Current authoritative rating and RD
  .get('/rating/me', async ({ userId, query, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: 'Unauthorized: Sign in required' };
    }

    try {
      const category = query.category || 'standard';
      const ratingState = await RatingService.getPlayerRating(userId, category);

      if (!ratingState) {
        // Fallback to user row if player_rating row hasn't been generated
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { rating: true, ratingDeviation: true },
        });

        return {
          success: true,
          category,
          rating: user?.rating ?? 1500,
          ratingDeviation: user?.ratingDeviation ?? 350,
        };
      }

      return {
        success: true,
        category,
        rating: Math.round(ratingState.rating),
        ratingDeviation: Math.round(ratingState.ratingDeviation * 10) / 10,
      };
    } catch (err: any) {
      console.error(`Error fetching rating for ${userId}:`, err);
      set.status = 500;
      return { error: 'Failed to fetch rating' };
    }
  });
