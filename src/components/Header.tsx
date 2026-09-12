import React, { useState, useEffect } from 'react';
import {
  BookOpen, FileText, Layers, GitCompare, CheckSquare, GraduationCap, Sparkles,
  Download, Printer, Users, History, ShieldCheck, PlusCircle, FileSearch,
  SlidersHorizontal, HardDrive, Shield, UserCheck, LibraryBig, ClipboardCheck, Workflow
} from 'lucide-react';
import { InstrumentSelector } from './InstrumentSelector';
import { ArticleAppraisal } from '../types';
import { AutosaveService, AutosaveStatus } from '../services/autosaveService';
import { UserRole, RbacService } from '../services/rbacService';

export type ActiveTab =
  | 'overview' | 'document_studio' | 'search' | 'evaluate' | 'details' | 'compare' | 'peer_review'
  | 'synthesis' | 'audittrail' | 'who_validation' | 'methodology_audit' | 'meta_research'
  | 'reference_library' | 'reference_hub' | 'validation_dashboard' | 'help_examples'
  | 'instrumentinfo' | 'source_workflow' | 'appraisal' | 'writing_studio' | 'case_workflow';

interface HeaderProps {
  activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; articles: ArticleAppraisal[]; selectedArticleId: string; onSelectArticleId: (id: string) => void;
  selectedInstrumentId: string; onSelectInstrument: (instrumentId: string) => void; currentUserRole: UserRole; onSelectUserRole: (role: UserRole) => void;
  onOpenPrivacyCenter: () => void; onOpenDocAnalysis?: () => void; onOpenImportExport?: (tab?: 'import' | 'export') => void; onOpenAutosave?: () => void; onNewArticle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, articles, selectedArticleId, onSelectArticleId, selectedInstrumentId, onSelectInstrument, currentUserRole, onSelectUserRole, onOpenPrivacyCenter, onOpenDocAnalysis, onOpenImportExport, onOpenAutosave, onNewArticle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => setIsMenuOpen(false), [activeTab]);
  const tabs: Array<{ id: ActiveTab; label: string; subtitle: string; icon: React.ReactNode }> = [
    { id: 'case_workflow', label: 'Case Workflow Studio', subtitle: 'Cases, stages, assignment, SLA & audit trail', icon: <Workflow className="w-4 h-4" /> },
    { id: 'document_studio', label: 'Document Studio', subtitle: 'IMRaD parsing, fulltekstanalyse & PDF-inspeksjon', icon: <FileText className="w-4 h-4" /> },
    { id: 'source_workflow', label: 'Screening & PICO', subtitle: 'Tittel/sammendrag, inklusjon/eksklusjon & PICO-tagging', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'appraisal', label: 'Universal Appraisal', subtitle: 'JBI, RoB 2, AMSTAR 2, AGREE II, GRADE, CERQual, RE-AIM & KTA', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'reference_hub', label: 'Reference & Citation Hub', subtitle: 'RIS/BibTeX/Medline, APA 7, norsk juridisk metode & duplikatkontroll', icon: <LibraryBig className="w-4 h-4" /> },
    { id: 'meta_research', label: 'Meta-Research & PRISMA', subtitle: 'Interaktivt PRISMA 2020-flytskjema & flytstatistikk', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'peer_review', label: 'Peer Review & Consensus', subtitle: 'Dual-review blinding, Cohen’s Kappa & uavhengig sammenligning', icon: <Users className="w-4 h-4" /> },
    { id: 'synthesis', label: 'Synthesis & Export Gate', subtitle: 'Evidenssyntese, kryptografisk audit trail & integritetssperre', icon: <Layers className="w-4 h-4" /> },
  ];
  return <header className="border-b border-slate-200 bg-white">
    <div className="flex items-center justify-between px-4 py-3 gap-3"><div className="flex items-center gap-3"><button type="button" className="font-black text-slate-900 text-left" onClick={() => setActiveTab('overview')}>Complete Evidence Appraisal Suite & Meta-Research Platform<span className="block text-[10px] font-semibold text-slate-500">Research Intelligence Platform</span></button><span className="text-xs text-slate-500">{articles.length} studier</span></div><div className="flex items-center gap-2"><InstrumentSelector selectedInstrumentId={selectedInstrumentId} onSelectInstrument={onSelectInstrument} /><button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={onOpenDocAnalysis}>Dokumentanalyse</button><button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={() => onOpenImportExport?.('import')}>Importer</button><button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={() => onOpenImportExport?.('export')}>Eksporter</button><button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={onOpenAutosave}>Autosave</button><button type="button" className="px-3 py-2 rounded-lg border text-xs" onClick={onOpenPrivacyCenter}><Shield className="inline w-3.5 h-3.5 mr-1"/>Personvern</button><button type="button" className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs" onClick={() => setIsMenuOpen(v => !v)}>Meny</button></div></div>
    {isMenuOpen && <nav className="px-4 pb-3 flex flex-wrap gap-2">{tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{tab.icon}<span><span className="block">{tab.label}</span><span className="block text-[9px] font-normal opacity-70">{tab.subtitle}</span></span></button>)}</nav>}
  </header>;
};
