import { LICENSE_STORAGE_KEY } from './appStorage';
import { productAllowedInEdition, verifyLicenseToken, type LicenseCheck } from './licenseService';
import { EDITION, IS_OFFLINE_EDITION, LICENSE_PUBLIC_KEY } from '../runtime/edition';

/** Browser-side licence handling: store, verify offline, pick up keys after purchase. */

export function readStoredLicense(): string | null {
  try { return localStorage.getItem(LICENSE_STORAGE_KEY); } catch { return null; }
}

export function storeLicense(token: string | null): void {
  try { if (token) localStorage.setItem(LICENSE_STORAGE_KEY, token.trim()); else localStorage.removeItem(LICENSE_STORAGE_KEY); } catch { /* storage unavailable */ }
}

/** After checkout the server redirects to `/#license=<token>` (fragments never reach servers or logs). */
export function takeLicenseFromLocation(): { token?: string; error?: string } {
  if (typeof window === 'undefined' || !window.location.hash) return {};
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('license') || undefined;
  const error = params.get('license-error') || undefined;
  if (token || error) window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  return { token, error };
}

export async function checkLicense(token: string | null): Promise<LicenseCheck> {
  if (!token) return { valid: false, reason: 'Ingen lisens er registrert på denne enheten.' };
  const check = await verifyLicenseToken(token, LICENSE_PUBLIC_KEY);
  if (check.valid && check.payload && !productAllowedInEdition(check.payload.product, EDITION)) {
    return { valid: false, payload: check.payload, reason: 'Denne lisensen gjelder nettversjonen. Den nedlastbare utgaven krever nedlastingslisens (engangskjøp).' };
  }
  return check;
}

/** Lets the web server know about the licence (httpOnly cookie) so server features work. */
export async function registerLicenseSession(token: string | null): Promise<void> {
  if (IS_OFFLINE_EDITION) return;
  try {
    await fetch('/api/license/session', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
  } catch { /* offline: the locally verified licence still applies */ }
}

/** Renews an online subscription licence when the server can confirm the subscription is active. */
export async function refreshLicense(token: string): Promise<string | null> {
  if (IS_OFFLINE_EDITION) return null;
  try {
    const response = await fetch('/api/license/refresh', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const data = await response.json().catch(() => null) as { token?: string } | null;
    return response.ok && data?.token ? data.token : null;
  } catch { return null; }
}

export async function downloadOfflineEdition(token: string): Promise<void> {
  const response = await fetch('/api/license/download', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error || 'Nedlastingen feilet.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'evidence-appraisal-offline.zip';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
