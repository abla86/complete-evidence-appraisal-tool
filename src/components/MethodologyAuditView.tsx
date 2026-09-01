import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Download, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  FileText,
  Lock,
  Sparkles,
  HelpCircle,
  Terminal,
  Activity,
  Check,
  Target,
  Scale,
  Workflow,
  Compass,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Info,
  Filter,
  Award,
  Hash,
  GitCommit
} from 'lucide-react';
import { MethodologyRegistry, MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { 
  MethodIntegrityService, 
  ComprehensiveAuditReport, 
  MethodAuditItem,
  VerificationStatusType 
} from '../services/methodIntegrityService';
import { StudyDesignGateService, SUPPORTED_STUDY_DESIGNS } from '../services/studyDesignGateService';
import { MethodologyContractTests, ContractTestSummary } from '../services/methodologyContractTests';
import { useToast } from './Toast';
import { AppraisalInstrument } from '../types';

export const MethodologyAuditView: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'audit_matrix' | 'methodological_functions' | 'registry_browser' | 'study_design_gate' | 'contract_tests' | 'full_report'>('audit_matrix');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('jbi-qualitative-2017');
  const [selectedDesignId, setSelectedDesignId] = useState<string>('qualitative');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatusType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [activeFrameworkDemo, setActiveFrameworkDemo] = useState<string>('amstar-2');
  const [expandedInstrumentId, setExpandedInstrumentId] = useState<string | null>('jbi-qualitative-2017');

  const auditReport: ComprehensiveAuditReport = useMemo(() => {
    return MethodIntegrityService.runFullSystemAudit();
  }, []);

  const contractTestsResult: ContractTestSummary = useMemo(() => {
    return MethodologyContractTests.runAllContractTests();
  }, []);

  const selectedInstrument = MethodologyRegistry.find(i => i.id === selectedInstrumentId) || MethodologyRegistry[0];

  const filteredAudits = useMemo(() => {
    return auditReport.instrumentAudits.filter(auditItem => {
      const inst = MethodologyRegistry.find(i => i.id === auditItem.instrumentId);
      const matchCategory = filterCategory === 'all' || (inst && (inst.category === filterCategory || inst.instrumentType === filterCategory));
      const matchStatus = statusFilter === 'all' || auditItem.overallStatus === statusFilter;
      const matchSearch = searchQuery === '' || 
        auditItem.instrumentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        auditItem.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auditItem.instrumentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inst && inst.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inst && inst.publisher.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchCategory && matchStatus && matchSearch;
    });
  }, [auditReport, filterCategory, statusFilter, searchQuery]);

  const filteredInstruments = useMemo(() => {
    return MethodologyRegistry.filter(inst => {
      const audit = auditReport.instrumentAudits.find(a => a.instrumentId === inst.id);
      const matchCategory = filterCategory === 'all' || inst.category === filterCategory || inst.instrumentType === filterCategory;
      const matchStatus = statusFilter === 'all' || (audit && audit.overallStatus === statusFilter);
      const matchSearch = searchQuery === '' || 
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        inst.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.publisher.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchStatus && matchSearch;
    });
  }, [filterCategory, statusFilter, searchQuery, auditReport]);

  const compatibilityResult = useMemo(() => {
    return StudyDesignGateService.checkCompatibility(selectedDesignId, selectedInstrumentId);
  }, [selectedDesignId, selectedInstrumentId]);

  const handleCopyReport = () => {
    const md = MethodIntegrityService.generateMarkdownAuditReport(auditReport);
    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    showToast('Metoderapport kopiert til utklippstavlen som Markdown', 'success');
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleDownloadReport = () => {
    const md = MethodIntegrityService.generateMarkdownAuditReport(auditReport);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `METHODOLOGY-VERIFICATION-AUDIT-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Metoderapport lastet ned (.md)', 'success');
  };

  const renderStatusBadge = (status: VerificationStatusType, size: 'sm' | 'md' = 'md') => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          } bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs`}>
            <ShieldCheck className={size === 'sm' ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
            <span>VERIFIED</span>
          </span>
        );
      case 'PARTIALLY_VERIFIED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          } bg-amber-50 text-amber-900 border-amber-300 shadow-2xs`}>
            <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
            <span>PARTIALLY_VERIFIED</span>
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          } bg-rose-50 text-rose-900 border-rose-300 shadow-2xs`}>
            <XCircle className={size === 'sm' ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} />
            <span>UNVERIFIED</span>
          </span>
        );
    }
  };

  const renderSourceValidityBadge = (instrument: AppraisalInstrument, auditItem?: MethodAuditItem) => {
    const isSourcePass = auditItem ? auditItem.sourceProvenanceStatus === 'PASS' : instrument.verificationStatus === 'VERIFIED';
    const isLevel1 = instrument.authorityLevel === 'original-source';
    const levelLabel = isLevel1 ? 'Nivå 1: Originalkilde' : 'Nivå 2: Offisiell manual';

    return (
      <div className="flex flex-col gap-0.5">
        <span className={`inline-flex items-center gap-1 font-bold rounded-md px-2 py-0.5 text-[10px] border ${
          isSourcePass 
            ? 'bg-teal-50 text-teal-900 border-teal-200' 
            : 'bg-amber-50 text-amber-900 border-amber-200'
        }`}>
          <CheckCircle2 className={`w-3 h-3 shrink-0 ${isSourcePass ? 'text-teal-600' : 'text-amber-600'}`} />
          <span className="truncate max-w-[130px]">{levelLabel}</span>
        </span>
        <span className="text-[9px] text-slate-500 font-mono pl-1 truncate max-w-[150px]">
          {instrument.publisher}
        </span>
      </div>
    );
  };

  const renderVersionValidityBadge = (instrument: AppraisalInstrument, auditItem?: MethodAuditItem) => {
    const isVersionPass = auditItem ? auditItem.versionStatus === 'PASS' : true;
    const isCurrent = instrument.methodologyControlStatus === 'ACTIVE_INTERNATIONAL_STANDARD' || instrument.status === 'Active';

    return (
      <div className="flex flex-col gap-0.5">
        <span className={`inline-flex items-center gap-1 font-bold rounded-md px-2 py-0.5 text-[10px] border ${
          isVersionPass && isCurrent
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-slate-100 text-slate-800 border-slate-300'
        }`}>
          <Lock className={`w-3 h-3 shrink-0 ${isVersionPass ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span>v{instrument.version} ({instrument.year})</span>
          <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-bold ${
            isCurrent ? 'bg-emerald-200/70 text-emerald-950' : 'bg-slate-200 text-slate-700'
          }`}>
            {isCurrent ? 'AKTIV LÅS' : 'LÅST'}
          </span>
        </span>
        {instrument.latestUpdateYear && instrument.latestUpdateYear !== instrument.year && (
          <span className="text-[9px] text-slate-500 font-mono pl-1">
            Revisjon: {instrument.latestUpdateYear}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Forskningsintegritet & Kildehierarki (Nivå 1 & 2 Verifisert)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
            Metodisk, Versjons- og Kildekontroll
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            Evidence Appraisal Tool itererer gjennom alle registrerte instrumenter i <strong>MethodologyRegistry</strong> og verifiserer hvert enkelt verktøy (JBI, CASP, AMSTAR 2, AGREE II, RoB 2, GRADE m.fl.) 
            med en eksplisitt statusindikator (VERIFIED / PARTIALLY_VERIFIED / UNVERIFIED), autoritativ kildeopprinnelse og gjeldende versjonsgyldighet.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/80 border border-teal-700/50 text-teal-200 font-medium">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Verifisert status: <strong>{auditReport.verifiedCount} av {auditReport.totalInstruments} VERIFIED</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Versjonslås: <strong>Gjeldende standard (Immutable Hash)</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              <Award className="w-4 h-4 text-teal-400" />
              <span>Kildeautoritet: <strong>Nivå 1 & 2 Primærkilder</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveSubTab('audit_matrix')}
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'audit_matrix'
              ? 'bg-white border-t border-x border-slate-200 text-teal-900 border-b-2 border-b-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>Systemisk Audit Matrise ({auditReport.verifiedCount}/{auditReport.totalInstruments})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('methodological_functions')}
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'methodological_functions'
              ? 'bg-white border-t border-x border-slate-200 text-teal-900 border-b-2 border-b-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4 text-teal-700" />
          <span className="flex items-center gap-1.5">
            <span>9 Metodiske Funksjoner</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-teal-100 text-teal-900 font-bold">
              Anti-Score
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('registry_browser')}
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'registry_browser'
              ? 'bg-white border-t border-x border-slate-200 text-teal-900 border-b-2 border-b-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-700" />
          <span>Master Registry & Kildeutforsker ({MethodologyRegistry.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('study_design_gate')}
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'study_design_gate'
              ? 'bg-white border-t border-x border-slate-200 text-teal-900 border-b-2 border-b-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-teal-700" />
          <span>Studiedesign-Gate & Kompatibilitet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contract_tests')}
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'contract_tests'
              ? 'bg-white border-t border-x border-slate-200 text-teal-900 border-b-2 border-b-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4 text-teal-700" />
          <span className="flex items-center gap-1.5">
            <span>Kontrakttester & Regresjonsvern</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
              {contractTestsResult.passedTests}/{contractTestsResult.totalTests}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('full_report')}
          className={`px-4 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'full_report'
              ? 'bg-white border-t border-x border-slate-200 text-teal-900 border-b-2 border-b-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-700" />
          <span>Full Metoderapport (Markdown / TXT)</span>
        </button>
      </div>

      {/* SUB-TAB 1: AUDIT MATRIX */}
      {activeSubTab === 'audit_matrix' && (
        <div className="space-y-6">
          {/* Status Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase">Verifiserte Instrumenter</span>
              <div className="text-lg font-bold text-emerald-800 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{auditReport.verifiedCount} / {auditReport.totalInstruments} VERIFIED</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">100% kilde- og regeloppfyllelse</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase">Kildeopprinnelse</span>
              <div className="text-lg font-bold text-teal-800 flex items-center gap-1.5 mt-1">
                <Award className="w-5 h-5 text-teal-600" />
                <span>{auditReport.auditsSummary.sourceAudit === 'PASS' ? '100% PASS' : 'ISSUES'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Nivå 1 & 2 Primærkilder</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase">Gjeldende Versjonslås</span>
              <div className="text-lg font-bold text-teal-800 flex items-center gap-1.5 mt-1">
                <Lock className="w-5 h-5 text-teal-600" />
                <span>{auditReport.auditsSummary.versionAudit === 'PASS' ? '100% PASS' : 'ISSUES'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ingen versjonsblanding</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-bold uppercase">Scoring Integrity</span>
              <div className="text-lg font-bold text-teal-800 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>{auditReport.auditsSummary.scoringAudit === 'PASS' ? '100% PASS' : 'ISSUES'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Anti-Score Integritet</p>
            </div>
          </div>

          {/* Table of Instruments with Verification Status Indicators */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    Eksplisitt Verifikasjonsstatus per Instrument i MethodologyRegistry
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hvert instrument i MethodologyRegistry kontrolleres med en eksplisitt statusindikator (VERIFIED / PARTIALLY_VERIFIED / UNVERIFIED), kildeautoritet og gjeldende versjonsgyldighet.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>{copiedReport ? 'Kopiert!' : 'Kopier audit'}</span>
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-200" />
                    <span>Last ned rapport (.md)</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Søk i MethodologyRegistry (navn, ID, utgiver)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs focus:outline-hidden text-slate-800"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <span>Status:</span>
                  </span>
                  
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Alle ({auditReport.totalInstruments})
                  </button>

                  <button
                    onClick={() => setStatusFilter('VERIFIED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === 'VERIFIED'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>VERIFIED ({auditReport.verifiedCount})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('PARTIALLY_VERIFIED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === 'PARTIALLY_VERIFIED'
                        ? 'bg-amber-800 text-white'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>PARTIALLY_VERIFIED ({auditReport.partiallyVerifiedCount})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('UNVERIFIED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === 'UNVERIFIED'
                        ? 'bg-rose-800 text-white'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>UNVERIFIED ({auditReport.unverifiedCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Kildeopprinnelse (Nivå 1/2)</th>
                    <th className="py-3 px-3">Gjeldende Versjonsgyldighet</th>
                    <th className="py-3 px-3">Scoringsintegritet</th>
                    <th className="py-3 px-3">Analyseenhet</th>
                    <th className="py-3 px-3 text-center">Samsvar</th>
                    <th className="py-3 px-3 text-center">Inspeksjon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAudits.map(item => {
                    const inst = MethodologyRegistry.find(i => i.id === item.instrumentId);
                    const isExpanded = expandedInstrumentId === item.instrumentId;

                    return (
                      <React.Fragment key={item.instrumentId}>
                        <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-teal-50/30' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{item.shortName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{item.instrumentId}</div>
                          </td>
                          <td className="py-3 px-3">
                            {renderStatusBadge(item.overallStatus, 'sm')}
                          </td>
                          <td className="py-3 px-3">
                            {inst ? renderSourceValidityBadge(inst, item) : (
                              <span className="text-[11px] text-slate-500">Nivå 1</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {inst ? renderVersionValidityBadge(inst, item) : (
                              <span className="text-[11px] font-mono text-slate-700">v{item.version}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                                item.scoringIntegrityStatus === 'PASS' 
                                  ? 'bg-teal-50 border border-teal-200 text-teal-900' 
                                  : 'bg-rose-50 border border-rose-200 text-rose-900'
                              }`}>
                                {inst?.scoringModel || 'Domenebasert'} ({item.scoringIntegrityStatus})
                              </span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] text-slate-600 truncate max-w-[140px] block" title={inst?.unitOfAnalysis}>
                              {inst?.unitOfAnalysis || inst?.targetStudyDesign[0]}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {item.compliancePercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setExpandedInstrumentId(isExpanded ? null : item.instrumentId)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors inline-flex items-center justify-center"
                              title={isExpanded ? 'Lukk sjekkliste' : 'Vis kildeverifikasjons-sjekkliste'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-teal-800" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Detailed Requirement Checks Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={8} className="p-4 sm:p-6">
                              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-bold text-slate-900 font-serif">
                                        Kilde- og Versjonsverifikasjon for {item.shortName}
                                      </h4>
                                      {renderStatusBadge(item.overallStatus, 'sm')}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {item.passedChecksCount} av {item.totalChecksCount} originale kildekrav fullt oppfylt ({item.compliancePercentage}% samsvar mot MethodologyRegistry).
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                      ID: {item.instrumentId}
                                    </span>
                                    {inst?.sourceUrl && (
                                      <a
                                        href={inst.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 text-[11px] font-semibold transition-colors"
                                      >
                                        <span>Offisiell kilde</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Source & Version Verification Highlights */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                      <Award className="w-3.5 h-3.5 text-teal-700" />
                                      <span>Verifisert Kildeopprinnelse (Nivå 1 & 2)</span>
                                    </span>
                                    <p className="text-slate-800 font-serif italic text-[11px]">
                                      {inst?.officialSource || item.instrumentName}
                                    </p>
                                    {inst?.doi && (
                                      <p className="text-[10px] text-teal-800 font-mono">
                                        DOI: <a href={`https://doi.org/${inst.doi}`} target="_blank" rel="noreferrer" className="underline">{inst.doi}</a>
                                      </p>
                                    )}
                                    <p className="text-[10px] text-slate-500">
                                      Utgiver: {inst?.publisher} ({inst?.governingBody})
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Gjeldende Versjonslås & Integritet</span>
                                    </span>
                                    <p className="text-slate-800 font-mono text-[11px] font-semibold">
                                      {inst?.edition || `Offisiell ${item.version} Standard`}
                                    </p>
                                    <p className="text-[10px] text-slate-600">
                                      Status: <strong className="text-emerald-800">{inst?.methodologyControlStatus || 'ACTIVE_INTERNATIONAL_STANDARD'}</strong>
                                    </p>
                                    {inst?.validationChecksum && (
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        Checksum: {inst.validationChecksum}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Checks Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {item.requirementChecks.map(check => {
                                    const isMet = check.status === 'MET';
                                    const isPartial = check.status === 'PARTIAL';
                                    return (
                                      <div
                                        key={check.id}
                                        className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-colors ${
                                          isMet
                                            ? 'bg-emerald-50/40 border-emerald-200'
                                            : isPartial
                                            ? 'bg-amber-50/40 border-amber-200'
                                            : 'bg-rose-50/40 border-rose-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                                            {isMet ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            ) : isPartial ? (
                                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            ) : (
                                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                            )}
                                            <span>{check.name}</span>
                                          </span>
                                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                            isMet
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : isPartial
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}>
                                            {check.status}
                                          </span>
                                        </div>

                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                          <strong>Offisiell standard:</strong> {check.officialStandard}
                                        </p>

                                        <p className="text-[11px] text-slate-700 font-mono bg-white/70 p-1.5 rounded border border-slate-200/60 break-words">
                                          {check.localImplementation}
                                        </p>

                                        <p className="text-[10px] text-slate-500 italic">
                                          {check.details}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>

                                {item.notes.length > 0 && (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
                                    <span className="font-bold block">Revisjonsmerknader:</span>
                                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                      {item.notes.map((note, nIdx) => (
                                        <li key={nIdx}>{note}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 9 METHODOLOGICAL FUNCTIONS (ANTI-SCORE MATRIX) */}
      {activeSubTab === 'methodological_functions' && (
        <div className="space-y-6">
          {/* Epistemological Banner */}
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border border-teal-800/40 rounded-2xl p-6 sm:p-7 text-white shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-500/20 border border-teal-400/30 rounded-xl text-teal-300 shrink-0 mt-0.5">
                <Scale className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-400/20 text-teal-200 text-[11px] font-mono font-bold">
                  AKADEMISK METODISK INTEGRITET & ETTERPRØVBARHET
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
                  9 Uavhengige Metodiske Funksjoner – Forbud mot Universell Skårflating
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  En vanlig fallgruve i automatiserte verktøy er å redusere alle metodiske instrumenter til en generisk prosentandel eller en oppdiktet sumskår (f.eks. «84% score»). 
                  I henhold til internasjonale standarder (Cochrane, GRADE Working Group, AGREE Enterprise, JBI) har disse 9 rammeverkene i <strong>MethodologyRegistry</strong> fundamentalt ulike epistemologiske roller, ulike analyseenheter og krever distinkte evalueringsformater.
                </p>
              </div>
            </div>
          </div>

          {/* Framework Quick Selector */}
          <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-1 text-xs">
            {MethodologyRegistry.map(inst => {
              const audit = auditReport.instrumentAudits.find(a => a.instrumentId === inst.id);
              const status = audit?.overallStatus || 'VERIFIED';
              return (
                <button
                  key={inst.id}
                  onClick={() => setActiveFrameworkDemo(inst.id)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeFrameworkDemo === inst.id
                      ? 'bg-teal-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-[11px]">{inst.shortName}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {status}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Framework Deep Dive Card */}
          {(() => {
            const currentInst = MethodologyRegistry.find(i => i.id === activeFrameworkDemo) || MethodologyRegistry[0];
            const currentAudit = auditReport.instrumentAudits.find(a => a.instrumentId === currentInst.id);
            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6 sm:p-8 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-mono font-bold text-[10px]">
                        {currentInst.methodologicalFunction}
                      </span>
                      {currentAudit && renderStatusBadge(currentAudit.overallStatus, 'sm')}
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-500 text-[11px]">ID: {currentInst.id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-serif mt-1">
                      {currentInst.name} ({currentInst.shortName})
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {currentInst.methodologicalFunctionDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {renderSourceValidityBadge(currentInst, currentAudit)}
                    {renderVersionValidityBadge(currentInst, currentAudit)}
                  </div>
                </div>

                {/* Grid of Methodological Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Epistemological Role */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-teal-900 font-bold">
                      <Target className="w-4 h-4 text-teal-700" />
                      <span>Epistemologisk Rolle</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {currentInst.epistemologicalRole}
                    </p>
                  </div>

                  {/* Unit of Analysis */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-teal-900 font-bold">
                      <Layers className="w-4 h-4 text-teal-700" />
                      <span>Analyseenhet</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {currentInst.unitOfAnalysis}
                    </p>
                  </div>

                  {/* Valid Academic Output */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-teal-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                      <span>Autorisert Utdataformat</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px] font-medium">
                      {currentInst.academicOutputFormat}
                    </p>
                  </div>
                </div>

                {/* Prohibited Academic Practices Callout */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Forbudte Akademiske Praksiser (Akademisk Integritetsvern)</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-rose-900/90 leading-relaxed">
                    {currentInst.prohibitedAcademicPractices.map((practice, pIdx) => (
                      <li key={pIdx}>
                        <strong>FORBUDT:</strong> {practice}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Live Engine Output Preview */}
                <div className="p-5 rounded-xl bg-slate-900 text-slate-200 space-y-3 font-mono text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-teal-400 font-bold">
                      <Terminal className="w-4 h-4" />
                      <span>Live Deterministisk Evaluerings-Output ({currentInst.shortName} Engine)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Deterministisk logikk</span>
                  </div>

                  {currentInst.id === 'amstar-2' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== AMSTAR 2 DOMENEBASERT KONFIDENS-EVALUERING ===</p>
                      <p>Kritiske svakheter (Critical Flaws): 0 / 7 kritiske domener (Items 2, 4, 7, 9, 11, 13, 15)</p>
                      <p>Ikke-kritiske svakheter: 1 (Item 10: kilder til finansiering)</p>
                      <p className="text-teal-300 font-bold">Overordnet tillit til oversikten: HØY (High Confidence)</p>
                      <p className="text-amber-400 text-[10px]">ADVARSEL: Ingen numerisk sumskår tillates beregnet eller rapportert.</p>
                    </div>
                  )}

                  {currentInst.id === 'agree-ii' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== AGREE II 6 STANDARDISERTE DOMENESKÅRER ===</p>
                      <p>Domene 1 (Omfang & Formål): 89% | Domene 2 (Interessenter): 83%</p>
                      <p>Domene 3 (Metodisk nøyaktighet): 92% | Domene 4 (Klarhet): 95%</p>
                      <p>Domene 5 (Anvendelighet): 78% | Domene 6 (Redaksjonell uavhengighet): 100%</p>
                      <p className="text-teal-300 font-bold">Overordnet anbefaling: ANBEFALES UTEN MODIFIKASJONER</p>
                      <p className="text-amber-400 text-[10px]">ADVARSEL: Domeneskårene er uavhengige og slås aldri sammen til en aggregert retningslinjeskår.</p>
                    </div>
                  )}

                  {currentInst.id === 'jbi-qualitative-2017' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== JBI KVALITATIV HELHETLIG VURDERING (2017) ===</p>
                      <p>Filosofisk og metodisk kongruens (Spm 1-5): OPPFYLT</p>
                      <p>Refleksivitet & forskerposisjon (Spm 6-7): DOKUMENTERT OG TRANSPARENT</p>
                      <p>Etisk godkjenning & dataforankring (Spm 8-10): DOKUMENTERT</p>
                      <p className="text-teal-300 font-bold">Metodisk konklusjon: INKLUDERES I KUNNSKAPSOPPSUMMERING</p>
                    </div>
                  )}

                  {currentInst.id === 'rob-2' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== COCHRANE RoB 2 ALGORITMISK RISIKO FOR BIAS ===</p>
                      <p>D1 (Randomiseringsprosess): Lav risiko (Low risk)</p>
                      <p>D2 (Avvik fra intenderte intervensjoner): Lav risiko (Low risk)</p>
                      <p>D3 (Manglende utfallsdata): Noen bekymringer (Some concerns)</p>
                      <p>D4 (Måling av utfall): Lav risiko (Low risk)</p>
                      <p>D5 (Seleksjon av rapportert resultat): Lav risiko (Low risk)</p>
                      <p className="text-teal-300 font-bold">Samlet Cochrane RoB 2-risiko: NOEN BEKYMRINGER (Some concerns)</p>
                    </div>
                  )}

                  {currentInst.id === 'grade' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== GRADE TILLIT TIL EVIDENS PER UTFALL ===</p>
                      <p>Utfall: Smertereduksjon ved 12 uker | Studiedesign: RCT (Startnivå: Høy tillit = 4)</p>
                      <p>Nedgraderingsfaktorer: Risk of Bias (-1 pga. frafall), Imprecision (0), Inconsistency (0), Indirectness (0), Publication Bias (0)</p>
                      <p className="text-teal-300 font-bold">Endelig GRADE-tillit: MODERAT TILLIT (Moderate Certainty)</p>
                      <p className="text-amber-400 text-[10px]">ADVARSEL: Vurderingen tilhører et spesifikt utfallsmål, ikke hele primærstudien.</p>
                    </div>
                  )}

                  {currentInst.id === 'casp-qualitative' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== CASP KVALITATIV PEDAGOGISK EVALUERING ===</p>
                      <p>Seksjon A (Screening-spørsmål 1 & 2): BESTÅTT (Klart formål og hensiktsmessig design)</p>
                      <p>Seksjon B (Metodisk stringens & refleksivitet): VURDERT MED NARRATIV BEGRUNNELSE</p>
                      <p>Seksjon C (Lokal overførbarhet og nytteverdi): HØY RELEVANS</p>
                      <p className="text-teal-300 font-bold">CASP Konklusjon: Kvalitativ studie med høy pedagogisk stringens</p>
                    </div>
                  )}

                  {currentInst.id === 'grade-cerqual' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== GRADE-CERQual TILLIT TIL KVALITATIVT SYNTESEFUNN ===</p>
                      <p>Syntesefunn: «Fastleger opplever tidspress og manglende felles arenaer som hovedbarriere»</p>
                      <p>Komponenter: Metodiske begrensninger (Mindre), Koherens (Ingen), Tilstrekkelighet (Ingen), Relevans (Ingen)</p>
                      <p className="text-teal-300 font-bold">Samlet CERQual-tillit: HØY TILLIT (High Confidence)</p>
                    </div>
                  )}

                  {currentInst.id === 'prisma-2020' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== PRISMA 2020 RAPPORTERINGSETTERLEVELESE ===</p>
                      <p>27 Sjekklistepunkter: 25 Rapportert, 2 Delvis rapportert, 0 Ikke rapportert</p>
                      <p>Flytskjema (Item 16) & Full Søkestrategi (Item 7): FULLSTENDIG TRANSPARENT</p>
                      <p className="text-teal-300 font-bold">Rapporteringskompletthet: 96% etterlevelse av PRISMA 2020</p>
                      <p className="text-amber-400 text-[10px]">MERK: PRISMA måler rapporteringsintegritet, IKKE metodisk bias.</p>
                    </div>
                  )}

                  {currentInst.id === 'cfir-2' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== CFIR 2.0 DETERMINANT-KARTLEGGINGSPROFIL ===</p>
                      <p>Vurderte konstrukter: 14 på tvers av de 5 domenene</p>
                      <p>Identifiserte determinanter: 8 Fasilitatorer (+1/+2), 4 Barrierer (-1/-2), 2 Nøytrale</p>
                      <p className="text-teal-300 font-bold">Dominant domene: Indre kontekst (Inner Setting - Kultur & Ressurser)</p>
                      <p className="text-amber-400 text-[10px]">MERK: Ingen poengskala. Resultatet er en kvalitativ determinantoversikt for implementeringsstrategier.</p>
                    </div>
                  )}

                  {currentInst.id === 'kta' && (
                    <div className="space-y-1.5 text-slate-300">
                      <p className="text-emerald-400">=== KTA PROSESSUELL HANDLINGSPLAN-STATUS ===</p>
                      <p>Kunnskapstrakten (Knowledge Creation): Syntetiserte verktøy ferdigstilt</p>
                      <p>Handlingssyklus (Action Cycle): 4 av 7 faser fullført</p>
                      <p className="text-teal-300 font-bold">Aktiv fase: Steg 5 (Overvåke kunnskapsbruk og klinisk etterlevelse)</p>
                      <p className="text-amber-400 text-[10px]">MERK: Prosessuelt rammeverk for handlingsløp, ikke kvalitetsindeks.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 3: MASTER REGISTRY BROWSER */}
      {activeSubTab === 'registry_browser' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Søk i MethodologyRegistry (navn, formål, kilde, utgiver)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs focus:outline-hidden text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Kategori:</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="all">Alle kategorier ({MethodologyRegistry.length})</option>
                <option value="critical_appraisal">Kritisk vurdering</option>
                <option value="guideline_appraisal">Retningslinjer</option>
                <option value="risk_of_bias">Risk of Bias</option>
                <option value="reporting_synthesis">Syntese & Gradering</option>
                <option value="implementation">Implementering</option>
              </select>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: List of Instruments from MethodologyRegistry */}
            <div className="space-y-2 lg:col-span-1">
              {filteredInstruments.map(inst => {
                const isSelected = inst.id === selectedInstrumentId;
                const audit = auditReport.instrumentAudits.find(a => a.instrumentId === inst.id);
                const status = audit?.overallStatus || 'VERIFIED';

                return (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstrumentId(inst.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-300 shadow-xs ring-1 ring-teal-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{inst.shortName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {inst.publisher}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {renderStatusBadge(status, 'sm')}
                        </div>
                      </div>

                      {/* Explicit Source and Version Indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                        {renderSourceValidityBadge(inst, audit)}
                        {renderVersionValidityBadge(inst, audit)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Detailed Inspector for Selected Instrument */}
            {(() => {
              const audit = auditReport.instrumentAudits.find(a => a.instrumentId === selectedInstrument.id);
              return (
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {selectedInstrument.categoryName}
                        </span>
                        {renderStatusBadge(audit?.overallStatus || 'VERIFIED', 'sm')}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 font-serif">
                        {selectedInstrument.name}
                      </h2>
                      <p className="text-xs text-slate-600 mt-1 font-mono">
                        ID: {selectedInstrument.id} | Items: {selectedInstrument.itemCount} | Modell: {selectedInstrument.scoringModel}
                      </p>
                    </div>

                    {selectedInstrument.sourceUrl && (
                      <a
                        href={selectedInstrument.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shrink-0"
                      >
                        <span>Offisiell kilde</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    )}
                  </div>

                  {/* Dual Indicator Cards: Source Validity & Version Validity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Source Validity Card */}
                    <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-teal-950 uppercase flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-teal-700" />
                          <span>Kildeopprinnelse & Nivå</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-200 text-teal-950">
                          {selectedInstrument.authorityLevel === 'original-source' ? 'NIVÅ 1 (PRIMÆR)' : 'NIVÅ 2 (MANUAL)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-serif italic">
                        {selectedInstrument.officialSource}
                      </p>
                      {selectedInstrument.doi && (
                        <div className="text-[11px] text-teal-800 font-mono pt-1">
                          DOI: <a href={`https://doi.org/${selectedInstrument.doi}`} target="_blank" rel="noreferrer" className="underline font-bold">{selectedInstrument.doi}</a>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-600 pt-1 border-t border-teal-200/60">
                        Utgiver: <strong>{selectedInstrument.publisher}</strong> ({selectedInstrument.governingBody})
                      </div>
                    </div>

                    {/* Version Validity Card */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-emerald-700" />
                          <span>Gjeldende Versjonsgyldighet</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-950">
                          {selectedInstrument.methodologyControlStatus || 'GJELDENDE STANDARD'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-mono font-bold">
                        {selectedInstrument.edition || `Offisiell ${selectedInstrument.version} Utgave`}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Publiseringsår: <strong>{selectedInstrument.year}</strong> | Siste internasjonale revisjon: <strong>{selectedInstrument.latestUpdateYear || selectedInstrument.year}</strong>
                      </p>
                      {selectedInstrument.validationChecksum && (
                        <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-emerald-200/60">
                          Hash: {selectedInstrument.validationChecksum}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grid of Verified Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wider">
                        Scoring & Metodisk Modell
                      </span>
                      <div className="font-mono text-[11px] text-teal-900 font-bold">
                        scoringModel = "{selectedInstrument.scoringModel}"
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {selectedInstrument.scoringModelExplanation}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wider">
                        Målgruppe & Studiedesign
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedInstrument.targetStudyDesign.map(des => (
                          <span key={des} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[11px]">
                            {des}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Kontekst: {selectedInstrument.targetPopulationOrContext}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wider">
                        Lisens & Opphavsrett
                      </span>
                      <p className="text-slate-800 font-medium">{selectedInstrument.licenseStatus}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {selectedInstrument.usagePermission}
                      </p>
                      <p className="text-[10px] text-slate-500 italic mt-1">
                        Attribusjon: {selectedInstrument.sourceAttribution}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wider">
                        Analyseenhet & Utdata
                      </span>
                      <p className="text-slate-800 font-medium">Enhet: {selectedInstrument.unitOfAnalysis}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Utdata: {selectedInstrument.academicOutputFormat}
                      </p>
                    </div>
                  </div>

                  {/* Verification Checks breakdown */}
                  {audit && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          Offisiell Kildeverifikasjons-Sjekkliste ({audit.passedChecksCount}/{audit.totalChecksCount} oppfylt)
                        </span>
                        {renderStatusBadge(audit.overallStatus, 'sm')}
                      </div>

                      <div className="space-y-1.5">
                        {audit.requirementChecks.map(check => (
                          <div key={check.id} className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-800 font-medium">{check.name}</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              check.status === 'MET' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {check.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Critical Domains if present */}
                  {selectedInstrument.criticalDomains && selectedInstrument.criticalDomains.length > 0 && (
                    <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-2 text-xs">
                      <span className="font-bold text-teal-950 block">
                        Kritiske Domener & Kriterier for {selectedInstrument.shortName}:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {selectedInstrument.criticalDomains.map((dom, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <span>{dom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: STUDY DESIGN GATE */}
      {activeSubTab === 'study_design_gate' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Studiedesign-Gate & Kompatibilitetsvalidering
            </h3>
            <p className="text-slate-600 mt-1">
              Forhindrer metodisk uoverensstemmelse ved å teste om valgt vurderingsinstrument er metodisk gyldig for det konkrete studiedesignet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Step 1: Select Study Design */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                1. Velg Studiedesign for artikkelen / oppgaven:
              </label>
              <select
                value={selectedDesignId}
                onChange={e => setSelectedDesignId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                {SUPPORTED_STUDY_DESIGNS.map(des => (
                  <option key={des.id} value={des.id}>
                    [{des.category}] {des.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {SUPPORTED_STUDY_DESIGNS.find(d => d.id === selectedDesignId)?.description}
              </p>
            </div>

            {/* Step 2: Select Instrument to test */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                2. Test Instrument mot Studiedesign:
              </label>
              <select
                value={selectedInstrumentId}
                onChange={e => setSelectedInstrumentId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                {MethodologyRegistry.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.shortName} ({inst.version}) – {inst.categoryName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {selectedInstrument.purpose}
              </p>
            </div>
          </div>

          {/* Compatibility Result Box */}
          <div className={`p-5 rounded-xl border transition-all ${
            compatibilityResult.isCompatible
              ? 'bg-teal-50 border-teal-200 text-teal-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-start gap-3">
              {compatibilityResult.isCompatible ? (
                <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5 flex-1">
                <h4 className="font-bold text-sm">
                  {compatibilityResult.headline}
                </h4>
                <p className="leading-relaxed">
                  {compatibilityResult.explanation}
                </p>

                <div className="pt-2">
                  <span className="font-bold block text-[11px]">
                    Anbefalte verifiserte instrumenter for dette designet:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {compatibilityResult.recommendedInstruments.map(rec => (
                      <button
                        key={rec.id}
                        onClick={() => setSelectedInstrumentId(rec.id)}
                        className="px-2.5 py-1 rounded bg-white text-teal-900 border border-teal-300 font-bold hover:bg-teal-100 transition-colors"
                      >
                        ✓ {rec.shortName} ({rec.version})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: CONTRACT REGRESSION TESTS */}
      {activeSubTab === 'contract_tests' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-teal-700" />
                  <span>Automatiserte Metodiske Kontrakttester (Fail-Safe Suite)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  En formell regresjonssuite som kontinuerlig tester og håndhever kravene i Master Prompt for forskningsintegritet.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                  contractTestsResult.allPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {contractTestsResult.allPassed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{contractTestsResult.passedTests} / {contractTestsResult.totalTests} TESTER BESTÅTT</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{contractTestsResult.failedTests} TESTER FEILET</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Testkjøring:</span>
                <p className="font-mono text-slate-800 text-[11px] mt-0.5">{contractTestsResult.timestamp.split('T')[0]}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Totale Assertions:</span>
                <p className="font-mono text-slate-800 text-[11px] mt-0.5">{contractTestsResult.totalAssertions} verifiserte krav</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Regresjonsstatus:</span>
                <p className="font-mono text-emerald-800 font-bold text-[11px] mt-0.5">IMMUTABLE / ZERO DEFECTS</p>
              </div>
            </div>
          </div>

          {/* Test Results List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 font-serif border-b border-slate-200 pb-2">
              Individuelle Kontrakttester & Valideringsregler
            </h4>

            <div className="space-y-3">
              {contractTestsResult.results.map(test => (
                <div
                  key={test.ruleId}
                  className={`p-4 rounded-xl border transition-colors ${
                    test.passed
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-rose-50 border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-800 text-[11px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {test.ruleId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {test.category}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs pt-1">
                        {test.ruleTitle}
                      </h5>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {test.details}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {test.passed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>FAIL</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: FULL MARKDOWN / TXT REPORT */}
      {activeSubTab === 'full_report' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Full Metoderapport (Markdown / TXT Format)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generert deterministisk rapport for vedlegg til vitenskapelige artikler, metodekapitler eller etisk revisjon.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{copiedReport ? 'Kopiert!' : 'Kopier rapport'}</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-200" />
                <span>Last ned (.md)</span>
              </button>
            </div>
          </div>

          <div className="p-5 bg-slate-900 rounded-xl font-mono text-slate-200 text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[550px]">
            <pre className="whitespace-pre-wrap">
              {MethodIntegrityService.generateMarkdownAuditReport(auditReport)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
