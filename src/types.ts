export type AssessmentStatus = 'Ja' | 'Nei' | 'Uklart' | 'Ikke relevant' | 'Ja, med forbehold' | 'Yes' | 'No' | 'Unclear' | 'Not applicable';

export type InstrumentCategory = 
  | 'critical_appraisal' 
  | 'guideline_appraisal' 
  | 'risk_of_bias' 
  | 'implementation' 
  | 'reporting_synthesis'
  | 'ethics_governance'
  | 'certainty_framework';

export type InstrumentType =
  | 'critical-appraisal'
  | 'certainty-framework'
  | 'implementation-framework'
  | 'reporting-standard'
  | 'risk-of-bias'
  | 'ethics-framework'
  | 'guideline-framework';

// -------------------------------------------------------------
// DOCUMENT CLASSIFICATION & STUDY DESIGN GATING TYPES (Sections 8-22)
// -------------------------------------------------------------

export type StandardDocumentType =
  | 'PRIMARY_RESEARCH_ARTICLE'
  | 'SYSTEMATIC_REVIEW'
  | 'META_ANALYSIS'
  | 'SCOPING_REVIEW'
  | 'RAPID_REVIEW'
  | 'INTEGRATIVE_REVIEW'
  | 'UMBRELLA_REVIEW'
  | 'QUALITATIVE_EVIDENCE_SYNTHESIS'
  | 'METHODOLOGY_STUDY'
  | 'DIAGNOSTIC_ACCURACY_STUDY'
  | 'RCT'
  | 'NON_RANDOMIZED_INTERVENTION_STUDY'
  | 'COHORT_STUDY'
  | 'CASE_CONTROL_STUDY'
  | 'CROSS_SECTIONAL_STUDY'
  | 'QUALITATIVE_STUDY'
  | 'MIXED_METHODS_STUDY'
  | 'CASE_REPORT'
  | 'CASE_SERIES'
  | 'PROTOCOL'
  | 'GUIDELINE'
  | 'NATIONAL_CLINICAL_GUIDELINE'
  | 'CLINICAL_PRACTICE_GUIDELINE'
  | 'PUBLIC_RECOMMENDATION_POLICY'
  | 'CONSENSUS_DOCUMENT'
  | 'IMPLEMENTATION_FRAMEWORK'
  | 'METHODOLOGICAL_FRAMEWORK'
  | 'REPORT'
  | 'HTA'
  | 'ECONOMIC_EVALUATION'
  | 'EDITORIAL_COMMENTARY'
  | 'LETTER_CORRESPONDENCE'
  | 'PROTOCOL_SYSTEMATIC_REVIEW'
  | 'OTHER'
  | 'UNKNOWN_UNCERTAIN';

export type MethodologicalApproach =
  | 'Kvalitativ'
  | 'Kvantitativ (Eksperimentell / RCT)'
  | 'Kvantitativ (Observasjonell)'
  | 'Mixed Methods (Blandet metode)'
  | 'Kunnskapsoppsummering / Syntese'
  | 'Klinisk retningslinje / Normativ praksis'
  | 'Implementering & Tjenesteinnovasjon'
  | 'Diagnostikk & Testvalidering'
  | 'Metodologi & Verktøyutvikling'
  | 'Ikke-forskningsdokument / Policy'
  | 'Ukjent / Uavklart';

export type MethodologicalPurpose =
  | 'Kausaleffekt / Behandlingseffekt'
  | 'Levde erfaringer / Sosiale fenomener'
  | 'Prognose / Forløp'
  | 'Etiologi / Risikofaktorer'
  | 'Prevalens / Kartlegging'
  | 'Diagnostisk nøyaktighet / Testvalidering'
  | 'Kunnskapssyntese / Meta-analyse'
  | 'Kvalitativ evidenssyntese'
  | 'Kliniske handlingsanbefalinger'
  | 'Implementeringsdeterminanter / Endringsprosess'
  | 'Metodisk rammeverk / Verktøy'
  | 'Studieprotokoll / Prosjektplan'
  | 'Kost-nytte / Helseøkonomi'
  | 'Uavklart / Krever manuell presisering';

export type ClassificationConfidenceStatus =
  | 'DEFINITIVE'
  | 'AI_CANDIDATE_REQUIRES_VERIFICATION'
  | 'HUMAN_VERIFIED'
  | 'CONFLICTING_EVIDENCE'
  | 'INSUFFICIENT_INFORMATION'
  | 'UNCERTAIN'
  | 'MANUAL_VERIFICATION_REQUIRED';

