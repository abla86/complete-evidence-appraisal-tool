import React, { useState } from 'react';
import { Shield, Lock, Trash2, Download, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';
import { PrivacyAndSecurityService, PiiDetectionResult } from '../services/privacyAndSecurityService';
import { ArticleAppraisal } from '../types';
import { useToast } from './Toast';

interface GdprPrivacyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleAppraisal[];
  onVaultPurged: () => void;
}

export const GdprPrivacyCenterModal: React.FC<GdprPrivacyCenterModalProps> = ({
  isOpen,
  onClose,
  articles,
  onVaultPurged
}) => {
  const { showToast } = useToast();
  const [testText, setTestText] = useState<string>('Eksempel med Ola Nordmann ola.nordmann@forskning.no og tlf 91234567');
  const [sanitizationResult, setSanitizationResult] = useState<PiiDetectionResult | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestSanitize = () => {
    const res = PrivacyAndSecurityService.sanitizeForAI(testText);
    setSanitizationResult(res);
  };

  const handleExportDataPortability = () => {
    const jsonStr = PrivacyAndSecurityService.exportUserData(articles);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdpr-data-portability-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('GDPR dataportabilitet-eksport fullfÃ¸rt (Artikkel 20).', 'success');
  };

  const handlePurgeAll = () => {
    if (!confirmPurge) {
      setConfirmPurge(true);
      return;
    }
    const success = PrivacyAndSecurityService.purgeLocalVault();
    if (success) {
      showToast('Alle lokale forskningsdata og revisjonslogger er slettet (Artikkel 17).', 'success');
      onVaultPurged();
      onClose();
    } else {
      showToast('Kunne ikke slette data.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-teal-400" />
            <div>
              <h2 className="text-lg font-bold">GDPR, Personvern & Datasikkerhetssenter</h2>
              <p className="text-xs text-slate-300">Styring av personopplysninger, dataminimering og rettigheter (GDPR/Helseforskningsloven)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Data Classification & Storage Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-teal-600" />
              Lokal Databehandling & Sikkerhetsarkitektur
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Plattformen kjÃ¸rer med <strong>lokal-fÃ¸rst klientlagring</strong> og sender aldri rÃ¥tekster til tredjepart uten eksplisitt brukerforespÃ¸rsel. 
              All vurderingshistorikk er kryptografisk lenket i en uforanderlig revisjonskjede (SHA-256).
            </p>
            <div className="mt-3 flex gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded border border-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> SHA-256 Audit Trail
              </span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded border border-blue-300 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> PII Sanitizer Aktiv
              </span>
            </div>
          </div>

          {/* Section 2: Interactive PII Sanitizer Test */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Dataminimering & AI-Saniterer (Sanitize for AI)
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Test hvordan personidentifiserende opplysninger (fÃ¸dselsnummer, e-post, telefon) filtreres ut fÃ¸r maskinell analyse.
            </p>
            <textarea
              value={testText}
              onChange={e => setTestText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded bg-white text-slate-800 mb-2 focus:ring-1 focus:ring-teal-500"
              rows={3}
            />
            <button
              onClick={handleTestSanitize}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-sm transition"
            >
              KjÃ¸r saniteringskontroll
            </button>

            {sanitizationResult && (
              <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono space-y-1">
                <p className="text-teal-400 font-bold">Sanitert tekstresultat:</p>
                <p className="bg-slate-800 p-2 rounded">{sanitizationResult.sanitizedText}</p>
                <div className="flex gap-4 pt-1 text-[11px] text-slate-300">
                  <span>PII Funnet: <strong>{sanitizationResult.hasPotentialPii ? 'JA' : 'NEI'}</strong></span>
                  {sanitizationResult.detectedPiiTypes.length > 0 && (
                    <span>Typer: <strong>{sanitizationResult.detectedPiiTypes.join(', ')}</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: GDPR Rights Execution */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              GDPR Rettigheter for Registrerte
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Data Portability */}
              <div className="flex-1 p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    Dataportabilitet (Artikkel 20)
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Last ned en maskinlesbar JSON-kopi av alle dine forskningsvurderinger og revisjonslogger.
                  </p>
                </div>
                <button
                  onClick={handleExportDataPortability}
                  className="mt-3 w-full px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded shadow-sm transition"
                >
                  Eksporter mine data (JSON)
                </button>
              </div>

              {/* Right to Erasure */}
              <div className="flex-1 p-3 border border-rose-200 rounded-lg bg-rose-50 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Retten til sletting (Artikkel 17)
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Slett alle lokalt lagrede artikler, vurderinger, snapshots og samhandlingsdata permanent.
                  </p>
                </div>
                <button
                  onClick={handlePurgeAll}
                  className={`mt-3 w-full px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition ${
                    confirmPurge 
                      ? 'bg-rose-700 hover:bg-rose-800 text-white animate-pulse' 
                      : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {confirmPurge ? 'Bekreft permanent sletting nÃ¥' : 'Slett alle lokale data'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded transition"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};


