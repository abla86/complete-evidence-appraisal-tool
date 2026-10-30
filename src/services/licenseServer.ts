import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';
import { getAuthenticatedUser } from './authApi';
import { encodePayload, LICENSE_TOKEN_PREFIX, parseLicenseToken, signingInput, type LicenseCheck, type LicensePayload, type LicenseProduct } from './licenseService';

/**
 * Server side of licensing: issues signed licence tokens after verified Stripe payments,
 * a one-time trial per Google account, subscription renewal, the licence session cookie
 * for server features, and the licensed download of the offline edition.
 */

const COOKIE_NAME = 'evidence_license';
const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 7);
const SUBSCRIPTION_GRACE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const env = (name: string) => (process.env[name] || '').trim();

let cachedPrivateKey: crypto.KeyObject | null | undefined;
function privateKey(): crypto.KeyObject | null {
  if (cachedPrivateKey !== undefined) return cachedPrivateKey;
  const raw = env('LICENSE_PRIVATE_KEY');
  if (!raw) return (cachedPrivateKey = null);
  cachedPrivateKey = raw.includes('BEGIN')
    ? crypto.createPrivateKey(raw.replace(/\\n/g, '\n'))
    : crypto.createPrivateKey({ key: Buffer.from(raw, 'base64url'), format: 'der', type: 'pkcs8' });
  if (cachedPrivateKey.asymmetricKeyType !== 'ed25519') throw new Error('LICENSE_PRIVATE_KEY must be an Ed25519 key.');
  return cachedPrivateKey;
}

/** Raw 32-byte public key (base64url) derived from the configured private key. */
export function licensePublicKey(): string {
  const key = privateKey();
  if (!key) return '';
  const jwk = crypto.createPublicKey(key).export({ format: 'jwk' }) as { x?: string };
  return jwk.x || '';
}

export function signLicense(payload: LicensePayload, key: crypto.KeyObject | null = privateKey()): string {
  if (!key) throw new Error('Lisensutstedelse er ikke konfigurert (LICENSE_PRIVATE_KEY mangler).');
  const encoded = encodePayload(payload);
  const signature = crypto.sign(null, Buffer.from(signingInput(encoded)), key).toString('base64url');
  return `${LICENSE_TOKEN_PREFIX}.${encoded}.${signature}`;
}

export function verifyLicenseTokenSync(token: string, now = Date.now()): LicenseCheck {
  const key = privateKey();
  if (!key) return { valid: false, reason: 'Lisenskontroll er ikke konfigurert.' };
  const parts = token.trim().split('.');
  const payload = parseLicenseToken(token);
  if (parts.length !== 3 || !payload) return { valid: false, reason: 'Ugyldig lisensnøkkel.' };
  let ok = false;
  try { ok = crypto.verify(null, Buffer.from(signingInput(parts[1])), crypto.createPublicKey(key), Buffer.from(parts[2], 'base64url')); } catch { ok = false; }
  if (!ok) return { valid: false, reason: 'Ugyldig signatur.' };
  if (payload.expiresAt && Date.parse(payload.expiresAt) <= now) return { valid: false, payload, reason: 'Lisensen er utløpt.' };
  return { valid: true, payload };
}

export function createLicensePayload(input: { id?: string; product: LicenseProduct; licensee: string; seats?: number; expiresAt: string | null; subscriptionId?: string }): LicensePayload {
  return {
    v: 1,
    id: input.id || `lic_${crypto.randomUUID()}`,
    product: input.product,
    licensee: input.licensee.trim().slice(0, 200),
    seats: Math.max(1, Math.floor(input.seats ?? 1)),
    issuedAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    ...(input.subscriptionId ? { subscriptionId: input.subscriptionId } : {}),
  };
}

function readLicenseCookie(req: Request): string | null {
  const match = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : null;
}

