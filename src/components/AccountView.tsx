import React, { useState } from 'react';
import { useLicense } from './LicenseGate';
import { PRODUCT_LABELS } from '../services/licenseService';
import { downloadOfflineEdition } from '../services/licenseClient';
import { APP_VERSION, IS_OFFLINE_EDITION, useOnlineStatus } from '../runtime/edition';
import { GoogleAuthButton } from './GoogleAuthButton';

export const AccountView: React.FC = () => {
  const { license, token, required, signOut } = useLicense();
  const online = useOnlineStatus();
  const [message, setMessage] = useState('');

  const download = async () => {
    if (!token) return;
    setMessage('Laster ned…');
    try { await downloadOfflineEdition(token); setMessage('Nedlastingen er startet. Pakk ut zip-filen og åpne «Evidence-Appraisal-Tool.html». Se LES-MEG.txt.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Nedlastingen feilet.'); }
  };

  return <section className="space-y-6 pb-16 max-w-3xl">
    <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
      <h2 className="text-2xl font-bold font-serif">Lisens</h2>
      {!required && <p className="text-sm text-slate-600">Utviklingsbygg: lisenskontroll er ikke aktivert.</p>}
      {license ? <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-500">Produkt</dt><dd>{PRODUCT_LABELS[license.product]}</dd>
        <dt className="text-slate-500">Lisensinnehaver</dt><dd>{license.licensee}</dd>
        <dt className="text-slate-500">Brukere</dt><dd>{license.seats}</dd>
        <dt className="text-slate-500">Lisens-ID</dt><dd className="font-mono text-xs break-all">{license.id}</dd>
        <dt className="text-slate-500">Gyldig til</dt><dd>{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('nb-NO') : 'Varig (engangskjøp)'}</dd>
        <dt className="text-slate-500">Versjon</dt><dd>{APP_VERSION} · {IS_OFFLINE_EDITION ? 'nedlastbar utgave' : 'nettutgave'}</dd>
      </dl> : required && <p className="text-sm">Ingen lisens registrert.</p>}
      {license && <button type="button" className="text-xs underline" onClick={() => { if (window.confirm('Fjerne lisensnøkkelen fra denne enheten? Arbeidsdata beholdes.')) signOut(); }}>Fjern lisens fra denne enheten</button>}
    </article>

    {!IS_OFFLINE_EDITION && license?.product === 'offline' && <article className="bg-white border border-teal-200 rounded-2xl p-5 space-y-2">
      <h3 className="font-bold">Last ned utgaven som virker uten nett</h3>
      <p className="text-sm text-slate-600">En zip-fil med én HTML-fil som åpnes i Chrome, Edge eller Firefox på Windows, macOS, Linux og ChromeOS. Ingen installasjon eller server trengs. På mobil og nettbrett: installer nettutgaven som app (Del → «Legg til på Hjem-skjerm»).</p>
      <button type="button" disabled={!online} onClick={() => void download()} className="rounded-lg bg-teal-800 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50">Last ned (zip)</button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </article>}

    {!IS_OFFLINE_EDITION && <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
      <h3 className="font-bold">Konto og synkronisering (valgfritt)</h3>
      <p className="text-sm text-slate-600">Innlogging trengs bare for prøveperiode og skysynkronisering. Slå på «Innlogging og skysynkronisering» under Personvern først.</p>
      <GoogleAuthButton />
    </article>}
  </section>;
};
