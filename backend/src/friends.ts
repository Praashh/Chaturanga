import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from './db';
import { extractToken } from './auth';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const friendsPlugin = new Elysia({ prefix: '/api/friends' })
  .use(
    jwt({
      name: 'sessionJwt',
      secret: JWT_SECRET,
      exp: '7d',
    })
  )
  .derive(async ({ cookie, headers, sessionJwt }) => {
    const token = extractToken(cookie, headers);
    if (!token) {
      return { userId: null };
    }
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

  // GET /api/friends - Get all confirmed friends and pending requests
  .get('/', async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: 'Unauthorized: Sign in required to access friends' };
    }

    try {
      const [friends, requests] = await Promise.all([
        getFriends(userId),
        getFriendRequests(userId),
      ]);

      return {
        success: true,
        friends,
        incoming: requests.incoming,
        outgoing: requests.outgoing,
      };
    } catch (err: any) {
      console.error('Error fetching friends:', err);
      set.status = 500;
      return { error: 'Failed to fetch friends' };
    }
  })

  // GET /api/friends/search?q=... - Search players by name or email
  .get(
    '/search',
    async ({ userId, query, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required to search players' };
      }

      const q = query.q || '';
      try {
        const users = await searchUsers(userId, q);
        return {
          success: true,
          users,
        };
      } catch (err: any) {
        console.error('Error searching players:', err);
        set.status = 500;
        return { error: 'Failed to search players' };
      }
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/friends/request - Send friend request by user ID or email
  .post(
    '/request',
    async ({ userId, body, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required' };
      }

      const target =
        body.target?.trim() ||
        body.username?.trim() ||
        body.receiverId?.trim() ||
        body.email?.trim();
      if (!target) {
        set.status = 400;
        return { error: 'Target player username, ID, or email is required' };
      }

      try {
        const result = await sendFriendRequest(userId, target);
        if (!result.success) {
          set.status = 400;
          return { error: result.error || 'Failed to send friend request' };
        }

        return {
          success: true,
          message: result.autoAccepted
            ? 'Alliance mutual! You are now allies.'
            : 'Alliance request sent successfully.',
        };
      } catch (err: any) {
        console.error('Error sending friend request:', err);
        set.status = 500;
        return { error: 'Failed to send friend request' };
      }
    },
    {
      body: t.Object({
        target: t.Optional(t.String()),
        username: t.Optional(t.String()),
        receiverId: t.Optional(t.String()),
        email: t.Optional(t.String()),
      }),
    }
  )

  // POST /api/friends/accept - Accept incoming friend request
  .post(
    '/accept',
    async ({ userId, body, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required' };
      }

      const requestId = Number(body.requestId);
      if (!requestId) {
        set.status = 400;
        return { error: 'Invalid friend request ID' };
      }

      try {
        const result = await acceptFriendRequest(requestId, userId);
        if (!result.success) {
          set.status = 400;
          return { error: result.error || 'Failed to accept friend request' };
        }

        return {
          success: true,
          message: 'Friend request accepted!',
        };
      } catch (err: any) {
        console.error('Error accepting friend request:', err);
        set.status = 500;
        return { error: 'Failed to accept friend request' };
      }
    },
    {
      body: t.Object({
        requestId: t.Numeric(),
      }),
    }
  )

  // POST /api/friends/reject - Reject or cancel friend request
  .post(
    '/reject',
    async ({ userId, body, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required' };
      }

      const requestId = Number(body.requestId);
      if (!requestId) {
        set.status = 400;
        return { error: 'Invalid friend request ID' };
      }

      try {
        const result = await rejectFriendRequest(requestId, userId);
        if (!result.success) {
          set.status = 400;
          return { error: result.error || 'Failed to decline friend request' };
        }

        return {
          success: true,
          message: 'Friend request declined or cancelled.',
        };
      } catch (err: any) {
        console.error('Error declining friend request:', err);
        set.status = 500;
        return { error: 'Failed to decline friend request' };
      }
    },
    {
      body: t.Object({
        requestId: t.Numeric(),
      }),
    }
  )

  // DELETE /api/friends/:friendId - Remove friendship
  .delete(
    '/:friendId',
    async ({ userId, params, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required' };
      }

      const friendId = params.friendId;
      if (!friendId) {
        set.status = 400;
        return { error: 'Friend ID is required' };
      }

      try {
        const result = await removeFriend(userId, friendId);
        if (!result.success) {
          set.status = 400;
          return { error: result.error || 'Failed to remove friend' };
        }

        return {
          success: true,
          message: 'Friend removed successfully.',
        };
      } catch (err: any) {
        console.error('Error removing friend:', err);
        set.status = 500;
        return { error: 'Failed to remove friend' };
      }
    },
    {
      params: t.Object({
        friendId: t.String(),
      }),
    }
  );
