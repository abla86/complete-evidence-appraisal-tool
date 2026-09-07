import DOMPurify from 'dompurify';
import React, { useState, useEffect, useMemo } from 'react';
import { ArticleAppraisal } from '../types';
import { 
  Apa7CitationService, 
  Apa7FormattedResult, 
  DoiLookupResult,
  CitationStyleId,
  SUPPORTED_CITATION_STYLES,
  BatchBibliographyResult
} from '../services/apa7CitationService';
import { generateAuditId } from '../services/idGenerator';
import { useToast } from './Toast';
import { 
  Quote, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Globe, 
  Layers, 
  Info,
  ArrowRightLeft,
  Download,
  ListOrdered,
  FileCheck2,
  Share2
} from 'lucide-react';

interface Apa7CitationStudioProps {
  article: ArticleAppraisal;
  allArticles?: ArticleAppraisal[];
  onUpdateArticle?: (updatedArticle: ArticleAppraisal) => void;
  isLocked?: boolean;
}

export const Apa7CitationStudio: React.FC<Apa7CitationStudioProps> = ({
  article,
  allArticles = [],
  onUpdateArticle,
  isLocked = false
}) => {
  const { showToast } = useToast();
  const [selectedStyle, setSelectedStyle] = useState<CitationStyleId>('apa7');
  const [language, setLanguage] = useState<'nb' | 'en'>('nb');
  const [doiInput, setDoiInput] = useState<string>(article.doi || '');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<DoiLookupResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [quotePage, setQuotePage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'intext' | 'lookup' | 'batch' | 'bibtex'>('preview');
  
  // Batch Bibliography state
  const [batchSortOrder, setBatchSortOrder] = useState<'author' | 'year' | 'order'>('author');

  // Compute live multi-style citations from current article props if no override lookup is active
  const liveFormatted: Apa7FormattedResult = useMemo(() => {
    if (lookupResult && lookupResult.success) {
      return lookupResult.formatted;
    }

    return Apa7CitationService.formatApa7({
      title: article.title,
      authors: article.authors,
      year: article.year,
      journal: article.journal,
      volume: article.volumeIssue?.split('(')[0]?.trim(),
      issue: article.volumeIssue?.match(/\((.*?)\)/)?.[1],
      pages: article.pages,
      doi: article.doi,
      url: article.sourceUrl
    }, language);
  }, [article, language, lookupResult]);

  // Current active style output
  const currentStyleOutput = useMemo(() => {
    return liveFormatted.styles[selectedStyle] || liveFormatted.styles.apa7;
  }, [liveFormatted, selectedStyle]);

  // Batch bibliography across all articles in workspace
  const batchBibliography: BatchBibliographyResult = useMemo(() => {
    const listToFormat = allArticles && allArticles.length > 0 ? allArticles : [article];
    return Apa7CitationService.generateBatchBibliography(
      listToFormat,
      selectedStyle,
      batchSortOrder,
      language
    );
  }, [allArticles, article, selectedStyle, batchSortOrder, language]);

  // Keep input in sync if article changes
  useEffect(() => {
    setDoiInput(article.doi || '');
    setLookupResult(null);
  }, [article.id, article.doi]);

  const handleCopyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} kopiert til utklippstavlen!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyRichText = async (html: string, plainText: string, key: string, label: string) => {
    const success = await Apa7CitationService.copyRichTextToClipboard(html, plainText);
    setCopiedKey(key);
    if (success) {
      showToast(`${label} kopiert som rik tekst (med kursiv for Word/Docs)!`, 'success');
    } else {
      showToast(`${label} kopiert som tekst!`, 'success');
    }
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Filen "${filename}" ble lastet ned!`, 'success');
  };

  const handleLookupDoi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = Apa7CitationService.cleanDoi(doiInput);
    if (!clean) {
      showToast('Vennligst oppgi en gyldig DOI (f.eks. 10.1111/jan.12345)', 'warning');
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await Apa7CitationService.lookupDoi(clean, language);
      setLookupResult(res);
      if (res.success) {
        showToast(`Metadata hentet og formatert etter ${SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.name || 'APA 7'} via ${res.source}!`, 'success');
      } else {
        showToast(res.errorMessage || 'Fant ikke DOI i internasjonale registre.', 'warning');
      }
    } catch (err: unknown) {
      showToast(`DOI-oppslag feilet: ${err.message || 'Nettverksfeil'}`, 'error');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleApplyMetadataToArticle = () => {
    if (!lookupResult || !lookupResult.success || !onUpdateArticle) return;

    const parsed = lookupResult.formatted.parsedMetadata;
    const authorStr = Apa7CitationService.formatApa7AuthorList(parsed.authors, language);

    const updated: ArticleAppraisal = {
      ...article,
      title: parsed.title || article.title,
      authors: authorStr || article.authors,
      journal: parsed.journal || article.journal,
      year: parseInt(parsed.year, 10) || article.year,
      doi: parsed.doi || article.doi,
      doiUrl: parsed.doiUrl || article.doiUrl,
      volumeIssue: parsed.volume ? (parsed.issue ? `${parsed.volume}(${parsed.issue})` : parsed.volume) : article.volumeIssue,
      pages: parsed.pages || article.pages,
      apaReference: lookupResult.formatted.plainText,
      shortCitation: lookupResult.formatted.shortCitation,
      auditTrail: [
        ...(article.auditTrail || []),
        {
          id: generateAuditId('audit'),
          studyId: article.id,
          reviewer: article.reviewerName || 'Forsker',
          instrumentId: article.instrumentId || 'UNKNOWN',
          version: article.instrumentVersion || 'UNKNOWN',
          itemId: 0,
          itemTitle: 'Akademisk Siteringsmotor & DOI Metadata Synk',
          previousAnswer: article.apaReference || '',
          newAnswer: lookupResult.formatted.plainText,
          previousRationale: `Forrige DOI: ${article.doi || 'Ingen'}`,
          newRationale: `Metadata synkronisert og standardisert mot ${lookupResult.source} (${SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.name || 'APA 7'})`,
          changedBy: article.reviewerName || 'Forsker',
          timestamp: new Date().toISOString(),
          comment: `Oppdatert fra offisielt DOI-oppslag: ${parsed.doi}`
        }
      ]
    };

    onUpdateArticle(updated);
    showToast('Artikkelens metadata og referanse er oppdatert og lagret!', 'success');
  };

  // Academic Search URLs
  const cleanDoiVal = Apa7CitationService.cleanDoi(article.doi);
  const encodedTitle = encodeURIComponent(article.title || '');
  const googleScholarUrl = `https://scholar.google.com/scholar?q=${encodedTitle}`;
  const pubMedSearchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedTitle}`;
  const europePmcUrl = cleanDoiVal ? `https://europepmc.org/article/MED/${cleanDoiVal}` : `https://europepmc.org/search?query=${encodedTitle}`;
  const semanticScholarUrl = `https://www.semanticscholar.org/search?q=${encodedTitle}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold font-serif text-slate-900">
                Akademisk Siteringshub & Referansemotor
              </h3>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200 rounded-md">
                {SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.shortName || 'APA 7'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              APA 7, Vancouver, Harvard, Chicago, MLA 9, IEEE, BibTeX & RIS med live DOI-synk og rik-tekst eksport for Word.
            </p>
          </div>
        </div>

        {/* Style Selector & Language Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Style dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Stil:</span>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as CitationStyleId)}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-teal-700 outline-none cursor-pointer"
            >
              {SUPPORTED_CITATION_STYLES.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name} ({style.shortName})
                </option>
              ))}
            </select>
          </div>

          {/* Language selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setLanguage('nb')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                language === 'nb' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
              title="Norske siteringskonvensjoner (og, s., bind)"
            >
              <Globe className="w-3 h-3 text-teal-700" />
              <span>Norsk</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                language === 'en' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
              title="English citation standards (&, and, p., vol.)"
            >
              <span>English</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'preview'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Litteraturliste-visning</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('intext')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'intext'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>I-tekst siteringer (Parentes, Narrativ & Side)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'batch'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Hele prosjektets referanseliste ({allArticles.length || 1})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lookup')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'lookup'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Live DOI-oppslag & Synk</span>
          {lookupResult?.success && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bibtex')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'bibtex'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>BibTeX & RIS</span>
        </button>
      </div>

      {/* Tab 1: Full Reference Card for Selected Style */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="relative bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[11px] text-teal-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.name}
              </span>
              <div className="flex items-center gap-2">
                {article.doi && (
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    DOI: {cleanDoiVal || article.doi}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.discipline}
                </span>
              </div>
            </div>

            {/* Academic Hanging Indent Reference */}
            <div 
              className="pl-8 -indent-8 text-sm sm:text-base font-serif text-slate-900 leading-relaxed break-words bg-white p-4 rounded-xl border border-slate-200 shadow-2xs"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentStyleOutput.htmlFormatted) }}
            />

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {selectedStyle === 'apa7' && 'APA 7: Kursiv tidsskrift & volum, sentence-case tittel, aktiv https://doi.org-lenke.'}
                  {selectedStyle === 'vancouver' && 'Vancouver (ICMJE): Numerisk sekvens, NLM tidsskriftnavn, direkte sidetallsspenn.'}
                  {selectedStyle === 'harvard' && 'Harvard: Forfatter-Ã¥r med enkle anfÃ¸rselstegn for tittel og "Available at:".'}
                  {selectedStyle === 'chicago-author-date' && 'Chicago Author-Date: Doble anfÃ¸rselstegn for tittel, Title Case og Ã¥rstall etter forfatter.'}
                  {selectedStyle === 'chicago-notes' && 'Chicago Notes & Bib: Fullstendig fotnoteoppsett for humaniora og etikk.'}
                  {selectedStyle === 'mla9' && 'MLA 9th: Med vol., no., pp. deskriptorer og Works Cited standard.'}
                  {selectedStyle === 'ieee' && 'IEEE: Hakeparentes [1] med forfatterinitialer fÃ¸rst for teknologiske/medisinske artikler.'}
                  {(selectedStyle === 'bibtex' || selectedStyle === 'ris') && 'Maskinlesbart dataformat klart for referansehÃ¥ndterer.'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Click Rich Text Copy for MS Word */}
                <button
                  type="button"
                  onClick={() => handleCopyRichText(currentStyleOutput.htmlFormatted, currentStyleOutput.plainText, 'word-rich', 'Formatert referanse')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Kopierer rik tekst slik at kursiv pÃ¥ tidsskrift og volum bevares nÃ¥r du limer inn i Microsoft Word eller Google Docs"
                >
                  {copiedKey === 'word-rich' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Sparkles className="w-3.5 h-3.5 text-teal-700" />}
                  <span>Kopier til Word (med kursiv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(currentStyleOutput.plainText, 'full-plain', 'Ren tekst')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedKey === 'full-plain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Ren tekst</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(currentStyleOutput.markdownFormatted, 'full-md', 'Markdown')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedKey === 'full-md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Markdown (*kursiv*)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Academic Portal Quick Links */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
                Ã…pne artikkelen direkte i vitenskapelige registre:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {cleanDoiVal && (
                <a
                  href={`https://doi.org/${cleanDoiVal}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-teal-200 text-teal-900 font-semibold rounded-lg hover:bg-teal-50 shadow-2xs"
                >
                  <span>DOI.org Resolver</span>
                  <ExternalLink className="w-3 h-3 text-teal-700" />
                </a>
              )}
              <a
                href={googleScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <span>Google Scholar</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href={pubMedSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <span>PubMed / NCBI</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href={europePmcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <span>Europe PMC</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href={semanticScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <span>Semantic Scholar</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: In-Text Citations */}
      {activeTab === 'intext' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parenthetical citation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Parentetisk sitering (I parentes)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentStyleOutput.inTextParenthetical, 'intext-par', 'Parentetisk sitat')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-900 bg-white border border-slate-200 rounded-lg hover:bg-teal-50 cursor-pointer"
                >
                  {copiedKey === 'intext-par' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-teal-700" />}
                  <span>Kopier</span>
                </button>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 font-serif text-sm font-semibold text-slate-900">
                {currentStyleOutput.inTextParenthetical}
              </div>
              <p className="text-[11px] text-slate-500">
                Brukes pÃ¥ slutten av en setning: Â«...som dokumentert i nyere litteratur {currentStyleOutput.inTextParenthetical}.Â»
              </p>
            </div>

            {/* Narrative citation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Narrativ sitering (I lÃ¸pende tekst)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentStyleOutput.inTextNarrative, 'intext-nar', 'Narrativt sitat')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-900 bg-white border border-slate-200 rounded-lg hover:bg-teal-50 cursor-pointer"
                >
                  {copiedKey === 'intext-nar' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-teal-700" />}
                  <span>Kopier</span>
                </button>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 font-serif text-sm font-semibold text-slate-900">
                {currentStyleOutput.inTextNarrative}
              </div>
              <p className="text-[11px] text-slate-500">
                Brukes nÃ¥r forfatteren inngÃ¥r i setningen: Â«IfÃ¸lge {currentStyleOutput.inTextNarrative} viser funnene...Â»
              </p>
            </div>
          </div>

          {/* Direct Quote with Page Locator */}
          <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-amber-700" />
                  Direkte sitat med sidetall / avsnitt (Page & Paragraph Locator)
                </span>
                <p className="text-xs text-amber-800">
                  Akademiske retningslinjer krever eksplisitt sidetall (f.eks. s. 14 / p. 14) ved direkte ordrette sitater eller tabellreferanser.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="quote-page-input" className="text-xs font-semibold text-slate-700 shrink-0">
                  Sidetall:
                </label>
                <input
                  id="quote-page-input"
                  type="text"
                  value={quotePage}
                  onChange={(e) => setQuotePage(e.target.value)}
                  placeholder="f.eks. 14 eller 14â€“16"
                  className="w-36 text-xs p-1.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs flex items-center justify-between gap-2">
                <span className="font-serif font-semibold text-slate-900">
                  {currentStyleOutput.inTextWithPage(quotePage || '14')}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentStyleOutput.inTextWithPage(quotePage || '14'), 'quote-par', 'Sitat med sidetall')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 cursor-pointer"
                >
                  {copiedKey === 'quote-par' ? 'Kopiert!' : 'Kopier'}
                </button>
              </div>

              <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs flex items-center justify-between gap-2">
                <span className="font-serif font-semibold text-slate-900">
                  {liveFormatted.narrativeWithPage(quotePage || '14')}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(liveFormatted.narrativeWithPage(quotePage || '14'), 'quote-nar', 'Narrativ med side')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 cursor-pointer"
                >
                  {copiedKey === 'quote-nar' ? 'Kopiert!' : 'Kopier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Batch Bibliography for All Articles in Project */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-teal-700" />
                  Komplett Litteraturliste for prosjektet ({batchBibliography.count} artikler)
                </span>
                <p className="text-xs text-slate-500">
                  Ferdig formatert iht. {SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.name}. Klar for masteroppgave, review eller publisering.
                </p>
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-slate-500">Sortering:</span>
                <div className="inline-flex rounded-lg bg-white border border-slate-300 p-0.5">
                  <button
                    type="button"
                    onClick={() => setBatchSortOrder('author')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      batchSortOrder === 'author' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Forfatter (Aâ€“Ã…)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchSortOrder('year')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      batchSortOrder === 'year' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ã…rstall
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchSortOrder('order')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      batchSortOrder === 'order' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    RekkefÃ¸lge
                  </button>
                </div>
              </div>
            </div>

            {/* Rendered Batch List */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 max-h-80 overflow-y-auto space-y-3 font-serif text-xs sm:text-sm text-slate-900">
              {batchBibliography.items.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className="pl-6 -indent-6 leading-relaxed border-b border-slate-100 last:border-0 pb-2"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.citation.htmlFormatted) }}
                />
              ))}
            </div>

            {/* Batch Export Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{batchBibliography.count} referanser verifisert mot {SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.shortName}.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyRichText(batchBibliography.htmlFormatted, batchBibliography.plainText, 'batch-word', 'Komplett litteraturliste')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {copiedKey === 'batch-word' ? <Check className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5 text-teal-300" />}
                  <span>Kopier alle til Word (med kursiv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadFile(batchBibliography.plainText, `Litteraturliste_${selectedStyle}.txt`, 'text/plain;charset=utf-8')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last ned .txt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadFile(batchBibliography.risBlock, `Prosjekt_Referanser.ris`, 'application/x-research-info-systems;charset=utf-8')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last ned .ris (EndNote/Zotero)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadFile(batchBibliography.bibtexBlock, `Prosjekt_Referanser.bib`, 'application/x-bibtex;charset=utf-8')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last ned .bib (BibTeX)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live DOI Lookup & Sync */}
      {activeTab === 'lookup' && (
        <div className="space-y-4">
          <form onSubmit={handleLookupDoi} className="space-y-3">
            <div>
              <label htmlFor="doi-lookup-field" className="block text-xs font-bold text-slate-700 mb-1">
                Oppgi DOI eller DOI-lenke for automatisk oppslag og validering:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="doi-lookup-field"
                    type="text"
                    value={doiInput}
                    onChange={(e) => setDoiInput(e.target.value)}
                    placeholder="f.eks. 10.1111/jan.12345 eller https://doi.org/10.1016/j.ijnurstu.2023.104521"
                    className="w-full text-xs font-mono p-2.5 pl-8 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-700"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp || !doiInput.trim()}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 disabled:opacity-50 rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isLookingUp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SlÃ¥r opp...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>SlÃ¥ opp DOI & Generer Referanser</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Lookup Result Box */}
          {lookupResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-3 ${
              lookupResult.success ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lookupResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-bold text-slate-900">
                    {lookupResult.success ? `Vellykket oppslag fra ${lookupResult.source}` : 'Oppslag feilet'}
                  </span>
                </div>
                {lookupResult.formatted.doiUrl && (
                  <a
                    href={lookupResult.formatted.doiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-800 font-semibold underline"
                  >
                    <span>Ã…pne pÃ¥ DOI.org</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {lookupResult.success ? (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Generert Referanse ({SUPPORTED_CITATION_STYLES.find(s => s.id === selectedStyle)?.name}):
                    </span>
                    <div 
                      className="pl-6 -indent-6 font-serif text-slate-900 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: (lookupResult.formatted.styles[selectedStyle] || lookupResult.formatted.styles.apa7).htmlFormatted }}
                    />
                  </div>

                  {/* Metadata comparison table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-slate-400 block font-medium">Hentet Tittel:</span>
                      <span className="font-semibold text-slate-800">{lookupResult.formatted.parsedMetadata.title}</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-slate-400 block font-medium">Tidsskrift & Volum:</span>
                      <span className="font-semibold text-slate-800">
                        {lookupResult.formatted.parsedMetadata.journal} {lookupResult.formatted.parsedMetadata.volume ? `vol. ${lookupResult.formatted.parsedMetadata.volume}` : ''} ({lookupResult.formatted.parsedMetadata.year})
                      </span>
                    </div>
                  </div>

                  {/* Sync Action */}
                  {onUpdateArticle && !isLocked && (
                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-emerald-200/60">
                      <p className="text-slate-600 text-[11px]">
                        Vil du oppdatere artikkelens lagrede tittel, forfattere, tidsskrift og referanse med disse dataene?
                      </p>
                      <button
                        type="button"
                        onClick={handleApplyMetadataToArticle}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Oppdater artikkel & lagre</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-rose-800">
                  {lookupResult.errorMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: BibTeX & RIS */}
      {activeTab === 'bibtex' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BibTeX */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  BibTeX Format (.bib)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyText(liveFormatted.bibtex, 'bibtex', 'BibTeX')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedKey === 'bibtex' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>Kopier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(liveFormatted.bibtex, `${(article.shortCitation || 'artikkel').replace(/\s+/g, '_')}.bib`, 'application/x-bibtex;charset=utf-8')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>.bib</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-900 text-teal-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-56">
                {liveFormatted.bibtex}
              </pre>
            </div>

            {/* RIS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  RIS Format (EndNote / Zotero / Mendeley)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyText(liveFormatted.ris, 'ris', 'RIS')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedKey === 'ris' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>Kopier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(liveFormatted.ris, `${(article.shortCitation || 'artikkel').replace(/\s+/g, '_')}.ris`, 'application/x-research-info-systems;charset=utf-8')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>.ris</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-900 text-teal-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-56">
                {liveFormatted.ris}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


