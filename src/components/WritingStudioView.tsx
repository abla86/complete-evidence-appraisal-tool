import React, { useMemo, useState } from 'react';
import type { ReferenceRecord } from '../services/referenceHubService';
import { buildCitation, type CitationStyle } from '../services/academicCitationService';
import {
  evaluateAcademicIntegrity,
  type AcademicClaim,
  type EvidenceExtraction,
  type AcademicDocument,
} from '../domain/academicEvidence';

interface Props {
  references: ReferenceRecord[];
}

const EMPTY_DOCUMENT: AcademicDocument = {
  id: 'new-document',
  title: 'Ny akademisk tekst',
  level: 'MASTER',
  body: '',
  claimIds: [],
  updatedAt: new Date().toISOString(),
};

export const WritingStudioView: React.FC<Props> = ({ references }) => {
  const [document, setDocument] = useState<AcademicDocument>(EMPTY_DOCUMENT);
  const [claims, setClaims] = useState<AcademicClaim[]>([]);
  const [evidence, setEvidence] = useState<EvidenceExtraction[]>([]);
  const [style, setStyle] = useState<CitationStyle>('APA7');
  const [selectedReferenceId, setSelectedReferenceId] = useState('');
  const [message, setMessage] = useState('');

  const verifiedSourceIds = useMemo(
    () => new Set(references.filter(r => r.verification === 'VALIDATED').map(r => r.id)),
    [references],
  );

  const integrity = useMemo(
    () => evaluateAcademicIntegrity(claims, evidence, verifiedSourceIds),
    [claims, evidence, verifiedSourceIds],
  );

  const addClaimFromText = () => {
    const text = window.prompt('Ny påstand');
    if (!text?.trim()) return;
    const now = new Date().toISOString();
    const claim: AcademicClaim = {
      id: crypto.randomUUID(),
      text: text.trim(),
      supportingEvidenceIds: [],
      contradictoryEvidenceIds: [],
      status: 'UNVERIFIED',
      createdAt: now,
      updatedAt: now,
      authorId: 'current-user',
    };
    setClaims(prev => [...prev, claim]);
    setDocument(prev => ({ ...prev, claimIds: [...prev.claimIds, claim.id], updatedAt: now }));
  };

  const addEvidence = () => {
    if (!selectedReferenceId) {
      setMessage('Velg en referanse før du legger inn evidens.');
      return;
    }
    const excerpt = window.prompt('Lim inn eksakt evidensutdrag fra kilden. Ikke omskriv sitatet.')?.trim();
    if (!excerpt) return;
    const location = window.prompt('Hvor i kilden? F.eks. side 12, metodeavsnitt eller tabell 2.')?.trim() || undefined;
    const item: EvidenceExtraction = {
      id: crypto.randomUUID(),
      sourceRecordId: selectedReferenceId,
      excerpt,
      location: location ? { page: location } : undefined,
      evidenceType: 'QUOTE',
      extractedBy: 'current-user',
      extractedAt: new Date().toISOString(),
      linkedClaims: [],
      researcherVerified: false,
    };
    setEvidence(prev => [...prev, item]);
    setMessage('Evidens lagt til. Den kan først brukes som verifisert grunnlag etter forskerkontroll.');
  };

  const linkEvidenceToClaim = (claimId: string, evidenceId: string) => {
    setClaims(prev => prev.map(c => c.id === claimId
      ? { ...c, supportingEvidenceIds: [...new Set([...c.supportingEvidenceIds, evidenceId])], status: 'NEEDS_REVIEW', updatedAt: new Date().toISOString() }
      : c));
    setEvidence(prev => prev.map(e => e.id === evidenceId
      ? { ...e, linkedClaims: [...new Set([...e.linkedClaims, claimId])] }
      : e));
  };

  const verifyClaim = (claimId: string) => {
    setClaims(prev => prev.map(c => c.id === claimId
      ? { ...c, status: 'SUPPORTED', updatedAt: new Date().toISOString() }
      : c));
  };

  const insertCitation = () => {
    const reference = references.find(r => r.id === selectedReferenceId);
    if (!reference) {
      setMessage('Velg en referanse.');
      return;
    }
    const citation = buildCitation({ id: reference.id, ...reference }, style);
    setDocument(prev => ({ ...prev, body: `${prev.body}${prev.body ? '\n\n' : ''}${citation.inline}`, updatedAt: new Date().toISOString() }));
    setMessage(`${style}-sitat satt inn. Kilde: ${citation.sourceStatus}.`);
  };

  const exportDocument = () => {
    if (!integrity.canExport) {
      setMessage('Eksport blokkert: løs feilene i integritetskontrollen først.');
      return;
    }
    const blob = new Blob([document.body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'academic-document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5 pb-16">
      <header className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Academic Writing Studio</div>
            <h2 className="text-2xl font-bold font-serif">Master / PhD forskningsskriving</h2>
            <p className="text-sm text-slate-600 mt-1">Skriving, påstander, evidens, sitater og integritetskontroll i samme arbeidsflate.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={document.level} onChange={e => setDocument({ ...document, level: e.target.value as AcademicDocument['level'] })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="MASTER">Master</option><option value="PHD">PhD</option><option value="ARTICLE">Forskningsartikkel</option><option value="PROTOCOL">Protokoll</option><option value="REPORT">Forskningsrapport</option>
            </select>
            <select value={style} onChange={e => setStyle(e.target.value as CitationStyle)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="APA7">APA 7</option><option value="VANCOUVER">Vancouver/NLM</option><option value="HARVARD">Harvard</option><option value="CHICAGO_AUTHOR_DATE">Chicago Author-Date</option><option value="MLA9">MLA 9</option><option value="IEEE">IEEE</option>
            </select>
            <button type="button" onClick={addClaimFromText} className="px-3 py-2 rounded-xl bg-teal-800 text-white text-sm font-semibold">Ny påstand</button>
            <button type="button" onClick={exportDocument} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">Eksporter</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <input value={document.title} onChange={e => setDocument({ ...document, title: e.target.value, updatedAt: new Date().toISOString() })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" aria-label="Dokumenttittel" />
          <textarea value={document.body} onChange={e => setDocument({ ...document, body: e.target.value, updatedAt: new Date().toISOString() })} rows={24} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-serif text-base leading-7" placeholder="Skriv her. Faktapåstander skal kobles til evidens før dokumentet kan eksporteres." />
          {message && <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-900">{message}</div>}
        </section>

        <aside className="space-y-5">
          <section className={`rounded-2xl border p-4 ${integrity.canExport ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="font-bold">Integritetskontroll</div>
            <div className="text-sm mt-1">{integrity.canExport ? 'Ingen blokkerende feil registrert.' : 'Eksport er blokkert til feilene er rettet.'}</div>
            <div className="text-xs mt-2">Støttede påstander: {integrity.supportedClaims} · Ustøttede: {integrity.unsupportedClaims}</div>
            {integrity.issues.length > 0 && <div className="mt-3 space-y-2">{integrity.issues.map((issue, index) => <div key={`${issue.code}-${issue.claimId}-${index}`} className="text-xs rounded-lg bg-white/70 p-2"><strong>{issue.severity}</strong> · {issue.message}</div>)}</div>}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="font-bold">Kilder</div>
            <select value={selectedReferenceId} onChange={e => setSelectedReferenceId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="">Velg kilde</option>
              {references.map(r => <option key={r.id} value={r.id}>{r.title || 'Uten tittel'} · {r.verification}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={addEvidence} className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm font-semibold">Legg inn evidens</button>
              <button type="button" onClick={insertCitation} className="flex-1 px-3 py-2 rounded-xl bg-teal-800 text-white text-sm font-semibold">Sett inn sitat</button>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="font-bold">Påstander</div>
            <div className="space-y-2 mt-3 max-h-[28rem] overflow-auto">
              {claims.length === 0 && <div className="text-sm text-slate-500">Ingen påstander registrert.</div>}
              {claims.map(claim => {
                const linked = evidence.filter(e => claim.supportingEvidenceIds.includes(e.id));
                return <div key={claim.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold">{claim.status}</div>
                  <div className="text-sm mt-1">{claim.text}</div>
                  <div className="text-[11px] text-slate-500 mt-2">Evidens: {linked.length}</div>
                  {linked.length > 0 && <button type="button" onClick={() => verifyClaim(claim.id)} className="mt-2 px-2 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold">Godkjenn som støttet</button>}
                </div>;
              })}
            </div>
          </section>
        </aside>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="font-bold">Evidensregister</div>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {evidence.length === 0 && <div className="text-sm text-slate-500">Ingen evidens registrert.</div>}
          {evidence.map(item => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="text-[10px] uppercase text-slate-400">{item.evidenceType}</div><blockquote className="text-sm mt-1">{item.excerpt}</blockquote><div className="text-xs text-slate-500 mt-2">Kilde: {references.find(r => r.id === item.sourceRecordId)?.title || item.sourceRecordId} · {item.location?.page || 'Lokasjon mangler'}</div></div>)}
        </div>

        {claims.length > 0 && evidence.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-sm font-semibold mb-2">Koble evidens til påstand</div>
          <div className="grid md:grid-cols-2 gap-2">
            {claims.map(claim => evidence.map(ev => claim.supportingEvidenceIds.includes(ev.id) ? null : (
              <button key={`${claim.id}-${ev.id}`} type="button" onClick={() => linkEvidenceToClaim(claim.id, ev.id)} className="text-left text-xs rounded-xl border border-slate-200 p-2 hover:bg-slate-50">
                Koble <strong>evidens</strong> til: {claim.text.slice(0, 70)}
              </button>
            )))}
          </div>
        </div>}
      </section>
    </section>
  );
};
