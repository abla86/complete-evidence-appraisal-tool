import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { checkLicense, readStoredLicense, refreshLicense, registerLicenseSession, storeLicense, takeLicenseFromLocation } from '../services/licenseClient';
import { PRODUCT_LABELS, type LicensePayload } from '../services/licenseService';
import { IS_OFFLINE_EDITION, LICENSE_PUBLIC_KEY, PUBLIC_SITE_URL, useOnlineStatus } from '../runtime/edition';
import { LegalView, type LegalSection } from './LegalView';
import { SELLER } from '../legal/seller';

interface LicenseContextValue { license: LicensePayload | null; token: string | null; required: boolean; signOut: () => void; }
const LicenseContext = createContext<LicenseContextValue>({ license: null, token: null, required: false, signOut: () => undefined });
export const useLicense = () => useContext(LicenseContext);

/** Licence checks are enforced in production builds; development builds run unlocked. */
export const LICENSE_REQUIRED = Boolean(import.meta.env.PROD) && import.meta.env.VITE_LICENSE_REQUIRED !== 'false';

const GATE_LEGAL_LINKS: Array<[LegalSection, string]> = [['disclaimer', 'Ansvarsfraskrivelse'], ['terms', 'Vilkår'], ['withdrawal', 'Angrerett'], ['privacy', 'Personvern'], ['seller', 'Om selger']];

interface StoreConfig { trialDays: number; authenticated: boolean; products: Record<'offline' | 'online', { url: string | null; priceLabel: string | null }>; }

