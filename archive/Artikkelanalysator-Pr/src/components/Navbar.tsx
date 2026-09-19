import React from 'react';
import { BookOpen, CheckSquare, Layers, FileText, ArrowRightLeft, Sparkles, Library, Presentation, Search, Bookmark, Globe, ShieldCheck, HelpCircle, FolderArchive, Terminal, UploadCloud } from 'lucide-react';

interface NavbarProps {
  activeTab: 'library' | 'classification' | 'checklist' | 'custom-checklist' | 'comparison' | 'presentation' | 'qa' | 'verifier' | 'student-evaluator' | 'references' | 'report' | 'help' | 'system-export' | 'audit-log' | 'file-appraisal';
  setActiveTab: (tab: 'library' | 'classification' | 'checklist' | 'custom-checklist' | 'comparison' | 'presentation' | 'qa' | 'verifier' | 'student-evaluator' | 'references' | 'report' | 'help' | 'system-export' | 'audit-log' | 'file-appraisal') => void;
  selectedArticleTitle: string;
  isAnalyzing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedArticleTitle,
  isAnalyzing
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Artikkelanalysator Pro</h1>
              <p className="text-xs text-slate-500">Kritisk vurdering, klassifisering og sjekklister for forskning & faglitteratur</p>
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'library'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Bibliotek</span>
            </button>

            <button
              onClick={() => setActiveTab('classification')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'classification'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Klassifisering</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'checklist'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Sjekkliste</span>
            </button>

            <button
              onClick={() => setActiveTab('custom-checklist')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'custom-checklist'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Egendefinert Sjekkliste</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Sammenlign</span>
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'qa'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Spørsmål & Svar</span>
            </button>

            <button
              onClick={() => setActiveTab('verifier')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'verifier'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Google Verifiser</span>
            </button>

            <button
              onClick={() => setActiveTab('student-evaluator')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'student-evaluator'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Eksamen & Sensor</span>
            </button>

            <button
              onClick={() => setActiveTab('presentation')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'presentation'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Presentation className="w-4 h-4" />
              <span>Presentasjon</span>
            </button>

            <button
              onClick={() => setActiveTab('references')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'references'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>APA 7 & Harvard</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'report'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Rapport</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'help'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Hjelp</span>
            </button>

            <button
              onClick={() => setActiveTab('system-export')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'system-export'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>System & ZIP</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-log')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'audit-log'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Logg & Metodikk</span>
            </button>

            <button
              onClick={() => setActiveTab('file-appraisal')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'file-appraisal'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Filbasert Vurdering</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subheader showing active article context and Quick Action Toolbar */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600 flex flex-wrap justify-between items-center gap-2 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="truncate flex items-center space-x-2">
          <span className="font-semibold text-slate-700">Aktiv kilde:</span>
          <span className="text-indigo-600 font-medium truncate max-w-sm">{selectedArticleTitle}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium hidden sm:inline">Hurtighandlinger:</span>
          <button
            onClick={() => setActiveTab('library')}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shadow-xs"
            title="Importer eller velg forskningskilde"
          >
            <Library className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Importer kilde</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shadow-xs"
            title="Utfør kritisk vurdering og sjekkliste"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Utfør vurdering</span>
          </button>

          <button
            onClick={() => setActiveTab('student-evaluator')}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shadow-xs"
            title="Kjør kontroll for AI-mønstre og plagiat"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. AI- & Plagiatsjekk</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shadow-xs"
            title="Generer samlet rapport og eksport"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Eksport & Rapport</span>
          </button>
        </div>
      </div>
    </header>
  );
};
