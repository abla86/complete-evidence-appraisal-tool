import React, { useMemo, useState } from 'react';
import { inspectPrivacy } from '../services/privacyInspector';
import { inspectAccessibility } from '../services/accessibilityInspector';

export const IntegratedResearchInspectorsView: React.FC = () => {
  const [url, setUrl] = useState('https://example.test/article');
  const [externalUrls, setExternalUrls] = useState('https://cdn.example.org/app.js\nhttps://www.google-analytics.com/analytics.js');
  const [htmlSignals, setHtmlSignals] = useState({ missingAlt: 1, emptyAlt: 1, unnamedButtons: 0, h1Count: 1, mainLandmarkCount: 1, headingCount: 4 });

  const privacy = useMemo(() => inspectPrivacy({ sourceUrl: url, externalUrls: externalUrls.split(/\r?\n/).filter(Boolean), analyzedAt: '2026-09-02T18:00:00.000Z' }), [url, externalUrls]);
  const accessibility = useMemo(() => inspectAccessibility({ sourceUrl: url, images: Array(htmlSignals.missingAlt + htmlSignals.emptyAlt).fill(null).map((_, i) => ({ hasAlt: i >= htmlSignals.missingAlt, alt: i < htmlSignals.missingAlt ? '' : i < htmlSignals.missingAlt + htmlSignals.emptyAlt ? '' : 'image' })), buttons: Array(htmlSignals.unnamedButtons).fill(null).map(() => ({ text: '' })), ...htmlSignals, analyzedAt: '2026-09-02T18:00:00.000Z' }), [url, htmlSignals]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Integrert Research Inspector</h2>
        <p className="text-sm text-slate-600 mt-1">Lokal metadata-, personvern- og tilgjengelighetsanalyse som støttefunksjon i evidence-workflowen.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Privacy signals</h3>
          <label className="block mt-4 text-xs font-semibold text-slate-700">Kildeside</label>
          <input value={url} onChange={e => setUrl(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" />
          <label className="block mt-3 text-xs font-semibold text-slate-700">Eksterne URL-er, én per linje</label>
          <textarea value={externalUrls} onChange={e => setExternalUrls(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm h-28" />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-bold">{privacy.externalResourceCount}</div><div className="text-[11px]">Eksterne ressurser</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-bold">{privacy.externalHosts.length}</div><div className="text-[11px]">Eksterne domener</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-bold">{privacy.trackingIndicatorCount}</div><div className="text-[11px]">Tracking-signaler</div></div>
          </div>
          <div className="mt-4 text-xs text-slate-600">{privacy.trackingHosts.length ? `Tracking-indikatorer: ${privacy.trackingHosts.join(', ')}` : 'Ingen konfigurerte tracking-indikatorer observert.'}</div>
          <div className="mt-2 text-[11px] text-slate-500">Observasjon, ikke GDPR- eller sikkerhetssertifisering.</div>
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Accessibility signals</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {Object.entries(accessibility).filter(([k]) => !['sourceUrl', 'analyzedAt', 'checksAreSignals'].includes(k)).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 p-3"><div className="text-lg font-bold">{String(value)}</div><div className="text-[11px] text-slate-600">{key}</div></div>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-slate-500">Heuristiske signaler, ikke WCAG-konformitetssertifisering.</div>
        </article>
      </div>
    </section>
  );
};