export type InstrumentRoleType =
  | 'CRITICAL_APPRAISAL_ROB'
  | 'GUIDELINE_APPRAISAL'
  | 'REPORTING_STANDARD'
  | 'EVIDENCE_CERTAINTY'
  | 'IMPLEMENTATION_FRAMEWORK';

export interface HumanVerificationDecision {
  status: 'APPROVED' | 'MODIFIED' | 'REJECTED' | 'UNCERTAIN' | 'PENDING';
  verifiedAt?: string;
  verifiedBy?: string;
  manualDocType?: StandardDocumentType;
  manualStudyDesign?: string;
  manualMethodology?: MethodologicalApproach;
  manualPurpose?: MethodologicalPurpose;
  manualInstrumentId?: string;
  rationale?: string;
}

export interface DocumentClassificationResult {
  documentType: StandardDocumentType;
  documentTypeName: string;
  isResearchDocument: boolean | null;
  studyDesign: string;
  methodologicalApproach: MethodologicalApproach;
  methodologicalPurpose: MethodologicalPurpose;
  confidenceScore: number; // 0 - 100
  confidenceStatus: ClassificationConfidenceStatus;
  statusBadgeText: string;
  evidenceSignals: {
    signalType: string;
    value: string;
    foundIn: string;
  }[];
  rationale: string;
  hasMetadataContentConflict: boolean;
  conflictDetails?: string;
  recommendedInstrumentId: string;
  recommendedInstrumentName: string;
  recommendedInstrumentJustification: string;
  alternativeInstruments: { id: string; name: string; role: string }[];
  methodologicalLimitations: string;
  instrumentSourceAndAuthority: string;
  instrumentRoleType: InstrumentRoleType;
  humanDecision?: HumanVerificationDecision;
  legalAnalysis?: LegalAnalysisResult;
}

// -------------------------------------------------------------
// LEGAL ACTS & STATUTORY MANDATE TYPES
// -------------------------------------------------------------

export interface LegalActReference {
  actName: string;
  officialName?: string;
  shortCode?: string;
  officialShortCode?: string;
  sectionReference?: string;
  relevantSections?: string[];
  jurisdiction?: string;
  lovdataUrl?: string;
  legalCategory: 
    | 'STATUTORY_DUTY'
    | 'ETHICS_RESEARCH_APPROVAL'
    | 'PRIVACY_DATA_PROTECTION'
    | 'PATIENT_RIGHT'
    | 'CONFIDENTIALITY_SECRECY'
    | 'PROFESSIONAL_RESPONSIBILITY'
    | 'ADMINISTRATIVE_LAW'
    | 'INTERNATIONAL_CONVENTION';
  legalCategoryName: string;
  normativeLevel: 
    | 'MANDATORY_STATUTORY_DUTY'
    | 'STATUTORY_RIGHT'
    | 'LEGAL_ETHICAL_REQUIREMENT'
    | 'PROFESSIONAL_GUIDELINE_RECOMMENDATION';
  snippetText: string;
  isStatutoryDuty: boolean;
  description: string;
  relevanceForAppraisal: string;
}

export interface LegalAnalysisResult {
  identifiedActs: LegalActReference[];
  hasLegalActs?: boolean;
  hasStatutoryDuties: boolean;
  statutoryDutiesCount: number;
  statutoryDuties?: { rawText: string; legalBasis?: string }[];
  professionalAdvice?: { rawText: string; context?: string }[];
  ethicsAndPrivacyApprovals: {
    hasRekApproval: boolean;
    rekReference?: string;
    hasSiktNsdApproval: boolean;
    siktReference?: string;
    hasInformedConsent: boolean;
    hasDeclarationOfHelsinki: boolean;
    hasGdprCompliance: boolean;
  };
  summary: string;
}

export type AuthorityLevel =
  | 'original-source'
  | 'peer-reviewed-publication'
  | 'official-manual'
  | 'secondary-source'
  | 'gold-standard';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'PROTOTYPE'
  | 'DEPRECATED';

export type ScoringModelType =
  | 'official'
  | 'none'
  | 'qualitative-judgement'
  | 'domain-based'
  | 'researcher-defined'
  | 'critical-domain-weighting'
  | 'not-verified';

