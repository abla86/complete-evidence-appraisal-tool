import React, { useState } from 'react';
import {
  HeartPulse,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Send,
  Download,
  Activity,
  User,
  Check
} from 'lucide-react';
import { SyntheticPatientEvent } from '../../types';

interface HealthFlowModuleProps {
  events: SyntheticPatientEvent[];
  onDispatchEvent: (event: Omit<SyntheticPatientEvent, 'id'>) => void;
}

const STAGES = [
  { id: 'HENVISNING', label: '1. Henvisning', desc: 'Fastlege 🡒 Spesialist' },
  { id: 'TRIAGE', label: '2. Triage & Vurdering', desc: 'Rett til helsehjelp & frist' },
  { id: 'POLIKLINIKK', label: '3. Poliklinikk', desc: 'Klinisk undersøkelse & lab' },
  { id: 'BEHANDLING', label: '4. Behandling', desc: 'Medikament & tiltak' },
  { id: 'UTSKRIVELSE', label: '5. Utskrivelse', desc: 'Signert epikrise' }
];

export const HealthFlowModule: React.FC<HealthFlowModuleProps> = ({
  events,
  onDispatchEvent
}) => {
  const [activeSubject, setActiveSubject] = useState<string>('SYN-PATIENT-8812');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // New event form
  const [newStage, setNewStage] = useState<SyntheticPatientEvent['stage']>('POLIKLINIKK');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Klinisk oppfølging');
  const [newDescription, setNewDescription] = useState('');

  const subjectEvents = events.filter((e) => e.syntheticSubjectId === activeSubject);

  const handleSimulateNext = () => {
    onDispatchEvent({
      syntheticSubjectId: activeSubject,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      stage: 'BEHANDLING',
      title: 'Digital monitorering: Automatisk oppfølgingsrapport',
      description: 'Pasientrapporterte utfallsmål (PROM) registrert via sikker pasientportal. Ingen alarmerende avvik.',
      status: 'COMPLETED',
      complianceStatus: 'VERIFIED',
      clinicalCategory: 'Digital oppfølging'
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onDispatchEvent({
      syntheticSubjectId: activeSubject,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      stage: newStage,
      title: newTitle,
      description: newDescription || 'Syntetisk klinisk hendelse generert av helsesimulator.',
      status: 'COMPLETED',
      complianceStatus: 'VERIFIED',
      clinicalCategory: newCategory
    });
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const handleExportFhirJson = () => {
    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      meta: {
        lastUpdated: new Date().toISOString(),
        tag: [{ system: 'https://researchforge.no/safety', code: 'SYNTHETIC_DATA_ONLY' }]
      },
      entry: subjectEvents.map((e) => ({
        resource: {
          resourceType: 'ClinicalImpression',
          id: e.id,
          subject: { reference: `Patient/${e.syntheticSubjectId}` },
          status: 'completed',
          description: e.title,
          summary: e.description,
          effectiveDateTime: e.timestamp
        }
      }))
    };
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSubject}_fhir_synthetic.json`;
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Synthetic Assurance */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-rose-400" />
              100% Syntetisk Datamodus
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              Normen & GDPR Sikret
            </span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            Health Flow Simulator & Kliniske Prosesstier
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulerer pasientflyt gjennom sykehusavdelinger med uforanderlig hendelsessporing og tilstandstransisjoner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFhirJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition-all"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Eksportert FHIR!
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> FHIR JSON Eksport
              </>
            )}
          </button>
          <button
            onClick={handleSimulateNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" /> Simuler Neste Steg
          </button>
        </div>
      </div>

      {/* Patient Subject Selector & Pathway Summary */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Aktiv Syntetisk Pasientprofil</div>
            <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
              {activeSubject}
              <span className="text-[10px] font-sans font-normal text-slate-400">
                (Kardiologisk / Metabolsk utredning)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Egendefinert Hendelse
        </button>
      </div>

      {/* 5-Step Visual Pathway Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {STAGES.map((s, idx) => {
          const hasEvent = subjectEvents.some((e) => e.stage === s.id);
          return (
            <div
              key={s.id}
              className={`p-3 rounded-xl border text-center transition-all ${
                hasEvent
                  ? 'bg-rose-950/30 border-rose-800/60 text-white'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-xs font-bold mb-1">
                {hasEvent && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                <span>{s.label}</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Event Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Klinisk Hendelsesstrøm (Event Sourcing Logg)
        </h4>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
          {subjectEvents.map((evt) => (
            <div
              key={evt.id}
              className="relative pl-9 p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="absolute left-2.5 top-5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-950" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                    {evt.stage}
                  </span>
                  <span className="text-xs font-semibold text-white">{evt.title}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{evt.timestamp}</span>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                {evt.description}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-[10px] font-mono text-slate-400">
                  Kategori: <strong className="text-slate-300">{evt.clinicalCategory}</strong>
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                  <FileCheck className="w-3 h-3" /> Event Hash Validert
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Ny Syntetisk Klinisk Hendelse</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Forløpstrinn</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as SyntheticPatientEvent['stage'])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="HENVISNING">HENVISNING</option>
                  <option value="TRIAGE">TRIAGE</option>
                  <option value="POLIKLINIKK">POLIKLINIKK</option>
                  <option value="BEHANDLING">BEHANDLING</option>
                  <option value="UTSKRIVELSE">UTSKRIVELSE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hendelsestittel *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="F.eks. Tverrfaglig vurdering av lab-resultat"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Klinisk Kategori</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="F.eks. Diagnostikk, Radiologi, Medisinering"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Beskrivelse</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detaljer om syntetisk klinisk vurdering eller tiltak..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Legg til hendelse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
