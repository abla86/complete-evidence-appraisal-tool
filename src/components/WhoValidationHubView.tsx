import React, { useState } from 'react';
import { 
  ArticleAppraisal, 
  AppraisalInstrument,
  GradeSummaryOfFindingsItem,
  GradeCerqualSummaryItem,
  WhoEtdCriteriaInput
} from '../types';
import { generateUniqueId } from '../services/idGenerator';
import { INSTRUMENTS_REGISTRY } from '../data/jbiData';
import { WhoValidationService } from '../services/whoValidationService';
import { 
  GradeAssessmentEngine, 
  GradeCerqualAssessmentEngine, 
  WhoEtdAssessmentEngine 
} from '../services/assessmentEngines';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Download, 
  Copy, 
  ExternalLink, 
  BookOpen, 
  Award, 
  Search, 
  Info,
  Check,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Scale,
  ListPlus,
  Trash2,
  Table
} from 'lucide-react';
import { useToast } from './Toast';

interface WhoValidationHubViewProps {
  articles: ArticleAppraisal[];
  onSelectArticleForEdit?: (articleId: string) => void;
  onSelectArticleForView?: (articleId: string) => void;
}

export const WhoValidationHubView: React.FC<WhoValidationHubViewProps> = ({
  articles,
  onSelectArticleForEdit,
  onSelectArticleForView
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'audit' | 'grade_sof' | 'cerqual' | 'etd' | 'registry' | 'handbook'>('audit');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [copiedCert, setCopiedCert] = useState<boolean>(false);

  // GRADE Summary of Findings (SoF) State
  const [sofItems, setSofItems] = useState<GradeSummaryOfFindingsItem[]>([
    {
      id: 'sof-1',
      reviewFinding: 'Smertereduksjon ved 12 uker viser en konsistent effekt i de inkluderte studiene.',
      methodologicalLimitations: 'No or very minor concerns',
      coherence: 'No or very minor concerns',
      adequacyOfData: 'No or very minor concerns',
      relevance: 'No or very minor concerns',
      contributingStudies: 4,
      overallConfidence: 'High confidence',
      outcomeName: 'Smertereduksjon ved 12 uker (VAS 0-100)',
      outcomeType: 'Continuous',
      assumedRisk: 'Kontroll: Gj.snitt 58 mm',
      correspondingRisk: 'Intervensjon: Gj.snitt 32 mm (-26 mm differanse)',
      relativeEffect: 'MD -26.0 (95% KI -31.2 til -20.8)',
      participantsCount: 420,
      studiesCount: 4,
      studyDesign: 'RCT',
      riskOfBias: 0,
      inconsistency: 0,
      indirectness: 0,
      imprecision: 0,
      publicationBias: 0,
      certainty: 'High',
      importance: 'Critical',
      comments: 'Robuste multisenterstudier med lav risiko for bias.'
    },
    {
      id: 'sof-2',
      reviewFinding: 'Alvorlige uønskede hendelser er usikre grunnet imprecision.',
      methodologicalLimitations: 'Minor concerns',
      coherence: 'No or very minor concerns',
      adequacyOfData: 'No or very minor concerns',
      relevance: 'No or very minor concerns',
      contributingStudies: 4,
      overallConfidence: 'Moderate confidence',
      outcomeName: 'Alvorlige uÃ¸nskede hendelser (Adverse events)',
      outcomeType: 'Dichotomous',
      assumedRisk: '15 per 1 000',
      correspondingRisk: '18 per 1 000 (3 flere per 1 000)',
      relativeEffect: 'RR 1.20 (95% KI 0.72 til 2.01)',
      participantsCount: 420,
      studiesCount: 4,
      studyDesign: 'RCT',
      riskOfBias: 0,
      inconsistency: 0,
      indirectness: 0,
      imprecision: -1,
      publicationBias: 0,
      certainty: 'Moderate',
      importance: 'Critical',
      comments: 'Nedgradert 1 nivÃ¥ pga imprecision (bredt konfidensintervall som inkluderer bÃ¥de gevinst og skade).'
    }
  ]);

  // GRADE-CERQual Qualitative State
  const [cerqualFindings, setCerqualFindings] = useState<GradeCerqualSummaryItem[]>([
    {
      id: 'cerq-1',
      finding: 'Pasienter opplever tverrfaglig oppfølging som avgjørende for mestringstro og trygghet i hverdagen.',
      confidence: 'High confidence',
      rationale: 'Gjenfinnbart på tvers av 5 uavhengige kvalitative studier med rik empiri og solid forskerrefleksivitet.',
      reviewFinding: 'Pasienter opplever tverrfaglig oppfÃ¸lging som avgjÃ¸rende for mestringstro og trygghet i hverdagen.',
      methodologicalLimitations: 'No or very minor concerns',
      coherence: 'No or very minor concerns',
      adequacyOfData: 'No or very minor concerns',
      relevance: 'No or very minor concerns',
      overallConfidence: 'High confidence',
      contributingStudies: 'Lund et al. (2024), Berg et al. (2023), Thorne et al. (2022)',
      explanation: 'Gjenfinnbart pÃ¥ tvers av 5 uavhengige kvalitative studier med rik empiri og solid forskerrefleksivitet.'
    },
    {
      id: 'cerq-2',
      finding: 'Kulturelle barrierer og språkutfordringer forsinker tidlig oppstart av rehabiliteringstiltak.',
      confidence: 'Moderate confidence',
      rationale: 'Moderat tillit pga begrenset antall informanter fra minoritetsgrupper (Adequacy of data).',
      reviewFinding: 'Kulturelle barrierer og sprÃ¥kutfordringer forsinker tidlig oppstart av rehabiliteringstiltak.',
      methodologicalLimitations: 'Minor concerns',
      coherence: 'No or very minor concerns',
      adequacyOfData: 'Moderate concerns',
      relevance: 'Minor concerns',
      overallConfidence: 'Moderate confidence',
      contributingStudies: 'Berg et al. (2023), Kim et al. (2021)',
      explanation: 'Moderat tillit pga begrenset antall informanter fra minoritetsgrupper (Adequacy of data).'
    }
  ]);

  // WHO Evidence-to-Decision (EtD / DECIDE) State
  const [etdInput, setEtdInput] = useState<WhoEtdCriteriaInput>({
    guidelineQuestion: 'BÃ¸r strukturert tverrfaglig rehabilitering tilbys rutinemessig til voksne med langvarige muskel-/skjelettsmerter?',
    targetPopulation: 'Voksne (18-67 Ã¥r) med langvarige muskel- og skjelettsmerter (>3 mnd)',
    intervention: 'Strukturert tverrfaglig biopsykososial rehabilitering (fysioterapi, kognitiv tilnÃ¦rming, arbeidstiltak)',
    comparison: 'Standard primÃ¦rhelsetjenesteoppfÃ¸lging / egentrening',
    problemPriority: 'Yes',
    desirableEffects: 'Large',
    undesirableEffects: 'Trivial',
    certaintyOfEvidence: 'Moderate',
    valuesUncertainty: 'Probably no important uncertainty',
    balanceOfEffects: 'Favors intervention',
    resourcesRequired: 'Moderate costs',
    costEffectiveness: 'Favors intervention',
    equity: 'Probably increased',
    acceptability: 'Yes',
    feasibility: 'Yes'
  });

  const etdResult = WhoEtdAssessmentEngine.evaluateEtD(etdInput);

  const selectedArticle = articles.find(a => a.id === selectedArticleId) || articles[0];
  const auditReport = selectedArticle ? WhoValidationService.auditArticle(selectedArticle, selectedArticle.instrumentId || 'UNKNOWN') : null;
  const selectedModel = INSTRUMENTS_REGISTRY.find(m => m.id === selectedModelId);

  // Overall library stats
  const libraryReports = articles.map(art => ({
    article: art,
    report: WhoValidationService.auditArticle(art, art.instrumentId || 'jbi-qualitative-2017')
  }));

  const fullyCompliantCount = libraryReports.filter(r => r.report.summaryVerdict === 'INTERN_METODISK_KONTROLLERT').length;
  const avgComplianceScore = libraryReports.length > 0
    ? Math.round(libraryReports.reduce((acc, r) => acc + r.report.complianceScore, 0) / libraryReports.length)
    : 100;

  const handleCopyCertificate = () => {
    if (!auditReport || !selectedArticle) return;
    const certText = WhoValidationService.generateCertificateText(auditReport, selectedArticle);
    navigator.clipboard.writeText(certText);
    setCopiedCert(true);
    showToast('WHO Kvalitetsrevisjons-sertifikat kopiert til utklippstavlen', 'success');
    setTimeout(() => setCopiedCert(false), 2500);
  };

  const handleDownloadCertificate = () => {
    if (!auditReport || !selectedArticle) return;
    const certText = WhoValidationService.generateCertificateText(auditReport, selectedArticle);
    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WHO_Kvalitetsrevisjon_${selectedArticle.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('WHO Revisjonssertifikat lastet ned (.txt)', 'success');
  };

  const handleRecalculateGradeOutcome = (id: string, updates: Partial<GradeSummaryOfFindingsItem>) => {
    setSofItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const merged = { ...item, ...updates };
      const evalRes = GradeAssessmentEngine.evaluateOutcome({
        outcomeName: merged.outcomeName,
        studyDesign: merged.studyDesign,
        riskOfBias: merged.riskOfBias,
        inconsistency: merged.inconsistency,
        indirectness: merged.indirectness,
        imprecision: merged.imprecision,
        publicationBias: merged.publicationBias
      });
      return {
        ...merged,
        certainty: evalRes.finalCertainty
      };
    }));
  };

  const handleRecalculateCerqual = (id: string, updates: Partial<GradeCerqualSummaryItem>) => {
    setCerqualFindings(prev => prev.map(item => {
      if (item.id !== id) return item;
      const merged = { ...item, ...updates };
      const evalRes = GradeCerqualAssessmentEngine.evaluateFinding({
        reviewFinding: merged.reviewFinding,
        methodologicalLimitations: merged.methodologicalLimitations,
        coherence: merged.coherence,
        adequacyOfData: merged.adequacyOfData,
        relevance: merged.relevance
      });
      return {
        ...merged,
        overallConfidence: evalRes.overallConfidence
      };
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/10 transform skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-teal-300" />
            <span>WHO Handbook for Guideline Development (2. utg. 2014) & GRADE Standard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            WHO Kvalitetskontroll, GRADE & Evidence-to-Decision
          </h1>
          <p className="text-sm text-teal-100/90 leading-relaxed">
            Komplett evidensrammeverk for forskere: Automatisk etterprÃ¸ving mot WHO-kravene, GRADE Kvantitativ SoF-tabell, 
            GRADE-CERQual Kvalitativ profil, og WHO DECIDE Evidence-to-Decision (EtD) for kliniske anbefalinger.
          </p>

          {/* Key Metric Pills */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
              <div className="text-[11px] text-teal-200 uppercase font-semibold">Registrerte Modeller</div>
              <div className="text-xl font-black mt-0.5 text-white">{INSTRUMENTS_REGISTRY.length} offisielle</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
              <div className="text-[11px] text-teal-200 uppercase font-semibold">Validert i bibliotek</div>
              <div className="text-xl font-black mt-0.5 text-emerald-300">{fullyCompliantCount} / {articles.length} artikler</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
              <div className="text-[11px] text-teal-200 uppercase font-semibold">Gj.snitt KvalitetsskÃ¥r</div>
              <div className="text-xl font-black mt-0.5 text-teal-200">{avgComplianceScore}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
              <div className="text-[11px] text-teal-200 uppercase font-semibold">Gjeldende revisjon</div>
              <div className="text-xl font-black mt-0.5 text-white">WHO 2014 Standard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Artikkelrevisjon & Kvalitetsrapport</span>
        </button>

        <button
          onClick={() => setActiveTab('grade_sof')}
          className={`pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'grade_sof'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4 text-teal-700" />
          <span>GRADE Summary of Findings (SoF)</span>
        </button>

        <button
          onClick={() => setActiveTab('cerqual')}
          className={`pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'cerqual'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>GRADE-CERQual Kvalitativ Profil</span>
        </button>

        <button
          onClick={() => setActiveTab('etd')}
          className={`pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'etd'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-sky-700" />
          <span>WHO Evidence-to-Decision (EtD)</span>
        </button>

        <button
          onClick={() => setActiveTab('registry')}
          className={`pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'registry'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Modelloversikt ({INSTRUMENTS_REGISTRY.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('handbook')}
          className={`pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'handbook'
              ? 'border-teal-700 text-teal-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>WHO HÃ¥ndbok & Prinsipper</span>
        </button>
      </div>

      {/* TAB 1: ARTICLE QUALITY AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Article Selector & Summary Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Velg studie for WHO Kvalitetsrevisjon:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedArticleId}
                  onChange={(e) => setSelectedArticleId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 max-w-md"
                >
                  {articles.map(art => (
                    <option key={art.id} value={art.id}>
                      {art.shortCitation} â€“ {art.title.substring(0, 50)}...
                    </option>
                  ))}
                </select>

                {selectedArticle && onSelectArticleForView && (
                  <button
                    onClick={() => onSelectArticleForView(selectedArticle.id)}
                    className="px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 rounded-lg border border-teal-200 transition-colors"
                  >
                    Ã…pne artikkeldetaljer
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {auditReport && selectedArticle && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyCertificate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{copiedCert ? 'Kopiert!' : 'Kopier revisjonsrapport'}</span>
                </button>
                <button
                  onClick={handleDownloadCertificate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-200" />
                  <span>Last ned revisjonsrapport (.txt)</span>
                </button>
              </div>
            )}
          </div>

          {/* Audit Results Card */}
          {auditReport && selectedArticle ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Detailed Rule Checkpoints */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Revisjonsrapport for {selectedArticle.shortCitation}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Testet mot {auditReport.whoHandbookStandard} & {auditReport.appraisalModel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        auditReport.summaryVerdict === 'INTERN_METODISK_KONTROLLERT'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {auditReport.summaryVerdict}
                      </span>
                    </div>
                  </div>

                  {/* Rules Checklist */}
                  <div className="space-y-3">
                    {auditReport.rules.map((rule) => {
                      return (
                        <div
                          key={rule.id}
                          className={`p-4 rounded-xl border transition-all ${
                            rule.passed
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : rule.severity === 'critical'
                                ? 'bg-rose-50/50 border-rose-200'
                                : 'bg-amber-50/50 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              {rule.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : rule.severity === 'critical' ? (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">{rule.name}</span>
                                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                                    {rule.id}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">({rule.category})</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">{rule.details}</p>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Standard: {rule.standard}</span>
                                </div>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              rule.passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {rule.passed ? 'BestÃ¥tt' : 'Mangler'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Link to Form if issues exist */}
                  {!auditReport.overallPassed && onSelectArticleForEdit && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-600">
                        Ã˜nsker du Ã¥ komplettere manglende begrunnelser eller data?
                      </span>
                      <button
                        onClick={() => onSelectArticleForEdit(selectedArticle.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
                      >
                        <span>FullfÃ¸r i JBI-skjema</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Quality Score & Model Metadata Card */}
              <div className="space-y-4">
                {/* Score & Verdict Box */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 border-4 border-teal-600 text-teal-900 font-black text-2xl">
                    {auditReport.complianceScore}%
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">WHO Kvalitetsindeks</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {auditReport.passedRuleCount} av {auditReport.totalRuleCount} kontrollpunkter bestÃ¥tt
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-left text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Modellversjon:</span>
                      <span className="font-semibold text-slate-900">{auditReport.modelVersion}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Sjekksum (SHA256):</span>
                      <span className="font-mono text-[10px] text-slate-700 truncate max-w-[120px]" title={auditReport.modelChecksum}>
                        {auditReport.modelChecksum}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Sist revidert:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(auditReport.timestamp).toLocaleDateString('no-NO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Library Compliance Status Overview */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Hele biblioteket ({articles.length} artikler)
                  </h4>
                  <div className="space-y-2">
                    {libraryReports.map(({ article, report }) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticleId(article.id)}
                        className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                          article.id === selectedArticleId
                            ? 'bg-white border-teal-500 shadow-2xs ring-1 ring-teal-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-slate-800 truncate">{article.shortCitation}</div>
                          <div className="text-[11px] text-slate-500 truncate">{article.title}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          report.summaryVerdict === 'INTERN_METODISK_KONTROLLERT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {report.complianceScore}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
              Ingen artikler registrert for revisjon.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRADE SUMMARY OF FINDINGS (SoF) STUDIO */}
      {activeTab === 'grade_sof' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-5 h-5 text-teal-700" />
                  <span>GRADE Summary of Findings (SoF) Tabellbygger</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Standardisert WHO & Cochrane format for kvantitativ evidenssyntese (Guyatt et al., BMJ 2008 / WHO Handbook).
                </p>
              </div>

              <button
                onClick={() => {
                  const newItem: GradeSummaryOfFindingsItem = {
                    id: generateUniqueId('sof'),
                    reviewFinding: 'Forskerens dokumenterte vurdering av utfallet.',
                    methodologicalLimitations: 'No or very minor concerns',
                    coherence: 'No or very minor concerns',
                    adequacyOfData: 'No or very minor concerns',
                    relevance: 'No or very minor concerns',
                    contributingStudies: 2,
                    overallConfidence: 'High confidence',
                    outcomeName: 'Nytt klinisk utfall (f.eks. Livskvalitet SF-36)',
                    outcomeType: 'Continuous',
                    assumedRisk: 'Kontrollgruppe',
                    correspondingRisk: 'Intervensjonsgruppe',
                    relativeEffect: 'MD / RR estimat',
                    participantsCount: 250,
                    studiesCount: 2,
                    studyDesign: 'RCT',
                    riskOfBias: 0,
                    inconsistency: 0,
                    indirectness: 0,
                    imprecision: 0,
                    publicationBias: 0,
                    certainty: 'High',
                    importance: 'Critical',
                    comments: 'Metodisk begrunnelse for utfallsvurdering'
                  };
                  setSofItems(prev => [...prev, newItem]);
                  showToast('Nytt utfall lagt til i GRADE SoF-tabellen', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <ListPlus className="w-4 h-4" />
                <span>Legg til nytt utfall</span>
              </button>
            </div>

            {/* SoF Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                    <th className="p-3 font-bold">Utfall & Betydning</th>
                    <th className="p-3 font-bold">Antall pasienter (Studier)</th>
                    <th className="p-3 font-bold">Absolutt & Relativ effekt</th>
                    <th className="p-3 font-bold">GRADE Nedgraderinger</th>
                    <th className="p-3 font-bold text-center">Sikkerhet (Certainty)</th>
                    <th className="p-3 font-bold text-right">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sofItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 max-w-xs space-y-1">
                        <input
                          type="text"
                          value={item.outcomeName}
                          onChange={(e) => handleRecalculateGradeOutcome(item.id, { outcomeName: e.target.value })}
                          className="w-full font-bold text-slate-900 bg-transparent border-b border-slate-200 focus:border-teal-600 focus:outline-hidden"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={item.importance}
                            onChange={(e) => {
                              const importance = e.target.value;
                              if (importance === 'Critical' || importance === 'Important' || importance === 'Not important') {
                                handleRecalculateGradeOutcome(item.id, { importance });
                              }
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <option value="Critical">Kritisk (Critical)</option>
                            <option value="Important">Viktig (Important)</option>
                            <option value="Not important">Mindre viktig</option>
                          </select>
                          <select
                            value={item.studyDesign}
                            onChange={(e) => {
                              const studyDesign = e.target.value;
                              if (studyDesign === 'RCT' || studyDesign === 'Observational' || studyDesign === 'Qualitative' || studyDesign === 'Mixed methods') {
                                handleRecalculateGradeOutcome(item.id, { studyDesign });
                              }
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <option value="RCT">RCT (Starter HÃ¸y)</option>
                            <option value="Observational">Observasjonell (Starter Lav)</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-3 space-y-1">
                        <div className="font-semibold text-slate-800">
                          {item.participantsCount} deltakere
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ({item.studiesCount} {item.studiesCount === 1 ? 'studie' : 'studier'})
                        </div>
                      </td>

                      <td className="p-3 space-y-1">
                        <div className="font-mono text-[11px] text-slate-900">{item.relativeEffect}</div>
                        <div className="text-[10px] text-slate-500">{item.correspondingRisk}</div>
                      </td>

                      <td className="p-3 space-y-1.5 min-w-[200px]">
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <div>
                            <span className="text-slate-500 block">Risk of bias:</span>
                            <select
                              value={item.riskOfBias}
                              onChange={(e) => handleRecalculateGradeOutcome(item.id, { riskOfBias: Number(e.target.value) as any })}
                              className="w-full bg-white border border-slate-200 rounded px-1 py-0.5"
                            >
                              <option value="0">Ingen (0)</option>
                              <option value="-1">Alvorlig (-1)</option>
                              <option value="-2">SvÃ¦rt alvorlig (-2)</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Inconsistency:</span>
                            <select
                              value={item.inconsistency}
                              onChange={(e) => handleRecalculateGradeOutcome(item.id, { inconsistency: Number(e.target.value) as any })}
                              className="w-full bg-white border border-slate-200 rounded px-1 py-0.5"
                            >
                              <option value="0">Ingen (0)</option>
                              <option value="-1">Alvorlig (-1)</option>
                              <option value="-2">SvÃ¦rt alvorlig (-2)</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Indirectness:</span>
                            <select
                              value={item.indirectness}
                              onChange={(e) => handleRecalculateGradeOutcome(item.id, { indirectness: Number(e.target.value) as any })}
                              className="w-full bg-white border border-slate-200 rounded px-1 py-0.5"
                            >
                              <option value="0">Ingen (0)</option>
                              <option value="-1">Alvorlig (-1)</option>
                              <option value="-2">SvÃ¦rt alvorlig (-2)</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Imprecision:</span>
                            <select
                              value={item.imprecision}
                              onChange={(e) => handleRecalculateGradeOutcome(item.id, { imprecision: Number(e.target.value) as any })}
                              className="w-full bg-white border border-slate-200 rounded px-1 py-0.5"
                            >
                              <option value="0">Ingen (0)</option>
                              <option value="-1">Alvorlig (-1)</option>
                              <option value="-2">SvÃ¦rt alvorlig (-2)</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black ${
                          item.certainty === 'High'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : item.certainty === 'Moderate'
                              ? 'bg-teal-100 text-teal-900 border border-teal-300'
                              : item.certainty === 'Low'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {item.certainty}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSofItems(prev => prev.filter(x => x.id !== item.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Slett utfall"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GRADE-CERQUAL KVALITATIV PROFIL */}
      {activeTab === 'cerqual' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>GRADE-CERQual Kvalitativ Evidensprofil</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Confidence in the Evidence from Reviews of Qualitative research (Lewin et al., PLOS Med 2018 / WHO Handbook).
                </p>
              </div>

              <button
                onClick={() => {
                  const newFinding: GradeCerqualSummaryItem = {
                    id: generateUniqueId('cerq'),
                    finding: 'Nytt kvalitativt syntesefunn (tematisk funn)',
                    confidence: 'High confidence',
                    rationale: 'Eksplisitt begrunnelse for tillitsvurderingen',
                    reviewFinding: 'Nytt kvalitativt syntesefunn (tematisk funn)',
                    methodologicalLimitations: 'No or very minor concerns',
                    coherence: 'No or very minor concerns',
                    adequacyOfData: 'No or very minor concerns',
                    relevance: 'No or very minor concerns',
                    overallConfidence: 'High confidence',
                    contributingStudies: 'Inkluderte kvalitative artikler',
                    explanation: 'Eksplisitt begrunnelse for tillitsvurderingen'
                  };
                  setCerqualFindings(prev => [...prev, newFinding]);
                  showToast('Nytt kvalitativt syntesefunn lagt til', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <ListPlus className="w-4 h-4" />
                <span>Legg til syntesefunn</span>
              </button>
            </div>

            {/* CERQual Cards */}
            <div className="space-y-4">
              {cerqualFindings.map((finding) => (
                <div key={finding.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <input
                        type="text"
                        value={finding.reviewFinding}
                        onChange={(e) => handleRecalculateCerqual(finding.id, { reviewFinding: e.target.value })}
                        className="w-full font-bold text-sm text-slate-900 bg-transparent border-b border-slate-200 focus:border-emerald-600 focus:outline-hidden"
                      />
                      <div className="text-xs text-slate-600">
                        Bidragsytende studier: <span className="font-semibold text-slate-800">{finding.contributingStudies}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        finding.overallConfidence === 'High confidence'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : finding.overallConfidence === 'Moderate confidence'
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : finding.overallConfidence === 'Low confidence'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {finding.overallConfidence}
                      </span>
                      <button
                        onClick={() => setCerqualFindings(prev => prev.filter(x => x.id !== finding.id))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 CERQual Components */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-600 block text-[10px] uppercase">1. Metodiske begrensninger</span>
                      <select
                        value={finding.methodologicalLimitations}
                        onChange={(e) => handleRecalculateCerqual(finding.id, { methodologicalLimitations: e.target.value as any })}
                        className="w-full mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      >
                        <option value="No or very minor concerns">Ingen / svÃ¦rt smÃ¥</option>
                        <option value="Minor concerns">Mindre bekymringer</option>
                        <option value="Moderate concerns">Moderate bekymringer</option>
                        <option value="Serious concerns">Alvorlige bekymringer</option>
                      </select>
                    </div>

                    <div>
                      <span className="font-bold text-slate-600 block text-[10px] uppercase">2. Koherens (Sammenheng)</span>
                      <select
                        value={finding.coherence}
                        onChange={(e) => handleRecalculateCerqual(finding.id, { coherence: e.target.value as any })}
                        className="w-full mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      >
                        <option value="No or very minor concerns">Ingen / svÃ¦rt smÃ¥</option>
                        <option value="Minor concerns">Mindre bekymringer</option>
                        <option value="Moderate concerns">Moderate bekymringer</option>
                        <option value="Serious concerns">Alvorlige bekymringer</option>
                      </select>
                    </div>

                    <div>
                      <span className="font-bold text-slate-600 block text-[10px] uppercase">3. Datamaterialets rikdom</span>
                      <select
                        value={finding.adequacyOfData}
                        onChange={(e) => handleRecalculateCerqual(finding.id, { adequacyOfData: e.target.value as any })}
                        className="w-full mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      >
                        <option value="No or very minor concerns">Ingen / svÃ¦rt smÃ¥</option>
                        <option value="Minor concerns">Mindre bekymringer</option>
                        <option value="Moderate concerns">Moderate bekymringer</option>
                        <option value="Serious concerns">Alvorlige bekymringer</option>
                      </select>
                    </div>

                    <div>
                      <span className="font-bold text-slate-600 block text-[10px] uppercase">4. Relevans for kontekst</span>
                      <select
                        value={finding.relevance}
                        onChange={(e) => handleRecalculateCerqual(finding.id, { relevance: e.target.value as any })}
                        className="w-full mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      >
                        <option value="No or very minor concerns">Ingen / svÃ¦rt smÃ¥</option>
                        <option value="Minor concerns">Mindre bekymringer</option>
                        <option value="Moderate concerns">Moderate bekymringer</option>
                        <option value="Serious concerns">Alvorlige bekymringer</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHO EVIDENCE-TO-DECISION (EtD / DECIDE) */}
      {activeTab === 'etd' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-sky-700" />
                <span>WHO Evidence-to-Decision (EtD / DECIDE) Rammeverk</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Strukturert beslutningsprosess fra evidens til klinisk retningslinjeanbefaling (WHO Handbook Chapter 9).
              </p>
            </div>

            {/* Recommendation Verdict Hero */}
            <div className={`p-5 rounded-2xl border ${
              etdResult.recommendationType.includes('Strong recommendation for')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : etdResult.recommendationType.includes('Conditional recommendation for')
                  ? 'bg-teal-50 border-teal-200 text-teal-950'
                  : etdResult.recommendationType.includes('Conditional recommendation against')
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    WHO AnbefalingsnivÃ¥ (Recommendation Level):
                  </div>
                  <h4 className="text-xl font-black mt-0.5">{etdResult.recommendationType}</h4>
                </div>
                <span className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white/80 border border-slate-200">
                  {etdResult.methodologicalStandard}
                </span>
              </div>
              <p className="text-xs mt-2 leading-relaxed opacity-90">{etdResult.strengthRationale}</p>
            </div>

            {/* 7 Core EtD Criteria Configurator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">1. Problemets prioritet for helsetjenesten</label>
                <select
                  value={etdInput.problemPriority}
                  onChange={(e) => setEtdInput(prev => ({ ...prev, problemPriority: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="Yes">Ja (HÃ¸y prioritet)</option>
                  <option value="Probably yes">Sannsynligvis ja</option>
                  <option value="Probably no">Sannsynligvis nei</option>
                  <option value="No">Nei</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">2. Balanse mellom Ã¸nskede og uÃ¸nskede effekter</label>
                <select
                  value={etdInput.balanceOfEffects}
                  onChange={(e) => setEtdInput(prev => ({ ...prev, balanceOfEffects: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="Favors intervention">Klar overvekt i favÃ¸r av intervensjon</option>
                  <option value="Probably favors intervention">Sannsynligvis i favÃ¸r av intervensjon</option>
                  <option value="Does not favor either">NÃ¸ytral / lik balanse</option>
                  <option value="Probably favors comparison">Sannsynligvis i favÃ¸r av kontroll/sammenligning</option>
                  <option value="Favors comparison">Klar overvekt i favÃ¸r av kontroll</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">3. Samlet evidenssikkerhet (GRADE / CERQual)</label>
                <select
                  value={etdInput.certaintyOfEvidence}
                  onChange={(e) => setEtdInput(prev => ({ ...prev, certaintyOfEvidence: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="High">HÃ¸y sikkerhet (High)</option>
                  <option value="Moderate">Moderat sikkerhet (Moderate)</option>
                  <option value="Low">Lav sikkerhet (Low)</option>
                  <option value="Very Low">SvÃ¦rt lav sikkerhet (Very Low)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">4. Pasient- / brukerverdier og preferanser</label>
                <select
                  value={etdInput.valuesUncertainty}
                  onChange={(e) => setEtdInput(prev => ({ ...prev, valuesUncertainty: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="No important uncertainty">Ingen viktig usikkerhet / samstemte verdier</option>
                  <option value="Probably no important uncertainty">Sannsynligvis ingen viktig usikkerhet</option>
                  <option value="Possibly important">Mulig variasjon i preferanser</option>
                  <option value="Important uncertainty or variability">Betydelig usikkerhet eller variasjon</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">5. Ressursbruk og kostnadseffektivitet</label>
                <select
                  value={etdInput.costEffectiveness}
                  onChange={(e) => setEtdInput(prev => ({ ...prev, costEffectiveness: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="Favors intervention">Kostnadseffektivt / fordelaktig</option>
                  <option value="Probably favors intervention">Sannsynligvis fordelaktig</option>
                  <option value="Does not favor either">NÃ¸ytralt</option>
                  <option value="Probably favors comparison">Sannsynligvis for dyrt</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">6. PÃ¥virkning pÃ¥ helselikhet (Equity)</label>
                <select
                  value={etdInput.equity}
                  onChange={(e) => setEtdInput(prev => ({ ...prev, equity: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="Increased equity">Ã˜kt helselikhet (Reduserer forskjeller)</option>
                  <option value="Probably increased">Sannsynligvis Ã¸kt likhet</option>
                  <option value="Probably no impact">Ingen vesentlig pÃ¥virkning</option>
                  <option value="Reduced equity">Redusert helselikhet (Ã˜ker ulikhet)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INSTRUMENTS & VERSIONS REGISTRY */}
      {activeTab === 'registry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Model List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Offisielt Akkrediterte Vurderingsinstrumenter
            </h3>
            {INSTRUMENTS_REGISTRY.map((inst) => {
              const isSelected = inst.id === selectedModelId;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedModelId(inst.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-600 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{inst.shortName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          v{inst.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{inst.purpose}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 bg-emerald-100 text-emerald-800">
                      Gjeldende
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right 2 cols: Selected Model Details & WHO Specifications */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-100 text-teal-900 text-xs font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>{selectedModel.categoryName}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{selectedModel.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{selectedModel.purpose}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Oppdatert Revisjon</div>
                  <div className="text-sm font-bold text-slate-800">{selectedModel.latestUpdateYear}</div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Offisiell Utgave / Edition</span>
                  <span className="font-semibold text-slate-900">{selectedModel.edition}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Ansvarlig Fagorgan</span>
                  <span className="font-semibold text-slate-900">{selectedModel.governingBody}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">WHO Standard Referanse</span>
                  <span className="font-semibold text-slate-900">{selectedModel.whoHandbookRef}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Integritets-sjekksum</span>
                  <span className="font-mono text-[10px] text-slate-800">{selectedModel.validationChecksum}</span>
                </div>
              </div>

              {/* Quality Control Guidelines */}
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>WHO Kvalitetskontroll og Vurderingskrav</span>
                </h4>
                <p className="text-xs text-teal-950 leading-relaxed">
                  {selectedModel.qualityControlGuidelines}
                </p>
              </div>

              {/* Applicable Study Types */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Gyldige studiedesign for denne modellen:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModel.applicableStudyTypes.map((st, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-medium border border-slate-200">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {/* Source Link */}
              {selectedModel.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={selectedModel.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 hover:underline"
                  >
                    <span>Ã…pne offisiell modellveileder hos {selectedModel.governingBody}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WHO HANDBOOK PRINCIPLES */}
      {activeTab === 'handbook' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              Kvalitetsstandarder etter WHO Handbook for Guideline Development
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Verdens helseorganisasjon (WHO) stiller strenge metodiske krav til syntetisering og kritisk vurdering
              av forskningsevidens. Dette verktÃ¸yet hÃ¥ndhever automatisk disse kontrollprinsippene for Ã¥ garantere
              hÃ¸yeste akademiske standard for masteroppgaver og vitenskapelige publikasjoner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Modellintegritet & Versjonskontroll</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingen artikler kan vurderes med utdaterte eller feilaktige modeller. Alle sjekklister mÃ¥ vÃ¦re 
                oppdatert til offisiell revisjon (f.eks. JBI 2017, AMSTAR 2 2017, RoB 2 2019).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">2</span>
                <span>100% Fullstendighetskrav</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingen spÃ¸rsmÃ¥l eller metodiske domener kan hoppes over. Alle 10 JBI-kriterier mÃ¥ vurderes 
                systematisk for Ã¥ forhindre selektiv kvalitetsvurdering.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Begrunnelsestransparens (Rationale)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                En vurdering (Ja/Nei/Uklart) er aldri gyldig alene. Hvert enkelt punkt krever en eksplisitt 
                skriftlig faglig begrunnelse som forklarer hvorfor kriteriet er eller ikke er oppfylt.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">4</span>
                <span>Empirisk Tekstforankring & Sitater</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bekreftende vurderinger (Â«JaÂ») skal underbygges med konkrete tekstutdrag eller sidetallshenvisninger
                fra artikkelen for maksimal etterprÃ¸vbarhet.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">5</span>
                <span>Forskerrefleksivitet & Posisjonering</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                I henhold til kvalitativ forskningsmetodikk (JBI 6 & 7) mÃ¥ forfatternes forforstÃ¥else, teoretiske 
                stÃ¥sted og pÃ¥virkning pÃ¥ datamaterialet eksplisitt evalueres.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">6</span>
                <span>Epistemologisk Kausalitetsvakt</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Forhindrer feilaktige slutninger. Kvalitative studier belyser opplevelser og mekanismer, men kan 
                aldri tolkes som bevis pÃ¥ isolert kausal effekt av en intervensjon.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

