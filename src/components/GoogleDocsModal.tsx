import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Search, 
  Loader2, 
  RefreshCw, 
  FolderSync, 
  LogOut, 
  LogIn, 
  Download, 
  BookOpen, 
  Copy, 
  Check, 
  ShieldCheck, 
  Settings, 
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  CitationStyle, 
  ReferenceItem, 
  ResearchProject, 
  StudyRecord,
  AppraisalAssessment,
  SourceRecord
} from '../types';
import { 
  getGoogleAuthStatus, 
  authenticateWithGoogleDocs, 
  clearGoogleAuth, 
  createGoogleDocument, 
  listUserGoogleDocs, 
  fetchGoogleDocText, 
  GoogleDocFile, 
  getGoogleClientId, 
  setCustomGoogleClientId,
  exportBibliographyToGoogleDocs,
  exportThesisManuscriptToGoogleDocs,
  exportAppraisalReportToGoogleDocs,
  GOOGLE_SCOPES
} from '../utils/googleDocsService';

interface GoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject;
  studies: StudyRecord[];
  references: ReferenceItem[];
  assessments: Record<string, AppraisalAssessment[]>;
  activeStudyId?: string;
  onImportSourceRecord?: (source: Partial<SourceRecord>) => void;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({
  isOpen,
  onClose,
  project,
  studies,
  references,
  assessments,
  activeStudyId,
  onImportSourceRecord
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'drive' | 'security'>('export');
  const [authStatus, setAuthStatus] = useState(getGoogleAuthStatus());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Client ID configuration state
  const [customClientId, setCustomClientId] = useState(getGoogleClientId());
  const [showConfig, setShowConfig] = useState(false);

  // Export State
  const [exportType, setExportType] = useState<'thesis' | 'bibliography' | 'appraisal'>('thesis');
  const [docTitle, setDocTitle] = useState(`${project.title || 'Kunnskapsoversikt'} - Google Docs Utkast`);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA7');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Drive Browser State
  const [docsList, setDocsList] = useState<GoogleDocFile[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocPreview, setSelectedDocPreview] = useState<{ title: string; text: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthStatus(getGoogleAuthStatus());
      setAuthError(null);
    }
  }, [isOpen]);

  // Refresh docs list if tab is opened and connected
  useEffect(() => {
    if (isOpen && activeTab === 'drive' && authStatus.isConnected && docsList.length === 0) {
      handleLoadDocs();
    }
  }, [isOpen, activeTab, authStatus.isConnected]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await authenticateWithGoogleDocs();
      const updated = getGoogleAuthStatus();
      setAuthStatus(updated);
      if (activeTab === 'drive') {
        handleLoadDocs();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Kunne ikke koble til Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleAuth();
    setAuthStatus(getGoogleAuthStatus());
    setDocsList([]);
    setSelectedDocPreview(null);
  };

  const handleSaveClientId = () => {
    setCustomGoogleClientId(customClientId);
    setAuthStatus(getGoogleAuthStatus());
    setShowConfig(false);
  };

  const handleExportDoc = async () => {
    setIsCreatingDoc(true);
    setCreatedDocUrl(null);
    setCreatedDocId(null);
    setAuthError(null);

    try {
      let res: { documentId: string; url: string };

      if (exportType === 'thesis') {
        const sections = [
          {
            title: '1. Protokoll og Formål',
            content: `Prosjekt: ${project.title}\nKortkode: ${project.shortCode || 'SR-2026'}\n` +
              `Forskningsspørsmål: ${project.protocol?.researchQuestion || 'Systematisk kunnskapsoversikt'}\n` +
              `Populasjon: ${project.protocol?.pico?.population || 'Se spesifikasjon'}\n` +
              `Intervensjon: ${project.protocol?.pico?.intervention || 'Se spesifikasjon'}\n` +
              `Utfall: ${project.protocol?.pico?.outcomes || 'Se spesifikasjon'}`
          },
          {
            title: '2. Kildeutvelgelse og Screening',
            content: `Totalt antall inkluderte studier: ${studies.length}\n` +
              `Søkekilder: PubMed, Europe PMC, OpenAlex, Cochrane Library, Lovdata.\n` +
              `Screening ble utført som dobbeltscreening med eksplisitte inklusjons- og eksklusjonskriterier.`
          },
          {
            title: '3. Kritisk Vurdering og Metodisk Integritet',
            content: `Inkluderte studier ble metodisk vurdert ved hjelp av standardiserte JBI-kriterier.\n` +
              `Gjennomgåtte studier (${studies.length} stk):\n` +
              studies.map((s, idx) => `${idx + 1}. ${s.title} (${s.year || 'u.å.'}) - Type: ${s.documentType}`).join('\n')
          }
        ];

        res = await exportThesisManuscriptToGoogleDocs(docTitle, sections, references, citationStyle);
      } else if (exportType === 'bibliography') {
        res = await exportBibliographyToGoogleDocs(references, citationStyle, project.title);
      } else {
        const activeStudy = studies.find(s => s.id === activeStudyId) || studies[0];
        if (!activeStudy) {
          throw new Error('Ingen studie valgt for vurderingsrapport.');
        }
        const studyAssessments = assessments[activeStudy.id] || [];
        const assessText = studyAssessments.length > 0 
          ? `Vurderer: ${studyAssessments[0].reviewerName || 'Hovedgransker'}\nInstrument: ${studyAssessments[0].instrument}\nKonklusjon: ${studyAssessments[0].overallConfidence || 'Vurdert'}\nNotater: ${studyAssessments[0].summaryNotes || 'Ingen merknader'}`
          : 'Ingen vurderingsdetaljer funnet for denne studien.';
        res = await exportAppraisalReportToGoogleDocs(activeStudy, assessText);
      }

      setCreatedDocId(res.documentId);
      setCreatedDocUrl(res.url);
    } catch (err: any) {
      setAuthError(err?.message || 'Kunne ikke opprette Google-dokument.');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleLoadDocs = async () => {
    setIsLoadingDocs(true);
    setAuthError(null);
    try {
      const list = await listUserGoogleDocs(searchQuery);
      setDocsList(list);
    } catch (err: any) {
      setAuthError(err?.message || 'Kunne ikke hente Google Docs.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handlePreviewDoc = async (doc: GoogleDocFile) => {
    setIsLoadingPreview(true);
    setAuthError(null);
    try {
      const data = await fetchGoogleDocText(doc.id);
      setSelectedDocPreview(data);
    } catch (err: any) {
      setAuthError(err?.message || 'Kunne ikke hente dokumentinnhold.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleImportAsSource = () => {
    if (!selectedDocPreview || !onImportSourceRecord) return;
    onImportSourceRecord({
      title: selectedDocPreview.title,
      abstract: selectedDocPreview.text.slice(0, 800),
      publicationType: 'Kvalitativ studie',
      year: undefined,
      screeningStatus: 'UNSCREENED'
    });
    setImportedNotice(`Dokumentet "${selectedDocPreview.title}" ble importert som ny kildepost.`);
    setTimeout(() => setImportedNotice(null), 4000);
  };

  const handleCopyDocLink = () => {
    if (createdDocUrl) {
      navigator.clipboard.writeText(createdDocUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Google Docs &amp; Drive Skyintegrasjon
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/80 uppercase">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Eksporter utkast, manuskripter og referanselister direkte til din personlige Google Drive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              title="Google OAuth Innstillinger"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OAuth Client ID Configuration Collapsible */}
        {showConfig && (
          <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                Google OAuth Client ID Konfigurasjon
              </span>
              <span className="text-[10px] text-slate-400">
                Brukes av Google Identity Services (GSI)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="f.eks. 1234567890-abc123xyz.apps.googleusercontent.com"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSaveClientId}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Lagre ID
              </button>
            </div>
          </div>
        )}

        {/* Connection Status Banner */}
        <div className="px-6 py-2.5 bg-slate-850/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${authStatus.isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-amber-500'}`} />
            {authStatus.isConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Tilkoblet Google:</span>
                <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {authStatus.userEmail || 'Aktiv Google-økt'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Full Docs &amp; Drive tilgang
                </span>
              </div>
            ) : (
              <div className="text-slate-300 flex items-center gap-2">
                <span>Ikke koblet til Google Docs ennå.</span>
                <span className="text-slate-500 text-[11px]">Logg inn for å lagre direkte til Google Drive.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {authStatus.isConnected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Koble fra</span>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isAuthenticating}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-md transition-all shadow-blue-900/30"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Kobler til Google...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Koble til med Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {authError && (
          <div className="px-6 py-2.5 bg-rose-950/80 border-b border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{authError}</span>
            <button onClick={() => setAuthError(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-6 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Eksporter til Google Docs</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'drive'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span>Bla i Google Drive Docs</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sikkerhet &amp; OAuth 2.0</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900/60">
          
          {/* TAB 1: EXPORT TO GOOGLE DOCS */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Velg innhold som skal eksporteres til Google Docs:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => {
                      setExportType('thesis');
                      setDocTitle(`${project.title || 'Kunnskapsoversikt'} - Fullt Utkast`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      exportType === 'thesis'
                        ? 'bg-blue-950/50 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-blue-300">
                      <BookOpen className="w-4 h-4" />
                      <span>Fullt Oppgaveutkast</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Metodekapittel, PRISMA 2020 søkestrategi, PICO-tabell, JBI vurderinger og referanser.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportType('bibliography');
                      setDocTitle(`Litteraturliste (${citationStyle}) - ${project.title}`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      exportType === 'bibliography'
                        ? 'bg-blue-950/50 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-indigo-300">
                      <FileText className="w-4 h-4" />
                      <span>Referanseliste ({references.length})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Komplett formatering i APA 7, Vancouver, Harvard, Chicago eller Norsk Lovstandard.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportType('appraisal');
                      setDocTitle(`Metodisk Vurderingsrapport (JBI)`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      exportType === 'appraisal'
                        ? 'bg-blue-950/50 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kritisk Vurdering (JBI)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Vurderingsrapport med sjekklistesvar, metodiske funn og SHA-256 integritetsbevis.
                    </p>
                  </button>

                </div>
              </div>

              {/* Title & Style Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Dokumenttittel i Google Docs:</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Siteringsstil:</label>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="APA7">APA 7th Edition</option>
                    <option value="Vancouver">Vancouver (NLM)</option>
                    <option value="Harvard">Harvard</option>
                    <option value="Chicago">Chicago</option>
                    <option value="MLA">MLA</option>
                    <option value="IEEE">IEEE</option>
                    <option value="NorwegianLaw">Norsk Juridisk Standard</option>
                  </select>
                </div>
              </div>

              {/* Success Card with Direct Link */}
              {createdDocUrl && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Google-dokument opprettet med suksess!</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300/80">ID: {createdDocId}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Dokumentet er nå lagret direkte på din Google Drive og kan åpnes, deles eller redigeres videre sammen med veiledere og kollegaer.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={createdDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Åpne i Google Docs</span>
                    </a>
                    <button
                      onClick={handleCopyDocLink}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Kopiert lenke' : 'Kopier Google Docs-lenke'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Oppretter et rent Google-dokument med strukturert overskriftsnivå</span>
                </div>

                <button
                  type="button"
                  onClick={handleExportDoc}
                  disabled={isCreatingDoc}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-950/50 transition-all cursor-pointer"
                >
                  {isCreatingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Oppretter i Google Docs...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Opprett Google Doc Nå</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: DRIVE BROWSER & IMPORTER */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadDocs()}
                    placeholder="Søk etter dokumenttittel i Google Drive..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleLoadDocs}
                  disabled={isLoadingDocs || !authStatus.isConnected}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {isLoadingDocs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Oppdater</span>
                </button>
              </div>

              {importedNotice && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importedNotice}</span>
                </div>
              )}

              {!authStatus.isConnected ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                  <FolderSync className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">Google Drive ikke tilkoblet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Koble til Google-kontoen din for å se og importere dine eksisterende Google Docs til analysearbeidet.
                  </p>
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Koble til Google Docs
                  </button>
                </div>
              ) : isLoadingDocs ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">Henter Google Docs fra din Google Drive...</span>
                </div>
              ) : docsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-300">Ingen Google Docs funnet for søkekriteriet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Prøv et annet søkeord eller opprett et nytt utkast ovenfor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[48vh] overflow-y-auto">
                  {docsList.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-200 line-clamp-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{doc.name}</span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString('no-NO') : 'Ukjent dato'}
                          </span>
                          {doc.owners?.[0]?.displayName && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              {doc.owners[0].displayName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                        <a
                          href={doc.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-400" />
                          <span>Åpne i Docs</span>
                        </a>
                        <button
                          onClick={() => handlePreviewDoc(doc)}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Forhåndsvis / Importer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview modal/drawer for selected doc */}
              {selectedDocPreview && (
                <div className="p-4 bg-slate-950 border border-slate-750 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>{selectedDocPreview.title}</span>
                    </h4>
                    <button
                      onClick={() => setSelectedDocPreview(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                    {selectedDocPreview.text.slice(0, 1200)}
                    {selectedDocPreview.text.length > 1200 && '... [merket avkortet]'}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleImportAsSource}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Importer som Kildepost i prosjektet</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SECURITY & OAUTH 2.0 EXPLANATION */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Google Workspace OAuth 2.0 Sikkerhetsarkitektur</span>
                </h4>
                <p>
                  Denne integrasjonen benytter Google Identity Services (GSI) klient-side OAuth 2.0 autentisering. Det betyr:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong>Ingen passord eller hemmeligheter</strong> deles eller lagres på noen ekstern server.</li>
                  <li><strong>Tokens lagres kun i nettleserens sesjonsminne</strong> og utløper automatisk.</li>
                  <li>Du har full kontroll og kan når som helst trekke tilbake tilgangen via Google-kontoens sikkerhetsside.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white">Forespurte og Aktive OAuth Scopes:</h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-blue-300">https://www.googleapis.com/auth/documents</span>
                    <span className="text-[10px] text-emerald-400">Opprette og redigere Google Docs</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-blue-300">https://www.googleapis.com/auth/drive.file</span>
                    <span className="text-[10px] text-emerald-400">Lagre filer opprettet av denne appen</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-blue-300">https://www.googleapis.com/auth/drive.readonly</span>
                    <span className="text-[10px] text-slate-400">Bla i dokumenter for import</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-blue-200 text-xs">
                <p>
                  <strong>Tips for veiledere og samhandling:</strong> Når et dokument opprettes i Google Docs, kan du invitere medforfattere, veileder eller medstudenter til samskriving i sanntid via Google Docs sin ordinære delingsknapp.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Google Docs™ og Google Drive™ er varemerker tilhørende Google LLC.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