export type MethodologyAlignmentStatus =
  | 'INTERNAL_SOURCE_CONTROLLED'
  | 'OFFICIAL_SOURCE_REFERENCED'
  | 'PEER_REVIEWED_SUPPORT'
  | 'GOLD_STANDARD_REFERENCE'
  | 'ACTIVE_INTERNATIONAL_STANDARD'
  | 'PENDING_VERIFICATION';

export type MethodologicalFunctionType =
  | 'CRITICAL_APPRAISAL'
  | 'SYSTEMATIC_REVIEW_CONFIDENCE'
  | 'GUIDELINE_RIGOUR_EVALUATION'
  | 'GUIDELINE_QUALITY_APPRAISAL'
  | 'CERTAINTY_OF_EVIDENCE_GRADING'
  | 'EVIDENCE_CERTAINTY_RATING'
  | 'RISK_OF_BIAS_ASSESSMENT'
  | 'EFFECT_ESTIMATE_RISK_OF_BIAS'
  | 'REPORTING_TRANSPARENCY_STANDARD'
  | 'IMPLEMENTATION_DETERMINANT_MAPPING'
  | 'IMPLEMENTATION_PROCESS_MODEL';

export interface InstrumentQuestionItem {
  id: number | string;
  itemNumber?: number;
  shortTitle: string;
  questionText?: string;
  questionTextEn?: string;
  officialQuestion?: string;
  officialQuestionEn?: string;
  descriptionGuide?: string;
  categoryTitle?: string;
  domain?: string;
  domainTitle?: string;
  isCritical?: boolean;
  allowedAnswers?: string[];
}

export interface AppraisalInstrument {
  id: string;
  name: string;
  shortName: string;
  version: string;
  edition: string;
  year: number;
  latestUpdateYear: number;
  instrumentType: InstrumentType;
  methodologicalFunction: MethodologicalFunctionType;
  methodologicalFunctionDescription: string;
  unitOfAnalysis: string;
  academicOutputFormat: string;
  prohibitedAcademicPractices: string[];
  epistemologicalRole: string;
  purpose: string;
  category: InstrumentCategory;
  categoryName: string;
  status: 'Available' | 'Active' | 'Beta';
  itemCount: number;
  targetStudyDesign: string[];
  targetPopulationOrContext: string;
  publisher: string;
  governingBody: string;
  authorityLevel: AuthorityLevel;
  officialSource: string;
  sourceUrl?: string;
  primaryPublication: string;
  doi?: string;
  licenseStatus: string;
  usagePermission: string;
  sourceAttribution: string;
  allowedAnswers: string[];
  scoringModel: ScoringModelType;
  scoringModelExplanation: string;
  interpretationModel: string;
  criticalDomains?: string[];
  knownLimitations: string;
  methodologyAlignmentStatus: MethodologyAlignmentStatus;
  whoHandbookRef: string;
  validationChecksum: string;
  applicableStudyTypes: string[];
  qualityControlGuidelines: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  verifiedBy: string;
  questions?: InstrumentQuestionItem[];
}

export type AssessmentLifecycleStatus = 'DRAFT' | 'IN_REVIEW' | 'FINALIZED' | 'REOPENED' | 'AMENDED';

export type AiEvidenceStatus = 'AI_SUGGESTED' | 'HUMAN_VERIFIED' | 'REJECTED' | 'MANUAL_ENTRY';

export interface AssessmentSnapshot {
  assessmentId: string;
  studyId: string;
  instrumentId: string;
  instrumentName: string;
  instrumentVersion: string;
  instrumentEdition: string;
  instrumentVariant?: string;
  source: string;
  sourcePublication: string;
  doi?: string;
  studyDesign: string;
  createdAt: string;
  createdBy: string;
  finalizedAt?: string;
  finalizedBy?: string;
  documentHash?: string;
  immutableLockHash: string;
  lifecycleStatus: AssessmentLifecycleStatus;
  reopenHistory?: {
    reopenedAt: string;
    reopenedBy: string;
    reason: string;
    previousStatus: AssessmentLifecycleStatus;
  }[];
}

export interface VersionLockMetadata {
  instrumentId: string;
  instrumentVersion: string;
  instrumentYear: number;
  source: string;
  sourcePublication: string;
  doi?: string;
  assessmentStartedAt: string;
  assessmentVersion: string;
  schemaVersion: string;
  immutableLockHash: string;
}

