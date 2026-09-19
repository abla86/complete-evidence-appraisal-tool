import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileCode,
  CheckCircle,
  FileText,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Key
} from 'lucide-react';
import { SecurityLayer, ADR } from '../../types';

interface ArchitectureSecurityModuleProps {
  layers: SecurityLayer[];
  adrs: ADR[];
  userRole: string;
}

export const ArchitectureSecurityModule: React.FC<ArchitectureSecurityModuleProps> = ({
  layers,
  adrs,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'adrs' | 'threat'>('layers');
  const [expandedLayer, setExpandedLayer] = useState<number | null>(2); // Default to Lag 2 Tenant-isolasjon
  const [selectedAdrId, setSelectedAdrId] = useState<string>(adrs[0]?.id || 'ADR-001');

  const selectedAdr = adrs.find((a) => a.id === selectedAdrId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Enterprise Defense in Depth
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              15 Lag Håndhevet
            </span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Systemarkitektur & 15-Lags Sikkerhetsmodell
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Fra streng leietaker-isolasjon på spørrenivå til AI Cost Firewall, uforanderlige revisjonslogger og plugin-sandkasse.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'layers'
                ? 'bg-amber-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            15 Sikkerhetslag
          </button>
          <button
            onClick={() => setActiveTab('adrs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'adrs'
                ? 'bg-amber-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ADR-er ({adrs.length})
          </button>
          <button
            onClick={() => setActiveTab('threat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'threat'
                ? 'bg-amber-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Trusselmodell
          </button>
        </div>
      </div>

      {/* Tab 1: 15 Security Layers */}
      {activeTab === 'layers' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {layers.map((layer) => {
              const isExpanded = expandedLayer === layer.number;
              return (
                <div
                  key={layer.number}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-900 border-amber-500/50 shadow-md'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedLayer(isExpanded ? null : layer.number)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        L{layer.number}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{layer.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            {layer.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{layer.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {layer.category}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/60">
                      <div className="text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        Arkitektur- & Kodeeksempel (TypeScript / SQL):
                      </div>
                      <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-amber-200 overflow-x-auto whitespace-pre-wrap border border-slate-800">
                        {layer.codeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Architecture Decision Records (ADRs) */}
      {activeTab === 'adrs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ADR list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Aksepterte Beslutninger
            </h4>
            {adrs.map((adr) => (
              <button
                key={adr.id}
                onClick={() => setSelectedAdrId(adr.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedAdrId === adr.id
                    ? 'bg-amber-950/30 border-amber-500/60 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-amber-400 font-bold">{adr.id}</span>
                  <span className="text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                    {adr.status}
                  </span>
                </div>
                <div className="text-xs font-semibold leading-snug">{adr.title}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">{adr.date}</div>
              </button>
            ))}
          </div>

          {/* ADR Detail */}
          {selectedAdr && (
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-amber-400 font-bold">{selectedAdr.id}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedAdr.title}</h3>
                </div>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800/40">
                  {selectedAdr.status}
                </span>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kontekst & Problemstilling
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  {selectedAdr.context}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Arkitektur-Beslutning
                </h5>
                <p className="text-xs text-amber-200 leading-relaxed bg-amber-950/20 p-3 rounded-lg border border-amber-900/40">
                  {selectedAdr.decision}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Konsekvenser & Avveininger
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedAdr.consequences.map((cons, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{cons}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Threat Model */}
      {activeTab === 'threat' && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            STRIDE Trusselmodell & Sikkerhetskontroller
          </h4>
          <p className="text-xs text-slate-400">
            Systematisk kartlegging av angrepsflater mot forskningsdata, AI-prompter og multi-tenant integritet.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="p-2">Trussel / Angrepsvektor</th>
                  <th className="p-2">Risiko</th>
                  <th className="p-2">Håndhevet Kontroll</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-2 font-semibold text-white">Kryss-leieboer datalekkasje (Multi-tenant breach)</td>
                  <td className="p-2 text-rose-400 font-mono">HØY</td>
                  <td className="p-2">Tvunget WHERE tenant_id = $1 på alle spørrelag og repositories.</td>
                  <td className="p-2 text-emerald-400 font-mono">MITIGERT</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-white">AI Kostnadsoverløp (Denial of Wallet)</td>
                  <td className="p-2 text-rose-400 font-mono">HØY</td>
                  <td className="p-2">Cost Firewall med daglig budsjettsperre ($20/dag) og automatisk kretsbryter.</td>
                  <td className="p-2 text-emerald-400 font-mono">MITIGERT</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-white">Prompt Injection (Ignorer regler / vis nøkler)</td>
                  <td className="p-2 text-amber-400 font-mono">MEDIUM</td>
                  <td className="p-2">Lagvis prompt: Systemregler 🡒 Sikkerhetsfilter 🡒 Kunnskapsbibel 🡒 Brukerinndata.</td>
                  <td className="p-2 text-emerald-400 font-mono">MITIGERT</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-white">Taushetsplikt-brudd i helsedemo</td>
                  <td className="p-2 text-rose-400 font-mono">KRITISK</td>
                  <td className="p-2">Eksklusiv bruk av syntetisk genererte testdata for åpen GitHub-portefølje.</td>
                  <td className="p-2 text-emerald-400 font-mono">MITIGERT</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-white">Uautorisert modifikasjon av forskningsfunn</td>
                  <td className="p-2 text-amber-400 font-mono">MEDIUM</td>
                  <td className="p-2">Uforanderlig revisjonslogg med SHA-256 hash-kjeder for alle vedtak.</td>
                  <td className="p-2 text-emerald-400 font-mono">MITIGERT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
