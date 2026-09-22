import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { upsertUser, getUserById, type UserRecord } from './db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const JWT_SECRET = process.env.JWT_SECRET as string;
const BASE_URL = process.env.BASE_URL as string;


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
    async ({ body, sessionJwt, set }) => {
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
  .get('/me', async ({ headers, sessionJwt, set }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'Unauthorized: Missing or malformed authorization header' };
    }

    const token = authHeader.substring(7);
    const payload = await sessionJwt.verify(token);

    if (!payload || !payload.sub) {
      set.status = 401;
      return { error: 'Unauthorized: Invalid or expired token' };
    }

    const user = await getUserById(payload.sub as string);
    if (!user) {
      set.status = 404;
      return { error: 'User not found in database' };
    }

    return {
      success: true,
      user,
    };
  })

  // Server-side OAuth redirect callback endpoint (as fallback if popup is blocked)
  .get('/google/callback', async ({ query, sessionJwt, set, redirect }) => {
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
      });

      return redirect(`${FRONTEND_URL}/?token=${token}`);
    } catch (err) {
      console.error('OAuth callback failed:', err);
      return redirect(`${FRONTEND_URL}/?error=oauth_failed`);
    }
  });
