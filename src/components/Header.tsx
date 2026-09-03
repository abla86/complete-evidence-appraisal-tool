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
  | 'instrumentinfo' | 'source_workflow' | 'appraisal' | 'writing_studio';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => setIsMenuOpen(false), [activeTab]);

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Oversikt', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'search', label: 'Forskning', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'evaluate', label: 'Vurder', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'details', label: 'Detaljer', icon: <FileText className="w-4 h-4" /> },
    { id: 'compare', label: 'Sammenlign', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'peer_review', label: 'Fagfelle', icon: <Users className="w-4 h-4" /> },
    { id: 'synthesis', label: 'Syntese', icon: <Layers className="w-4 h-4" /> },
    { id: 'audittrail', label: 'Revisjon', icon: <History className="w-4 h-4" /> },
    { id: 'who_validation', label: 'WHO', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'methodology_audit', label: 'Metode', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'meta_research', label: 'Meta', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'reference_library', label: 'Bibliotek', icon: <LibraryBig className="w-4 h-4" /> },
    { id: 'reference_hub', label: 'Referanser', icon: <LibraryBig className="w-4 h-4" /> },
    { id: 'validation_dashboard', label: 'Validering', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'help_examples', label: 'Hjelp', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'instrumentinfo', label: 'Instrument', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'source_workflow', label: 'Kilde', icon: <FileText className="w-4 h-4" /> },
    { id: 'appraisal', label: 'Appraisal', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'writing_studio', label: 'Skriveverksted', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="font-black text-slate-900" onClick={() => setActiveTab('overview')}>Evidence Appraisal</button>
          <span className="text-xs text-slate-500">{articles.length} studier</span>
        </div>
        <div className="flex items-center gap-2">
          <InstrumentSelector selectedInstrumentId={selectedInstrumentId} onSelectInstrument={onSelectInstrument} />
          <button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={onOpenAutosave}>Autosave</button>
          <button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={onOpenPrivacyCenter}><Shield className="inline w-3.5 h-3.5 mr-1"/>Personvern</button>
          <button type="button" className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs" onClick={() => setIsMenuOpen(v => !v)}>Meny</button>
        </div>
      </div>
      {isMenuOpen && (
        <nav className="px-4 pb-3 flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};