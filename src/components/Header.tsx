import React, { useState, useEffect } from 'react';
import { Menu, Shield, Workflow, Wifi, WifiOff, X } from 'lucide-react';
import { InstrumentSelector } from './InstrumentSelector';
import { ArticleAppraisal } from '../types';
import { UserRole } from '../services/rbacService';
import { CaseWorkflowStudioView } from './CaseWorkflowStudioView';
import { IS_OFFLINE_EDITION, useOnlineStatus } from '../runtime/edition';

export type ActiveTab =
  | 'overview' | 'document_studio' | 'search' | 'evaluate' | 'details' | 'compare' | 'peer_review'
  | 'synthesis' | 'audittrail' | 'who_validation' | 'methodology_audit' | 'meta_research'
  | 'reference_library' | 'reference_hub' | 'validation_dashboard' | 'help_examples'
  | 'instrumentinfo' | 'source_workflow' | 'appraisal' | 'writing_studio'
  | 'new_article' | 'methodology' | 'analysis_tools' | 'modules' | 'legal' | 'account';

interface HeaderProps {
  activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; articles: ArticleAppraisal[]; selectedArticleId: string; onSelectArticleId: (id: string) => void;
  selectedInstrumentId: string; onSelectInstrument: (instrumentId: string) => void; currentUserRole: UserRole; onSelectUserRole: (role: UserRole) => void;
  onOpenPrivacyCenter: () => void; onOpenDocAnalysis?: () => void; onOpenImportExport?: (tab?: 'import' | 'export') => void; onOpenAutosave?: () => void; onNewArticle?: () => void;
}

/** Every reachable view, grouped. 'evaluate' and 'instrumentinfo' are opened from articles, not from the menu. */
export const NAV_GROUPS: Array<{ title: string; tabs: Array<{ id: ActiveTab; label: string }> }> = [
  { title: 'Arbeidsflyt', tabs: [
    { id: 'overview', label: 'Oversikt' },
    { id: 'search', label: 'Litteratursøk' },
    { id: 'source_workflow', label: 'Screening & PICO' },
    { id: 'document_studio', label: 'Dokumentstudio (PDF)' },
    { id: 'new_article', label: 'Ny artikkel' },
    { id: 'appraisal', label: 'Kritisk vurdering' },
    { id: 'details', label: 'Studiedetaljer' },
    { id: 'compare', label: 'Dobbel vurdering' },
    { id: 'peer_review', label: 'Fagfelle & konsensus' },
    { id: 'synthesis', label: 'Syntese & eksport' },
  ] },
  { title: 'Analyse og metode', tabs: [
    { id: 'meta_research', label: 'Metaforskning & PRISMA' },
    { id: 'analysis_tools', label: 'GRADE, meta-analyse & kappa' },
    { id: 'who_validation', label: 'WHO-validering' },
    { id: 'methodology', label: 'Instrumentkatalog' },
    { id: 'methodology_audit', label: 'Metoderevisjon' },
    { id: 'validation_dashboard', label: 'Valideringstester' },
  ] },
  { title: 'Referanser og skriving', tabs: [
    { id: 'reference_hub', label: 'Referansehub' },
    { id: 'reference_library', label: 'Referansebibliotek' },
    { id: 'writing_studio', label: 'Skrivestudio' },
  ] },
  { title: 'Kvalitet og moduler', tabs: [
    { id: 'audittrail', label: 'Revisjonslogg' },
    { id: 'modules', label: 'Kildeinntak & inspektører' },
  ] },
  { title: 'Hjelp og konto', tabs: [
    { id: 'help_examples', label: 'Hjelp & eksempler' },
    { id: 'account', label: 'Lisens & konto' },
    { id: 'legal', label: 'Vilkår, personvern & ansvar' },
  ] },
];

const ROLES: Array<{ id: UserRole; label: string }> = [
  { id: 'lead_reviewer', label: 'Hovedvurderer' },
  { id: 'reviewer', label: 'Vurderer' },
  { id: 'adjudicator', label: 'Konsensusleder' },
  { id: 'admin', label: 'Administrator' },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, articles, selectedInstrumentId, onSelectInstrument, currentUserRole, onSelectUserRole, onOpenPrivacyCenter, onOpenDocAnalysis, onOpenImportExport, onOpenAutosave, onNewArticle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const online = useOnlineStatus();
  useEffect(() => { setIsMenuOpen(false); setShowWorkflow(false); }, [activeTab]);
  const go = (tab: ActiveTab) => { setShowWorkflow(false); if (tab === 'new_article' && onNewArticle) onNewArticle(); else setActiveTab(tab); };
  const button = 'px-3 py-2 rounded-lg border border-slate-300 text-xs whitespace-nowrap';

  return <>
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-3 gap-3">
        <button type="button" className="font-black text-slate-900 text-left text-sm sm:text-base" onClick={() => go('overview')}>
          Evidence Appraisal Tool
          <span className="block text-[10px] font-semibold text-slate-500">{articles.length} studier · {IS_OFFLINE_EDITION ? 'nedlastbar utgave' : 'nettutgave'}</span>
        </button>
        <div className="flex items-center gap-2">
          <span role="status" className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${online ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{online ? <Wifi className="w-3 h-3" aria-hidden="true" /> : <WifiOff className="w-3 h-3" aria-hidden="true" />}{online ? 'Tilkoblet' : 'Uten nett – lokale funksjoner virker'}</span>
          <button type="button" aria-expanded={isMenuOpen} aria-controls="main-nav" className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs flex items-center gap-1.5" onClick={() => setIsMenuOpen(v => !v)}>{isMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}Meny</button>
        </div>
        <div className="w-full flex flex-wrap items-center gap-2">
          <InstrumentSelector selectedInstrumentId={selectedInstrumentId} onSelectInstrument={onSelectInstrument} />
          <label className="sr-only" htmlFor="role-select">Rolle</label>
          <select id="role-select" value={currentUserRole} onChange={e => onSelectUserRole(e.target.value as UserRole)} className="rounded-lg border border-slate-300 px-2 py-2 text-xs">{ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
          <button type="button" className={`${button} flex items-center gap-1.5 ${showWorkflow ? 'bg-teal-800 text-white border-teal-800' : ''}`} onClick={() => setShowWorkflow(v => !v)}><Workflow className="w-3.5 h-3.5" aria-hidden="true" />Saksflyt</button>
          <button type="button" className={button} onClick={onOpenDocAnalysis}>Dokumentanalyse</button>
          <button type="button" className={button} onClick={() => onOpenImportExport?.('import')}>Importer</button>
          <button type="button" className={button} onClick={() => onOpenImportExport?.('export')}>Eksporter</button>
          <button type="button" className={button} onClick={onOpenAutosave}>Autolagring</button>
          <button type="button" className={button} onClick={onOpenPrivacyCenter}><Shield className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />Personvern, nettverk & sikkerhetskopi</button>
        </div>
      </div>
      {isMenuOpen && <nav id="main-nav" aria-label="Hovedmeny" className="px-3 sm:px-4 pb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 max-h-[70vh] overflow-y-auto">
        {NAV_GROUPS.map(group => <div key={group.title}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">{group.title}</div>
          <ul className="space-y-1">{group.tabs.map(tab => <li key={tab.id}><button type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => go(tab.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${activeTab === tab.id ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{tab.label}</button></li>)}</ul>
        </div>)}
      </nav>}
    </header>
    {showWorkflow && <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8"><CaseWorkflowStudioView /></main>}
  </>;
};
