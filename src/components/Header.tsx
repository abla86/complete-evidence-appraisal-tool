import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Layers, GitCompare, CheckSquare, GraduationCap, Sparkles, Download, Printer, Users, History, ShieldCheck, PlusCircle, FileSearch, HardDrive, Shield, UserCheck, ScanSearch } from 'lucide-react';
import { useToast } from './Toast';
import { InstrumentSelector } from './InstrumentSelector';
import { ArticleAppraisal } from '../types';
import { AutosaveService, AutosaveStatus } from '../services/autosaveService';
import { UserRole, RbacService } from '../services/rbacService';

export type ActiveTab = 'overview' | 'search' | 'evaluate' | 'details' | 'compare' | 'peer_review' | 'synthesis' | 'audittrail' | 'who_validation' | 'methodology_audit' | 'meta_research' | 'reference_library' | 'validation_dashboard' | 'help_examples' | 'instrumentinfo' | 'research_inspector';

interface HeaderProps { activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; articles: ArticleAppraisal[]; selectedArticleId: string; onSelectArticleId: (id: string) => void; selectedInstrumentId: string; onSelectInstrument: (instrumentId: string) => void; currentUserRole: UserRole; onSelectUserRole: (role: UserRole) => void; onOpenPrivacyCenter: () => void; onOpenDocAnalysis?: () => void; onOpenImportExport?: (tab?: 'import' | 'export') => void; onOpenAutosave?: () => void; onNewArticle?: () => void; }

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, articles, selectedArticleId, onSelectArticleId, selectedInstrumentId, onSelectInstrument, currentUserRole, onSelectUserRole, onOpenPrivacyCenter, onOpenDocAnalysis, onOpenImportExport, onOpenAutosave, onNewArticle }) => {
  const { showToast } = useToast();
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>({ state: 'idle', lastSavedAt: null });
  useEffect(() => AutosaveService.subscribe(setSaveStatus), []);
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16 sm:h-18">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { onSelectInstrument('jbi-qualitative-2017'); setActiveTab('overview'); }}>
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs"><ShieldCheck className="w-6 h-6 text-teal-100" /></div>
          <div><div className="flex items-center gap-2"><h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">Evidence Appraisal Tool</h1><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-900 border border-teal-200">Superprogram</span></div><p className="text-xs text-slate-500 hidden sm:block">Kritisk vurdering · forskning · evidens · integritet</p></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onOpenAutosave && <button type="button" onClick={onOpenAutosave} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border bg-slate-50 text-slate-700 border-slate-300"><span className={`w-2 h-2 rounded-full ${saveStatus.state === 'saving' ? 'bg-amber-500 animate-spin' : saveStatus.state === 'error' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} /><HardDrive className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" /><span className="hidden md:inline text-[11px]">{saveStatus.state === 'saving' ? 'Lagrer...' : saveStatus.lastSavedAt ? `Autolagret ${saveStatus.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Autolagring på'}</span></button>}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1"><UserCheck className="w-3.5 h-3.5 text-teal-700" /><select value={currentUserRole} onChange={e => onSelectUserRole(e.target.value as UserRole)} className="text-[11px] font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1">{RbacService.getAvailableRoles().map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          <button type="button" onClick={onOpenPrivacyCenter} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl"><Shield className="w-3.5 h-3.5 text-teal-700" /><span className="hidden lg:inline text-[11px]">Personvern</span></button>
          <button type="button" onClick={() => setActiveTab('research_inspector')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl ${activeTab === 'research_inspector' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-950 border border-indigo-200'}`}><ScanSearch className="w-3.5 h-3.5" /><span className="hidden lg:inline">Research Inspector</span></button>
          <button type="button" onClick={() => setActiveTab('meta_research')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl ${activeTab === 'meta_research' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'}`}><Sparkles className="w-3.5 h-3.5" /><span className="hidden lg:inline">Forsk på Forskning</span></button>
          {onOpenImportExport && <button type="button" onClick={() => onOpenImportExport('export')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-xl"><Download className="w-3.5 h-3.5 text-teal-700" /><span>Import & Eksport</span></button>}
          {onOpenDocAnalysis && <button type="button" onClick={onOpenDocAnalysis} className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-teal-50 border border-teal-200 rounded-xl"><FileSearch className="w-3.5 h-3.5 text-teal-700" /><span>Dokumentanalyse</span></button>}
          {onNewArticle && <button type="button" onClick={onNewArticle} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 rounded-xl"><PlusCircle className="w-3.5 h-3.5 text-teal-200" /><span className="hidden sm:inline">Ny artikkel</span></button>}
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl"><Printer className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span></button>
        </div>
      </div></div>
      <InstrumentSelector selectedInstrumentId={selectedInstrumentId} onSelectInstrument={(id) => { onSelectInstrument(id); setActiveTab(id === 'jbi-qualitative-2017' ? 'overview' : 'instrumentinfo'); }} />
      {selectedInstrumentId === 'jbi-qualitative-2017' && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mb-px">
        {([['overview', Layers, `Artikkelbibliotek (${articles.length})`], ['search', FileSearch, 'Forskningssøk & Databaser'], ['details', BookOpen, 'Artikkeldetaljer & Evidens'], ['evaluate', CheckSquare, 'JBI Vurderingsskjema'], ['compare', GitCompare, 'Dual Review'], ['peer_review', Users, 'Fagfellevurdering & Grupper'], ['synthesis', FileText, 'Metodesyntese & Oppgavetekst'], ['audittrail', History, 'Audit Trail'], ['who_validation', ShieldCheck, 'Metodisk kontroll'], ['meta_research', Sparkles, 'Forsk på Forskning'], ['reference_library', BookOpen, 'Gullstandard-bibliotek'], ['validation_dashboard', ShieldCheck, 'Valideringsdashboard'], ['methodology_audit', ShieldCheck, 'Kilde- & Metoderevisjon'], ['research_inspector', ScanSearch, 'Privacy & Accessibility'], ['help_examples', GraduationCap, 'Hjelp & Eksempler']] as const).map(([id, Icon, label]) => <button key={id} type="button" onClick={() => setActiveTab(id as ActiveTab)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap ${activeTab === id ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}><Icon className="w-3.5 h-3.5" /><span>{label}</span></button>)}
      </nav></div>}
    </header>
  );
};