export interface EvidenceLocation {
  page?: string;
  section?: string;
  table?: string;
  figure?: string;
}

export interface JBIQuestion {
  id: number;
  shortTitle: string;
  officialQuestion: string;
  officialQuestionEn: string;
  descriptionGuide: string;
  category: 'metodisk_samsvar' | 'forskerrolle' | 'representasjon' | 'etikk' | 'konklusjon';
  categoryTitle: string;
  whoControlPrinciple?: string;
}

export interface JBIEvaluationItem {
  questionId: number;
  status: AssessmentStatus;
  justification: string; // Rationale (mandatory for WHO compliance)
  evidenceText?: string; // Direct quote / what researcher found
  location?: EvidenceLocation;
  sourceQuoteOrRef?: string; // Legacy/display helper
  reviewerNotes?: string;
  candidateEvidenceVerified?: boolean;
  aiEvidenceStatus?: AiEvidenceStatus;
  aiSuggestionReason?: string;
  aiSuggestedStatus?: AssessmentStatus;
}

export interface AuditTrailEntry {
  id: string;
  studyId: string;
  reviewer: string;
  instrumentId: string;
  version: string;
  itemId: number;
  itemTitle?: string;
  previousAnswer: string;
  newAnswer: string;
  previousRationale: string;
  newRationale: string;
  changedBy: string;
  timestamp: string;
  comment?: string;
  action?: string;
  previousHash?: string;
  entryHash?: string;
}

export interface DualReviewComparison {
  studyId: string;
  studyTitle: string;
  reviewer1: {
    name: string;
    date: string;
    items: JBIEvaluationItem[];
    verdict: string;
  };
  reviewer2: {
    name: string;
    date: string;
    items: JBIEvaluationItem[];
    verdict: string;
  };
  itemComparisons: {
    questionId: number;
    questionTitle: string;
    r1Status: AssessmentStatus;
    r2Status: AssessmentStatus;
    isAgreement: boolean;
    r1Rationale: string;
    r2Rationale: string;
    consensusStatus?: AssessmentStatus;
    consensusRationale?: string;
  }[];
  overallAgreementPercentage: number;
  totalAgreements: number;
  totalDisagreements: number;
  consensusVerdict?: 'Inkluder' | 'Ekskluder' | 'Søk mer informasjon';
}

export interface CandidateEvidence {
  questionId: number;
  suggestedStatus?: AssessmentStatus;
  relevanceScore: number;
  suggestedLocation: EvidenceLocation;
  extractedSnippet: string;
  confidenceReason: string;
  verifiedByResearcher: boolean;
}

export interface DocumentAnalysisResult {
  fileName: string;
  analyzedAt: string;
  totalPassagesFound: number;
  disclaimer: string;
  goldenRule: string;
  candidateEvidence: CandidateEvidence[];
}

export type DocumentTypeCategory =
  | 'PRIMARY_QUALITATIVE'
  | 'PRIMARY_QUANT_RCT'
  | 'PRIMARY_QUANT_OBSERVATIONAL'
  | 'PRIMARY_MIXED_METHODS'
  | 'PRIMARY_DIAGNOSTIC'
  | 'SECONDARY_SYSTEMATIC_REVIEW'
  | 'SECONDARY_SCOPING_REVIEW'
  | 'SECONDARY_QUALITATIVE_SYNTHESIS'
  | 'CLINICAL_GUIDELINE'
  | 'IMPLEMENTATION_QUALITY_IMPROVEMENT'
  | 'METHODOLOGICAL_PROTOCOL'
  | 'OTHER';

export type MethodologyFamily = 
  | 'Kvalitativ'
  | 'Kvantitativ (Eksperimentell)'
  | 'Kvantitativ (Observasjonell)'
  | 'Blandet metode (Mixed Methods)'
  | 'Kunnskapsoppsummering / Syntese'
  | 'Klinisk retningslinje'
  | 'Implementering & Forbedring'
  | 'Diagnostikk & Prediksjon'
  | 'Annet';

export interface MetaResearchClassification {
  documentType: DocumentTypeCategory;
  documentTypeName: string;
  methodologyType: MethodologyFamily;
  epistemology: string;
  confidenceScore: number;
  detectedKeywords: string[];
  rationale: string;
  unitOfAnalysis: string;
  recommendedInstrumentId: string;
  alternativeInstrumentIds: string[];
  incompatibleInstrumentIds: string[];
}

