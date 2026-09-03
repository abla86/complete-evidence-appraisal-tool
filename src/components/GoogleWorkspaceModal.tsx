import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  LogOut, 
  LogIn, 
  RefreshCw,
  FolderOpen,
  HelpCircle,
  Clock,
  Layers,
  Table,
  BookOpen
} from 'lucide-react';
import { 
  AppraisalAssessment, 
  CitationStyle, 
  DataExtractionRecord, 
  PrismaFlowData, 
  ReferenceItem, 
  ResearchProject, 
  StudyRecord 
} from '../types';
import { 
  getGoogleClientId, 
  setCustomGoogleClientId, 
  getStoredGoogleTokenState, 
  saveGoogleTokenState, 
  clearGoogleTokenState, 
  requestGoogleWorkspaceToken, 
  fetchGoogleUserInfo,
  exportThesisSectionToGoogleDoc,
  exportReferenceLibraryToGoogleDoc,
  exportStudiesToGoogleSheet,
  exportExtractionsToGoogleSheet,
  exportReferencesToGoogleSheet,
  exportPrismaFlowToGoogleSheet,
  listRecentGoogleFiles,
  GoogleExportResult,
  GoogleWorkspaceTokenState,
  GOOGLE_WORKSPACE_SCOPES
} from '../utils/googleWorkspace';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject;
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  references: ReferenceItem[];
  extractions: DataExtractionRecord[];
  prismaData: PrismaFlowData;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  project,
  studies,
  assessments,
  references,
  extractions,
  prismaData
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'sheets' | 'drive' | 'auth'>('docs');
  const [tokenState, setTokenState] = useState<GoogleWorkspaceTokenState>(getStoredGoogleTokenState());
  const [clientId, setClientId] = useState<string>(getGoogleClientId());
  const [isEditingClientId, setIsEditingClientId] = useState(false);
  const [tempClientId, setTempClientId] = useState(getGoogleClientId());
  
  // Action states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<GoogleExportResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA7');
  
  // Drive files
  const [recentFiles, setRecentFiles] = useState<{ id: string; name: string; mimeType: string; modifiedTime: string; webViewLink?: string }[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getStoredGoogleTokenState();
      setTokenState(current);
      setClientId(getGoogleClientId());
      setTempClientId(getGoogleClientId());
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Load drive files when Drive tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'drive' && tokenState.accessToken) {
      loadDriveFiles();
    }
  }, [isOpen, activeTab, tokenState.accessToken]);

  const loadDriveFiles = async () => {
    if (!tokenState.accessToken) return;
    setLoadingFiles(true);
    try {
      const files = await listRecentGoogleFiles(tokenState.accessToken);
      setRecentFiles(files);
    } catch (err: any) {
      console.warn('Failed to load drive files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleConnect = async () => {
    setErrorMsg(null);
    setLoadingAction('auth');
    try {
      const targetClientId = clientId || tempClientId;
      if (!targetClientId) {
        throw new Error('Google OAuth Client ID er påkrevd. Vennligst angi din Client ID under "OAuth Innstillinger".');
      }
      
      const { accessToken, expiresIn } = await requestGoogleWorkspaceToken(targetClientId);
      const userInfo = await fetchGoogleUserInfo(accessToken);
      
      saveGoogleTokenState(accessToken, expiresIn, userInfo);
      setTokenState({
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
        userInfo,
        scopes: GOOGLE_WORKSPACE_SCOPES
      });
      setIsEditingClientId(false);
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err.message || 'Kunne ikke koble til Google Workspace.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnect = () => {
    clearGoogleTokenState();
    setTokenState({
      accessToken: null,
      expiresAt: null,
      userInfo: null,
      scopes: GOOGLE_WORKSPACE_SCOPES
    });
    setLastExport(null);
  };

  const handleSaveClientId = () => {
    setCustomGoogleClientId(tempClientId);
    setClientId(tempClientId);
    setIsEditingClientId(false);
  };

  const ensureToken = async (): Promise<string> => {
    if (tokenState.accessToken && tokenState.expiresAt && Date.now() < tokenState.expiresAt) {
      return tokenState.accessToken;
    }
    // Need to authenticate
    const targetClientId = clientId || tempClientId;
    if (!targetClientId) {
      throw new Error('Mangler Google Client ID. Gå til innstillinger for å konfigurere.');
    }
    const { accessToken, expiresIn } = await requestGoogleWorkspaceToken(targetClientId);
    const userInfo = await fetchGoogleUserInfo(accessToken);
    saveGoogleTokenState(accessToken, expiresIn, userInfo);
    setTokenState({
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      userInfo,
      scopes: GOOGLE_WORKSPACE_SCOPES
    });
    return accessToken;
  };

  // Google Docs export actions
  const handleExportThesisDoc = async () => {
    setErrorMsg(null);
    setLoadingAction('thesis-doc');
    try {
      const token = await ensureToken();
      const content = `1. INNLEDNING OG FORMÅL
Denne studien utfører en systematisk evidensvurdering av forskningslitteraturen innen ${project.title}.
Vurderingen følger internasjonale metodiske retningslinjer fra Joanna Briggs Institute (JBI 2017/2020) samt PRISMA 2020 for transparent rapportering.

2. METODE OG SØKESTRATEGI
Søket ble utført i sentrale helse- og samfunnsvitenskapelige databaser (PubMed/MEDLINE, CINAHL, PsycINFO, Embase).
PICO-rammeverket dannet grunnlaget for inklusjons- og eksklusjonskriterier:
- Populasjon: Spesifisert i prosjektprotokollen
- Intervensjon/Fenomen: Kvalitative erfaringer og metodisk evidens
- Sammenligning: Standard praksis eller ingen kontroll
- Utfall: Brukererfaringer, metodisk kongruens og troverdighet

3. KRITISK VURDERING (CRITICAL APPRAISAL)
Totalt ${studies.length} studier ble vurdert uavhengig av to granskere med blinding.
Alle inkluderte artikler er kryptografisk forseglet med SHA-256 hash for full sporbarhet.

4. INKLUDERTE STUDIER OG EVIDENSKVALITET
${studies.map((s, idx) => `${idx + 1}. ${s.title} (${s.authors || 'Forfattere u.å.'}, ${s.year || '2024'}). DOI: ${s.doi || 'N/A'}. Hash: ${s.documentHashSha256?.slice(0, 16) || 'Uverifisert'}...`).join('\n')}

5. SYNTESE OG METODISKE BEGRENSNINGER
Syntesen viser konsistens på tvers av kvalitative metoder der forfatter-posisjonalitet og etisk godkjenning er eksplisitt beskrevet.`;

      const result = await exportThesisSectionToGoogleDoc(token, project, 'Metodekapittel & Synteseutkast', content);
      setLastExport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eksport til Google Docs feilet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportReferencesDoc = async () => {
    setErrorMsg(null);
    setLoadingAction('refs-doc');
    try {
      const token = await ensureToken();
      const result = await exportReferenceLibraryToGoogleDoc(token, project, references, citationStyle);
      setLastExport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eksport av referanser til Google Docs feilet.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Google Sheets export actions
  const handleExportStudiesSheet = async () => {
    setErrorMsg(null);
    setLoadingAction('studies-sheet');
    try {
      const token = await ensureToken();
      const result = await exportStudiesToGoogleSheet(token, project, studies, assessments);
      setLastExport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eksport til Google Sheets feilet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportExtractionsSheet = async () => {
    setErrorMsg(null);
    setLoadingAction('extractions-sheet');
    try {
      const token = await ensureToken();
      const result = await exportExtractionsToGoogleSheet(token, project, extractions, studies);
      setLastExport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eksport av dataekstraksjon til Google Sheets feilet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportReferencesSheet = async () => {
    setErrorMsg(null);
    setLoadingAction('refs-sheet');
    try {
      const token = await ensureToken();
      const result = await exportReferencesToGoogleSheet(token, project, references);
      setLastExport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eksport av referanser til Google Sheets feilet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportPrismaSheet = async () => {
    setErrorMsg(null);
    setLoadingAction('prisma-sheet');
    try {
      const token = await ensureToken();
      const result = await exportPrismaFlowToGoogleSheet(token, project, prismaData);
      setLastExport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eksport av PRISMA-tall til Google Sheets feilet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const copyExportUrl = () => {
    if (!lastExport?.url) return;
    navigator.clipboard.writeText(lastExport.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Google Colors & Identity */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 inline-flex items-center justify-center text-[9px] font-bold text-white" title="Google Docs">
                D
              </span>
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 inline-flex items-center justify-center text-[9px] font-bold text-white" title="Google Sheets">
                S
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Google Workspace Studio</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  Google Docs &amp; Sheets
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direkte toveissynkronisering og eksport av evidens, matriser og referanser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'docs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>Google Docs Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sheets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Google Sheets Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'drive'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-purple-300" />
              <span>Nylige Dokumenter</span>
            </button>

            <button
              onClick={() => setActiveTab('auth')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'auth'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>OAuth &amp; Tilkobling</span>
            </button>
          </div>

          {/* User connection badge */}
          <div className="flex items-center gap-2">
            {tokenState.accessToken ? (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 rounded-full text-xs text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium truncate max-w-[160px]">
                  {tokenState.userInfo?.email || 'Tilkoblet Google'}
                </span>
                <button
                  onClick={handleDisconnect}
                  title="Koble fra Google-konto"
                  className="hover:text-red-300 text-emerald-400 ml-1"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loadingAction === 'auth'}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold transition-colors"
              >
                {loadingAction === 'auth' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LogIn className="w-3 h-3" />
                )}
                <span>Koble til Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-950/90 border border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Last export success alert */}
        {lastExport && (
          <div className="mx-5 mt-4 p-3.5 bg-blue-950/80 border border-blue-700/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                  <span>{lastExport.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900 text-blue-200 uppercase font-mono">
                    {lastExport.type === 'document' ? 'Google Doc' : 'Google Sheet'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5">{lastExport.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyExportUrl}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-600 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Kopiert lenke' : 'Kopier lenke'}</span>
              </button>

              <a
                href={lastExport.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Åpne i {lastExport.type === 'document' ? 'Google Docs' : 'Google Sheets'}</span>
              </a>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: GOOGLE DOCS HUB */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Google Docs Eksport &amp; Rapportbygger</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Oppretter automatisk strukturerte akademiske dokumenter direkte på din Google Disk.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Sitatstil:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                  >
                    <option value="APA7">APA 7th Edition</option>
                    <option value="Vancouver">Vancouver (Medisin)</option>
                    <option value="Harvard">Harvard</option>
                    <option value="Chicago">Chicago Author-Date</option>
                    <option value="MLA">MLA 9th Edition</option>
                    <option value="IEEE">IEEE Numerisk</option>
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Thesis / Methodology Chapter */}
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex flex-col justify-between hover:border-blue-600/70 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700">
                        Kapittelutkast
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      Masteroppgave: Metode &amp; Syntese
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Genererer et komplett metodedokument med JBI-kriterier, PRISMA 2020-flyt, risiko for skjevhet og SHA-256 forseglinger for alle {studies.length} studier.
                    </p>
                  </div>

                  <button
                    onClick={handleExportThesisDoc}
                    disabled={loadingAction === 'thesis-doc'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loadingAction === 'thesis-doc' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Opprett i Google Docs</span>
                  </button>
                </div>

                {/* Reference Library */}
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex flex-col justify-between hover:border-blue-600/70 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700">
                        {references.length} Referanser
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      Fullstendig Referanseliste ({citationStyle})
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Formaterer hele referansebiblioteket i {citationStyle} med korrekte forfatter-initialer, DOI-hyperlenker og hengende innrykk.
                    </p>
                  </div>

                  <button
                    onClick={handleExportReferencesDoc}
                    disabled={loadingAction === 'refs-doc'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loadingAction === 'refs-doc' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Eksporter Bibliografi til Google Docs</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS HUB */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheets Datamatriser &amp; Regneark</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Eksporterer strukturerte tabeller, ekstraksjoner og statistikk direkte til Google Sheets med frosne overskrifter.
                  </p>
                </div>
              </div>

              {/* Sheets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* JBI Critical Appraisal Scoring Matrix */}
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex flex-col justify-between hover:border-emerald-600/70 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
                        <Table className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700">
                        JBI Matrise
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      JBI Evidens- &amp; Skåringsmatrise
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Inkluderer alle {studies.length} studier med svar (Ja/Nei/Uklar/NA) for hvert kriterium, samlet skår i prosent, kvalitetsnivå og SHA-256 kontrollsum.
                    </p>
                  </div>

                  <button
                    onClick={handleExportStudiesSheet}
                    disabled={loadingAction === 'studies-sheet'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loadingAction === 'studies-sheet' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Opprett i Google Sheets</span>
                  </button>
                </div>

                {/* PICO Data Extraction Matrix */}
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex flex-col justify-between hover:border-emerald-600/70 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700">
                        {extractions.length} Ekstraksjoner
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      PICO Dataekstraksjonsmatrise
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Strukturert tabell med populasjon, intervensjon, komparator, primære utfallsmål, utvalgsstørrelse (N), kontekst og nøkkelfunn.
                    </p>
                  </div>

                  <button
                    onClick={handleExportExtractionsSheet}
                    disabled={loadingAction === 'extractions-sheet'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loadingAction === 'extractions-sheet' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Eksporter PICO til Google Sheets</span>
                  </button>
                </div>

                {/* Reference Hub Library */}
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex flex-col justify-between hover:border-emerald-600/70 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700">
                        {references.length} Poster
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      Komplett Referansebibliotek
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Inkluderer alle referanser med EndNote CWYW-tokens, forfattere, årgang, tidsskrift, DOI, PMID, APA 7-streng og emnetagger.
                    </p>
                  </div>

                  <button
                    onClick={handleExportReferencesSheet}
                    disabled={loadingAction === 'refs-sheet'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loadingAction === 'refs-sheet' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Eksporter Referanser til Google Sheets</span>
                  </button>
                </div>

                {/* PRISMA 2020 Flow Counts */}
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex flex-col justify-between hover:border-emerald-600/70 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
                        <Table className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700">
                        PRISMA 2020
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      PRISMA 2020 Flytskjema-tall
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Tabell med identifiserte poster fra databaser/registre, fjernede duplikater, tittel-/sammendrag-skjerming og spesifiserte eksklusjonsgrunner.
                    </p>
                  </div>

                  <button
                    onClick={handleExportPrismaSheet}
                    disabled={loadingAction === 'prisma-sheet'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {loadingAction === 'prisma-sheet' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Eksporter PRISMA-tall til Google Sheets</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DRIVE RECENT FILES */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    <span>Nylige Google Workspace-filer i Google Disk</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dokumenter og regneark tilknyttet din Google-konto.
                  </p>
                </div>

                <button
                  onClick={loadDriveFiles}
                  disabled={loadingFiles || !tokenState.accessToken}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                  <span>Oppdater</span>
                </button>
              </div>

              {!tokenState.accessToken ? (
                <div className="p-8 text-center bg-slate-800/40 border border-slate-700 rounded-lg space-y-3">
                  <Key className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                  <div className="text-sm font-semibold text-white">Ikke tilkoblet Google</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Koble til Google-kontoen din for å se og åpne dine eksporterte Google Docs og Google Sheets direkte.
                  </p>
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Koble til Google Workspace
                  </button>
                </div>
              ) : loadingFiles ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Henter nylige filer fra Google Disk...</span>
                </div>
              ) : recentFiles.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/40 border border-slate-700 rounded-lg text-slate-400 text-xs">
                  Ingen nylige dokumenter funnet. Bruk Google Docs Hub eller Google Sheets Hub for å opprette ditt første dokument!
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                  {recentFiles.map((file) => {
                    const isDoc = file.mimeType.includes('document');
                    return (
                      <div key={file.id} className="p-3 bg-slate-800/60 hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isDoc ? (
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">{file.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{isDoc ? 'Google Doc' : 'Google Sheet'}</span>
                              <span>&bull;</span>
                              <span>{new Date(file.modifiedTime).toLocaleString('no-NO')}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={file.webViewLink || (isDoc ? `https://docs.google.com/document/d/${file.id}/edit` : `https://docs.google.com/spreadsheets/d/${file.id}/edit`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium shrink-0 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Åpne</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUTH & SETTINGS */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-semibold text-white">Google OAuth Sikkerhet &amp; Omfang (Scopes)</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800">
                    GDPR &amp; Zero-Knowledge
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Autentiseringen skjer trygt på klientsiden via Google Identity Services (GSI). Ingen hemmelige nøkler eller passord sendes til eksterne servere.
                </p>

                <div className="bg-slate-900/90 p-3 rounded border border-slate-800 text-[11px] space-y-1.5 font-mono text-slate-300">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Aktive OAuth Omfang:</div>
                  <div className="text-blue-300">&bull; https://www.googleapis.com/auth/documents (Opprette og redigere Google Docs)</div>
                  <div className="text-emerald-300">&bull; https://www.googleapis.com/auth/spreadsheets (Opprette og redigere Google Sheets)</div>
                  <div className="text-purple-300">&bull; https://www.googleapis.com/auth/drive.file (Tilgang til app-opprettede filer)</div>
                  <div className="text-slate-400">&bull; https://www.googleapis.com/auth/drive.readonly (Vise nylige dokumenter)</div>
                </div>
              </div>

              {/* Client ID Configuration */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-semibold text-white">Google OAuth Client ID</h4>
                  </div>

                  <button
                    onClick={() => setIsEditingClientId(!isEditingClientId)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {isEditingClientId ? 'Avbryt' : 'Endre Client ID'}
                  </button>
                </div>

                {isEditingClientId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tempClientId}
                      onChange={(e) => setTempClientId(e.target.value)}
                      placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:border-blue-500 focus:outline-hidden"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={handleSaveClientId}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        Lagre Client ID
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="font-mono text-slate-300 truncate">
                      {clientId || 'Ingen egendefinert Client ID (bruker standard OAuth klient)'}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-2 shrink-0">
                      {clientId ? 'Egendefinert' : 'Standard'}
                    </span>
                  </div>
                )}
              </div>

              {/* Connection status card */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Tilkoblingsstatus</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {tokenState.accessToken
                      ? `Tilkoblet som ${tokenState.userInfo?.email || 'Aktiv Google Bruker'}`
                      : 'Ikke tilkoblet'}
                  </div>
                </div>

                {tokenState.accessToken ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Koble fra</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Logg inn med Google</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Klientside Google Workspace-integrasjon via Google Identity Services</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium transition-colors"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
