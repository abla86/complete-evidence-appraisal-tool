import React, { useEffect, useRef, useState } from 'react';
import { Shield, Lock, Trash2, Download, Upload, FileText, X, Wifi } from 'lucide-react';
import { PrivacyAndSecurityService, PiiDetectionResult } from '../services/privacyAndSecurityService';
import { ArticleAppraisal } from '../types';
import { useToast } from './Toast';
import { clearNetworkLog, getNetworkConsent, getNetworkLog, NETWORK_CATEGORIES, setNetworkConsent, subscribeNetworkConsent, type NetworkCategory, type NetworkConsent } from '../services/networkPolicy';
import { createWorkspaceBackup, readWorkspaceBackup, restoreWorkspaceBackup } from '../services/workspaceBackupService';
import { listAppStorageKeys, readAppStorage } from '../services/appStorage';
import { APP_VERSION, IS_OFFLINE_EDITION } from '../runtime/edition';

interface GdprPrivacyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleAppraisal[];
  onVaultPurged: () => void;
}

function downloadBytes(bytes: Uint8Array | string, fileName: string, type: string): void {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const GdprPrivacyCenterModal: React.FC<GdprPrivacyCenterModalProps> = ({ isOpen, onClose, articles, onVaultPurged }) => {
  const { showToast } = useToast();
  const [testText, setTestText] = useState<string>('Eksempel med Ola Nordmann ola.nordmann@forskning.no og tlf 91234567');
  const [sanitizationResult, setSanitizationResult] = useState<PiiDetectionResult | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [consent, setConsent] = useState<NetworkConsent>(() => getNetworkConsent());
  const [logVersion, setLogVersion] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => subscribeNetworkConsent(setConsent), []);
  if (!isOpen) return null;
  const log = getNetworkLog();
  void logVersion;

  const toggle = (category: NetworkCategory) => setConsent(setNetworkConsent(category, !consent[category]));

  const handleBackupDownload = async () => {
    try {
      const bytes = await createWorkspaceBackup(readAppStorage(), APP_VERSION);
      downloadBytes(bytes, `evidence-appraisal-sikkerhetskopi-${new Date().toISOString().slice(0, 10)}.zip`, 'application/zip');
      showToast('Sikkerhetskopi (zip) lastet ned. Oppbevar filen sikkert – den inneholder forskningsdataene dine.', 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Sikkerhetskopien kunne ikke lages.', 'error'); }
  };

  const handleBackupUpload = async (file: File) => {
    try {
      const { manifest, data } = await readWorkspaceBackup(await file.arrayBuffer());
      if (!window.confirm(`Sikkerhetskopien er fra ${new Date(manifest.createdAt).toLocaleString('nb-NO')} og inneholder ${manifest.entries.length} datasett. Gjeldende data på denne enheten blir erstattet. Fortsette?`)) return;
      restoreWorkspaceBackup(data, localStorage, listAppStorageKeys());
      showToast('Sikkerhetskopien er gjenopprettet. Appen lastes på nytt.', 'success');
      setTimeout(() => window.location.reload(), 600);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Sikkerhetskopien kunne ikke leses.', 'error'); }
  };

  const handleExportDataPortability = () => {
    downloadBytes(PrivacyAndSecurityService.exportUserData(articles), `dataportabilitet-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Eksport fullført (GDPR artikkel 20).', 'success');
  };

  const handlePurgeAll = () => {
    if (!confirmPurge) { setConfirmPurge(true); return; }
    if (PrivacyAndSecurityService.purgeLocalVault()) {
      showToast('Alle lokale arbeidsdata for dette verktøyet er slettet fra denne enheten.', 'success');
      onVaultPurged();
      onClose();
    } else showToast('Kunne ikke slette data.', 'error');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between rounded-t-xl sticky top-0">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-teal-400" aria-hidden="true" />
            <div>
              <h2 id="privacy-title" className="text-lg font-bold">Personvern, nettverk og data</h2>
              <p className="text-xs text-slate-300">Du bestemmer hva som forlater enheten din.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Lukk" className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-teal-600" aria-hidden="true" />Lokal lagring</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Artikler, PDF-er, vurderinger og referanser lagres og behandles lokalt i denne nettleseren{IS_OFFLINE_EDITION ? ' (nedlastbar utgave: ingen server brukes)' : ''}. PDF-er og dokumenter lastes aldri opp.
              Revisjonsloggen er hash-kjedet (SHA-256) slik at endringer kan oppdages, men lokal lagring er ikke manipulasjonssikker, og data kan gå tapt hvis nettleserdata slettes. Ta sikkerhetskopi jevnlig.
            </p>
          </section>

          <section className="border border-slate-200 rounded-lg p-4" aria-labelledby="network-title">
            <h3 id="network-title" className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1"><Wifi className="w-4 h-4 text-sky-600" aria-hidden="true" />Nettverk – alt er av til du slår det på</h3>
            <p className="text-xs text-slate-600 mb-3">Appen kan teknisk bare kontakte mottakerne som er oppgitt her. Slår du av en kategori, stoppes forespørslene før de sendes.</p>
            <div className="space-y-3">
              {(Object.keys(NETWORK_CATEGORIES) as NetworkCategory[]).filter(c => !(IS_OFFLINE_EDITION && (c === 'cloud' || c === 'ai'))).map(category => {
                const info = NETWORK_CATEGORIES[category];
                return <label key={category} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={consent[category]} onChange={() => toggle(category)} />
                  <span className="text-xs text-slate-700"><strong className="block text-sm text-slate-900">{info.label}</strong>Sender: {info.sends}<br />Mottakere: {info.recipients}</span>
                </label>;
              })}
            </div>
            <details className="mt-3">
              <summary className="text-xs font-semibold cursor-pointer">Nettverkslogg ({log.length} siste forespørsler – adresse og tid, aldri innhold)</summary>
              <div className="mt-2 max-h-48 overflow-auto rounded border border-slate-200">
                {log.length === 0 ? <p className="p-2 text-xs text-slate-500">Ingen forespørsler registrert.</p> : <table className="w-full text-[11px]"><tbody>{log.map((entry, i) => <tr key={i} className="border-b border-slate-100"><td className="p-1 whitespace-nowrap">{new Date(entry.at).toLocaleString('nb-NO')}</td><td className="p-1">{entry.outcome === 'sent' ? 'Sendt' : 'Stoppet'}</td><td className="p-1">{entry.method}</td><td className="p-1 break-all">{entry.host}{entry.path}</td></tr>)}</tbody></table>}
              </div>
              <button type="button" className="mt-2 text-xs underline" onClick={() => { clearNetworkLog(); setLogVersion(v => v + 1); }}>Tøm logg</button>
            </details>
          </section>

          <section className="border border-slate-200 rounded-lg p-4" aria-labelledby="backup-title">
            <h3 id="backup-title" className="text-sm font-bold text-slate-800 mb-1">Sikkerhetskopi (zip)</h3>
            <p className="text-xs text-slate-600 mb-3">Last ned alle arbeidsdata som én zip-fil, og last den opp igjen på en annen enhet eller nettleser. Innholdet kontrolleres med SHA-256 ved opplasting. Lisensnøkkelen tas ikke med.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => void handleBackupDownload()} className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" aria-hidden="true" />Last ned sikkerhetskopi</button>
              <button type="button" onClick={() => uploadRef.current?.click()} className="px-3 py-2 border border-slate-300 text-xs font-semibold rounded flex items-center justify-center gap-1.5"><Upload className="w-3.5 h-3.5" aria-hidden="true" />Last opp sikkerhetskopi</button>
              <input ref={uploadRef} type="file" accept=".zip,application/zip" className="sr-only" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void handleBackupUpload(file); }} />
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-indigo-600" aria-hidden="true" />Test filtrering av personopplysninger</h3>
            <p className="text-xs text-slate-600 mb-3">Viser hvordan åpenbare personopplysninger (fødselsnummer, e-post, telefon) filtreres før en eventuell KI-analyse. Filteret er regelbasert og fanger ikke alt – ikke legg inn identifiserbare pasientdata.</p>
            <textarea value={testText} onChange={e => setTestText(e.target.value)} aria-label="Testtekst" className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded bg-white text-slate-800 mb-2" rows={3} />
            <button type="button" onClick={() => setSanitizationResult(PrivacyAndSecurityService.sanitizeForAI(testText))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded">Kjør filtrering</button>
            {sanitizationResult && <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono space-y-1"><p className="bg-slate-800 p-2 rounded">{sanitizationResult.sanitizedText}</p><p>Mulige personopplysninger funnet: <strong>{sanitizationResult.hasPotentialPii ? 'JA' : 'NEI'}</strong>{sanitizationResult.detectedPiiTypes.length > 0 && ` (${sanitizationResult.detectedPiiTypes.join(', ')})`}</p></div>}
          </section>

          <section className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Dine rettigheter</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between">
                <p className="text-[11px] text-slate-600"><strong className="block text-xs text-slate-800">Dataportabilitet (art. 20)</strong>Maskinlesbar JSON-kopi av artikler og vurderinger.</p>
                <button type="button" onClick={handleExportDataPortability} className="mt-3 w-full px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded">Eksporter (JSON)</button>
              </div>
              <div className="flex-1 p-3 border border-rose-200 rounded-lg bg-rose-50 flex flex-col justify-between">
                <p className="text-[11px] text-rose-700"><strong className="block text-xs text-rose-900"><Trash2 className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />Sletting (art. 17)</strong>Sletter alle arbeidsdata for dette verktøyet på denne enheten. Data du har synkronisert til serveren slettes ved henvendelse til selger.</p>
                <button type="button" onClick={handlePurgeAll} className={`mt-3 w-full px-3 py-1.5 text-xs font-semibold rounded ${confirmPurge ? 'bg-rose-700 hover:bg-rose-800 text-white' : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-100'}`}>{confirmPurge ? 'Bekreft permanent sletting nå' : 'Slett alle lokale data'}</button>
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded">Lukk</button>
        </div>
      </div>
    </div>
  );
};
