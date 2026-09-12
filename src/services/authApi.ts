import type { Express, Request, Response } from 'express';
import {
  authorizationStateCookieHeader,
  clearAuthorizationStateCookie,
  clearSessionCookie,
  createAuthorizationRequest,
  createSessionCookie,
  exchangeCode,
  googleOAuthConfigured,
  readAuthorizationStateCookie,
  readSessionCookie,
  sessionCookieHeader,
} from './googleOAuthService';

function secureCookie(req: Request): boolean {
  return req.secure || process.env.NODE_ENV === 'production';
}

export function getAuthenticatedUser(req: Request) {
  return readSessionCookie(req.headers.cookie);
}

export function requireAuthenticatedUser(req: Request): { sub: string; email?: string; name?: string; picture?: string } {
  const user = getAuthenticatedUser(req);
  if (!user?.sub) throw new Error('Authentication required.');
  return user;
}

export function reviewerIdForRequest(req: Request): string {
  if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_REVIEWER_HEADER === 'true') {
    const header = String(req.header('x-reviewer-id') || '').trim();
    if (header) return header.slice(0, 128);
  }
  return requireAuthenticatedUser(req).sub;
}

export function registerAuthApi(app: Express): void {
  app.get('/auth/google', (_req, res) => {
    if (!googleOAuthConfigured()) return res.status(503).send('Google OAuth is not configured.');
    const { url, state } = createAuthorizationRequest();
    res.setHeader('Set-Cookie', authorizationStateCookieHeader(state, process.env.NODE_ENV === 'production'));
    return res.redirect(url);
  });

  app.get('/auth/google/callback', async (req, res) => {
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    const expectedState = readAuthorizationStateCookie(req.headers.cookie);
    try {
      if (!expectedState) throw new Error('OAuth state cookie is missing.');
      const user = await exchangeCode(code, state, expectedState);
      const session = createSessionCookie(user);
      res.setHeader('Set-Cookie', [sessionCookieHeader(session, secureCookie(req)), clearAuthorizationStateCookie(secureCookie(req))]);
      return res.redirect('/');
    } catch (error) {
      res.setHeader('Set-Cookie', clearAuthorizationStateCookie(secureCookie(req)));
      return res.status(401).send(error instanceof Error ? error.message : 'Authentication failed.');
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    return res.json({ authenticated: Boolean(user), user: user ? { sub: user.sub, email: user.email, name: user.name, picture: user.picture } : null });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.setHeader('Set-Cookie', clearSessionCookie(secureCookie(req)));
    return res.json({ success: true });
  });
}