export interface MetaResearchIntegrityDimension {
  id: string;
  name: string;
  category: string;
  score: 'HIGH' | 'MODERATE' | 'LOW' | 'UNCLEAR' | 'NOT_APPLICABLE';
  foundSnippet: string;
  location?: EvidenceLocation;
  assessment: string;
  recommendation: string;
}

export interface MetaResearchReport {
  id: string;
  fileName: string;
  extractedTitle: string;
  extractedAuthors: string;
  extractedDoi?: string;
  extractedYear?: string;
  extractedAbstract?: string;
  classification: MetaResearchClassification;
  integrityDimensions: MetaResearchIntegrityDimension[];
  overallIntegrityLevel: 'HIGH_INTEGRITY' | 'MODERATE_INTEGRITY' | 'REPORTING_DEFICIT' | 'HIGH_RISK_OF_BIAS';
  integritySummary: string;
  keyStrengths: string[];
  potentialMethodologicalRisks: string[];
  candidateEvidence: CandidateEvidence[];
  generatedAt: string;
  engineUsed: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK' | 'GEMINI_AI_FLASH' | 'DETERMINISTIC_NLP_GATE';
}

export interface WhoRuleEvaluation {
  id: string;
  name: string;
  standard: string;
  category: 'Fullstendighet' | 'Begrunnelse & Rationale' | 'Evidensforankring' | 'Modellversjon' | 'Forskerrefleksivitet' | 'Kausalitetsvakt';
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  details: string;
  recommendation: string;
}

export interface WhoEtdCriteriaInput {
  guidelineQuestion: string;
  targetPopulation: string;
  intervention: string;
  comparison: string;
  problemPriority: 'Yes' | 'Probably yes' | 'Probably no' | 'No' | 'Varies' | 'Don’t know';
  desirableEffects: 'Large' | 'Moderate' | 'Small' | 'Trivial' | 'Varies' | 'Don’t know';
  undesirableEffects: 'Large' | 'Moderate' | 'Small' | 'Trivial' | 'Varies' | 'Don’t know';
  certaintyOfEvidence: 'High' | 'Moderate' | 'Low' | 'Very Low' | 'No included studies';
  valuesUncertainty: 'Important uncertainty or variability' | 'Possibly important' | 'Probably no important uncertainty' | 'No important uncertainty';
  balanceOfEffects: 'Favors intervention' | 'Probably favors intervention' | 'Does not favor either' | 'Probably favors comparison' | 'Favors comparison';
  resourcesRequired: 'Large costs' | 'Moderate costs' | 'Negligible costs or savings' | 'Moderate savings' | 'Large savings';
  costEffectiveness: 'Favors intervention' | 'Probably favors intervention' | 'Does not favor either' | 'Probably favors comparison' | 'Favors comparison';
  equity: 'Increased equity' | 'Probably increased' | 'Probably no impact' | 'Probably reduced' | 'Reduced equity';
  acceptability: 'Yes' | 'Probably yes' | 'Probably no' | 'No' | 'Varies';
  feasibility: 'Yes' | 'Probably yes' | 'Probably no' | 'No' | 'Varies';
  notes?: Record<string, string>;
}

export interface WhoEtdEvaluationResult {
  guidelineQuestion: string;
  targetPopulation: string;
  intervention: string;
  comparison: string;
  recommendationType: 'Strong recommendation for' | 'Conditional recommendation for' | 'Conditional recommendation against' | 'Strong recommendation against' | 'Recommendation for research only';
  strengthRationale: string;
  detailedCriteriaAudit: {
    criterionName: string;
    judgment: string;
    whoRequirementSummary: string;
    status: 'SUPPORTIVE' | 'CAUTION' | 'BARRIER';
  }[];
  implementationConsiderations: string[];
  monitoringAndEvaluation: string[];
  methodologicalStandard: string;
}

export interface GradeSummaryOfFindingsItem {
  id: string;
  outcomeName: string;
  outcomeType: 'Dichotomous' | 'Continuous' | 'Time-to-event' | 'Patient-reported';
  assumedRisk?: string; // Control
  correspondingRisk?: string; // Intervention
  relativeEffect?: string; // e.g. RR 0.75 (95% CI 0.62-0.90)
  participantsCount: number;
  studiesCount: number;
  studyDesign: 'RCT' | 'Observational';
  riskOfBias: 0 | -1 | -2;
  inconsistency: 0 | -1 | -2;
  indirectness: 0 | -1 | -2;
  imprecision: 0 | -1 | -2;
  publicationBias: 0 | -1 | -2;
  certainty: 'High' | 'Moderate' | 'Low' | 'Very Low';
  importance: 'Critical' | 'Important' | 'Not important';
  comments: string;
}

