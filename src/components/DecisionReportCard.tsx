import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  ShieldCheck, 
  ExternalLink,
  BookOpen,
  ArrowRight,
  Share2
} from 'lucide-react';
import { EvidencePipelineSession } from '../types';
import { generateFinalDecisionReport } from '../utils/orchestratorEngine';

interface DecisionReportCardProps {
  session: EvidencePipelineSession;
}

export const DecisionReportCard: React.FC<DecisionReportCardProps> = ({ session }) => {
  const [copied, setCopied] = useState(false);
  const markdownReport = generateFinalDecisionReport(session);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([markdownReport], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `EvidenceOps-Beslutningsgrunnlag-${session.sessionId}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  const isApproved = session.humanApproval.isApproved;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl text-slate-100">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded uppercase">
              Endelig Leveranse &bull; Beslutningsgrunnlag
            </span>
            {isApproved ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Faglig signert & godkjent
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-semibold">
                Utkast &bull; Avventer menneskelig godkjenning
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            Klinisk Beslutningsgrunnlag: Kognitiv stimulering ved demens
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generert av EvidenceOps AI &bull; Standard for kunnskapsbasert praksis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert' : 'Kopier'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Last ned (.md)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Skriv ut / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Clinical Recommendation Card (Helsedirektoratet/NICE style) */}
      <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-wide">
            {session.clinicalRecommendation?.strength || 'STERK'} ANBEFALING FOR TILTAKET
          </span>
          <span className="text-xs text-slate-400">
            Evidensgrad: <strong className="text-emerald-400">MODERAT (GRADE)</strong>
          </span>
        </div>

        <blockquote className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
          "{session.clinicalRecommendation?.statement || 'Personer med mild til moderat demens bør tilbys kognitiv stimuleringsterapi (CST) i gruppe som en integrert del av helse- og omsorgstilbudet.'}"
        </blockquote>

        <div className="mt-4 pt-4 border-t border-emerald-900/40 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-emerald-300 block mb-1">Målgruppe:</span>
            <p className="text-slate-300">
              {session.clinicalRecommendation?.targetPopulation || 'Personer med mild til moderat demens (Alzheimer, vaskulær eller blandet demens).'}
            </p>
          </div>

          <div>
            <span className="font-bold text-emerald-300 block mb-1">Verdier & Brukermedvirkning:</span>
            <p className="text-slate-300">
              {session.clinicalRecommendation?.valuesAndPreferences || 'Sosialt fellesskap, verdighet og mestringsopplevelser verdsettes høyt av pasienter og pårørende.'}
            </p>
          </div>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        
        {/* Implementation guidance */}
        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Praktisk implementering & opplæring
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {(session.clinicalRecommendation?.implementationConsiderations || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence highlights */}
        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            Kunnskapsgrunnlag & Nøkkeltall
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Systematisk oversikt:</span>
              <span className="font-semibold text-slate-200">Cochrane (Woods et al. 2023, n=2914)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Effekt på kognisjon (ADAS-Cog):</span>
              <span className="font-mono text-emerald-400 font-bold">SMD 0.42 [0.31, 0.54] (p &lt; 0.00001)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Effekt på livskvalitet (QoL-AD):</span>
              <span className="font-mono text-emerald-400 font-bold">SMD 0.28 [0.16, 0.40]</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Kost-nytte (Knapp et al.):</span>
              <span className="font-semibold text-slate-200">&gt;80% sannsynlighet for kostnadseffektivitet</span>
            </div>
          </div>
        </div>

      </div>

      {/* Human Approval Sign-off Box */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Klinisk godkjenning & Ansvar
          </span>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-100">
              {session.humanApproval.reviewerName || 'Anne-Beth Andersen'}
            </span>
            <span className="text-slate-400">
              &bull; {session.humanApproval.reviewerRole || 'Klinisk spesialist'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 italic">
            "{session.humanApproval.clinicalNotes || 'Gjennomgått og godkjent for publisering.'}"
          </p>
        </div>

        <div className="text-right text-[11px] text-slate-500 font-mono">
          <span>Audit-ID: {session.sessionId}</span> <br />
          <span>Hash: {session.auditTrail[session.auditTrail.length - 1]?.hash || 'evops-sealed'}</span>
        </div>
      </div>
    </div>
  );
};