function bearerToken(req: Request): string | null {
  const header = String(req.header('authorization') || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

export function requestLicense(req: Request): LicensePayload | null {
  const token = bearerToken(req) || readLicenseCookie(req);
  if (!token) return null;
  const check = verifyLicenseTokenSync(token);
  return check.valid ? check.payload ?? null : null;
}

/** Server features (cloud sync, server-side analysis) need a signed-in account and a valid licence. */
export function requireLicensedUser(req: Request): { sub: string; email?: string; name?: string; picture?: string } {
  const user = getAuthenticatedUser(req);
  if (!user?.sub) throw new Error('Authentication required.');
  if (!requestLicense(req)) throw new Error('En gyldig lisens kreves for denne funksjonen.');
  return user;
}

// ---- Stripe ---------------------------------------------------------------

async function stripeGet(resource: string): Promise<any> {
  const secret = env('STRIPE_SECRET_KEY');
  if (!secret) throw new Error('Betaling er ikke konfigurert.');
  const response = await fetch(`https://api.stripe.com/v1/${resource}`, { headers: { Authorization: `Bearer ${secret}` } });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Stripe API request failed with status:', response.status);
    throw new Error('Betalingen kunne ikke bekreftes nå. Prøv igjen senere.');
  }
  return data;
}

function subscriptionPeriodEnd(subscription: any): number | null {
  const seconds = subscription?.current_period_end ?? subscription?.items?.data?.[0]?.current_period_end;
  return typeof seconds === 'number' ? seconds * 1000 : null;
}

async function onlineExpiryFromSubscription(subscriptionId: string): Promise<string> {
  const subscription = await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (!['active', 'trialing'].includes(String(subscription?.status))) throw new Error('Abonnementet er ikke aktivt.');
  const end = subscriptionPeriodEnd(subscription);
  if (!end) throw new Error('Abonnementets periode kunne ikke leses.');
  return new Date(end + SUBSCRIPTION_GRACE_DAYS * DAY_MS).toISOString();
}

/** Verifies a completed Stripe Checkout session and returns a signed licence for what was bought. */
export async function licenseFromCheckoutSession(sessionId: string): Promise<string> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error('Ugyldig betalingsreferanse.');
  const session = await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session?.status !== 'complete' || !['paid', 'no_payment_required'].includes(String(session?.payment_status))) throw new Error('Betalingen er ikke fullført.');
  const offlineLink = env('STRIPE_PAYMENT_LINK_ID_OFFLINE');
  const onlineLink = env('STRIPE_PAYMENT_LINK_ID_ONLINE');
  const licensee = String(session.customer_details?.email || session.customer_email || session.customer_details?.name || 'Kunde').trim();
  // Deterministic id: redeeming the same payment twice yields the same licence id.
  const id = `lic_${crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 24)}`;
  if (offlineLink && session.payment_link === offlineLink) {
    return signLicense(createLicensePayload({ id, product: 'offline', licensee, seats: Number(env('OFFLINE_LICENSE_SEATS') || 1), expiresAt: null }));
  }
  if (onlineLink && session.payment_link === onlineLink) {
    const subscriptionId = String(session.subscription || '');
    if (!subscriptionId) throw new Error('Betalingen gjelder ikke et abonnement.');
    return signLicense(createLicensePayload({ id, product: 'online', licensee, expiresAt: await onlineExpiryFromSubscription(subscriptionId), subscriptionId }));
  }
  throw new Error('Betalingen gjelder ikke et produkt fra dette verktøyet.');
}

// ---- Trial ----------------------------------------------------------------

function trialFile(): string {
  return path.resolve(process.env.EVIDENCE_DATA_DIR || './data', 'license-trials.json');
}

function readTrials(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(trialFile(), 'utf8')) as Record<string, string>; } catch { return {}; }
}