export interface GradeCerqualSummaryItem {
  id: string;
  reviewFinding: string;
  methodologicalLimitations: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  coherence: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  adequacyOfData: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  relevance: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  overallConfidence: 'High confidence' | 'Moderate confidence' | 'Low confidence' | 'Very low confidence';
  contributingStudies: string;
  explanation: string;
}

export interface WhoComplianceReport {
  overallPassed: boolean;
  complianceScore: number; // 0 to 100
  whoHandbookStandard: string;
  appraisalModel: string;
  modelVersion: string;
  modelChecksum: string;
  timestamp: string;
  articleCitation: string;
  rules: WhoRuleEvaluation[];
  passedRuleCount: number;
  totalRuleCount: number;
  summaryVerdict: 'INTERN_METODISK_KONTROLLERT' | 'KREVER_KOMPLETTERING' | 'IKKE_GODKJENT';
  recommendations: string[];
}

export interface ScoreCalculationResult {
  ja: number;
  uklart: number;
  nei: number;
  ikkeRelevant: number;
  total: number;
  answered: number;
  unanswered: number;
  completenessPercent: number;
  jaScorePercent: number;
  applicableTotal: number;
  applicableJaPercent: number;
}

export interface VerdictRecommendation {
  verdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon' | 'Ufullstendig';
  riskOfBias: 'Lav' | 'Moderat' | 'Høy' | 'Uavklart';
  rationale: string;
  criticalFlaws: string[];
  suggestedAction: string;
}

export interface InterRaterAgreementResult {
  totalItems: number;
  agreedCount: number;
  disagreedCount: number;
  percentAgreement: number;
  cohensKappa: number;
  kappaInterpretation: 'Svært god (Almost perfect)' | 'Betydelig (Substantial)' | 'Moderat (Moderate)' | 'Middels (Fair)' | 'Dårlig (Poor)';
  interpretation?: string;
  discrepancies: {
    questionId: number;
    questionTitle: string;
    r1Status: AssessmentStatus;
    r2Status: AssessmentStatus;
    r1Rationale?: string;
    r2Rationale?: string;
  }[];
}

export interface ValidationReport {
  isValid: boolean;
  instrumentId: string;
  instrumentName?: string;
  instrumentVersion?: string;
  timestamp: string;
  totalItems: number;
  answeredItems: number;
  completenessPercent: number;
  errors: string[];
  warnings: string[];
  counts: {
    yes: number;
    no: number;
    unclear: number;
    notApplicable: number;
    unanswered: number;
  };
  scoreCalculation: ScoreCalculationResult;
  verdictRecommendation: VerdictRecommendation;
  summaryVerdictSuggestion: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon' | 'Ufullstendig';
  whoCompliance?: WhoComplianceReport;
}

export interface ArticleAppraisal {
  id: string;
  instrumentId?: string; // default: 'jbi-qualitative-2017'
  instrumentVersion?: string;
  lifecycleStatus?: AssessmentLifecycleStatus;
  snapshot?: AssessmentSnapshot;
  documentHash?: string;
  parsingStatus?: 'PARSED_COMPLETE' | 'PARSED_INCOMPLETE' | 'PARSED_WITH_WARNINGS' | 'NOT_PARSED';
  whoValidationStatus?: 'INTERNALLY_COMPLIANCE_CHECKED' | 'PENDING_VERIFICATION' | 'NEEDS_REVISION';
  authors: string;
  shortCitation: string;
  year: number;
  publicationYear?: number;
  title: string;
  journal: string;
  volumeIssue?: string;
  pages?: string;
  abstract?: string;
  doi: string;
  doiUrl: string;
  sourceUrl: string;
  sourceName: string;
  studyContext: string;
  design: string;
  studyDesign?: string;
  methodology?: string;
  epistemology?: string;
  dataCollection: string;
  participants: string;
  analyticMethod: string;
  reviewerName?: string;
  reviewerRole?: string;
  assessmentDate?: string;
  projectName?: string;
  summaryScore: {
    ja: number;
    uklart: number;
    nei: number;
    ikkeRelevant?: number;
    total: number;
  };
  overallVerdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
  verdictNote: string;
  keyStrength: string;
  mainLimitation: string;
  apaReference: string;
  items: JBIEvaluationItem[];
  auditTrail?: AuditTrailEntry[];
  projectId?: string;
  isDemoData?: boolean;
  dataClassification?: 'OPEN_PUBLIC' | 'RESTRICTED_RESEARCH' | 'SENSITIVE_SPECIAL_CATEGORY';
  canonicalHash?: string;
}

