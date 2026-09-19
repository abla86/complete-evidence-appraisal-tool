import React, { useState, useEffect } from 'react';
import { 
  createInitialSession,
  runPicoAgent,
  runSearchAgent,
  runRetrievalAgent,
  runAppraisalAgent,
  runGradeAgent,
  createApprovalCheckpointAudit,
  generateClientHash,
  generateFinalDecisionReport
} from './utils/orchestratorEngine';
import { 
  EvidencePipelineSession, 
  PicoDefinition, 
  GradeCertainty,
  AuditLogEntry
} from './types';
import { DEFAULT_CLINICAL_TASK } from './data/evidenceCorpus';
import { Navbar } from './components/Navbar';
import { TaskInputCard } from './components/TaskInputCard';
import { WorkflowTimeline } from './components/WorkflowTimeline';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { PicoCard } from './components/PicoCard';
import { SearchStrategyCard } from './components/SearchStrategyCard';
import { PrismaScreeningCard } from './components/PrismaScreeningCard';
import { AppraisalCard } from './components/AppraisalCard';
import { GradeTableCard } from './components/GradeTableCard';
import { HumanApprovalModal } from './components/HumanApprovalModal';
import { DecisionReportCard } from './components/DecisionReportCard';
import { AuditTrailCard } from './components/AuditTrailCard';
import { 
  ArrowRight, 
  Play, 
  FastForward, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  Layers,
  FileCheck2,
  Lock
} from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState<string>(DEFAULT_CLINICAL_TASK);
  const [session, setSession] = useState<EvidencePipelineSession>(() => createInitialSession(DEFAULT_CLINICAL_TASK));
  const [activeTab, setActiveTab] = useState<'pipeline' | 'architecture' | 'audit' | 'report'>('pipeline');
  const [activeStepView, setActiveStepView] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);

  // Synchronize active step view when currentStep advances
  useEffect(() => {
    if (session.currentStep > 0) {
      setActiveStepView(session.currentStep);
    }
  }, [session.currentStep]);

  // Handle pipeline step advancement
  const executeNextStep = async () => {
    setIsRunning(true);

    const stepToExecute = session.currentStep + 1;

    // Small delay to simulate realistic agent deliberation and tool communication
    await new Promise(resolve => setTimeout(resolve, 600));

    if (stepToExecute === 1) {
      // Step 1: PICO Agent
      const { pico, audit } = runPicoAgent(prompt);
      setSession(prev => ({
        ...prev,
        currentStep: 1,
        activeAgent: 'Search Strategy Agent',
        status: 'PROCESSING',
        pico,
        auditTrail: [...prev.auditTrail, audit],
      }));
    } else if (stepToExecute === 2) {
      // Step 2: Search Strategy Agent
      if (!session.pico) return;
      const { searchStrategy, audit } = runSearchAgent(session.pico);
      setSession(prev => ({
        ...prev,
        currentStep: 2,
        activeAgent: 'Retrieval & Deduplication Agent',
        status: 'PROCESSING',
        searchStrategy,
        auditTrail: [...prev.auditTrail, audit],
      }));
    } else if (stepToExecute === 3) {
      // Step 3: Retrieval & Deduplication Agent (PRISMA)
      const { prisma, studies, audit } = runRetrievalAgent();
      setSession(prev => ({
        ...prev,
        currentStep: 3,
        activeAgent: 'Appraisal Agent',
        status: 'PROCESSING',
        prisma,
        studies,
        auditTrail: [...prev.auditTrail, audit],
      }));
    } else if (stepToExecute === 4) {
      // Step 4: Critical Appraisal Agent (CASP / AMSTAR-2)
      const { studies, audit } = runAppraisalAgent(session.studies);
      setSession(prev => ({
        ...prev,
        currentStep: 4,
        activeAgent: 'GRADE Evidence Agent',
        status: 'PROCESSING',
        studies,
        auditTrail: [...prev.auditTrail, audit],
      }));
    } else if (stepToExecute === 5) {
      // Step 5: GRADE Evidence Agent
      const { gradeAssessments, clinicalRecommendation, audit } = runGradeAgent();
      
      // CRITICAL REQUIREMENT #11:
      // "Stoppe og kreve menneskelig godkjenning før faglige konklusjoner publiseres."
      const checkpointAudit = createApprovalCheckpointAudit();

      setSession(prev => ({
        ...prev,
        currentStep: 6, // Moves straight to Human Approval Checkpoint
        activeAgent: 'Human Gatekeeper',
        status: 'WAITING_FOR_HUMAN_APPROVAL',
        gradeAssessments,
        clinicalRecommendation,
        humanApproval: {
          ...prev.humanApproval,
          isPendingApproval: true,
        },
        auditTrail: [...prev.auditTrail, audit, checkpointAudit],
      }));
      setActiveStepView(6);
    }

    setIsRunning(false);
  };

  // Run autonomous agent route until Human Approval Checkpoint is hit
  const startAutonomousPipeline = async (auto: boolean) => {
    setAutoAdvance(auto);
    setIsRunning(true);

    // Re-initialize session with latest prompt
    const baseSession = createInitialSession(prompt);
    setSession(baseSession);
    setActiveStepView(1);

    // Step 1: PICO
    await new Promise(r => setTimeout(r, 450));
    const { pico, audit: audit1 } = runPicoAgent(prompt);

    if (!auto) {
      setSession({
        ...baseSession,
        currentStep: 1,
        activeAgent: 'Search Strategy Agent',
        status: 'PROCESSING',
        pico,
        auditTrail: [...baseSession.auditTrail, audit1],
      });
      setIsRunning(false);
      return;
    }

    // Step 2: Search Strategy
    await new Promise(r => setTimeout(r, 550));
    const { searchStrategy, audit: audit2 } = runSearchAgent(pico);

    // Step 3: Retrieval & PRISMA
    await new Promise(r => setTimeout(r, 650));
    const { prisma, studies, audit: audit3 } = runRetrievalAgent();

    // Step 4: Critical Appraisal
    await new Promise(r => setTimeout(r, 700));
    const { studies: appraisedStudies, audit: audit4 } = runAppraisalAgent(studies);

    // Step 5: GRADE Synthesis
    await new Promise(r => setTimeout(r, 600));
    const { gradeAssessments, clinicalRecommendation, audit: audit5 } = runGradeAgent();

    // Step 6: Trigger Mandatory Human Approval Gate
    const checkpointAudit = createApprovalCheckpointAudit();

    setSession({
      ...baseSession,
      currentStep: 6,
      activeAgent: 'Human Gatekeeper',
      status: 'WAITING_FOR_HUMAN_APPROVAL',
      pico,
      searchStrategy,
      prisma,
      studies: appraisedStudies,
      gradeAssessments,
      clinicalRecommendation,
      humanApproval: {
        isPendingApproval: true,
        isApproved: false,
        isRejected: false,
        reviewerName: '',
        reviewerRole: '',
        clinicalNotes: '',
        adjustmentsMade: {},
      },
      auditTrail: [
        ...baseSession.auditTrail,
        audit1,
        audit2,
        audit3,
        audit4,
        audit5,
        checkpointAudit,
      ],
    });

    setActiveStepView(6);
    setIsRunning(false);
  };

  // Human Approval Action (Clinical Sign-off)
  const handleApprove = async (reviewerName: string, reviewerRole: string, notes: string) => {
    setIsRunning(true);

    try {
      // Attempt server-side formal signature call
      const response = await fetch('/api/agents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName,
          reviewerRole,
          decision: 'APPROVED',
          clinicalNotes: notes,
          pipelineState: {
            sessionId: session.sessionId,
            pico: session.pico,
          }
        }),
      });

      let auditEntry: AuditLogEntry;

      if (response.ok) {
        const data = await response.json();
        auditEntry = data.auditEntry;
      } else {
        // Deterministic fallback if offline
        const now = new Date().toISOString();
        auditEntry = {
          id: `audit-approval-${Date.now()}`,
          timestamp: now,
          agentName: 'Human Reviewer',
          action: 'KLINISK_GODKJENNING_FULLFORT',
          stepNumber: 6,
          status: 'APPROVED',
          executionTimeMs: 40,
          hash: generateClientHash(`approved-${reviewerName}-${now}`),
          details: `Fagperson ${reviewerName} (${reviewerRole}) fullførte formell menneskelig godkjenning. Merknad: "${notes}". Beslutningsgrunnlag godkjent for publisering.`,
        };
      }

      setSession(prev => {
        const updated: EvidencePipelineSession = {
          ...prev,
          status: 'APPROVED_AND_FINALIZED',
          activeAgent: 'Audit & Export Engine',
          humanApproval: {
            isPendingApproval: false,
            isApproved: true,
            isRejected: false,
            reviewedAt: new Date().toLocaleDateString('no-NO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            reviewerName,
            reviewerRole,
            clinicalNotes: notes,
            adjustmentsMade: {},
          },
          auditTrail: [...prev.auditTrail, auditEntry],
        };
        updated.finalReportMarkdown = generateFinalDecisionReport(updated);
        return updated;
      });

      // Automatically switch to the published report tab
      setActiveTab('report');
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReject = (reviewerName: string, reviewerRole: string, notes: string) => {
    const auditEntry: AuditLogEntry = {
      id: `audit-reject-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentName: 'Human Reviewer',
      action: 'REVISJON_PÅKREVD',
      stepNumber: 6,
      status: 'WARNING',
      executionTimeMs: 25,
      hash: generateClientHash(`reject-${reviewerName}`),
      details: `Fagperson ${reviewerName} (${reviewerRole}) avviste eller krevde revisjon av utkastet. Merknad: "${notes}".`,
    };

    setSession(prev => ({
      ...prev,
      status: 'REJECTED',
      humanApproval: {
        ...prev.humanApproval,
        isPendingApproval: false,
        isRejected: true,
        reviewerName,
        reviewerRole,
        clinicalNotes: notes,
      },
      auditTrail: [...prev.auditTrail, auditEntry],
    }));
  };

  const handleUpdateCertainty = (outcomeIndex: number, newCertainty: GradeCertainty) => {
    setSession(prev => {
      const updated = [...prev.gradeAssessments];
      const prevCert = updated[outcomeIndex].certainty;
      updated[outcomeIndex] = {
        ...updated[outcomeIndex],
        certainty: newCertainty,
      };

      const audit: AuditLogEntry = {
        id: `audit-override-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentName: 'Human Reviewer',
        action: 'GRADE_OVERSTYRING',
        stepNumber: 5,
        status: 'SUCCESS',
        executionTimeMs: 15,
        hash: generateClientHash(`grade-${outcomeIndex}-${newCertainty}`),
        details: `Fagperson overstyrte GRADE-sikkerhet for "${updated[outcomeIndex].outcome}" fra ${prevCert} til ${newCertainty}.`,
      };

      return {
        ...prev,
        gradeAssessments: updated,
        auditTrail: [...prev.auditTrail, audit],
      };
    });
  };

  const handleReset = () => {
    setSession(createInitialSession(prompt));
    setActiveStepView(1);
    setActiveTab('pipeline');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        session={session}
        onReset={handleReset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Architecture Tab View */}
        {activeTab === 'architecture' && (
          <ArchitectureDiagram session={session} onNavigateStep={(step) => {
            setActiveStepView(step);
            setActiveTab('pipeline');
          }} />
        )}

        {/* Final Report Tab View */}
        {activeTab === 'report' && (
          <DecisionReportCard session={session} />
        )}

        {/* Audit Trail Tab View */}
        {activeTab === 'audit' && (
          <AuditTrailCard logs={session.auditTrail} sessionId={session.sessionId} />
        )}

        {/* Primary Pipeline Tab View */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            
            {/* 1. Task Definition & Initiation Card */}
            <TaskInputCard
              prompt={prompt}
              setPrompt={setPrompt}
              isRunning={isRunning}
              onStartPipeline={startAutonomousPipeline}
              currentStep={session.currentStep}
            />

            {/* 2. Interactive Step Tracker Ribbon */}
            {session.currentStep > 0 && (
              <WorkflowTimeline
                session={session}
                selectedStep={activeStepView}
                onSelectStep={(s) => setActiveStepView(s)}
              />
            )}

            {/* 3. Mandatory Human Approval Alert Gate (Shown when paused at step 6) */}
            {session.status === 'WAITING_FOR_HUMAN_APPROVAL' && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/70 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">
                      AUTONOM AGENTKJØRING STOPPET FOR MENNESKELIG SIKKERHETSKONTROLL
                    </h4>
                    <p className="text-xs text-amber-300/80">
                      Systemet krever formell gjennomgang og sign-off fra fagperson før beslutningsgrunnlaget publiseres.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStepView(6)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow"
                >
                  Åpne kontrollpunkt (Trinn 6) &rarr;
                </button>
              </div>
            )}

            {/* 4. Active Step Content Display */}
            <div className="transition-all duration-300">
              
              {/* Step 1: PICO Card */}
              {activeStepView === 1 && session.pico && (
                <PicoCard
                  pico={session.pico}
                  onUpdatePico={(newPico) => setSession(prev => ({ ...prev, pico: newPico }))}
                />
              )}

              {/* Step 2: Search Strategy Card */}
              {activeStepView === 2 && session.searchStrategy && (
                <SearchStrategyCard strategy={session.searchStrategy} />
              )}

              {/* Step 3: PRISMA & Studies Card */}
              {activeStepView === 3 && session.prisma && (
                <PrismaScreeningCard
                  prisma={session.prisma}
                  studies={session.studies}
                />
              )}

              {/* Step 4: Critical Appraisal Card */}
              {activeStepView === 4 && session.studies.length > 0 && (
                <AppraisalCard studies={session.studies} />
              )}

              {/* Step 5: GRADE Synthesis Card */}
              {activeStepView === 5 && session.gradeAssessments.length > 0 && (
                <GradeTableCard
                  assessments={session.gradeAssessments}
                  onUpdateCertainty={handleUpdateCertainty}
                />
              )}

              {/* Step 6: Human Approval Checkpoint Card */}
              {activeStepView === 6 && (
                <HumanApprovalModal
                  session={session}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}

            </div>

            {/* 5. Bottom Step Navigation & Controls (For Step-by-Step Mode) */}
            {session.currentStep > 0 && session.currentStep < 5 && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Neste agent i kø: <strong className="text-slate-200">{session.activeAgent}</strong>
                </div>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={executeNextStep}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow"
                >
                  <span>Kjør neste agent: Trinn {session.currentStep + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 6. Completed State CTA */}
            {session.status === 'APPROVED_AND_FINALIZED' && (
              <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-600/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Kunnskapsbasert beslutningsgrunnlag er godkjent og autorisert!
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Komplett evidensrapport med GRADE SoF-tabell, PRISMA 2020 og kryptografisk revisjonsspor er klar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer shrink-0"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Åpne ferdig beslutningsgrunnlag</span>
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-400">EvidenceOps AI</span> &bull; 
            Autonom agentplattform for kunnskapsbasert praksis & beslutningsstøtte
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>PRISMA 2020</span>
            <span>&bull;</span>
            <span>CASP RCT</span>
            <span>&bull;</span>
            <span>AMSTAR-2</span>
            <span>&bull;</span>
            <span>GRADE</span>
            <span>&bull;</span>
            <span className="text-emerald-400">Human-in-the-Loop</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
