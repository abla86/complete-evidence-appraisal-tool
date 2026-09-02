import React, { useMemo } from 'react';
import type { ReferenceRecord } from '../services/referenceHubService';
import type { CitationStyle } from '../services/academicCitationService';
import type { AcademicClaim, EvidenceExtraction } from '../domain/academicEvidence';
import { runCitationAudit } from '../services/citationAuditService';

export const CitationAuditView: React.FC<{
  claims: AcademicClaim[];
  evidence: EvidenceExtraction[];
  references: ReferenceRecord[];
  style?: CitationStyle;
}> = ({ claims, evidence, references, style = 'APA7' }) => {
  const report = useMemo(() => runCitationAudit(claims, evidence, references, style), [claims, evidence, references, style]);
  const usedReferenceIds = new Set(report.results.flatMap(result => result.linkedReferences.map(reference => reference.id)));
  const unusedReferences = references.filter(reference => !usedReferenceIds.has(reference.id));

  return (
    <section className="space-y-4">
      <header className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Citation Audit</div>
            <h2 className="text-xl font-bold font-serif">Siterings- og kildeintegritet</h2>
          </div>
          <span className={`px-3 py-2 rounded-xl text-xs font-bold ${report.canExport ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
            {report.canExport ? 'EKSPORT TILLATT' : 'EKSPORT BLOKKERT'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-3">Påstander <strong>{claims.length}</strong></div>
          <div className="rounded-xl bg-slate-50 p-3">Godkjent <strong>{report.results.filter(r => r.ok).length}</strong></div>
          <div className="rounded-xl bg-slate-50 p-3">Feil <strong>{report.blockingIssues}</strong></div>
          <div className="rounded-xl bg-slate-50 p-3">Ubrukte referanser <strong>{unusedReferences.length}</strong></div>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3">Påstand</th>
                <th className="text-left p-3">Evidens</th>
                <th className="text-left p-3">Kilder</th>
                <th className="text-left p-3">Sitat</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map(result => (
                <tr key={result.claimId} className="border-b border-slate-100 align-top">
                  <td className="p-3 max-w-md">{result.claimText}</td>
                  <td className="p-3">{result.linkedEvidence.length}</td>
                  <td className="p-3">{result.linkedReferences.length}</td>
                  <td className="p-3 min-w-[260px]">{result.citation || '—'}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${result.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>{result.ok ? 'OK' : 'FEIL'}</span>{result.reasons.length > 0 && <div className="mt-2 space-y-1 text-xs text-rose-800">{result.reasons.map((reason, i) => <div key={i}>• {reason}</div>)}</div>}</td>
                </tr>
              ))}
              {report.results.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Ingen påstander å kontrollere.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {unusedReferences.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="font-bold text-amber-950">Referanser i biblioteket som ikke er brukt</h3>
          <div className="mt-2 space-y-1 text-sm text-amber-950">{unusedReferences.map(reference => <div key={reference.id}>{reference.title || 'Uten tittel'}</div>)}</div>
        </section>
      )}
    </section>
  );
};
