/**
 * Licence tokens: `EAT1.<base64url(payload)>.<base64url(Ed25519 signature)>`.
 *
 * Tokens are signed by the seller's private key (server or owner's issuing script) and
 * verified with the embedded public key, so verification works without a network.
 * This is a licence check, not copy protection: a determined user with full control
 * of their own device can bypass any client-side check. Server-side features (sync,
 * hosted downloads) re-verify the token on the server.
 */

export type LicenseProduct = 'offline' | 'online' | 'trial';

export interface LicensePayload {
  v: 1;
  /** Unique licence id (shown on receipts and in support requests). */
  id: string;
  product: LicenseProduct;
  /** Name or e-mail of the licensee (person or institution). */
  licensee: string;
  /** Number of users/devices the licence covers. */
  seats: number;
  issuedAt: string;
  /** ISO timestamp; null means perpetual (one-time purchase of the offline edition). */
  expiresAt: string | null;
  /** Stripe subscription id for renewable online access. */
  subscriptionId?: string;
}

export interface LicenseCheck {
  valid: boolean;
  payload?: LicensePayload;
  reason?: string;
}

export const LICENSE_TOKEN_PREFIX = 'EAT1';

export const PRODUCT_LABELS: Record<LicenseProduct, string> = {
  offline: 'Nedlastingslisens (engangskjøp, fungerer uten nett)',
  online: 'Nettilgang (abonnement)',
  trial: 'Prøvetilgang',
};

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('Ugyldig base64url.');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function encodePayload(payload: LicensePayload): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
}

export function signingInput(encodedPayload: string): Uint8Array {
  return new TextEncoder().encode(`${LICENSE_TOKEN_PREFIX}.${encodedPayload}`);
}

function isPayload(value: unknown): value is LicensePayload {
  const p = value as Partial<LicensePayload> | null;
  return Boolean(p && p.v === 1 && typeof p.id === 'string' && p.id.length > 0
    && (p.product === 'offline' || p.product === 'online' || p.product === 'trial')
    && typeof p.licensee === 'string' && Number.isInteger(p.seats) && (p.seats ?? 0) > 0
    && typeof p.issuedAt === 'string' && (p.expiresAt === null || typeof p.expiresAt === 'string'));
}

/** Parses without verifying; only for display of an already verified token. */
export function parseLicenseToken(token: string): LicensePayload | null {
  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts[0] !== LICENSE_TOKEN_PREFIX) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
    return isPayload(payload) ? payload : null;
  } catch { return null; }
}

async function importPublicKey(publicKeyBase64Url: string): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto er ikke tilgjengelig i denne nettleseren.');
  const raw = base64UrlDecode(publicKeyBase64Url.trim());
  if (raw.byteLength !== 32) throw new Error('Offentlig lisensnøkkel har feil lengde.');
  return subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
}

export async function verifyLicenseToken(token: string, publicKeyBase64Url: string, now: Date = new Date()): Promise<LicenseCheck> {
  if (!publicKeyBase64Url) return { valid: false, reason: 'Lisenskontroll er ikke konfigurert i denne utgaven.' };
  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts[0] !== LICENSE_TOKEN_PREFIX) return { valid: false, reason: 'Lisensnøkkelen har feil format.' };
  const payload = parseLicenseToken(token);
  if (!payload) return { valid: false, reason: 'Lisensnøkkelen kan ikke leses.' };
  let signatureOk = false;
  try {
    const key = await importPublicKey(publicKeyBase64Url);
    signatureOk = await globalThis.crypto.subtle.verify({ name: 'Ed25519' }, key, base64UrlDecode(parts[2]), signingInput(parts[1]));
  } catch (error) {
    return { valid: false, reason: error instanceof Error && error.message.includes('Ed25519') ? 'Nettleseren støtter ikke Ed25519-signaturer. Oppdater nettleseren.' : 'Lisensnøkkelen kunne ikke verifiseres.' };
  }
  if (!signatureOk) return { valid: false, reason: 'Lisensnøkkelen er ikke utstedt av selger (ugyldig signatur).' };
  if (payload.expiresAt && Date.parse(payload.expiresAt) <= now.getTime()) return { valid: false, payload, reason: `Lisensen utløp ${new Date(payload.expiresAt).toLocaleDateString('nb-NO')}.` };
  return { valid: true, payload };
}

/** Which products unlock which edition. The downloadable edition requires the one-time offline licence. */
export function productAllowedInEdition(product: LicenseProduct, edition: 'web' | 'offline'): boolean {
  return edition === 'web' ? true : product === 'offline';
}