export const LicenseGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const online = useOnlineStatus();
  const [token, setToken] = useState<string | null>(() => readStoredLicense());
  const [license, setLicense] = useState<LicensePayload | null>(null);
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [reason, setReason] = useState('');
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [legal, setLegal] = useState<LegalSection | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback(async (candidate: string | null) => {
    const check = await checkLicense(candidate);
    if (check.valid && check.payload && candidate) {
      storeLicense(candidate);
      setToken(candidate);
      setLicense(check.payload);
      setStatus('valid');
      void registerLicenseSession(candidate);
      return true;
    }
    setLicense(null);
    setStatus('invalid');
    setReason(check.reason || 'Lisensen er ikke gyldig.');
    return false;
  }, []);

  useEffect(() => {
    const fromUrl = takeLicenseFromLocation();
    if (fromUrl.error) setReason(fromUrl.error);
    void apply(fromUrl.token ?? readStoredLicense());
  }, [apply]);

  // Renew subscription licences that expire within 7 days, or have expired, when the server is reachable.
  useEffect(() => {
    if (!online || !token || IS_OFFLINE_EDITION) return;
    const expiresAt = license?.expiresAt ? Date.parse(license.expiresAt) : null;
    const stored = license ?? null;
    const needsRefresh = stored ? stored.product === 'online' && expiresAt !== null && expiresAt - Date.now() < 7 * 86_400_000 : status === 'invalid';
    if (!needsRefresh) return;
    void refreshLicense(token).then(next => { if (next && next !== token) void apply(next); });
  }, [online, token, license, status, apply]);

  useEffect(() => {
    if (IS_OFFLINE_EDITION || status !== 'invalid' || !online) return;
    fetch('/api/license/config', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(data => { if (data) setConfig(data as StoreConfig); }).catch(() => undefined);
  }, [status, online]);

  const signOut = useCallback(() => { storeLicense(null); void registerLicenseSession(null); setToken(null); setLicense(null); setStatus('invalid'); setReason('Lisensnøkkelen er fjernet fra denne enheten.'); }, []);

  if (!LICENSE_REQUIRED) return <LicenseContext.Provider value={{ license, token, required: false, signOut }}>{children}</LicenseContext.Provider>;
  if (status === 'checking') return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Kontrollerer lisens…</div>;
  if (status === 'valid') return <LicenseContext.Provider value={{ license, token, required: true, signOut }}>{children}</LicenseContext.Provider>;

  const startTrial = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/license/trial', { method: 'POST', credentials: 'same-origin' });
      const data = await response.json().catch(() => null) as { token?: string; error?: string } | null;
      if (data?.token) await apply(data.token); else setReason(data?.error || 'Prøveperioden kunne ikke startes.');
    } finally { setBusy(false); }
  };
  const buyUrl = (product: 'offline' | 'online') => config?.products[product].url || (PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}/` : null);

  return <div className="min-h-screen bg-slate-50 px-4 py-8">
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <ShieldCheck className="w-10 h-10 mx-auto text-teal-700" aria-hidden="true" />
        <h1 className="text-2xl font-bold font-serif text-slate-900">Evidence Appraisal Tool</h1>
        <p className="text-sm text-slate-600">Verktøy for kritisk vurdering av forskning. {IS_OFFLINE_EDITION ? 'Nedlastbar utgave – virker uten nett.' : 'Nettutgave – kan installeres som app.'}</p>
      </header>

      {!LICENSE_PUBLIC_KEY && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">Denne utgaven er bygget uten offentlig lisensnøkkel (VITE_LICENSE_PUBLIC_KEY) og kan ikke kontrollere lisenser. Kontakt selger.</div>}
      {reason && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{reason}</div>}

      <section className="grid sm:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="font-bold">Nettilgang</h2>
          <p className="text-xs text-slate-600">{PRODUCT_LABELS.online}. Brukes i nettleser og som installert app. Rimeligst.</p>
          {config?.products.online.priceLabel && <p className="text-sm font-semibold">{config.products.online.priceLabel}</p>}
          {buyUrl('online') && !IS_OFFLINE_EDITION ? <a className="inline-block rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-semibold" href={buyUrl('online')!}>Kjøp nettilgang</a> : null}
          {!IS_OFFLINE_EDITION && <div className="pt-2 border-t border-slate-100">
            {config?.authenticated
              ? <button type="button" disabled={busy || !online} onClick={() => void startTrial()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Start gratis prøveperiode ({config.trialDays} dager)</button>
              : <a className="text-xs underline" href="/auth/google?returnTo=%2F">Logg inn med Google for gratis prøveperiode</a>}
          </div>}
        </article>
        <article className="rounded-2xl border border-teal-200 bg-white p-5 space-y-2">
          <h2 className="font-bold">Nedlastingslisens</h2>
          <p className="text-xs text-slate-600">{PRODUCT_LABELS.offline}. Last ned som zip og bruk på Windows, macOS, Linux og ChromeOS uten nett og uten server.</p>
          {config?.products.offline.priceLabel && <p className="text-sm font-semibold">{config.products.offline.priceLabel}</p>}
          {buyUrl('offline') ? <a className="inline-block rounded-lg bg-teal-800 text-white px-3 py-2 text-xs font-semibold" href={buyUrl('offline')!} target={IS_OFFLINE_EDITION ? '_blank' : undefined} rel="noreferrer noopener">Kjøp nedlastingslisens</a> : <p className="text-xs text-slate-500">Kjøp skjer på selgers nettside.</p>}
        </article>
      </section>
      <p className="text-xs text-slate-500 text-center">Ved kjøp gjelder <button type="button" className="underline" onClick={() => setLegal('terms')}>bruksvilkårene</button> og <button type="button" className="underline" onClick={() => setLegal('withdrawal')}>reglene om angrerett</button>. Selger: {SELLER.name}, org.nr. {SELLER.organisationNumber}.</p>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" aria-hidden="true" />Har du en lisensnøkkel?</h2>
        <label className="block text-xs text-slate-600" htmlFor="license-input">Lim inn nøkkelen du fikk etter kjøp eller fra skolen/institusjonen. Den kontrolleres lokalt på enheten.</label>
        <textarea id="license-input" value={input} onChange={e => setInput(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs" placeholder="EAT1.…" spellCheck={false} autoComplete="off" />
        <button type="button" disabled={!input.trim() || busy} onClick={() => void apply(input.trim())} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50">Aktiver lisens</button>
      </section>

      <nav className="flex flex-wrap justify-center gap-3 text-xs" aria-label="Juridisk informasjon">
        {GATE_LEGAL_LINKS.map(([s, label]) => <button key={s} type="button" className="underline text-slate-600" onClick={() => setLegal(s)}>{label}</button>)}
      </nav>
      {legal && <LegalView section={legal} onSelect={setLegal} />}
    </div>
  </div>;
};
