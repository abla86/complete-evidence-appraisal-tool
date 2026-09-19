import React, { useState } from 'react';
import { 
  HelpCircle, 
  Target, 
  Search, 
  Filter, 
  CheckSquare, 
  ShieldAlert, 
  FileSpreadsheet, 
  BarChart3, 
  Award, 
  FileText,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { StageId, StageDefinition } from '../types';

export const STAGES: StageDefinition[] = [
  { id: 'question', stepNumber: 1, labelNo: 'Research question', labelEn: 'Research question', shortDesc: 'Formulering & FINER', icon: 'HelpCircle' },
  { id: 'pico', stepNumber: 2, labelNo: 'PICO / PECO', labelEn: 'PICO / PECO', shortDesc: 'Rammeverk & MeSH', icon: 'Target' },
  { id: 'search', stepNumber: 3, labelNo: 'Search & Discovery', labelEn: 'Search & Discovery', shortDesc: 'AI Litteratursøk & databaser', icon: 'Search' },
  { id: 'screening', stepNumber: 4, labelNo: 'Study Screening', labelEn: 'Study Screening', shortDesc: 'Tittel, abstrakt & fulltekst', icon: 'Filter' },
  { id: 'appraisal', stepNumber: 5, labelNo: 'Critical Appraisal', labelEn: 'Critical Appraisal', shortDesc: 'AI Kvalitetsvurdering (CASP)', icon: 'CheckSquare' },
  { id: 'rob', stepNumber: 6, labelNo: 'Risk of Bias', labelEn: 'Risk of Bias', shortDesc: 'Cochrane RoB 2 matrise', icon: 'ShieldAlert' },
  { id: 'extraction', stepNumber: 7, labelNo: 'Data Extraction', labelEn: 'Data Extraction', shortDesc: 'AI Mal & GDPR-sikkerhet', icon: 'FileSpreadsheet' },
  { id: 'synthesis', stepNumber: 8, labelNo: 'Evidence Synthesis', labelEn: 'Evidence Synthesis', shortDesc: 'Metaanalyse & Forest plot', icon: 'BarChart3' },
  { id: 'grade', stepNumber: 9, labelNo: 'Evidence Certainty', labelEn: 'Evidence Certainty', shortDesc: 'GRADE & SoF tabell', icon: 'Award' },
  { id: 'report', stepNumber: 10, labelNo: 'Reproducible Report', labelEn: 'Reproducible Report', shortDesc: 'PRISMA 2020 rapport & eksport', icon: 'FileText' },
];

interface NavigationLayoutProps {
  currentStage: StageId;
  onSelectStage: (stage: StageId) => void;
  projectTitle: string;
  projectId?: string;
  protocolId?: string;
  language: 'no' | 'en';
  onToggleLanguage: () => void;
  onOpenAi: () => void;
  onResetSample: () => void;
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationLayoutProps> = ({
  currentStage,
  onSelectStage,
  projectTitle,
  projectId = 'EV-2024-082',
  protocolId = 'PROSPERO CRD42024589211',
  language,
  onToggleLanguage,
  onOpenAi,
  onResetSample,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentIdx = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="flex bg-[#f8fafc] text-slate-900 font-sans min-h-screen w-full">
      {/* Sleek Dark Slate Sidebar (Desktop) */}
      <aside className="w-64 bg-[#0f172a] text-slate-400 flex flex-col shrink-0 border-r border-slate-800 h-screen sticky top-0 hidden lg:flex select-none z-30">
        {/* Brand Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
              E
            </div>
            <span>EvidenceOS</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Systematic Evidence Engine</p>
        </div>

        {/* Stepper Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1 relative">
            {/* Continuous vertical connector line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-slate-700/70 z-0" />

            {STAGES.map((stage, idx) => {
              const isActive = stage.id === currentStage;
              const isCompleted = idx < currentIdx;

              return (
                <li key={stage.id} className="relative z-10">
                  <button
                    onClick={() => onSelectStage(stage.id)}
                    className={`w-full text-left flex items-center gap-3 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-blue-400 shadow-sm border border-slate-700/60'
                        : isCompleted
                        ? 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                        : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                    }`}
                  >
                    {/* Stepper Dot */}
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] ring-2 ring-blue-400/40 shrink-0" />
                    ) : isCompleted ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{stage.labelNo}</div>
                      <div className="text-[10px] text-slate-500 truncate font-normal">
                        {stage.shortDesc}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer / Researcher Profile & GDPR badge */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              SJ
            </div>
            <div className="text-xs truncate">
              <p className="text-white font-medium truncate">Dr. S. Johansen</p>
              <p className="text-slate-500 text-[10px] truncate">Lead Researcher</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">GDPR Art. 9 &amp; 89 Sikkerhet Aktiv</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-[#0f172a] text-slate-400 flex flex-col h-full border-r border-slate-800 p-4 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">E</div>
                <span>EvidenceOS</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto space-y-1 relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-[1px] bg-slate-700 z-0" />
              {STAGES.map((stage) => {
                const isActive = stage.id === currentStage;
                return (
                  <button
                    key={stage.id}
                    onClick={() => {
                      onSelectStage(stage.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`relative z-10 w-full text-left flex items-center gap-3 py-2 px-3 rounded-md text-xs font-medium ${
                      isActive ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`} />
                    <span>{stage.labelNo}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sleek Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md border border-slate-200"
              aria-label="Meny"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            <div className="min-w-0">
              <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Project ID: <span className="font-mono text-slate-800 font-bold">{projectId}</span> • {protocolId}
              </h2>
              <p className="text-slate-900 font-bold truncate max-w-sm sm:max-w-xl text-xs sm:text-sm">
                {projectTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              Live Synthesis
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 uppercase tracking-tight">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              GDPR Art. 9
            </span>

            <button
              onClick={onToggleLanguage}
              className="px-2 py-1 text-[11px] font-mono font-medium rounded border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              title="Bytt språk"
            >
              {language === 'no' ? 'NO' : 'EN'}
            </button>

            <button
              onClick={onResetSample}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition"
              title="Nullstill prosjekt til referansedata"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="text-[11px]">Eksempel</span>
            </button>

            <button
              onClick={onOpenAi}
              className="bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Methodologist</span>
            </button>
          </div>
        </header>

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
