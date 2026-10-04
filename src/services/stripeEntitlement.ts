import crypto from 'node:crypto';
import type { Request } from 'express';
import { getAuthenticatedUser } from './authApi';

const COOKIE_NAME = 'evidence_pro_entitlement';
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const PAYMENT_LINK_ID = process.env.STRIPE_PRO_PAYMENT_LINK_ID || 'plink_1UMvNFBP9Robpo623kSgv7Lv';
const PRODUCT_CODE = 'evidence-appraisal-pro';

function sign(value: string): string {
  if (!SESSION_SECRET) throw new Error('AUTH_SESSION_SECRET is not configured.');
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}
function encode(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return body + '.' + sign(body);
}
function decode(value: string): Record<string, unknown> | null {
  const [body, signature] = value.split('.');
  if (!body || !signature || !SESSION_SECRET) return null;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (typeof payload.exp === 'number' && payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
function readEntitlement(cookieHeader?: string): Record<string, unknown> | null {
  const match = cookieHeader?.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + '='));
  return match ? decode(match.slice(COOKIE_NAME.length + 1)) : null;
}
function entitlementCookie(userSub: string, email: string): string {
  const value = encode({ sub: userSub, email: email.toLowerCase(), product: PRODUCT_CODE, iat: Date.now(), exp: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return COOKIE_NAME + '=' + value + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000' + secure;
}
async function stripeGet(path: string): Promise<any> {
  if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured.');
  const response = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + STRIPE_SECRET_KEY } });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Stripe API request failed.');
  return data;
}

export function requireProUser(req: Request): { sub: string; email?: string; name?: string; picture?: string } {
  const user = getAuthenticatedUser(req);
  if (!user?.sub) throw new Error('Authentication required.');
  if (!hasProEntitlement(req)) throw new Error('Evidence Appraisal Suite Pro is required for this feature.');
  return user;
}

export function hasProEntitlement(req: Request): boolean {
  const user = getAuthenticatedUser(req);
  if (!user?.sub || !user.email) return false;
  const entitlement = readEntitlement(req.headers.cookie);
  return entitlement?.product === PRODUCT_CODE && entitlement.sub === user.sub && String(entitlement.email).toLowerCase() === user.email.toLowerCase();
}

export async function verifyAndGrantPro(req: Request, sessionId: string): Promise<{ email: string }> {
  const user = getAuthenticatedUser(req);
  if (!user?.sub || !user.email) throw new Error('Logg inn med Google før du aktiverer Pro.');
  if (!/^cs_[A-Za-z0-9]+$/.test(sessionId)) throw new Error('Ugyldig Stripe checkout session.');
  const session = await stripeGet('checkout/sessions/' + encodeURIComponent(sessionId));
  if (session.payment_status !== 'paid') throw new Error('Betalingen er ikke registrert som fullført.');
  if (session.payment_link !== PAYMENT_LINK_ID) throw new Error('Betalingen gjelder ikke Evidence Appraisal Suite Pro.');
  const email = String(session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
  if (!email || email !== user.email.toLowerCase()) throw new Error('Stripe-e-post og innlogget Google-e-post må være den samme.');
  return { email };
}

export function registerEntitlementApi(app: import('express').Express): void {
  app.get('/api/pro/status', (req, res) => {
    const user = getAuthenticatedUser(req);
    return res.json({ authenticated: Boolean(user), pro: hasProEntitlement(req), email: user?.email || null });
  });
  app.post('/api/pro/activate', async (req, res) => {
    try {
      const sessionId = String(req.body?.session_id || '').trim();
      const result = await verifyAndGrantPro(req, sessionId);
      const user = getAuthenticatedUser(req)!;
      res.setHeader('Set-Cookie', entitlementCookie(user.sub, result.email));
      return res.json({ success: true, pro: true });
    } catch (error) {
      return res.status(400).json({ success: false, pro: false, error: error instanceof Error ? error.message : 'Kunne ikke aktivere Pro.' });
    }
  });
}
