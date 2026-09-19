import React from 'react';
import { 
  UserCheck, 
  Cpu, 
  Search, 
  CheckSquare, 
  Award, 
  ShieldAlert, 
  FileText, 
  Database, 
  ArrowDown, 
  Layers, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { EvidencePipelineSession } from '../types';

interface ArchitectureDiagramProps {
  session: EvidencePipelineSession;
  onNavigateStep?: (step: number) => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  session,
  onNavigateStep,
}) => {
  const currentStep = session.currentStep;
  const isAwaitingApproval = session.status === 'WAITING_FOR_HUMAN_APPROVAL';
  const isApproved = session.status === 'APPROVED_AND_FINALIZED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            EvidenceOps AI Multi-Agent Arkitektur
          </h3>
          <p className="text-xs text-slate-400">
            Orkestrert agentflyt med autonome spesialister, verktøykoblinger og eksplisitt menneskelig kontrollpunkt (Human-in-the-Loop)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktiv agent
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Menneskelig godkjenning
          </span>
        </div>
      </div>

      {/* Visual Architectural Graph */}
      <div className="flex flex-col items-center max-w-4xl mx-auto space-y-6">
        
        {/* Tier 1: User / Researcher */}
        <div className={`w-64 p-3 rounded-lg border text-center transition-all ${
          currentStep === 0
            ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
            : 'bg-slate-800/80 border-slate-700'
        }`}>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-100">
            <UserCheck className="w-4 h-4 text-sky-400" />
            USER / RESEARCHER
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Klinisk spørsmål & PICO-initiering</p>
        </div>

        <ArrowDown className="w-5 h-5 text-slate-500" />

        {/* Tier 2: AI Orchestrator */}
        <div className={`w-72 p-3.5 rounded-lg border text-center transition-all shadow-md ${
          currentStep >= 1 && currentStep <= 5
            ? 'bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/30'
            : 'bg-slate-800/90 border-slate-700'
        }`}>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
            <Cpu className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            AI ORCHESTRATOR
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            Status: <span className="font-semibold text-emerald-400">{session.activeAgent}</span> ({session.status})
          </p>
        </div>

        <ArrowDown className="w-5 h-5 text-slate-500" />

        {/* Tier 3: Autonomous Specialist Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          
          {/* Agent 1: Search Agent */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center ${
            currentStep === 2 || currentStep === 3
              ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-800/60 border-slate-800'
          }`}>
            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-2">
              <Search className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Search Agent</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">PICO &rarr; MeSH & Boolsk syntaks</p>
            
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded p-2 text-[11px] text-slate-300 flex items-center justify-center gap-1.5 mt-auto">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>PubMed / Cochrane / Embase</span>
            </div>
          </div>

          {/* Agent 2: Appraisal Agent */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center ${
            currentStep === 4
              ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-800/60 border-slate-800'
          }`}>
            <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-2">
              <CheckSquare className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Appraisal Agent</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Kritisk metodisk vurdering</p>
            
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded p-2 text-[11px] text-slate-300 flex items-center justify-center gap-1.5 mt-auto">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>CASP RCT / AMSTAR-2</span>
            </div>
          </div>

          {/* Agent 3: Evidence Agent */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center ${
            currentStep === 5
              ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-800/60 border-slate-800'
          }`}>
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Evidence Agent</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Evidensstyrke & syntese</p>
            
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded p-2 text-[11px] text-slate-300 flex items-center justify-center gap-1.5 mt-auto">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>GRADE Framework</span>
            </div>
          </div>

        </div>

        <ArrowDown className="w-5 h-5 text-slate-500" />

        {/* Tier 4: CRITICAL HUMAN APPROVAL GATEWAY */}
        <div className={`w-full max-w-lg p-4 rounded-xl border text-center transition-all ${
          isAwaitingApproval
            ? 'bg-amber-950/40 border-amber-500 ring-4 ring-amber-500/20 shadow-lg shadow-amber-950/50'
            : isApproved
            ? 'bg-emerald-950/40 border-emerald-500'
            : 'bg-slate-800/70 border-slate-700'
        }`}>
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            {isApproved ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300">HUMAN APPROVAL: GODKJENT</span>
              </>
            ) : isAwaitingApproval ? (
              <>
                <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
                <span className="text-amber-300">HUMAN APPROVAL CHECKPOINT (PÅKREVD)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300">HUMAN APPROVAL GATEKEEPER</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {isApproved 
              ? `Signert av fagperson: ${session.humanApproval.reviewerName} (${session.humanApproval.reviewerRole})`
              : 'Systemet stopper autonomt. Konklusjoner kan ikke publiseres før en fagperson har validert funn og gitt formell signatur.'}
          </p>
        </div>

        <ArrowDown className="w-5 h-5 text-slate-500" />

        {/* Tier 5: Final Report */}
        <div className={`w-72 p-3.5 rounded-lg border text-center transition-all ${
          isApproved
            ? 'bg-emerald-900/30 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
            : 'bg-slate-800/60 border-slate-700 opacity-70'
        }`}>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            FINAL DECISION REPORT
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Strukturert beslutningsgrunnlag + Uforanderlig audit logg
          </p>
        </div>

      </div>

      {/* Architectural Principles Box */}
      <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800">
          <span className="font-semibold text-emerald-400 block mb-1">1. Autonom eksekvering</span>
          Agentene utfører flertrinns analysearbeid i databaser og evidensrammeverk, ikke bare generelle tekstsvar.
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800">
          <span className="font-semibold text-amber-400 block mb-1">2. Menneskelige sperrer</span>
          Kritiske kliniske vurderinger krever faglig godkjenning for å hindre ukritisk publisering av AI-vurderinger.
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800">
          <span className="font-semibold text-sky-400 block mb-1">3. Komplett revisjonsspor</span>
          Hvert eneste agentkall, screeningkriterium og modifikasjon hashes og tidsstemples i en uforanderlig audit-logg.
        </div>
      </div>
    </div>
  );
};
