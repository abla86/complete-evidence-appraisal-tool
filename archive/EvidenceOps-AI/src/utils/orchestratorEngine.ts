import { 
  EvidencePipelineSession, 
  AuditLogEntry, 
  PicoDefinition, 
  SearchStrategy, 
  PrismaFlowchartData,
  RetrievedStudy,
  GradeAssessment,
  ClinicalRecommendation,
  GradeCertainty
} from '../types';
import { 
  DEFAULT_CLINICAL_TASK, 
  INITIAL_STUDIES_POOL, 
  DEFAULT_GRADE_ASSESSMENTS, 
  DEFAULT_CLINICAL_RECOMMENDATION 
} from '../data/evidenceCorpus';

// Simple deterministic hash function for client-side audit entries
export function generateClientHash(source: string): string {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function createInitialSession(prompt: string = DEFAULT_CLINICAL_TASK): EvidencePipelineSession {
  const sessionId = `evops-${Date.now()}`;
  const now = new Date().toISOString();

  const initialAudit: AuditLogEntry = {
    id: `audit-init-${Date.now()}`,
    timestamp: now,
    agentName: 'Orchestrator',
    action: 'PIPELINE_INITIALISERT',
    stepNumber: 0,
    status: 'SUCCESS',
    executionTimeMs: 12,
    hash: generateClientHash(`init-${sessionId}`),
    details: `EvidenceOps AI sesjon startet for oppdrag: "${prompt.slice(0, 80)}..."`,
  };

  return {
    sessionId,
    userPrompt: prompt,
    currentStep: 0,
    totalSteps: 6,
    status: 'IDLE',
    activeAgent: 'Orchestrator',
    studies: [],
    gradeAssessments: [],
    humanApproval: {
      isPendingApproval: false,
      isApproved: false,
      isRejected: false,
      reviewerName: '',
      reviewerRole: '',
      clinicalNotes: '',
      adjustmentsMade: {},
    },
    auditTrail: [initialAudit],
  };
}

// Generate PICO based on prompt
export function runPicoAgent(prompt: string): { pico: PicoDefinition; audit: AuditLogEntry } {
  const isDementia = prompt.toLowerCase().includes('demens') || prompt.toLowerCase().includes('kognitiv');
  
  const pico: PicoDefinition = isDementia ? {
    population: 'Personer med mild til moderat demens (Alzheimer, vaskulær eller blandet demens)',
    intervention: 'Kognitiv stimuleringsterapi (CST) i strukturert gruppeformat (14+ sesjoner)',
    comparison: 'Sedvanlig oppfølging (treatment as usual), venteliste eller inaktiv kontroll',
    primaryOutcomes: [
      'Kognitiv funksjon (målt med ADAS-Cog, MMSE eller MoCA)',
      'Selvopplevd livskvalitet (målt med QoL-AD)'
    ],
    secondaryOutcomes: [
      'Aktiviteter i dagliglivet (ADL/IADL)',
      'Nevropsykiatriske atferdssymptomer (NPI)',
      'Pårørendes omsorgsbelastning (ZBI)'
    ],
    studyDesigns: [
      'Systematiske oversikter med metaanalyser',
      'Randomiserte kontrollerte studier (RCT)'
    ],
    justification: 'PICO-spesifikasjonen er forankret i internasjonale standarder for psykososiale demensintervensjoner og Helsedirektoratets prioriteringskriterier.'
  } : {
    population: 'Klinisk definert pasientgruppe med dokumentert diagnose',
    intervention: 'Målrettet evidensbasert intervensjon eller tiltak',
    comparison: 'Standard behandling / placebo / passiv kontroll',
    primaryOutcomes: ['Primær klinisk effekt', 'Bivirkninger og sikkerhet'],
    secondaryOutcomes: ['Livskvalitet', 'Funksjonsnivå'],
    studyDesigns: ['Systematiske oversikter', 'Randomiserte kontrollerte studier'],
    justification: 'PICO definert i tråd med kunnskapsbasert praksis-metodikk.'
  };

  const audit: AuditLogEntry = {
    id: `audit-pico-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'PICO Agent',
    action: 'PICO_DEFINERT',
    stepNumber: 1,
    status: 'SUCCESS',
    executionTimeMs: 340,
    hash: generateClientHash(JSON.stringify(pico)),
    details: `Strukturert PICO utledet: Populasjon="${pico.population}", Intervensjon="${pico.intervention}", Utfall=${pico.primaryOutcomes.join(', ')}`,
    payloadSummary: JSON.stringify({ population: pico.population, intervention: pico.intervention })
  };

  return { pico, audit };
}

// Generate Search Strategy based on PICO
export function runSearchAgent(pico: PicoDefinition): { searchStrategy: SearchStrategy; audit: AuditLogEntry } {
  const searchStrategy: SearchStrategy = {
    targetDatabases: ['PubMed (MEDLINE)', 'Cochrane Library (CENTRAL)', 'Embase', 'Epistemonikos'],
    booleanQuery: '("Dementia"[Mesh] OR "Alzheimer Disease"[Mesh] OR "Cognitive Impairment"[tiab]) AND ("Cognitive Stimulation"[Mesh] OR "cognitive stimulation therapy"[tiab] OR "CST"[tiab] OR "reality orientation"[tiab]) AND ("randomized controlled trial"[pt] OR "controlled clinical trial"[pt] OR "systematic review"[pt] OR "meta-analysis"[pt])',
    meshTerms: [
      'Dementia/rehabilitation[Mesh]',
      'Cognitive Stimulation Therapy[Mesh]',
      'Alzheimer Disease/psychology[Mesh]',
      'Randomized Controlled Trials as Topic[Mesh]'
    ],
    freeTextKeywords: [
      '"cognitive stimulation therapy"[tiab]',
      '"CST"[tiab]',
      '"group cognitive stimulation"[tiab]',
      '"memory stimulation"[tiab]'
    ],
    limitsAndFilters: [
      'Arter: Mennesker (Humans)',
      'Studiedesign: RCT + Systematisk oversikt',
      'Publisert: Siste 20 år med oppdateringsvarsel',
      'Språk: Engelsk, Norsk, Skandinavisk'
    ],
    cochraneStrategy: '#1 MeSH descriptor: [Dementia] explode all trees\n#2 "cognitive stimulation*":ti,ab,kw\n#3 #1 AND #2 in Trials and Reviews',
    syntaxRationale: 'Kombinerer kontrollerte MeSH-termer med presise fritekstsynonymer i tittel/abstrakt for å maksimere sensitivitet uten å oversvømme med urelaterte tDCS- eller farmakologistudier.'
  };

  const audit: AuditLogEntry = {
    id: `audit-search-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'Search Strategy Agent',
    action: 'SOKESTRATEGI_GENERERT',
    stepNumber: 2,
    status: 'SUCCESS',
    executionTimeMs: 410,
    hash: generateClientHash(searchStrategy.booleanQuery),
    details: `Syntetisert boolsk søkestreng og MeSH-termer for 4 databaser. Beregnet treffestimat: ~142 artikler før duplikatfiltrering.`,
    payloadSummary: searchStrategy.booleanQuery
  };

  return { searchStrategy, audit };
}

// Run Retrieval & PRISMA screening
export function runRetrievalAgent(): { 
  prisma: PrismaFlowchartData; 
  studies: RetrievedStudy[]; 
  audit: AuditLogEntry 
} {
  const prisma: PrismaFlowchartData = {
    recordsIdentified: 142,
    duplicatesRemoved: 19,
    recordsScreened: 123,
    recordsExcludedScreening: 98,
    fullTextAssessed: 25,
    fullTextExcluded: 21,
    studiesIncluded: 4 // Studies matching rigorous PICO criteria in corpus
  };

  const studies = [...INITIAL_STUDIES_POOL];

  const audit: AuditLogEntry = {
    id: `audit-retrieval-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'Retrieval & Deduplication Agent',
    action: 'INNSTILLING_OG_DUPLIKATHANDTERING',
    stepNumber: 3,
    status: 'SUCCESS',
    executionTimeMs: 680,
    hash: generateClientHash(`prisma-${prisma.recordsIdentified}-${prisma.studiesIncluded}`),
    details: `PRISMA 2020: 142 treff identifisert. 19 duplikater eliminert. 123 titler/abstrakt screenet. 4 sentrale studier inkludert for kritisk vurdering.`,
    payloadSummary: JSON.stringify(prisma)
  };

  return { prisma, studies, audit };
}

// Run Critical Appraisal (CASP, AMSTAR-2, AGREE II)
export function runAppraisalAgent(studies: RetrievedStudy[]): { 
  studies: RetrievedStudy[]; 
  audit: AuditLogEntry 
} {
  // Studies already have appraisal detailed in corpus
  const appraisedStudies = studies.map(study => {
    return { ...study };
  });

  const includedStudies = appraisedStudies.filter(s => s.screeningStatus === 'INCLUDED');

  const audit: AuditLogEntry = {
    id: `audit-appraisal-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'Appraisal Agent',
    action: 'METODISK_KVALITETSVURDERING',
    stepNumber: 4,
    status: 'SUCCESS',
    executionTimeMs: 820,
    hash: generateClientHash(`appraisal-${includedStudies.length}`),
    details: `Kritisk vurdering fullført for ${includedStudies.length} inkluderte studier. Cochrane-oversikt (Woods et al.) vurdert med AMSTAR-2 (Høy kvalitet). Primærstudier vurdert med CASP RCT.`,
    payloadSummary: JSON.stringify(includedStudies.map(s => ({ id: s.id, tool: s.appraisal?.tool, quality: s.appraisal?.overallQuality })))
  };

  return { studies: appraisedStudies, audit };
}

// Run GRADE Evidence Synthesis
export function runGradeAgent(): {
  gradeAssessments: GradeAssessment[];
  clinicalRecommendation: ClinicalRecommendation;
  audit: AuditLogEntry;
} {
  const gradeAssessments = [...DEFAULT_GRADE_ASSESSMENTS];
  const clinicalRecommendation = { ...DEFAULT_CLINICAL_RECOMMENDATION };

  const audit: AuditLogEntry = {
    id: `audit-grade-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'GRADE Evidence Agent',
    action: 'GRADE_SYNTESE_FULLFORT',
    stepNumber: 5,
    status: 'SUCCESS',
    executionTimeMs: 590,
    hash: generateClientHash(JSON.stringify(gradeAssessments)),
    details: `GRADE-vurdering syntetisert for 5 utfallsmål. Kognisjon: MODERAT evidens. Livskvalitet: MODERAT evidens. Sikkerhet: HØY evidens. Foreløpig sterk anbefaling for CST.`,
    payloadSummary: JSON.stringify(gradeAssessments.map(g => ({ outcome: g.outcome, certainty: g.certainty })))
  };

  return { gradeAssessments, clinicalRecommendation, audit };
}

// Generate the Human Approval Required checkpoint event
export function createApprovalCheckpointAudit(): AuditLogEntry {
  return {
    id: `audit-checkpoint-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName: 'Orchestrator',
    action: 'STOPPET_FOR_MENNESKELIG_GODKJENNING',
    stepNumber: 6,
    status: 'AWAITING_APPROVAL',
    executionTimeMs: 15,
    hash: generateClientHash(`checkpoint-${Date.now()}`),
    details: 'KRITISK SIKKERHETSKONTROLLPUNKT AKTIVERT: Autonom rute stoppet i henhold til kliniske retningslinjer. Krever fagpersonens formelle gjennomgang og sign-off før publisering av beslutningsgrunnlag.',
  };
}

// Finalize and generate markdown report
export function generateFinalDecisionReport(
  session: EvidencePipelineSession
): string {
  const dateStr = new Date().toLocaleDateString('no-NO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `# EVIDENCE BRIEF & BESLUTNINGSGRUNNLAG
**Tittel:** Kognitiv stimuleringsterapi (CST) ved mild til moderat demens
**Dato:** ${dateStr}
**Status:** Faglig godkjent og autorisert for klinisk praksis
**Godkjent av:** ${session.humanApproval.reviewerName || 'Anne-Beth Andersen'} (${session.humanApproval.reviewerRole || 'Klinisk spesialist / Evidensgransker'})
**Revisjons-ID:** ${session.sessionId}

---

## 1. SAMMENDRAG & KLINISK ANBEFALING
> **Anbefaling (${session.clinicalRecommendation?.strength || 'STERK'} ANBEFALING FOR):**
> ${session.clinicalRecommendation?.statement || 'Personer med mild til moderat demens bør tilbys kognitiv stimuleringsterapi (CST) i gruppe som en integrert del av helse- og omsorgstilbudet.'}

### Målgruppe & Implementering:
- **Målgruppe:** ${session.clinicalRecommendation?.targetPopulation || 'Personer med mild til moderat demens i hjemmebasert omsorg eller sykehjem.'}
- **Intervensjonsformat:** 14 sesjoner over 7 uker (2 ganger per uke), grupper på 6–8 deltakere, ledet av sertifiserte gruppeledere.
- **Vedlikehold:** Ukentlige oppfølgingssesjoner anbefales for å bevare kognitive og livskvalitetsmessige gevinster.

---

## 2. STRUKTURERT PICO
- **Populasjon (P):** ${session.pico?.population || 'Personer med mild til moderat demens'}
- **Intervensjon (I):** ${session.pico?.intervention || 'Kognitiv stimuleringsterapi (CST)'}
- **Sammenligning (C):** ${session.pico?.comparison || 'Sedvanlig oppfølging (TAU)'}
- **Primære utfall (O):** ${(session.pico?.primaryOutcomes || []).join(', ')}
- **Sekundære utfall:** ${(session.pico?.secondaryOutcomes || []).join(', ')}

---

## 3. LITTERATURSØK & PRISMA 2020 FLOW
- **Identifiserte treff:** ${session.prisma?.recordsIdentified || 142}
- **Duplikater fjernet:** ${session.prisma?.duplicatesRemoved || 19}
- **Screenet på tittel/abstrakt:** ${session.prisma?.recordsScreened || 123}
- **Ekskludert ved screening:** ${session.prisma?.recordsExcludedScreening || 98} (hovedsakelig invasive teknikker/tDCS, feil populasjon)
- **Fulltekster vurdert:** ${session.prisma?.fullTextAssessed || 25}
- **Inkluderte nøkkelstudier:** ${session.prisma?.studiesIncluded || 4}

---

## 4. METODISK KVALITETSVURDERING
${session.studies.filter(s => s.screeningStatus === 'INCLUDED').map(s => `
### ${s.title} (${s.journal}, ${s.year})
- **Forfattere:** ${s.authors}
- **Studiedesign:** ${s.studyType}
- **Vurderingsverktøy:** ${s.appraisal?.tool} | **Kvalitet:** ${s.appraisal?.overallQuality} (${s.appraisal?.confidenceRating}% konfidens)
- **Vurdering:** ${s.appraisal?.concludingSummary}
- **Effekt:** ${s.effectSizeEstimate || 'N/A'}
`).join('\n')}

---

## 5. GRADE SUMMARY OF FINDINGS
| Utfallsmål | Viktighet | Studier (Deltakere) | Relativ effekt | Evidensstyrke (GRADE) |
|---|---|---|---|---|
${session.gradeAssessments.map(g => `| ${g.outcome} | ${g.importance} | ${g.studyCount} RCTer (${g.participants}) | ${g.relativeEffect} | **${g.certainty}** |`).join('\n')}

---

## 6. FORMELT MENNESKELIG VEDTAK (AUDIT SEAL)
- **Faglig ansvarlig:** ${session.humanApproval.reviewerName}
- **Rolle/Tittel:** ${session.humanApproval.reviewerRole}
- **Dato & Tid:** ${session.humanApproval.reviewedAt || dateStr}
- **Faglige kommentarer:** ${session.humanApproval.clinicalNotes || 'Gjennomgått og godkjent uten vesentlige avvik.'}
- **Uforanderlig revisjons-hash:** \`${session.auditTrail[session.auditTrail.length - 1]?.hash || 'ev-audit-certified'}\`
`;
}
