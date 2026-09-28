import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { OAuth2Client } from 'google-auth-library';
import {
  upsertUser,
  getUserById,
  isUsernameAvailable,
  completeUserOnboarding,
  type UserRecord,
} from './db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const FRONTEND_URL = (process.env.FRONTEND_URL as string).replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET as string;
const BASE_URL = (process.env.BASE_URL as string).replace(/\/$/, '');

export const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.RENDER === 'true' ||
  Boolean(process.env.RENDER);

export const SESSION_COOKIE_NAME = 'chaturanga_session';

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

export const extractToken = (
  cookie: any,
  headers: Record<string, string | undefined>
): string | null => {
  const cookieVal = cookie?.[SESSION_COOKIE_NAME]?.value;
  if (cookieVal && typeof cookieVal === 'string' && cookieVal.trim()) {
    return cookieVal.trim();
  }
  const authHeader = headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
};

const googleClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: `${BASE_URL}/api/auth/google/callback`,
});

export const authPlugin = new Elysia({ prefix: '/api/auth' })
  .use(
    jwt({
      name: 'sessionJwt',
      secret: JWT_SECRET,
      exp: '7d',
    })
  )
  // Public config endpoint: returns Google Client ID so frontend can dynamically load it
  .get('/config', () => {
    return {
      googleClientId: GOOGLE_CLIENT_ID,
    };
  })

  // Google ID Token / One-Tap / Popup Verification
  .post(
    '/google',
    async ({ body, cookie, sessionJwt, set }) => {
      const { credential } = body;

      if (!credential) {
        set.status = 400;
        return { error: 'Missing Google credential token' };
      }

      try {
        let sub: string;
        let email: string;
        let name: string;
        let picture: string | null = null;

        // Verify ID Token with Google
        if (GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();

          if (!payload || !payload.sub || !payload.email) {
            set.status = 401;
            return { error: 'Invalid Google token payload' };
          }

          sub = payload.sub;
          email = payload.email;
          name = payload.name || payload.email.split('@')[0] || 'Warrior';
          picture = payload.picture || null;
        } else {
          // Fallback if client ID is not yet provided
          set.status = 400;
          return {
            error: 'Google Client ID is not configured in backend environment variables.',
          };
        }

        // Upsert User in PostgreSQL database via Prisma v8
        const user = await upsertUser({
          id: sub,
          email,
          name,
          picture,
        });

        // Generate Chaturanga session JWT
        const token = await sessionJwt.sign({
          sub: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
        });

        // Set HttpOnly session cookie
        cookie[SESSION_COOKIE_NAME]?.set({
          value: token,
          ...getSessionCookieOptions(),
        });

        return {
          success: true,
          token,
          user,
        };
      } catch (err: any) {
        console.error('Google token verification failed:', err);
        set.status = 401;
        return { error: err.message || 'Google authentication failed' };
      }
    },
    {
      body: t.Object({
        credential: t.String(),
      }),
    }
  )

  // Get Current Authenticated User profile & ratings from PostgreSQL
  .get('/me', async ({ cookie, headers, sessionJwt, set }) => {
    const token = extractToken(cookie, headers);
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized: Missing session cookie or authorization header' };
    }

    let payload: any;
    try {
      payload = await sessionJwt.verify(token);
    } catch {
      set.status = 401;
      return { error: 'Unauthorized: Invalid or expired token' };
    }

    if (!payload || !payload.sub) {
      set.status = 401;
      return { error: 'Unauthorized: Invalid or expired token payload' };
    }

    const user = await getUserById(payload.sub as string);
    if (!user) {
      set.status = 404;
      return { error: 'User not found in database' };
    }

    // Refresh / slide session cookie expiry
    cookie[SESSION_COOKIE_NAME]?.set({
      value: token,
      ...getSessionCookieOptions(),
    });

    return {
      success: true,
      user,
      token,
    };
  })

  // Check username availability in real-time
  .get(
    '/check-username',
    async ({ query, cookie, headers, sessionJwt }) => {
      const username = query.username || '';
      let currentUserId: string | undefined;

      const token = extractToken(cookie, headers);
      if (token) {
        try {
          const payload = await sessionJwt.verify(token);
          if (payload && typeof payload === 'object' && 'sub' in payload && payload.sub) {
            currentUserId = payload.sub as string;
          }
        } catch {
          // Ignore invalid token on check
        }
      }

      const result = await isUsernameAvailable(username, currentUserId);
      if (!result.available) {
        return {
          available: false,
          error: result.error,
        };
      }

      return {
        available: true,
      };
    },
    {
      query: t.Object({
        username: t.String(),
      }),
    }
  )

  // Complete onboarding by claiming chosen username
  .post(
    '/onboard',
    async ({ body, cookie, headers, sessionJwt, set }) => {
      const token = extractToken(cookie, headers);
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication token required' };
      }

      let payload: any;
      try {
        payload = await sessionJwt.verify(token);
      } catch {
        set.status = 401;
        return { error: 'Unauthorized: Invalid or expired token' };
      }

      if (!payload || !payload.sub) {
        set.status = 401;
        return { error: 'Unauthorized: Invalid token payload' };
      }

      const result = await completeUserOnboarding(payload.sub as string, body.username);
      if (!result.success || !result.user) {
        set.status = 400;
        return { error: result.error || 'Failed to complete onboarding' };
      }

      // Generate updated session token with new username
      const newToken = await sessionJwt.sign({
        sub: result.user.id,
        email: result.user.email,
        name: result.user.name,
        username: result.user.username,
      });

      // Update session cookie with new token
      cookie[SESSION_COOKIE_NAME]?.set({
        value: newToken,
        ...getSessionCookieOptions(),
      });

      return {
        success: true,
        token: newToken,
        user: result.user,
      };
    },
    {
      body: t.Object({
        username: t.String(),
      }),
    }
  )

  // Server-side OAuth redirect callback endpoint (as fallback if popup is blocked)
  .get('/google/callback', async ({ query, cookie, sessionJwt, set, redirect }) => {
    const code = query.code as string | undefined;
    if (!code) {
      return redirect(`${FRONTEND_URL}/?error=no_code`);
    }

    try {
      const { tokens } = await googleClient.getToken(code);
      if (!tokens.id_token) {
        return redirect(`${FRONTEND_URL}/?error=no_id_token`);
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        return redirect(`${FRONTEND_URL}/?error=invalid_payload`);
      }

      const user = await upsertUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0]!,
        picture: payload.picture || null,
      });

      const token = await sessionJwt.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      });

      cookie[SESSION_COOKIE_NAME]?.set({
        value: token,
        ...getSessionCookieOptions(),
      });

      const targetPath = user.onboarded ? '/' : '/onboard';
      return redirect(`${FRONTEND_URL}${targetPath}?token=${token}`);
    } catch (err) {
      console.error('OAuth callback failed:', err);
      return redirect(`${FRONTEND_URL}/?error=oauth_failed`);
    }
  })

  // Sign out and clear HttpOnly session cookie
  .post('/logout', ({ cookie }) => {
    cookie[SESSION_COOKIE_NAME]?.set({
      value: '',
      ...getSessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    });
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });
