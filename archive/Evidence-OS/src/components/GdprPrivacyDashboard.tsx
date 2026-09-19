import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Eye, 
  EyeOff, 
  FileCheck2, 
  Check, 
  Copy, 
  AlertCircle,
  HelpCircle,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Sliders,
  Beaker
} from 'lucide-react';
import { StudyExtraction, StudyRecord } from '../types';
import { 
  scanExtraction, 
  sanitizeExtraction, 
  ExtractionScanReport, 
  PiiScanIssue 
} from '../utils/gdprScanner';

interface GdprPrivacyDashboardProps {
  currentStudy: StudyRecord;
  currentExtraction: StudyExtraction;
  onUpdateExtraction: (updated: StudyExtraction) => void;
  onUpdateAllExtractions?: (updater: (prev: StudyExtraction) => StudyExtraction) => void;
  language: 'no' | 'en';
}

export const GdprPrivacyDashboard: React.FC<GdprPrivacyDashboardProps> = ({
  currentStudy,
  currentExtraction,
  onUpdateExtraction,
  onUpdateAllExtractions,
  language,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showChecklistDetails, setShowChecklistDetails] = useState(true);
  const [showMaskedPreview, setShowMaskedPreview] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [justSanitized, setJustSanitized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Scan current extraction
  const report: ExtractionScanReport = scanExtraction(currentExtraction);

  // Trigger Sanitize Single Study
  const handleSanitizeSingle = () => {
    setIsScanning(true);
    setTimeout(() => {
      const { sanitizedExtraction, totalRedacted } = sanitizeExtraction(currentExtraction);
      onUpdateExtraction(sanitizedExtraction);
      setIsScanning(false);
      setJustSanitized(true);
      setTimeout(() => setJustSanitized(false), 4000);
    }, 350);
  };

  // Trigger Sanitize All Studies
  const handleSanitizeAll = () => {
    if (!onUpdateAllExtractions) {
      handleSanitizeSingle();
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      onUpdateAllExtractions((ext) => {
        const { sanitizedExtraction } = sanitizeExtraction(ext);
        return sanitizedExtraction;
      });
      setIsScanning(false);
      setJustSanitized(true);
      setTimeout(() => setJustSanitized(false), 4000);
    }, 450);
  };

  // Demo: Inject test clinical note with simulated PII to demonstrate detection & masking
  const handleInjectSamplePii = () => {
    const demoWithPii: StudyExtraction = {
      ...currentExtraction,
      interventionDetails: `Dapagliflozin 10 mg oralt daglig administrert under oppsyn av Dr. H. Hansen (tlf: +47 98234567, e-post: hansen.pharma@ous-hf.no, PasientID: HF-94028). Pasient født: 14.03.1954.`,
      controlDetails: `Placebo matchet tablett 1 gang daglig. Overlege Anne Berg (tlf: 22118000, FNR: 14035448123) monitorerte bivirkningsprofil.`,
    };
    onUpdateExtraction(demoWithPii);
  };

  // Copy Audit Hash
  const handleCopyAuditHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  const isCompliant = !report.hasPii && report.gdprArticle9Compliant;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all mb-6">
      {/* Top Banner & Control Bar */}
      <div className={`p-5 transition-colors ${
        isCompliant 
          ? 'bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white' 
          : 'bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCompliant ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isCompliant ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 animate-pulse" />}
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>GDPR &amp; Helsedatapersonvern Dashboard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-white/10 text-slate-200 border border-white/15">
                  Art. 9 &amp; HIPAA Shield
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Automatisert sanntidskontroll av datauthenting for {currentStudy.citationKey}: Sikrer at ingen uautoriserte personidentifikatorer (PII) eller beskyttet helseinformasjon (PHI) lekker inn i metaanalysen.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Sanitize Data Primary Button */}
            <button
              onClick={handleSanitizeSingle}
              disabled={isScanning}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                report.hasPii
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 ring-2 ring-rose-400/50 animate-bounce hover:animate-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
              title="Masker sensitive opplysninger med standardiserte avidentifiseringstagger"
            >
              {isScanning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saniterer data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Saniter data (Masker PII/PHI)</span>
                </>
              )}
            </button>

            {/* Test Sample Injector for Demo */}
            <button
              onClick={handleInjectSamplePii}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition"
              title="Sett inn simulerte helsedata med PII for å teste deteksjon og sanering"
            >
              <Beaker className="w-3.5 h-3.5 text-amber-300" />
              <span>Test PII-demo</span>
            </button>

            {/* Expand / Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition"
              title={isExpanded ? 'Skjul detaljert oversikt' : 'Vis detaljert oversikt'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Success Alert Banner when sanitized */}
        {justSanitized && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-semibold">
                Data vellykket sanert! Alle personidentifikatorer er erstattet med irreversible avidentifiseringstagger.
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-400/30">
              Audit Hash generert
            </span>
          </div>
        )}

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-black/25 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">GDPR Samsvarsstatus</div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
              {isCompliant ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Fullt i samsvar</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-300">{report.issuesCount} PII Oppdaget</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-black/25 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Dataminimering (Art. 5)</div>
            <div className="text-sm sm:text-base font-mono font-bold text-white mt-0.5 flex items-center gap-2">
              <span className={report.dataMinimizationScore === 100 ? 'text-emerald-300' : 'text-amber-300'}>
                {report.dataMinimizationScore}%
              </span>
              <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden max-w-[60px]">
                <div 
                  className={`h-full transition-all duration-500 ${report.dataMinimizationScore === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ width: `${report.dataMinimizationScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-black/25 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Avidentifisering</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
              {report.anonymizationGrade}
            </div>
          </div>

          <div className="bg-black/25 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Kryptografisk Integritet</div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5 flex items-center justify-between">
              <span className="truncate max-w-[110px]">{report.auditHash.split(':')[1] || 'SHA256'}</span>
              <button
                onClick={() => handleCopyAuditHash(report.auditHash)}
                className="text-slate-400 hover:text-white transition p-0.5"
                title="Kopier revisjonssignatur"
              >
                {copiedAudit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 bg-slate-50/50">
          {/* PII Detection Alerts Box if issues are found */}
          {report.hasPii && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Automatisk skanning oppdaget {report.issuesCount} sensitiv(e) personopplysning(er)</span>
                </h3>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
                  Tiltak påkrevd før eksport
                </span>
              </div>

              <p className="text-xs text-rose-800 leading-relaxed">
                Følgende felt i ekstraksjonen inneholder direkte identifikatorer eller helseopplysninger som strider mot prinsippet om dataminimering (GDPR Art. 5(1)(c)). Klikk <strong>«Saniter data»</strong> for automatisk maskering.
              </p>

              <div className="space-y-2 mt-2">
                {report.issues.map((issue) => (
                  <div 
                    key={issue.id}
                    className="p-3 bg-white rounded-lg border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{issue.fieldLabel}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          issue.risk === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {issue.typeLabel}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Funnet token: <code className="bg-rose-50 px-1 py-0.5 rounded text-rose-900 font-mono font-bold">{issue.token}</code>
                        {' '}&rarr; Maskeres til: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">{issue.maskedPreview}</code>
                      </div>
                    </div>

                    <button
                      onClick={handleSanitizeSingle}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] flex items-center gap-1 transition self-start sm:self-center shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Masker nå</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GDPR / Privacy Compliance Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>GDPR &amp; Helsedatapersonvern Sjekkliste (Compliance Checklist)</span>
              </h3>
              <button
                onClick={() => setShowChecklistDetails(!showChecklistDetails)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {showChecklistDetails ? 'Enkel visning' : 'Vis lovhjemler'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.checklist.map((item) => {
                const isItemCompliant = item.status === 'compliant';
                return (
                  <div 
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isItemCompliant 
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300' 
                        : 'bg-rose-50/50 border-rose-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 p-1 rounded-md shrink-0 ${
                          isItemCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isItemCompliant ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                              {item.article}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isItemCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isItemCompliant ? 'Oppfylt' : 'Avvik'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                            {item.title}
                          </h4>
                          {showChecklistDetails && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {item.requirement}
                            </p>
                          )}
                          <div className={`mt-2 text-[11px] font-mono px-2 py-1 rounded ${
                            isItemCompliant ? 'bg-slate-50 text-emerald-800' : 'bg-rose-100/70 text-rose-900 font-semibold'
                          }`}>
                            {item.details}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Trail & Protocol Documentation */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  Kryptografisk revisjonsspor for {currentStudy.citationKey}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Signatur: {report.auditHash} • Tidsstempel: {new Date(report.scannedAt).toLocaleString('no-NO')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {onUpdateAllExtractions && (
                <button
                  onClick={handleSanitizeAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                  title="Kjør PII-sanering på tvers av alle inkluderte studier samtidig"
                >
                  Saniter alle studier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
