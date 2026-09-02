import React from 'react';
import type { AcademicIntegrityReport } from '../domain/academicEvidence';

export const AcademicIntegrityPanel: React.FC<{ report: AcademicIntegrityReport }> = ({ report }) => (
  <section className={`rounded-2xl border p-4 ${report.canExport ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="font-bold">Forskningsintegritet</h3>
        <p className="text-xs mt-1">{report.canExport ? 'Ingen blokkerende integritetsfeil.' : 'Eksport skal stoppes til blokkerende feil er løst.'}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${report.canExport ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
        {report.canExport ? 'KLAR' : 'BLOKKERT'}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
      <div className="rounded-lg bg-white/70 p-2">Støttet: <strong>{report.supportedClaims}</strong></div>
      <div className="rounded-lg bg-white/70 p-2">Ustøttet: <strong>{report.unsupportedClaims}</strong></div>
    </div>
    {report.issues.length > 0 && (
      <div className="mt-3 space-y-2">
        {report.issues.map((issue, index) => (
          <div key={`${issue.code}-${index}`} className="rounded-lg bg-white/70 p-2 text-xs">
            <strong>{issue.severity}</strong> · {issue.message}
          </div>
        ))}
      </div>
    )}
  </section>
);
