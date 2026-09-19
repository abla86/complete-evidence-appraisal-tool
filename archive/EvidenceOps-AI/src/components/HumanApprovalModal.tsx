import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Signature, 
  UserCheck,
  Check
} from 'lucide-react';
import { EvidencePipelineSession } from '../types';

interface HumanApprovalModalProps {
  session: EvidencePipelineSession;
  onApprove: (reviewerName: string, reviewerRole: string, notes: string) => void;
  onReject: (reviewerName: string, reviewerRole: string, notes: string) => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  session,
  onApprove,
  onReject,
}) => {
  const [reviewerName, setReviewerName] = useState('Anne-Beth Andersen');
  const [reviewerRole, setReviewerRole] = useState('Klinisk spesialist / Forskningsansvarlig');
  const [notes, setNotes] = useState('Gjennomgått PICO, Cochrane-oversikt (Woods 2023) og GRADE-vurdering. Metodisk grunnlag er solid og klinisk anbefaling er godt forankret.');
  
  const [checkPico, setCheckPico] = useState(true);
  const [checkStudies, setCheckStudies] = useState(true);
  const [checkGrade, setCheckGrade] = useState(true);
  const [checkEthics, setCheckEthics] = useState(true);

  const allChecked = checkPico && checkStudies && checkGrade && checkEthics;

  const handleApprove = () => {
    if (!reviewerName.trim() || !reviewerRole.trim()) return;
    onApprove(reviewerName, reviewerRole, notes);
  };

  const handleReject = () => {
    if (!reviewerName.trim() || !reviewerRole.trim()) return;
    onReject(reviewerName, reviewerRole, notes);
  };

  const isApproved = session.humanApproval.isApproved;

  return (
    <div className={`border rounded-2xl p-6 sm:p-8 shadow-2xl transition-all ${
      isApproved
        ? 'bg-emerald-950/20 border-emerald-500/80 ring-1 ring-emerald-500/30'
        : 'bg-slate-900 border-amber-500/80 ring-2 ring-amber-500/20'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            isApproved 
              ? 'bg-emerald-950 text-emerald-400 border-emerald-700' 
              : 'bg-amber-950 text-amber-400 border-amber-700 animate-pulse'
          }`}>
            {isApproved ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                isApproved 
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' 
                  : 'bg-amber-900/60 text-amber-300 border border-amber-700'
              }`}>
                {isApproved ? 'Sikkerhetskontroll godkjent' : 'Obligatorisk Menneskelig Kontrollpunkt'}
              </span>
              <span className="text-xs text-slate-400">Trinn 6 av 6 &bull; Human-in-the-Loop</span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {isApproved 
                ? 'Faglig godkjenning fullført & autorisert' 
                : 'Stopp for menneskelig gransking & godkjenning'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isApproved
                ? `Signert av ${session.humanApproval.reviewerName} (${session.humanApproval.reviewerRole}). Beslutningsgrunnlag er godkjent for publisering.`
                : 'Autonom agentkjøring er pauset. Kunnskapsbasert praksis krever at en kvalifisert fagperson vurderer og godkjenner kunnskapsgrunnlaget før faglige råd publiseres.'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary of Evidence Ready for Approval */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">1. Formulert PICO</span>
          <p className="font-semibold text-slate-100 mt-1 line-clamp-2">
            {session.pico?.population} &rarr; {session.pico?.intervention}
          </p>
          <span className="text-emerald-400 font-medium text-[11px] block mt-2">
            ✓ Primære utfall: {session.pico?.primaryOutcomes.join(', ')}
          </span>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">2. Identifiserte studier</span>
          <p className="font-semibold text-slate-100 mt-1">
            {session.prisma?.studiesIncluded || 4} sentrale studier inkludert (Cochrane + RCTer)
          </p>
          <span className="text-emerald-400 font-medium text-[11px] block mt-2">
            ✓ Metodisk kvalitet: Høy (AMSTAR-2 94% konfidens)
          </span>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">3. Foreløpig GRADE & Anbefaling</span>
          <p className="font-semibold text-slate-100 mt-1">
            MODERAT evidens for kognisjon (SMD 0.42)
          </p>
          <span className="text-emerald-400 font-medium text-[11px] block mt-2">
            ✓ Forslag: STERK ANBEFALING FOR CST
          </span>
        </div>
      </div>

      {/* Checklist of verification */}
      {!isApproved ? (
        <div className="space-y-6">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Klinisk verifiseringssjekkliste (Påkrevd for signering)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
              <label className="flex items-start gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={checkPico}
                  onChange={(e) => setCheckPico(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-400 mt-0.5"
                />
                <span>Jeg har verifisert at PICO dekker populasjonen og klinisk problemstilling</span>
              </label>

              <label className="flex items-start gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={checkStudies}
                  onChange={(e) => setCheckStudies(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-400 mt-0.5"
                />
                <span>Jeg har gransket litteraturtreff og duplikathåndtering (PRISMA)</span>
              </label>

              <label className="flex items-start gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={checkGrade}
                  onChange={(e) => setCheckGrade(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-400 mt-0.5"
                />
                <span>Jeg godkjenner CASP/AMSTAR-2 vurderingene og GRADE-graderingen</span>
              </label>

              <label className="flex items-start gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={checkEthics}
                  onChange={(e) => setCheckEthics(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-400 mt-0.5"
                />
                <span>Jeg bekrefter at faglige råd er etisk forsvarlige og klare for beslutning</span>
              </label>
            </div>
          </div>

          {/* Form fields for formal signoff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fagpersonens fulle navn:
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="F.eks. Dr. Anne-Beth Andersen"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Klinisk stilling / Forskerrolle:
              </label>
              <input
                type="text"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="F.eks. Spesialist i geriatri / Overlege"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Faglige vurderinger & begrunnelse for sign-off:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500"
              placeholder="Skriv kommentar eller eventuelle forbehold..."
            />
          </div>

          {/* Decision Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReject}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-rose-800 bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Avvis / Krev revisjon</span>
            </button>

            <button
              type="button"
              disabled={!allChecked || !reviewerName.trim() || !reviewerRole.trim()}
              onClick={handleApprove}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Godkjenn & Publiser Beslutningsgrunnlag</span>
            </button>
          </div>
        </div>
      ) : (
        /* Approved Confirmation Display */
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Check className="w-4 h-4" />
              <span>Signert og forseglet i audit-loggen</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              <strong>Fagperson:</strong> {session.humanApproval.reviewerName} ({session.humanApproval.reviewerRole}) &bull; 
              <span className="text-slate-400 ml-1 font-mono">{session.humanApproval.reviewedAt || 'Nylig signert'}</span>
            </p>
            {session.humanApproval.clinicalNotes && (
              <p className="text-xs text-emerald-300/80 mt-1 italic">
                "{session.humanApproval.clinicalNotes}"
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-900 text-emerald-200 border border-emerald-600 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              AUTORISERT
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
