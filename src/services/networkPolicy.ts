/**
 * Central network policy for the browser app. Research data, PDFs and documents are processed
 * locally; nothing leaves the device unless the user has switched on the matching category.
 * All client-side network calls go through `guardedFetch`, which enforces the category consent,
 * an allow-list of hosts and keeps a local log (method, host, path, time; never request bodies).
 */

export type NetworkCategory = 'metadata' | 'cloud' | 'ai' | 'clinical';

export interface NetworkCategoryInfo {
  label: string;
  sends: string;
  recipients: string;
}

export const NETWORK_CATEGORIES: Record<NetworkCategory, NetworkCategoryInfo> = {
  metadata: {
    label: 'Litteratursøk og DOI-/metadataoppslag',
    sends: 'Søkeord, DOI-er og PubMed-ID-er du selv skriver inn. Aldri dokumentinnhold eller PDF-er.',
    recipients: 'Crossref, OpenAlex, PubMed (NCBI), Europe PMC (EMBL-EBI), DOAJ og Semantic Scholar – direkte fra nettleseren.',
  },
  cloud: {
    label: 'Innlogging og skysynkronisering',
    sends: 'Referanser, kildeposter og forskningsartefakter du synkroniserer, samt innloggingsinformasjon (Google-konto).',
    recipients: 'Serveren til dette verktøyet (driftes av selger) og Google (innlogging).',
  },
  ai: {
    label: 'KI-analyse (valgfri)',
    sends: 'Teksten i dokumentet du analyserer (inntil ca. 7 000 tegn), etter filtrering av åpenbare personopplysninger.',
    recipients: 'Serveren til dette verktøyet og Google Gemini API (Google LLC). Gjelder kun når du starter en KI-analyse.',
  },
  clinical: {
    label: 'FHIR-/klinisk systemintegrasjon',
    sends: 'Forespørsler mot FHIR-endepunktet du selv oppgir, med eventuelt tilgangstoken du legger inn.',
    recipients: 'Kun den adressen du skriver inn.',
  },
};

const ALLOWED_HOSTS: Record<Exclude<NetworkCategory, 'clinical'>, string[]> = {
  metadata: ['api.crossref.org', 'api.openalex.org', 'eutils.ncbi.nlm.nih.gov', 'www.ebi.ac.uk', 'doaj.org', 'api.semanticscholar.org'],
  cloud: [],
  ai: [],
};

const CONSENT_KEY = 'evidence-appraisal-network-consent-v1';
const LOG_KEY = 'evidence-appraisal-network-log-v1';
const MAX_LOG = 200;

export type NetworkConsent = Record<NetworkCategory, boolean>;
const DEFAULT_CONSENT: NetworkConsent = { metadata: false, cloud: false, ai: false, clinical: false };

export class NetworkConsentError extends Error {
  constructor(public readonly category: NetworkCategory, message?: string) {
    super(message ?? `Nettverksbruk for «${NETWORK_CATEGORIES[category].label}» er slått av. Slå det på under Personvern → Nettverk hvis du ønsker det.`);
    this.name = 'NetworkConsentError';
  }
}

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const listeners = new Set<(consent: NetworkConsent) => void>();

export function getNetworkConsent(): NetworkConsent {
  if (!isBrowser()) return { metadata: true, cloud: true, ai: true, clinical: true };
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<NetworkConsent> : {};
    return { ...DEFAULT_CONSENT, ...Object.fromEntries(Object.entries(parsed).filter(([k, v]) => k in DEFAULT_CONSENT && typeof v === 'boolean')) };
  } catch { return { ...DEFAULT_CONSENT }; }
}

export function setNetworkConsent(category: NetworkCategory, allowed: boolean): NetworkConsent {
  const next = { ...getNetworkConsent(), [category]: allowed };
  if (isBrowser()) localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  for (const listener of listeners) listener(next);
  return next;
}

export function subscribeNetworkConsent(listener: (consent: NetworkConsent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface NetworkLogEntry { at: string; category: NetworkCategory; method: string; host: string; path: string; outcome: 'sent' | 'blocked'; }

export function getNetworkLog(): NetworkLogEntry[] {
  if (!isBrowser()) return [];
  try { const parsed = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

export function clearNetworkLog(): void { if (isBrowser()) localStorage.removeItem(LOG_KEY); }

function log(entry: NetworkLogEntry): void {
  if (!isBrowser()) return;
  try { localStorage.setItem(LOG_KEY, JSON.stringify([entry, ...getNetworkLog()].slice(0, MAX_LOG))); } catch { /* quota must not break requests */ }
}

function resolveUrl(input: string): URL {
  const base = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost';
  return new URL(input, base);
}

export function isRequestAllowed(category: NetworkCategory, url: URL): boolean {
  if (category === 'clinical') return url.protocol === 'https:';
  const sameOrigin = typeof window !== 'undefined' && url.origin === window.location.origin;
  if (category === 'cloud' || category === 'ai') return sameOrigin;
  return url.protocol === 'https:' && ALLOWED_HOSTS[category].includes(url.hostname);
}

/** fetch() that enforces consent and the host allow-list in the browser. On the server it is plain fetch. */
export async function guardedFetch(category: NetworkCategory, input: string, init?: RequestInit): Promise<Response> {
  if (!isBrowser()) return fetch(input, init);
  const url = resolveUrl(input);
  const method = (init?.method || 'GET').toUpperCase();
  const base = { at: new Date().toISOString(), category, method, host: url.host, path: url.pathname };
  if (!getNetworkConsent()[category]) { log({ ...base, outcome: 'blocked' }); throw new NetworkConsentError(category); }
  if (!isRequestAllowed(category, url)) { log({ ...base, outcome: 'blocked' }); throw new NetworkConsentError(category, `Adressen ${url.host} er ikke på listen over godkjente mottakere for ${NETWORK_CATEGORIES[category].label}.`); }
  log({ ...base, outcome: 'sent' });
  return fetch(url.toString(), { ...init, referrerPolicy: 'no-referrer', credentials: category === 'cloud' || category === 'ai' ? 'same-origin' : 'omit' });
}
