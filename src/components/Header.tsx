import React, { useState, useEffect } from 'react';
import {
  BookOpen, FileText, Layers, GitCompare, CheckSquare, GraduationCap, Sparkles,
  Download, Printer, Users, History, ShieldCheck, PlusCircle, FileSearch,
  SlidersHorizontal, HardDrive, Shield, UserCheck, LibraryBig, ClipboardCheck
} from 'lucide-react';
import { InstrumentSelector } from './InstrumentSelector';
import { ArticleAppraisal } from '../types';
import { AutosaveService, AutosaveStatus } from '../services/autosaveService';
import { UserRole, RbacService } from '../services/rbacService';

export type ActiveTab =
  | 'overview' | 'search' | 'evaluate' | 'details' | 'compare' | 'peer_review'
  | 'synthesis' | 'audittrail' | 'who_validation' | 'methodology_audit' | 'meta_research'
  | 'reference_library' | 'reference_hub' | 'validation_dashboard' | 'help_examples'
  | 'instrumentinfo' | 'source_workflow' | 'appraisal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  articles: ArticleAppraisal[];
  selectedArticleId: string;
  onSelectArticleId: (id: string) => void;
  selectedInstrumentId: string;
  onSelectInstrument: (instrumentId: string) => void;
  currentUserRole: UserRole;
  onSelectUserRole: (role: UserRole) => void;
  onOpenPrivacyCenter: () => void;
  onOpenDocAnalysis?: () => void;
  onOpenImportExport?: (tab?: 'import' | 'export') => void;
  onOpenAutosave?: () => void;
  onNewArticle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab, setActiveTab, articles, selectedArticleId, onSelectArticleId,
  selectedInstrumentId, onSelectInstrument, currentUserRole, onSelectUserRole,
  onOpenPrivacyCenter, onOpenDocAnalysis, onOpenImportExport, onOpenAutosave, onNewArticle,
}) => {
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>({ state: 'idle', lastSavedAt: null });

  useEffect(() => AutosaveService.subscribe(setSaveStatus), []);

  const handlePrint = () => window.print();
  const selectInstrument = (id: string) => {
    onSelectInstrument(id);
    setActiveTab('appraisal');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <button type="button" className="flex items-center space-x-3 text-left" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">Evidence Appraisal Tool</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">Evidence Platform</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Søk · Screening · Appraisal · Evidens · Syntese · Rapportering</p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {onOpenAutosave && <button type="button" onClick={onOpenAutosave} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300" title="Autolagring og gjenoppretting">
              <span className={`w-2 h-2 rounded-full ${saveStatus.state === 'saving' ? 'bg-amber-500 animate-spin' : saveStatus.state === 'error' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              <HardDrive className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
              <span className="hidden md:inline text-[11px]">{saveStatus.state === 'saving' ? 'Lagrer...' : saveStatus.lastSavedAt ? `Autolagret ${saveStatus.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Autolagring på'}</span>
            </button>}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <select value={currentUserRole} onChange={e => onSelectUserRole(e.target.value as UserRole)} className="text-[11px] font-semibold text-slate-800 bg-transparent border-none focus:outline-none pr-1">
                {RbacService.getAvailableRoles().map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={onOpenPrivacyCenter} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl" title="Personvern og datakontroll">
              <Shield className="w-3.5 h-3.5 text-teal-700" /><span className="hidden lg:inline text-[11px]">Personvern</span>
            </button>
            <button type="button" onClick={() => setActiveTab('meta_research')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl ${activeTab === 'meta_research' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-950 border border-emerald-300'}`}>
              <Sparkles className="w-3.5 h-3.5" /><span>Forsk på Forskning</span>
            </button>
            {onOpenImportExport && <button type="button" onClick={() => onOpenImportExport('export')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl">
              <Download className="w-3.5 h-3.5 text-teal-700" /><span>Import & Eksport</span>
            </button>}
            {onOpenDocAnalysis && <button type="button" onClick={onOpenDocAnalysis} className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl">
              <FileSearch className="w-3.5 h-3.5 text-teal-700" /><span>Dokumentanalyse</span>
            </button>}
            {onNewArticle && <button type="button" onClick={onNewArticle} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl">
              <PlusCircle className="w-3.5 h-3.5 text-teal-200" /><span className="hidden sm:inline">Ny artikkel</span>
            </button>}
            <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl">
              <Printer className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <InstrumentSelector selectedInstrumentId={selectedInstrumentId} onSelectInstrument={selectInstrument} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mb-px">
          <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Layers className="w-3.5 h-3.5" />} label={`Prosjekt (${articles.length})`} />
          <NavButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<FileSearch className="w-3.5 h-3.5" />} label="Søk" emphasis="sky" />
          <NavButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Kilder & Evidens" />
          <NavButton active={activeTab === 'appraisal' || activeTab === 'instrumentinfo'} onClick={() => setActiveTab('appraisal')} icon={<ClipboardCheck className="w-3.5 h-3.5 text-teal-700" />} label="Appraisal" emphasis="teal" />
          <NavButton active={activeTab === 'compare'} onClick={() => setActiveTab('compare')} icon={<GitCompare className="w-3.5 h-3.5" />} label="Dual Review" />
          <NavButton active={activeTab === 'peer_review'} onClick={() => setActiveTab('peer_review')} icon={<Users className="w-3.5 h-3.5" />} label="Fagfellevurdering" />
          <NavButton active={activeTab === 'synthesis'} onClick={() => setActiveTab('synthesis')} icon={<FileText className="w-3.5 h-3.5" />} label="Syntese & Skriving" />
          <NavButton active={activeTab === 'reference_hub'} onClick={() => setActiveTab('reference_hub')} icon={<LibraryBig className="w-3.5 h-3.5 text-violet-700" />} label="Reference Hub" emphasis="violet" />
          <NavButton active={activeTab === 'reference_library'} onClick={() => setActiveTab('reference_library')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Referanser" />
          <NavButton active={activeTab === 'audittrail'} onClick={() => setActiveTab('audittrail')} icon={<History className="w-3.5 h-3.5" />} label="Audit" />
          <NavButton active={activeTab === 'methodology_audit'} onClick={() => setActiveTab('methodology_audit')} icon={<SlidersHorizontal className="w-3.5 h-3.5" />} label="Metodeaudit" />
          <NavButton active={activeTab === 'validation_dashboard'} onClick={() => setActiveTab('validation_dashboard')} icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Validering" />
          <NavButton active={activeTab === 'help_examples'} onClick={() => setActiveTab('help_examples')} icon={<GraduationCap className="w-3.5 h-3.5" />} label="Hjelp" />
        </nav>
      </div>
    </header>
  );
};

function NavButton({ active, onClick, icon, label, emphasis }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; emphasis?: 'sky' | 'violet' | 'teal' }) {
  const activeClass = emphasis === 'sky'
    ? (active ? 'border-sky-600 text-sky-950 font-bold bg-sky-50/70' : 'border-transparent text-sky-800 hover:text-sky-950 hover:border-sky-300 font-semibold')
    : emphasis === 'violet'
      ? (active ? 'border-violet-600 text-violet-950 font-bold bg-violet-50/70' : 'border-transparent text-violet-800 hover:text-violet-950 hover:border-violet-300 font-semibold')
      : emphasis === 'teal'
        ? (active ? 'border-teal-700 text-teal-900 font-bold bg-teal-50/70' : 'border-transparent text-teal-800 hover:text-teal-950 hover:border-teal-300 font-semibold')
        : (active ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300');
  return <button type="button" onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${activeClass}`}>{icon}<span>{label}</span></button>;
}
