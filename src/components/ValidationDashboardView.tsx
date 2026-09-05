import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Play, Search, ShieldCheck } from 'lucide-react';
import { MethodologyContractTests, type ContractTestSummary, type TestResult } from '../services/methodologyContractTests';
import { MethodIntegrityService } from '../services/methodIntegrityService';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import type { ValidationDashboardInstrumentCard, ReleaseGateCheck } from '../types';

function statusClass(status: string): string {
  if (status === 'PASS' || status === 'VERIFIED' || status === 'TESTED') return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  if (status === 'PARTIAL' || status === 'PARTIALLY_VERIFIED' || status === 'NOT_TESTED') return 'bg-amber-100 text-amber-900 border-amber-300';
  return 'bg-rose-100 text-rose-900 border-rose-300';
}

export const ValidationDashboardView: React.FC = () => {
  const [testSummary, setTestSummary] = useState<ContractTestSummary>(() => MethodologyContractTests.runAllContractTests());
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | TestResult['level']>('ALL');

  const audit = useMemo(() => MethodIntegrityService.runFullSystemAudit(), [testSummary]);
  const auditById = useMemo(() => new Map(audit.instrumentAudits.map(item => [item.instrumentId, item])), [audit]);

  const instrumentCards: ValidationDashboardInstrumentCard[] = useMemo(() => {
    const resultsByInstrument = new Map<string, TestResult[]>();
    for (const result of testSummary.results) {
      const match = MASTER_INSTRUMENTS_REGISTRY.find(inst => result.ruleId.toLowerCase().includes(inst.id.toLowerCase()));
      if (!match) continue;
      resultsByInstrument.set(match.id, [...(resultsByInstrument.get(match.id) ?? []), result]);
    }
    return MASTER_INSTRUMENTS_REGISTRY.map(instrument => {
      const instrumentAudit = auditById.get(instrument.id);
      const results = resultsByInstrument.get(instrument.id) ?? [];
      const passed = results.filter(r => r.passed).length;
      const failed = results.length - passed;
      const status = instrumentAudit?.overallStatus ?? 'UNVERIFIED';
      return {
        instrumentId: instrument.id,
        instrumentName: instrument.shortName,
        version: instrument.version,
        statusBadge: status === 'VERIFIED' ? 'GREEN' : status === 'PARTIALLY_VERIFIED' ? 'YELLOW' : 'RED',
        statusExplanation: results.length ? `${passed}/${results.length} kjørte kontrakttester bestått; auditstatus ${status}.` : `Ingen eksplisitt runtime-test registrert; auditstatus ${status}.`,
        unitTestsStatus: results.some(r => r.level === 'LEVEL_1_UNIT') ? (results.filter(r => r.level === 'LEVEL_1_UNIT').every(r => r.passed) ? 'PASS' : 'FAIL') : 'NOT_TESTED',
        integrationTestsStatus: results.some(r => r.level === 'LEVEL_2_INTEGRATION') ? (results.filter(r => r.level === 'LEVEL_2_INTEGRATION').every(r => r.passed) ? 'PASS' : 'FAIL') : 'NOT_TESTED',
        referenceCasesCount: results.filter(r => r.level === 'LEVEL_3_REFERENCE').length,
        referenceCasesPassedCount: results.filter(r => r.level === 'LEVEL_3_REFERENCE' && r.passed).length,
        knownMismatchesCount: failed,
        sourceVerified: instrumentAudit?.sourceProvenanceStatus === 'PASS',
        lastValidationDate: instrument.verifiedAt,
        algorithmVersion: instrument.version,
        releaseGatePassed: status === 'VERIFIED' && failed === 0,
      };
    });
  }, [auditById, testSummary]);

  const filteredResults = useMemo(() => testSummary.results.filter(result => {
    const levelMatch = selectedLevel === 'ALL' || result.level === selectedLevel;
    const query = searchQuery.trim().toLowerCase();
    return levelMatch && (!query || `${result.ruleId} ${result.ruleTitle} ${result.details}`.toLowerCase().includes(query));
  }), [searchQuery, selectedLevel, testSummary.results]);

  const releaseGateChecks: ReleaseGateCheck[] = useMemo(() => [
    { id: 'RG-01', title: 'Alle kontrakttester bestått', passed: testSummary.allPassed, details: `${testSummary.passedTests}/${testSummary.totalTests}` },
    { id: 'RG-02', title: 'Instrumentkilder kontrollert', passed: audit.auditsSummary.sourceAudit === 'PASS', details: audit.auditsSummary.sourceAudit },
    { id: 'RG-03', title: 'Versjoner kontrollert', passed: audit.auditsSummary.versionAudit === 'PASS', details: audit.auditsSummary.versionAudit },
    { id: 'RG-04', title: 'Scoringsintegritet kontrollert', passed: audit.auditsSummary.scoringAudit === 'PASS', details: audit.auditsSummary.scoringAudit },
    { id: 'RG-05', title: 'Studiedesign-gating kontrollert', passed: audit.auditsSummary.studyDesignAudit === 'PASS', details: audit.auditsSummary.studyDesignAudit },
    { id: 'RG-06', title: 'Eksplisitt runtime-verifikasjon foreligger', passed: instrumentCards.every(card => card.releaseGatePassed), details: `${instrumentCards.filter(card => card.releaseGatePassed).length}/${instrumentCards.length}` },
  ], [audit, instrumentCards, testSummary]);

  const runTests = () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      setTestSummary(MethodologyContractTests.runAllContractTests());
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="space-y-6 pb-12">
      <header className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-teal-700 font-bold">METHODOLOGY VALIDATION</div>
            <h1 className="text-2xl font-bold text-slate-900">Runtime- og metodisk kontroll</h1>
            <p className="mt-1 text-sm text-slate-600">Status hentes fra kjørte kontrakttester og faktisk instrumentaudit. Ingen status markeres som bestått uten underliggende resultat.</p>
          </div>
          <button type="button" onClick={runTests} disabled={isRunning} className="inline-flex items-center gap-2 rounded-xl bg-teal-800 text-white px-4 py-2 text-sm font-bold disabled:opacity-50">
            <Play className="w-4 h-4" />
            {isRunning ? 'Kjører…' : 'Kjør validering'}
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-3">
        <Metric label="Tester" value={testSummary.totalTests} />
        <Metric label="Bestått" value={testSummary.passedTests} />
        <Metric label="Feilet" value={testSummary.failedTests} />
        <Metric label="Auditstatus" valueText={audit.overallSystemAudit} />
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-700" /> Instrumentstatus</h2>
          <span className="text-xs text-slate-500">{instrumentCards.length} registrerte instrumenter</span>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {instrumentCards.map(card => (
            <article key={card.instrumentId} className="rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-bold text-sm">{card.instrumentName}</h3><p className="text-[11px] text-slate-500">{card.instrumentId} · v{card.version}</p></div>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusClass(card.statusBadge === 'GREEN' ? 'VERIFIED' : card.statusBadge === 'YELLOW' ? 'PARTIAL' : 'UNVERIFIED')}`}>
                  {card.statusBadge === 'GREEN' ? 'VERIFIED' : card.statusBadge === 'YELLOW' ? 'PARTIAL' : 'UNVERIFIED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{card.statusExplanation}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <StatusStat label="Unit" value={card.unitTestsStatus} />
                <StatusStat label="Integrasjon" value={card.integrationTestsStatus} />
                <StatusStat label="Referanser" value={`${card.referenceCasesPassedCount}/${card.referenceCasesCount}`} />
                <StatusStat label="Source" value={card.sourceVerified ? 'PASS' : 'FAIL'} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Søk i testresultater…" className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm" /></div>
          <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value as typeof selectedLevel)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="ALL">Alle nivåer</option><option value="LEVEL_1_UNIT">Level 1</option><option value="LEVEL_2_INTEGRATION">Level 2</option><option value="LEVEL_3_REFERENCE">Level 3</option></select>
        </div>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {filteredResults.map(result => (
            <div key={result.ruleId} className="p-3 flex items-start gap-3 text-xs">
              {result.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />}
              <div className="min-w-0 flex-1"><div className="font-bold text-slate-900">{result.ruleTitle}</div><div className="text-slate-500 mt-0.5">{result.ruleId} · {result.level}</div><div className="text-slate-600 mt-1">{result.details}</div></div>
              <span className={`px-2 py-0.5 rounded-full border font-bold ${statusClass(result.passed ? 'PASS' : 'FAIL')}`}>{result.passed ? 'PASS' : 'FAIL'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-700" /> Release gate</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
          {releaseGateChecks.map(check => <div key={check.id} className="rounded-xl border border-slate-200 p-3 text-xs flex items-start gap-2">{check.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-700 shrink-0" />}<div><div className="font-bold">{check.title}</div><div className="text-slate-500">{check.details}</div></div></div>)}
        </div>
      </section>
    </section>
  );
};

function Metric({ label, value, valueText }: { label: string; value?: number; valueText?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="text-2xl font-bold mt-1">{valueText ?? value}</div></div>;
}
function StatusStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 border border-slate-200 p-2"><div className="text-slate-400">{label}</div><div className="font-bold">{value}</div></div>;
}