export interface ComparisonDimension {
  dimension: string;
  studyA: string;
  studyB: string;
  methodologicalNote?: string;
}

// -------------------------------------------------------------
// REFERENCE VALIDATION LIBRARY & TEST PYRAMID TYPES (Sections 16-30)
// -------------------------------------------------------------

export type ReferenceAssessmentType = 
  | 'OFFICIAL_ALGORITHM_EXPECTED'
  | 'PUBLISHED_RESEARCHER_ASSESSMENT'
  | 'EXPERT_ADJUDICATED_REFERENCE'
  | 'LOCAL_TEST_EXPECTATION';

export type ReferenceArticleVerificationStatus = 
  | 'VERIFIED'
  | 'NEEDS_VERIFICATION'
  | 'REJECTED';

export type DiffSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type GoldStandardMatchStatus = 
  | 'MATCH'
  | 'PARTIAL_MATCH'
  | 'MISMATCH'
  | 'UNABLE_TO_COMPARE';

export interface SupplementaryMaterialRecord {
  id: string;
  supplementTitle: string;
  supplementUrl?: string;
  fileType: 'Excel (.xlsx)' | 'PDF (.pdf)' | 'Appendix Table' | 'Data Repository (OSF/Zenodo)' | 'Online Supplementary Material';
  retrievedDate: string;
  itemsCovered: string; // e.g. "Items 1-16 (Item-by-item table)"
  validationStatus: 'VERIFIED' | 'NEEDS_VERIFICATION';
  notes?: string;
}

export interface ItemLevelReferenceData {
  itemNumber: number;
  itemTitle: string;
  referenceResponse: string; // e.g. "Yes", "Partial Yes", "No", "Low risk", "High"
  referenceRationale: string;
  referenceEvidenceLocation?: EvidenceLocation;
  evidenceSnippet?: string;
  referenceSource: string; // e.g. "Published Supplementary Table S2 (Shea et al., BMJ 2017)"
  reviewerOrStudy: string; // e.g. "Reviewer Consensus / Lead Methodologist"
  agreementStatus?: 'UNANIMOUS' | 'MAJORITY_CONSENSUS' | 'ADJUDICATED';
}

export interface ReferenceValidationArticle {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pmid?: string;
  database: 'PubMed' | 'PubMed Central' | 'Cochrane Library' | 'BMJ' | 'BMC' | 'JBI' | 'PLOS' | 'ScienceDirect' | 'Wiley' | 'Springer Nature' | 'Web of Science';
  publisher: string;
  articleUrl: string;
  fullTextUrl?: string;
  instrumentId: string;
  instrumentName: string;
  instrumentVersion: string;
  whySelected: string;
  selectionCriteria: {
    searchDatabase: string;
    searchDate: string;
    inclusionReason: string;
    exclusionReason?: string;
    publicationStatus: 'PEER_REVIEWED' | 'OFFICIAL_METHODOLOGY_REPORT' | 'VALIDATION_BENCHMARK';
  };
  validationSource: string;
  referenceAssessmentType: ReferenceAssessmentType;
  verificationDate: string;
  verificationStatus: ReferenceArticleVerificationStatus;
  verifiedBy: string;
  expectedOverallScoreOrVerdict?: string;
  expectedCriticalFlawsCount?: number;
  expectedNonCriticalFlawsCount?: number;
  itemData: ItemLevelReferenceData[];
  supplementaryMaterials: SupplementaryMaterialRecord[];
  methodologicalNotes: string;
}

export interface GoldStandardDiffItem {
  itemNumber: number;
  itemTitle: string;
  referenceResponse: string;
  applicationResponse: string;
  difference: string;
  referenceSource: string;
  evidenceSnippet?: string;
  severity: DiffSeverity;
  isMatch: boolean;
}

