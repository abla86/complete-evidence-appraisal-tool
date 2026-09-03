import 'dotenv/config';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/, '');
export const GOOGLE_CALLBACK_PATH = '/auth/google/callback';
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${APP_URL}${GOOGLE_CALLBACK_PATH}`;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || '';
const COOKIE_NAME = 'evidence_google_session';

export function googleOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && SESSION_SECRET);
}

export function getGoogleOAuthClient(): OAuth2Client {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Google OAuth is not configured: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing.');
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function scopes(): string[] {
  return (process.env.GOOGLE_OAUTH_SCOPES || 'openid email profile')
    .split(/\s+/)
    .map(value => value.trim())
    .filter(Boolean);
}

function sign(value: string): string {
  if (!SESSION_SECRET) throw new Error('AUTH_SESSION_SECRET is not configured.');
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function encode(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode<T>(value: string): T | null {
  const [body, signature] = value.split('.');
  if (!body || !signature || !SESSION_SECRET) return null;
  const expected = sign(body);
  const actualBytes = Buffer.from(signature, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & { exp?: number };
    if (parsed.exp && Number(parsed.exp) < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createAuthorizationRequest(): { url: string; state: string } {
  const client = getGoogleOAuthClient();
  const state = encode({ nonce: crypto.randomBytes(24).toString('hex'), exp: Date.now() + 10 * 60 * 1000 });
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes(),
    include_granted_scopes: true,
    state,
    prompt: 'select_account',
  });
  return { url, state };
}

export function createAuthorizationUrl(): string {
  return createAuthorizationRequest().url;
}

export function authorizationStateCookieHeader(state: string, secure: boolean): string {
  return `evidence_google_oauth_state=${encodeURIComponent(state)}; Path=/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${secure ? '; Secure' : ''}`;
}

export function readAuthorizationStateCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith('evidence_google_oauth_state='));
  return match ? decodeURIComponent(match.slice('evidence_google_oauth_state='.length)) : null;
}

export function clearAuthorizationStateCookie(secure: boolean): string {
  return `evidence_google_oauth_state=; Path=/auth/google; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

export async function exchangeCode(code: string, state: string, expectedState?: string): Promise<GoogleUser> {
  if (!code.trim()) throw new Error('Google authorization code is required.');
  if (!decode(state)) throw new Error('Invalid or expired OAuth state.');
  if (expectedState && !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) throw new Error('OAuth state mismatch.');
  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error('Google did not return an ID token.');
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new Error('Google ID token did not contain the required identity claims.');
  return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
}

export function createSessionCookie(user: GoogleUser): string {
  return encode({ ...user, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
}

export function readSessionCookie(cookieHeader?: string): GoogleUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return decode<GoogleUser>(match.slice(COOKIE_NAME.length + 1));
}

export function sessionCookieHeader(value: string, secure: boolean): string {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function publicAuthConfig() {
  return { configured: googleOAuthConfigured(), clientId: CLIENT_ID || null, redirectUri: GOOGLE_REDIRECT_URI, scopes: scopes() };
}
