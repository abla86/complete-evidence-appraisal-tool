import React, { useMemo, useState } from 'react';
import type { ReferenceRecord } from '../services/referenceHubService';
import { buildCitation, type CitationStyle } from '../services/academicCitationService';
import { evaluateAcademicIntegrity, type AcademicClaim, type EvidenceExtraction, type AcademicDocument } from '../domain/academicEvidence';

interface Props { references: ReferenceRecord[]; }
const EMPTY_DOCUMENT: AcademicDocument = { id: 'new-document', title: 'Ny akademisk tekst', level: 'MASTER', body: '', claimIds: [], updatedAt: new Date().toISOString() };

export const WritingStudioView: React.FC<Props> = ({ references }) => {
  const [academicDocument, setAcademicDocument] = useState<AcademicDocument>(EMPTY_DOCUMENT);
  const [claims, setClaims] = useState<AcademicClaim[]>([]);
  const [evidence, setEvidence] = useState<EvidenceExtraction[]>([]);
  const [style, setStyle] = useState<CitationStyle>('APA7');
  const [selectedReferenceId, setSelectedReferenceId] = useState('');
  const [message, setMessage] = useState('');
  const verifiedSourceIds = useMemo(() => new Set(references.filter(r => r.verification === 'VALIDATED').map(r => r.id)), [references]);
  const integrity = useMemo(() => evaluateAcademicIntegrity(claims, evidence, verifiedSourceIds), [claims, evidence, verifiedSourceIds]);

  const addClaim = () => {
    const text = window.prompt('Ny påstand');
    if (!text?.trim()) return;
    const now = new Date().toISOString();
    const claim: AcademicClaim = { id: crypto.randomUUID(), text: text.trim(), supportingEvidenceIds: [], contradictoryEvidenceIds: [], status: 'UNVERIFIED', createdAt: now, updatedAt: now, authorId: 'current-user' };
    setClaims(prev => [...prev, claim]);
    setAcademicDocument(prev => ({ ...prev, claimIds: [...prev.claimIds, claim.id], updatedAt: now }));
  };

  const addEvidence = () => {
    if (!selectedReferenceId) { setMessage('Velg en Reference Hub-kilde først.'); return; }
    const excerpt = window.prompt('Eksakt evidensutdrag. Ikke omskriv sitatet.')?.trim();
    if (!excerpt) return;
    const location = window.prompt('Lokasjon, f.eks. side 12, Tabell 2 eller Resultater.')?.trim() || undefined;
    const ref = references.find(r => r.id === selectedReferenceId);
    const item: EvidenceExtraction = { id: crypto.randomUUID(), sourceRecordId: selectedReferenceId, sourceIdentifiers: ref ? { doi: ref.doi || undefined, pmid: ref.pmid || undefined, pmcid: ref.pmcid || undefined, isbn: ref.isbn || undefined, issn: ref.issn || undefined } : undefined, excerpt, location: location ? { page: location } : undefined, evidenceType: 'QUOTE', extractedBy: 'current-user', extractedAt: new Date().toISOString(), linkedClaims: [], researcherVerified: false };
    setEvidence(prev => [...prev, item]);
    setMessage('Evidens er registrert som UVERIFISERT. Forsker må kontrollere den før eksport.');
  };

  const linkEvidence = (claimId: string, evidenceId: string) => {
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, supportingEvidenceIds: [...new Set([...c.supportingEvidenceIds, evidenceId])], status: 'NEEDS_REVIEW', updatedAt: new Date().toISOString() } : c));
    setEvidence(prev => prev.map(e => e.id === evidenceId ? { ...e, linkedClaims: [...new Set([...e.linkedClaims, claimId])] } : e));
  };

  const verifyEvidence = (evidenceId: string) => {
    const note = window.prompt('Forskerens kontrollnotat (hva er verifisert?):')?.trim();
    if (!note) { setMessage('Verifikasjon krever kontrollnotat.'); return; }
    setEvidence(prev => prev.map(e => e.id === evidenceId ? { ...e, researcherVerified: true, verificationNote: note } : e));
    setMessage('Evidens er forskerverifisert.');
  };

  const verifyClaim = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    const linked = evidence.filter(e => claim.supportingEvidenceIds.includes(e.id));
    if (!linked.length || linked.some(e => !e.researcherVerified) || linked.some(e => !verifiedSourceIds.has(e.sourceRecordId))) {
      setMessage('Påstanden kan ikke settes til SUPPORTED før lenket evidens og kilder er kontrollert.');
      return;
    }
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'SUPPORTED', updatedAt: new Date().toISOString() } : c));
  };

  const insertCitation = () => {
    const reference = references.find(r => r.id === selectedReferenceId);
    if (!reference) { setMessage('Velg en kilde.'); return; }
    const citation = buildCitation({ id: reference.id, ...reference }, style);
    setAcademicDocument(prev => ({ ...prev, body: `${prev.body}${prev.body ? '\n\n' : ''}${citation.inline}`, updatedAt: new Date().toISOString() }));
    setMessage(`${style}-sitat satt inn.`);
  };

  const exportDocument = () => {
    if (!integrity.canExport) { setMessage('Eksport blokkert: rett integritetsfeil først.'); return; }
    const blob = new Blob([academicDocument.body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${academicDocument.title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'academic-document'}.md`; a.click(); URL.revokeObjectURL(url);
  };

  return <section className="space-y-5 pb-16">
    <header className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4"><div><div className="text-[11px] uppercase tracking-wide text-slate-500">Evidence Appraisal · Writing Studio</div><h2 className="text-2xl font-bold font-serif">Master / PhD forskningsskriving</h2><p className="text-sm text-slate-600 mt-1">Påstand → evidens → Reference Hub → integritetskontroll → eksport.</p></div><div className="flex flex-wrap gap-2"><select value={academicDocument.level} onChange={e => setAcademicDocument({ ...academicDocument, level: e.target.value as AcademicDocument['level'] })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="MASTER">Master</option><option value="PHD">PhD</option><option value="ARTICLE">Forskningsartikkel</option><option value="PROTOCOL">Protokoll</option><option value="REPORT">Rapport</option></select><select value={style} onChange={e => setStyle(e.target.value as CitationStyle)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="APA7">APA 7</option><option value="VANCOUVER">Vancouver/NLM</option><option value="HARVARD">Harvard</option><option value="CHICAGO_AUTHOR_DATE">Chicago Author-Date</option><option value="MLA9">MLA 9</option><option value="IEEE">IEEE</option></select><button type="button" onClick={addClaim} className="px-3 py-2 rounded-xl bg-teal-800 text-white text-sm font-semibold">Ny påstand</button><button type="button" onClick={exportDocument} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">Eksporter</button></div></div></header>

    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5"><section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><input value={academicDocument.title} onChange={e => setAcademicDocument({ ...academicDocument, title: e.target.value, updatedAt: new Date().toISOString() })} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold" /><textarea value={academicDocument.body} onChange={e => setAcademicDocument({ ...academicDocument, body: e.target.value, updatedAt: new Date().toISOString() })} rows={25} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-serif text-base leading-7" placeholder="Skriv her. Påstander kobles til evidens i sidepanelet." />{message && <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-900">{message}</div>}</section>

      <aside className="space-y-5"><section className={`rounded-2xl border p-4 ${integrity.canExport ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}><div className="font-bold">Integritetskontroll</div><div className="text-sm mt-1">{integrity.canExport ? 'Klar for eksport.' : 'Eksport blokkert.'}</div><div className="text-xs mt-2">Støttede: {integrity.supportedClaims} · Ustøttede: {integrity.unsupportedClaims} · Feil: {integrity.issues.length}</div>{integrity.issues.map((issue, i) => <div key={`${issue.code}-${issue.claimId}-${i}`} className="mt-2 text-xs rounded-lg bg-white/70 p-2"><strong>{issue.severity}</strong> · {issue.message}</div>)}</section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"><div className="font-bold">Reference Hub</div><select value={selectedReferenceId} onChange={e => setSelectedReferenceId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Velg kilde</option>{references.map(r => <option key={r.id} value={r.id}>{r.title || 'Uten tittel'} · {r.verification}</option>)}</select><div className="flex gap-2"><button type="button" onClick={addEvidence} className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-sm font-semibold">Ny evidens</button><button type="button" onClick={insertCitation} className="flex-1 px-3 py-2 rounded-xl bg-teal-800 text-white text-sm font-semibold">Sett inn sitat</button></div></section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4"><div className="font-bold">Påstander</div><div className="space-y-2 mt-3 max-h-[30rem] overflow-auto">{claims.length === 0 && <div className="text-sm text-slate-500">Ingen påstander.</div>}{claims.map(claim => { const linked = evidence.filter(e => claim.supportingEvidenceIds.includes(e.id)); return <div key={claim.id} className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold">{claim.status}</div><div className="text-sm mt-1">{claim.text}</div><div className="text-[11px] text-slate-500 mt-2">Evidens: {linked.length}</div>{linked.map(e => <div key={e.id} className="mt-2 text-[11px] rounded-lg bg-slate-50 p-2"><div>{e.researcherVerified ? '✓ Forskervalidert' : '⚠ Ikke forskervalidert'}</div>{!e.researcherVerified && <button type="button" onClick={() => verifyEvidence(e.id)} className="mt-1 px-2 py-1 rounded-lg bg-emerald-700 text-white">Verifiser evidens</button>}</div>)}{linked.length > 0 && <button type="button" onClick={() => verifyClaim(claim.id)} className="mt-2 px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px]">Godkjenn påstand</button>}{linked.length === 0 && <div className="mt-2 text-[11px] text-rose-700">Mangler evidens.</div>}{evidence.length > 0 && <div className="mt-2 space-y-1">{evidence.filter(e => !claim.supportingEvidenceIds.includes(e.id)).map(e => <button key={e.id} type="button" onClick={() => linkEvidence(claim.id, e.id)} className="w-full text-left text-[11px] rounded-lg border border-slate-200 p-2 hover:bg-slate-50">Koble evidens: {e.excerpt.slice(0, 80)}</button>)}</div>}</div>; })}</div></section></aside></div>

    <section className="bg-white border border-slate-200 rounded-2xl p-5"><div className="font-bold">Evidensregister</div><div className="grid md:grid-cols-2 gap-3 mt-3">{evidence.length === 0 && <div className="text-sm text-slate-500">Ingen evidens.</div>}{evidence.map(item => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between text-[10px] uppercase text-slate-400"><span>{item.evidenceType}</span><span>{item.researcherVerified ? 'VALIDERT' : 'UVERIFISERT'}</span></div><blockquote className="text-sm mt-1">{item.excerpt}</blockquote><div className="text-xs text-slate-500 mt-2">Kilde: {references.find(r => r.id === item.sourceRecordId)?.title || item.sourceRecordId} · {item.location?.page || item.location?.section || item.location?.table || item.location?.figure || 'Lokasjon mangler'}</div>{!item.researcherVerified && <button type="button" onClick={() => verifyEvidence(item.id)} className="mt-2 px-2 py-1 rounded-lg bg-emerald-700 text-white text-[11px]">Verifiser</button>}</div>)}</div></section>
  </section>;
};