export interface GoldStandardDiffResult {
  articleId: string;
  articleTitle: string;
  instrumentId: string;
  instrumentVersion: string;
  referenceAssessmentType: ReferenceAssessmentType;
  totalItemsCompared: number;
  matchingItemsCount: number;
  mismatchingItemsCount: number;
  matchPercentage: number;
  matchStatus: GoldStandardMatchStatus;
  criticalMismatchesCount: number;
  highMismatchesCount: number;
  mediumMismatchesCount: number;
  lowMismatchesCount: number;
  itemDiffs: GoldStandardDiffItem[];
  summaryMessage: string;
  scientificValidityNotice: string;
}

export interface ValidationDashboardInstrumentCard {
  instrumentId: string;
  instrumentName: string;
  version: string;
  statusBadge: 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
  statusExplanation: string;
  unitTestsStatus: 'PASS' | 'FAIL' | 'UNVERIFIED';
  integrationTestsStatus: 'PASS' | 'FAIL' | 'UNVERIFIED';
  referenceCasesCount: number;
  referenceCasesPassedCount: number;
  knownMismatchesCount: number;
  sourceVerified: boolean;
  lastValidationDate: string;
  algorithmVersion: string;
  releaseGatePassed: boolean;
}

export interface ReleaseGateCheck {
  id: string;
  title: string;
  passed: boolean;
  severity: 'CRITICAL' | 'HIGH';
  details: string;
}

// -------------------------------------------------------------
// PEER REVIEW & GROUP COLLABORATION TYPES
// -------------------------------------------------------------

export type ReviewerRole = 
  | 'Lead Reviewer / Hovedgransker'
  | 'Co-Reviewer / Medgransker'
  | 'Arbiter / Tredjeperson'
  | 'Methodologist / Metodolog'
  | 'Supervisor / Veileder'
  | 'External Peer Reviewer / Fagfellegransker';

export interface ReviewerProfile {
  id: string;
  name: string;
  email?: string;
  role: ReviewerRole;
  institution?: string;
  avatarColor: string; // e.g. "teal", "indigo", "rose", "amber", "cyan", "purple"
  isCurrentUser?: boolean;
}

export type ReviewStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED_BLIND';

export interface PeerReviewSubmission {
  id: string;
  studyId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: ReviewerRole;
  status: ReviewStatus;
  startedAt: string;
  completedAt?: string;
  items: JBIEvaluationItem[];
  overallVerdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
  verdictRationale: string;
  keyStrength?: string;
  mainLimitation?: string;
}

export type CommentCategory = 
  | 'METHODOLOGY_CONCERN'
  | 'CLARIFICATION_NEEDED'
  | 'STRENGTH_PRAISE'
  | 'CONSENSUS_NOTE'
  | 'GENERAL_FEEDBACK';

export interface PeerReviewComment {
  id: string;
  studyId: string;
  questionId?: number; // 1-10 or undefined for overall study
  authorId: string;
  authorName: string;
  authorRole: ReviewerRole;
  category: CommentCategory;
  text: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type ConsensusMeetingStatus = 
  | 'NOT_STARTED'
  | 'IN_DISCUSSIONS'
  | 'DISCREPANCIES_FLAGGED'
  | 'CONSENSUS_REACHED'
  | 'ARBITER_DECIDED';

export interface StudyConsensusRecord {
  studyId: string;
  meetingDate?: string;
  status: ConsensusMeetingStatus;
  assignedReviewerIds: string[];
  arbiterId?: string;
  itemConsensus: Record<number, {
    status: AssessmentStatus;
    rationale: string;
    agreedBy: string[];
    adoptedFromReviewerId?: string;
  }>;
  overallVerdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
  verdictRationale: string;
  consensusNotes: string;
  signedOffBy: string[];
  lockedAt?: string;
}

export interface ResearchGroupWorkspace {
  id: string;
  projectName: string;
  institutionOrCourse?: string;
  description?: string;
  protocolPrismaTarget?: string;
  createdAt: string;
  updatedAt: string;
  blindedMode: boolean; // Hide ratings until both submitted
  requireDualReview: boolean;
  members: ReviewerProfile[];
  activeReviewerId: string;
  submissions: Record<string, PeerReviewSubmission[]>; // studyId -> submissions[]
  comments: PeerReviewComment[];
  consensusRecords: Record<string, StudyConsensusRecord>; // studyId -> consensus record
}

