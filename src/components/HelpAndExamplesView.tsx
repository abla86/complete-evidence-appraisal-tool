import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Layers, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Download, 
  Quote, 
  MapPin, 
  ChevronRight, 
  GraduationCap, 
  Check, 
  Info, 
  PlusCircle, 
  Eye, 
  Award, 
  BrainCircuit, 
  Users, 
  Calendar, 
  ListOrdered,
  FileCheck
} from 'lucide-react';
import { METHODOLOGY_EXAMPLE_LIBRARY, MethodologyExampleStudy, ExampleEvaluationCriterion } from '../data/methodologyExampleLibrary';
import { ArticleAppraisal } from '../types';
import { generateArticleId, generateAuditId } from '../services/idGenerator';
import { useToast } from './Toast';

interface HelpAndExamplesViewProps {
  onLoadExampleToWorkspace?: (article: ArticleAppraisal) => void;
  onGoToEvaluation?: (article: ArticleAppraisal) => void;
}

export const HelpAndExamplesView: React.FC<HelpAndExamplesViewProps> = ({
  onLoadExampleToWorkspace,
  onGoToEvaluation
}) => {
  const { showToast } = useToast();

  const [selectedExampleId, setSelectedExampleId] = useState<string>(METHODOLOGY_EXAMPLE_LIBRARY[0].id);
  const [selectedCriterionId, setSelectedCriterionId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeHelpTab, setActiveHelpTab] = useState<'examples' | 'guidance' | 'faq'>('examples');

  const currentExample: MethodologyExampleStudy = useMemo(() => {
    return METHODOLOGY_EXAMPLE_LIBRARY.find(ex => ex.id === selectedExampleId) || METHODOLOGY_EXAMPLE_LIBRARY[0];
  }, [selectedExampleId]);

  const filteredExamples = useMemo(() => {
    if (!searchQuery.trim()) return METHODOLOGY_EXAMPLE_LIBRARY;
    const q = searchQuery.toLowerCase();
    return METHODOLOGY_EXAMPLE_LIBRARY.filter(ex => 
      ex.methodologyTitle.toLowerCase().includes(q) ||
      ex.instrumentName.toLowerCase().includes(q) ||
      ex.article.title.toLowerCase().includes(q) ||
      ex.article.authors.toLowerCase().includes(q) ||
      ex.findingsSummary.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCopyExampleMarkdown = () => {
    let md = `# Metodisk Eksempel & Begrunnelse: ${currentExample.article.shortCitation}\n\n`;
    md += `**Metodologi:** ${currentExample.methodologyTitle} | **Instrument:** ${currentExample.instrumentName}\n`;
    md += `**Tittel:** ${currentExample.article.title}\n`;
    md += `**Forfattere:** ${currentExample.article.authors} (${currentExample.article.year})\n`;
    md += `**Kilde:** ${currentExample.article.journal} | DOI: ${currentExample.article.doi}\n\n`;
    md += `### Forklaring av funnene i artikkelen\n${currentExample.findingsSummary}\n\n`;
    md += `### Samlet Vurderingsresultat: ${currentExample.overallVerdict}\n${currentExample.overallVerdictNote}\n\n`;
    md += `### Hva som sier at artikkelen er vurdert som den er (Kriterier & Sidetall)\n\n`;
    md += `| Kriterium | Vurdering & Sidetall | Faglig begrunnelse (Rationale) | Evidenssitat fra teksten |\n`;
    md += `|---|---|---|---|\n`;

    currentExample.criteria.forEach(c => {
      const qTitle = c.criterionTitle.replace(/\|/g, '\\|');
      const st = `${c.status} ${c.pageComment}`;
      const why = c.whyAssessedAsSuch.replace(/\|/g, '\\|');
      const ev = `Â«${c.evidenceQuote}Â»`.replace(/\|/g, '\\|');
      md += `| **${qTitle}** | **${st}** | ${why} | ${ev} |\n`;
    });

    navigator.clipboard.writeText(md);
    showToast(`Eksempel for ${currentExample.article.shortCitation} kopiert som Markdown!`, 'success');
  };

  const handleImportToWorkspace = () => {
    const newArticleId = generateArticleId('art');
    const newArticle: ArticleAppraisal = {
      id: newArticleId,
      instrumentId: currentExample.instrumentId,
      instrumentVersion: '2017/2024',
      lifecycleStatus: 'FINALIZED',
      whoValidationStatus: 'INTERNALLY_COMPLIANCE_CHECKED',
      parsingStatus: 'PARSED_COMPLETE',
      authors: currentExample.article.authors,
      shortCitation: currentExample.article.shortCitation,
      year: currentExample.article.year,
      title: currentExample.article.title,
      journal: currentExample.article.journal,
      volumeIssue: currentExample.article.volumeIssue || '',
      doi: currentExample.article.doi,
      doiUrl: `https://doi.org/${currentExample.article.doi}`,
      sourceUrl: '',
      sourceName: currentExample.instrumentStandard,
      studyContext: currentExample.article.populationAndSetting,
      design: currentExample.article.studyDesign,
      dataCollection: currentExample.article.dataCollection,
      participants: currentExample.article.populationAndSetting,
      analyticMethod: currentExample.article.analyticMethod,
      reviewerName: 'Metodisk Veileder (Gullstandard Eksempel)',
      reviewerRole: 'Akademisk Veileder',
      assessmentDate: new Date().toISOString().split('T')[0],
      projectName: 'Eksempelbibliotek & Metodisk veiledning',
      summaryScore: {
        ja: currentExample.criteria.filter(c => c.status === 'Ja' || c.status === 'Lav risiko' || c.status === 'Tilfredsstilt').length,
        uklart: currentExample.criteria.filter(c => c.status === 'Uklart' || c.status === 'Noe bekymring').length,
        nei: currentExample.criteria.filter(c => c.status === 'Nei' || c.status === 'Høy risiko').length,
        ikkeRelevant: 0,
        total: currentExample.criteria.length
      },
      overallVerdict: currentExample.overallVerdict.includes('Inkluder') || currentExample.overallVerdict.includes('Lav risiko') || currentExample.overallVerdict.includes('HÃ¸y') ? 'Inkluder' : 'Vurder videre',
      verdictNote: currentExample.overallVerdictNote,
      keyStrength: currentExample.keyStrengths.join('; '),
      mainLimitation: currentExample.keyLimitations.join('; '),
      apaReference: `${currentExample.article.authors} (${currentExample.article.year}). ${currentExample.article.title}. ${currentExample.article.journal}. https://doi.org/${currentExample.article.doi}`,
      items: currentExample.criteria.map((c, idx) => ({
        questionId: typeof c.id === 'number' ? c.id : (idx + 1),
        status: (c.status === 'Ja' || c.status === 'Lav risiko' || c.status === 'Tilfredsstilt') ? 'Ja' : (c.status === 'Nei' || c.status === 'Høy risiko') ? 'Nei' : 'Uklart',
        justification: `${c.whyAssessedAsSuch} (Sidetall i artikkel: ${c.pageLocation})`,
        evidenceText: c.evidenceQuote,
        location: {
          page: c.pageLocation.replace(/[^0-9]/g, '') || '1',
          section: c.section
        },
        sourceQuoteOrRef: `${c.section}, ${c.pageLocation}`,
        reviewerNotes: `Gullstandard vurdering: ${c.criterionTitle}`
      })),
      auditTrail: [
        {
          id: generateAuditId('audit'),
          studyId: newArticleId,
          reviewer: 'Eksempelbibliotek',
          instrumentId: currentExample.instrumentId,
          version: '1.0.0',
          itemId: 1,
          itemTitle: 'Eksempel importert',
          previousAnswer: 'NONE',
          newAnswer: 'VERIFIED',
          previousRationale: '',
          newRationale: 'Gullstandard-eksempel lastet inn i arbeidsomrÃ¥det fra hjelpesiden.',
          changedBy: 'Forsker',
          timestamp: new Date().toISOString(),
          comment: 'Lastet inn fra Eksempelbibliotek'
        }
      ]
    };

    if (onLoadExampleToWorkspace) {
      onLoadExampleToWorkspace(newArticle);
      showToast(`Eksempelstudien Â«${currentExample.article.shortCitation}Â» er lagt til i ditt artikkelbibliotek!`, 'success');
    }
  };

  const getColorClasses = (colorKey: string) => {
    switch (colorKey) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
          highlight: 'bg-emerald-100/90 text-emerald-950 border-l-4 border-emerald-600',
          badge: 'bg-emerald-700 text-white',
          pill: 'bg-emerald-100 text-emerald-800'
        };
      case 'sky':
        return {
          bg: 'bg-sky-50 text-sky-900 border-sky-300',
          highlight: 'bg-sky-100/90 text-sky-950 border-l-4 border-sky-600',
          badge: 'bg-sky-700 text-white',
          pill: 'bg-sky-100 text-sky-800'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-300',
          highlight: 'bg-indigo-100/90 text-indigo-950 border-l-4 border-indigo-600',
          badge: 'bg-indigo-700 text-white',
          pill: 'bg-indigo-100 text-indigo-800'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 text-purple-900 border-purple-300',
          highlight: 'bg-purple-100/90 text-purple-950 border-l-4 border-purple-600',
          badge: 'bg-purple-700 text-white',
          pill: 'bg-purple-100 text-purple-800'
        };
      case 'rose':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-300',
          highlight: 'bg-rose-100/90 text-rose-950 border-l-4 border-rose-600',
          badge: 'bg-rose-700 text-white',
          pill: 'bg-rose-100 text-rose-800'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          highlight: 'bg-amber-100/90 text-amber-950 border-l-4 border-amber-600',
          badge: 'bg-amber-700 text-white',
          pill: 'bg-amber-100 text-amber-800'
        };
      case 'teal':
        return {
          bg: 'bg-teal-50 text-teal-900 border-teal-300',
          highlight: 'bg-teal-100/90 text-teal-950 border-l-4 border-teal-600',
          badge: 'bg-teal-800 text-white',
          pill: 'bg-teal-100 text-teal-800'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-50 text-cyan-900 border-cyan-300',
          highlight: 'bg-cyan-100/90 text-cyan-950 border-l-4 border-cyan-600',
          badge: 'bg-cyan-700 text-white',
          pill: 'bg-cyan-100 text-cyan-800'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-900 border-slate-300',
          highlight: 'bg-slate-100/90 text-slate-950 border-l-4 border-slate-600',
          badge: 'bg-slate-700 text-white',
          pill: 'bg-slate-100 text-slate-800'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner: Academic Guidance & Example Library Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-teal-700" />
              <span>Hjelpeside & Pedagogisk Eksempelbibliotek</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              Metodisk Veiledning & Gullstandard Eksempler
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Her finner du referanseartikler som dekker alle sentrale forskningsmetoder (Kvalitativ, RCT, Systematisk oversikt, Kohort, Retningslinjer og Mixed Methods). 
              Hvert eksempel forklarer studiens empiriske funn, viser nÃ¸yaktig hva i teksten som begrunner vurderingen, og inneholder <strong>fargekodede tekstutdrag</strong> med <strong>sidetall</strong> bak hvert svar for enkel visuell verifisering.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveHelpTab('examples')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                activeHelpTab === 'examples'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
              <span>Eksempelbibliotek ({METHODOLOGY_EXAMPLE_LIBRARY.length} metoder)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHelpTab('guidance')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                activeHelpTab === 'guidance'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" />
              <span>Metoderegler & Standarder</span>
            </button>

            <button
              type="button"
              onClick={handleCopyExampleMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Kopier eksempel (MD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: EXAMPLES LIBRARY */}
      {activeHelpTab === 'examples' && (
        <div className="space-y-6">
          {/* Methodology Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>Velg forskningsmetode for Ã¥ inspisere gullstandard:</span>
              </span>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="SÃ¸k i metodologier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            {/* Methodology Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredExamples.map((example) => {
                const isSelected = example.id === selectedExampleId;
                return (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => {
                      setSelectedExampleId(example.id);
                      setSelectedCriterionId(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-teal-900 text-white shadow-xs ring-2 ring-teal-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-300' : 'bg-slate-400'}`} />
                    <div>
                      <span className="block font-bold">{example.methodologyTitle}</span>
                      <span className={`text-[10px] block ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                        {example.instrumentName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE EXAMPLE DETAILS CONTAINER (TWO-COLUMN WORKSPACE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: ARTICLE OVERVIEW, FINDINGS & COLOR-CODED TEXT PASSAGES */}
            <div className="lg:col-span-6 space-y-6">
              {/* Article Header Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    {currentExample.instrumentStandard}
                  </span>

                  <button
                    type="button"
                    onClick={handleImportToWorkspace}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-2xs transition-colors"
                    title="Last dette eksempelet inn i ditt arbeidsomrÃ¥de for testing og redigering"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-teal-200" />
                    <span>Last inn i mitt arbeidsomrÃ¥de</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold font-serif text-slate-900 leading-snug">
                    {currentExample.article.title}
                  </h3>
                  <p className="text-xs text-slate-700 font-medium">
                    {currentExample.article.authors} ({currentExample.article.year})
                  </p>
                  <p className="text-xs text-slate-500">
                    {currentExample.article.journal} â€¢ {currentExample.article.volumeIssue} â€¢ DOI: {currentExample.article.doi}
                  </p>
                </div>

                {/* 1. Forklaring av funnene i artikkelen */}
                <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-950 uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4 text-teal-700" />
                    <span>Forklaring av funnene i artikkelen</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-serif">
                    {currentExample.findingsSummary}
                  </p>
                  <div className="pt-2 border-t border-teal-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div>
                      <strong className="text-teal-950 block">Studiedesign:</strong>
                      <span>{currentExample.article.studyDesign}</span>
                    </div>
                    <div>
                      <strong className="text-teal-950 block">Populasjon & Utvalg:</strong>
                      <span>{currentExample.article.populationAndSetting}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Scores & Strengths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <strong className="text-emerald-950 font-bold block mb-1">Metodiske styrker:</strong>
                    <ul className="space-y-1 text-[11px] text-emerald-900 list-disc list-inside">
                      {currentExample.keyStrengths.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <strong className="text-amber-950 font-bold block mb-1">Metodiske begrensninger:</strong>
                    <ul className="space-y-1 text-[11px] text-amber-900 list-disc list-inside">
                      {currentExample.keyLimitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fulltekst med Fargekodet Lokasjonsmarkering */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-teal-700" />
                    <h4 className="text-sm font-bold text-slate-900 font-serif">
                      Fargekodet Tekstleser med Sidetallsreferanser
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Interaktiv evidensinspeksjon
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Tekstpassasjene under viser de autentiske utdragene fra artikkelen. 
                  Fargene og sidetallsetikettene <span className="font-mono font-bold">[s. X]</span> korresponderer direkte med vurderingskriteriene til hÃ¸yre.
                </p>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {currentExample.article.fullTextPassages.map((passage, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{passage.sectionTitle}</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                          <MapPin className="w-3 h-3 text-teal-700" />
                          Side {passage.pageNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-serif">
                        {passage.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: HVA SOM SIER AT DE ER VURDERT SOM DE ER (KRITERIUM FOR KRITERIUM) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">
                      Hva som sier at artikkelen er vurdert slik den er
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kriterium-for-kriterium analyse med sidetallskommentar bak hvert svar
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      {currentExample.overallVerdict}
                    </span>
                  </div>
                </div>

                {/* Criteria List */}
                <div className="space-y-3.5">
                  {currentExample.criteria.map((criterion, idx) => {
                    const colorStyles = getColorClasses(criterion.colorKey);
                    const isExpanded = selectedCriterionId === criterion.id;

                    return (
                      <div
                        key={criterion.id}
                        onClick={() => setSelectedCriterionId(isExpanded ? null : criterion.id)}
                        className={`border rounded-xl p-4 transition-all cursor-pointer ${
                          isExpanded 
                            ? `${colorStyles.bg} ring-2 ring-teal-600 shadow-xs` 
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Criterion Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorStyles.badge}`}>
                                Kriterium {typeof criterion.id === 'number' ? `Q${criterion.id}` : criterion.id}
                              </span>
                              <span className="text-xs font-bold text-slate-900 font-serif">
                                {criterion.criterionTitle}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">
                              {criterion.officialQuestion}
                            </p>
                          </div>

                          {/* Status Badge + Page Number Comment */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              criterion.status === 'Ja' || criterion.status === 'Lav risiko' || criterion.status === 'Tilfredsstilt' || criterion.status === 'Høy kvalitet'
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : criterion.status === 'Uklart' || criterion.status === 'Noe bekymring'
                                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                  : 'bg-rose-100 text-rose-950 border border-rose-300'
                            }`}>
                              {criterion.status}
                              <strong className="font-mono text-[10px] ml-1 bg-white/80 px-1 py-0.2 rounded text-slate-800">
                                {criterion.pageComment}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Rationale & Evidence Details */}
                        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 text-xs">
                          {/* Faglig Begrunnelse */}
                          <div>
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                              Faglig Begrunnelse (Hvorfor vurdert slik):
                            </span>
                            <p className="text-slate-700 leading-relaxed font-serif">
                              {criterion.whyAssessedAsSuch}
                            </p>
                          </div>

                          {/* Autentisk Tekstsitat */}
                          <div className={`p-2.5 rounded-lg border text-xs ${colorStyles.highlight}`}>
                            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                              <span className="flex items-center gap-1">
                                <Quote className="w-3 h-3 text-teal-700" />
                                <span>Evidens i teksten ({criterion.section}):</span>
                              </span>
                              <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                Lokasjon: {criterion.pageLocation}
                              </span>
                            </div>
                            <p className="italic leading-relaxed">
                              Â«{criterion.evidenceQuote}Â»
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: METHODOLOGY GUIDANCE & STANDARDS */}
      {activeHelpTab === 'guidance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Metoderegler, Kunnskapsbasert Praksis & Integritetsstandarder
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Oversikt over de grunnleggende vitenskapelige standardene for kritisk vurdering i helse- og samfunnsvitenskapelig forskning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>1. Skille mellom Evidens og Rationale</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                En gyldig metodisk vurdering krever at forskeren aldri blander sammen det som <em>faktisk stÃ¥r i artikkelen</em> (tekstsitat og sidetall) med <em>forskerens faglige dom</em> (om designet er tilstrekkelig).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                <MapPin className="w-4 h-4 text-teal-700" />
                <span>2. Presis Sidetallsangivelse [s. X]</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                For Ã¥ sikre etterprÃ¸vbarhet for sensorer, veiledere og fagfeller, skal alle vurderinger dokumentere sidetallet der funnet ble gjort bak svaret, f.eks. <code>Ja [s. 3]</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                <Award className="w-4 h-4 text-teal-700" />
                <span>3. Valg av Riktig Instrument</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Bruk alltid instrumentet som er skreddersydd for studiedesignet: JBI for kvalitative studier, Cochrane RoB 2 for RCT, ROBINS-I for kohorter, AMSTAR 2 for oversikter og AGREE II for retningslinjer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


