import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Layers, 
  GitCompare, 
  CheckSquare, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  Download,
  Printer,
  Users,
  History,
  ShieldCheck,
  PlusCircle,
  FileSearch,
  SlidersHorizontal,
  Save,
  HardDrive,
  Shield,
  UserCheck
} from 'lucide-react';
import { useToast } from './Toast';
import { InstrumentSelector } from './InstrumentSelector';
import { ArticleAppraisal } from '../types';
import { AutosaveService, AutosaveStatus } from '../services/autosaveService';
import { UserRole, RbacService } from '../services/rbacService';

export type ActiveTab = 
  | 'overview' 
  | 'search'
  | 'evaluate'
  | 'details'
  | 'compare'
  | 'peer_review'
  | 'synthesis'
  | 'audittrail'
  | 'who_validation'
  | 'methodology_audit'
  | 'meta_research'
  | 'reference_library'
  | 'validation_dashboard'
  | 'help_examples'
  | 'instrumentinfo';

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
  activeTab,
  setActiveTab,
  articles,
  selectedArticleId,
  onSelectArticleId,
  selectedInstrumentId,
  onSelectInstrument,
  currentUserRole,
  onSelectUserRole,
  onOpenPrivacyCenter,
  onOpenDocAnalysis,
  onOpenImportExport,
  onOpenAutosave,
  onNewArticle
}) => {
  const { showToast } = useToast();
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>({
    state: 'idle',
    lastSavedAt: null
  });

  useEffect(() => {
    const unsub = AutosaveService.subscribe(st => {
      setSaveStatus(st);
    });
    return unsub;
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId) || articles[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
      {/* Top App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Tool Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => {
              onSelectInstrument('jbi-qualitative-2017');
              setActiveTab('overview');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">
                  Evidence Appraisal Tool
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-900 border border-teal-200">
                  JBI Qualitative (2017)
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Generelt vitenskapelig verktøy for kritisk kvalitativ vurdering og syntese
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Autosave Status Pill */}
            {onOpenAutosave && (
              <button
                type="button"
                id="btn-autosave-status-indicator"
                onClick={onOpenAutosave}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-2xs bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                title="Autolagring er aktiv. Klikk for å se versjoner, gjenopprettingspunkter eller laste ned backup."
              >
                <span className={`w-2 h-2 rounded-full ${
                  saveStatus.state === 'saving' 
                    ? 'bg-amber-500 animate-spin' 
                    : saveStatus.state === 'error' 
                      ? 'bg-rose-500' 
                      : 'bg-emerald-500 animate-pulse'
                }`} />
                <HardDrive className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                <span className="hidden md:inline text-[11px]">
                  {saveStatus.state === 'saving' 
                    ? 'Lagrer...' 
                    : saveStatus.lastSavedAt 
                      ? `Autolagret ${saveStatus.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Autolagring på'}
                </span>
              </button>
            )}

            {/* RBAC Role Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <select
                value={currentUserRole}
                onChange={e => onSelectUserRole(e.target.value as UserRole)}
                className="text-[11px] font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                title="Bytt aktiv brukerrolle (RBAC)"
              >
                {RbacService.getAvailableRoles().map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* GDPR & Privacy Center Button */}
            <button
              type="button"
              id="btn-nav-gdpr-privacy-top"
              onClick={onOpenPrivacyCenter}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
              title="GDPR & Personvernsenter: Dataminimering, PII-sanitering og rettigheter"
            >
              <Shield className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden lg:inline text-[11px]">Personvern</span>
            </button>

            <button
              type="button"
              id="btn-nav-meta-research-top"
              onClick={() => setActiveTab('meta_research')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                activeTab === 'meta_research'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300'
              }`}
              title="Forsk på forskning: Automatisk dokumentidentifisering, integritetsvakt og verktøyfinner"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Forsk på Forskning (Integritetsvakt)</span>
            </button>

            {onOpenImportExport && (
              <button
                type="button"
                id="btn-nav-import-export-top"
                onClick={() => onOpenImportExport('export')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors shadow-2xs"
                title="Importer eller eksporter filer i alle formater (RIS, BibTeX, Excel, Word, PDF, JSON)"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" />
                <span>Import & Eksport</span>
              </button>
            )}

            {onOpenDocAnalysis && (
              <button
                type="button"
                onClick={onOpenDocAnalysis}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors shadow-2xs"
                title="Åpne tekst- og dokumentanalyse for kandidat-evidens"
              >
                <FileSearch className="w-3.5 h-3.5 text-teal-700" />
                <span>Dokumentanalyse</span>
              </button>
            )}

            {onNewArticle && (
              <button
                type="button"
                onClick={onNewArticle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-2xs transition-colors"
                title="Opprett eller importer ny artikkel for vurdering"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal-200" />
                <span className="hidden sm:inline">Ny artikkel</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
              title="Skriv ut eller lagre som PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header: Instrument Selector Banner */}
      <InstrumentSelector
        selectedInstrumentId={selectedInstrumentId}
        onSelectInstrument={(id) => {
          onSelectInstrument(id);
          if (id === 'jbi-qualitative-2017') {
            setActiveTab('overview');
          } else {
            setActiveTab('instrumentinfo');
          }
        }}
      />

      {/* Main Navigation Tabs */}
      {selectedInstrumentId === 'jbi-qualitative-2017' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'border-teal-700 text-teal-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Artikkelbibliotek ({articles.length})</span>
            </button>

            <button
              type="button"
              id="tab-btn-nav-search"
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'search'
                  ? 'border-sky-600 text-sky-950 font-bold bg-sky-50/70'
                  : 'border-transparent text-sky-800 hover:text-sky-950 hover:border-sky-300 font-semibold'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5 text-sky-600" />
              <span>Forskningssøk & Databaser</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'details'
                  ? 'border-teal-700 text-teal-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Artikkeldetaljer & Evidens</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('evaluate')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'evaluate'
                  ? 'border-teal-700 text-teal-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-700" />
              <span>JBI Vurderingsskjema</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'compare'
                  ? 'border-teal-700 text-teal-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Sammenligning & Dual Review</span>
            </button>

            <button
              type="button"
              id="tab-btn-nav-peer-review"
              onClick={() => setActiveTab('peer_review')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'peer_review'
                  ? 'border-teal-700 text-teal-950 font-bold bg-teal-50/70'
                  : 'border-transparent text-teal-900 hover:text-teal-950 hover:border-teal-300 font-semibold'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-700" />
              <span>Fagfellevurdering & Grupper</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-teal-100 text-teal-900 font-bold">
                Team
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('synthesis')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'synthesis'
                  ? 'border-teal-700 text-teal-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Metodesyntese & Oppgavetekst</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audittrail')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'audittrail'
                  ? 'border-teal-700 text-teal-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('who_validation')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'who_validation'
                  ? 'border-teal-700 text-teal-900 font-bold bg-teal-50/50'
                  : 'border-transparent text-teal-800 hover:text-teal-950 hover:border-teal-300 font-semibold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Metodisk kontroll</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-teal-100 text-teal-900 font-bold">Kontroll</span>
            </button>

            <button
              type="button"
              id="tab-btn-nav-meta-research"
              onClick={() => setActiveTab('meta_research')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'meta_research'
                  ? 'border-emerald-600 text-emerald-950 font-bold bg-emerald-50/70'
                  : 'border-transparent text-emerald-800 hover:text-emerald-950 hover:border-emerald-300 font-semibold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Forsk på Forskning</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-900 font-bold">
                NY
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-nav-reference-library"
              onClick={() => setActiveTab('reference_library')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'reference_library'
                  ? 'border-teal-700 text-teal-900 font-bold bg-teal-50/50'
                  : 'border-transparent text-teal-800 hover:text-teal-950 hover:border-teal-300 font-semibold'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>Gullstandard-bibliotek</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-teal-100 text-teal-900 font-bold">
                L3
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-nav-validation-dashboard"
              onClick={() => setActiveTab('validation_dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'validation_dashboard'
                  ? 'border-teal-700 text-teal-900 font-bold bg-teal-50/50'
                  : 'border-transparent text-teal-800 hover:text-teal-950 hover:border-teal-300 font-semibold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Valideringsdashboard</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-900 font-bold">
                Pass
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('methodology_audit')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'methodology_audit'
                  ? 'border-teal-700 text-teal-900 font-bold bg-teal-50/50'
                  : 'border-transparent text-teal-800 hover:text-teal-950 hover:border-teal-300 font-semibold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Kilde- & Metoderevisjon</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-teal-100 text-teal-900 font-bold">Audit</span>
            </button>

            <button
              type="button"
              id="tab-btn-nav-help-examples"
              onClick={() => setActiveTab('help_examples')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'help_examples'
                  ? 'border-indigo-600 text-indigo-950 font-bold bg-indigo-50/70'
                  : 'border-transparent text-indigo-800 hover:text-indigo-950 hover:border-indigo-300 font-semibold'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hjelp & Eksempelbibliotek</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-900 font-bold">
                Veileder
              </span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