function issueTrial(sub: string, email: string): string {
  const hashed = crypto.createHash('sha256').update(`trial:${sub}`).digest('hex');
  const trials = readTrials();
  if (trials[hashed]) throw new Error('Prøveperioden er allerede brukt for denne kontoen.');
  trials[hashed] = new Date().toISOString();
  fs.mkdirSync(path.dirname(trialFile()), { recursive: true });
  const temporary = `${trialFile()}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(trials), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporary, trialFile());
  return signLicense(createLicensePayload({ product: 'trial', licensee: email, expiresAt: new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString() }));
}

// ---- Routes ---------------------------------------------------------------

export function offlineReleasePath(): string {
  return path.resolve(process.cwd(), process.env.OFFLINE_RELEASE_PATH || 'release/evidence-appraisal-offline.zip');
}

function licenseCookie(token: string | null, expiresAt: string | null): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  if (!token) return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
  const maxAge = expiresAt ? Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)) : 365 * 24 * 60 * 60;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

const fail = (res: Response, status: number, error: unknown) => res.status(status).json({ success: false, error: error instanceof Error ? error.message : 'Forespørselen feilet.' });

export function registerLicenseApi(app: Express): void {
  app.get('/api/license/config', (req, res) => {
    const user = getAuthenticatedUser(req);
    res.json({
      issuingConfigured: Boolean(privateKey()),
      publicKey: licensePublicKey(),
      trialDays: TRIAL_DAYS,
      authenticated: Boolean(user),
      email: user?.email || null,
      offlineDownloadAvailable: fs.existsSync(offlineReleasePath()),
      products: {
        offline: { url: env('STRIPE_PAYMENT_LINK_URL_OFFLINE') || null, priceLabel: env('PRICE_LABEL_OFFLINE') || null },
        online: { url: env('STRIPE_PAYMENT_LINK_URL_ONLINE') || null, priceLabel: env('PRICE_LABEL_ONLINE') || null },
      },
    });
  });

  app.post('/api/license/trial', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user?.sub || !user.email) return fail(res, 401, new Error('Logg inn med Google for å starte prøveperioden.'));
    try { return res.json({ success: true, token: issueTrial(user.sub, user.email) }); }
    catch (error) { return fail(res, 409, error); }
  });

  app.post('/api/license/refresh', async (req, res) => {
    const token = String(req.body?.token || '');
    const payload = parseLicenseToken(token);
    // Signature must be valid; expiry is allowed so a lapsed-but-renewed subscription can be refreshed.
    const check = verifyLicenseTokenSync(token, 0);
    if (!payload || !check.valid) return fail(res, 400, new Error('Ugyldig lisensnøkkel.'));
    if (payload.product !== 'online' || !payload.subscriptionId) return res.json({ success: true, token });
    try {
      const expiresAt = await onlineExpiryFromSubscription(payload.subscriptionId);
      return res.json({ success: true, token: signLicense({ ...payload, issuedAt: new Date().toISOString(), expiresAt }) });
    } catch (error) { return fail(res, 402, error); }
  });

  app.post('/api/license/session', (req, res) => {
    const token = String(req.body?.token || '');
    if (!token) { res.setHeader('Set-Cookie', licenseCookie(null, null)); return res.json({ success: true, active: false }); }
    const check = verifyLicenseTokenSync(token);
    if (!check.valid || !check.payload) return fail(res, 400, new Error(check.reason || 'Ugyldig lisensnøkkel.'));
    res.setHeader('Set-Cookie', licenseCookie(token, check.payload.expiresAt));
    return res.json({ success: true, active: true });
  });

  app.get('/api/license/download', (req, res) => {
    const license = requestLicense(req);
    if (!license) return fail(res, 401, new Error('En gyldig lisens kreves for nedlasting.'));
    if (license.product !== 'offline') return fail(res, 403, new Error('Nedlasting krever nedlastingslisens (engangskjøp).'));
    const file = offlineReleasePath();
    if (!fs.existsSync(file)) return fail(res, 503, new Error('Nedlastingspakken er ikke bygget på serveren ennå.'));
    res.setHeader('Cache-Control', 'no-store');
    return res.download(file, 'evidence-appraisal-offline.zip');
  });

  app.get('/purchase-complete', async (req, res) => {
    const sessionId = String(req.query.session_id || '').trim();
    try {
      const token = await licenseFromCheckoutSession(sessionId);
      // Fragment is never sent to servers or logged; the client stores the key locally.
      return res.redirect(`/#license=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Purchase verification failed:', error instanceof Error ? error.name : 'UnknownError');
      return res.redirect(`/#license-error=${encodeURIComponent('Betalingen kunne ikke bekreftes. Kontakt selger med kvitteringen hvis du er belastet.')}`);
    }
  });
}
