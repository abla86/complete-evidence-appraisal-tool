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

export type StandardDocumentType =
  | 'PRIMARY_RESEARCH_ARTICLE' | 'SYSTEMATIC_REVIEW' | 'META_ANALYSIS' | 'SCOPING_REVIEW'
  | 'RAPID_REVIEW' | 'INTEGRATIVE_REVIEW' | 'UMBRELLA_REVIEW' | 'QUALITATIVE_EVIDENCE_SYNTHESIS'
  | 'METHODOLOGY_STUDY' | 'DIAGNOSTIC_ACCURACY_STUDY' | 'RCT' | 'NON_RANDOMIZED_INTERVENTION_STUDY'
  | 'COHORT_STUDY' | 'CASE_CONTROL_STUDY' | 'CROSS_SECTIONAL_STUDY' | 'QUALITATIVE_STUDY'
  | 'MIXED_METHODS_STUDY' | 'CASE_REPORT' | 'CASE_SERIES' | 'PROTOCOL' | 'GUIDELINE'
  | 'NATIONAL_CLINICAL_GUIDELINE' | 'CLINICAL_PRACTICE_GUIDELINE' | 'PUBLIC_RECOMMENDATION_POLICY'
  | 'CONSENSUS_DOCUMENT' | 'IMPLEMENTATION_FRAMEWORK' | 'METHODOLOGICAL_FRAMEWORK' | 'REPORT'
  | 'HTA' | 'ECONOMIC_EVALUATION' | 'EDITORIAL_COMMENTARY' | 'LETTER_CORRESPONDENCE'
  | 'PROTOCOL_SYSTEMATIC_REVIEW' | 'OTHER' | 'UNKNOWN_UNCERTAIN';

export type MethodologicalApproach =
  | 'Kvalitativ' | 'Kvantitativ (Eksperimentell / RCT)' | 'Kvantitativ (Observasjonell)'
  | 'Mixed Methods (Blandet metode)' | 'Kunnskapsoppsummering / Syntese'
  | 'Klinisk retningslinje / Normativ praksis' | 'Implementering & Tjenesteinnovasjon'
  | 'Diagnostikk & Testvalidering' | 'Metodologi & Verktøyutvikling'
  | 'Ikke-forskningsdokument / Policy' | 'Ukjent / Uavklart';

export type MethodologicalPurpose =
  | 'Kausaleffekt / Behandlingseffekt' | 'Levde erfaringer / Sosiale fenomener' | 'Prognose / Forløp'
  | 'Etiologi / Risikofaktorer' | 'Prevalens / Kartlegging' | 'Diagnostisk nøyaktighet / Testvalidering'
  | 'Kunnskapssyntese / Meta-analyse' | 'Kvalitativ evidenssyntese' | 'Kliniske handlingsanbefalinger'
  | 'Implementeringsdeterminanter / Endringsprosess' | 'Metodisk rammeverk / Verktøy'
  | 'Studieprotokoll / Prosjektplan' | 'Kost-nytte / Helseøkonomi' | 'Uavklart / Krever manuell presisering';

export type ClassificationConfidenceStatus =
  | 'DEFINITIVE' | 'AI_CANDIDATE_REQUIRES_VERIFICATION' | 'HUMAN_VERIFIED'
  | 'CONFLICTING_EVIDENCE' | 'INSUFFICIENT_INFORMATION' | 'UNCERTAIN' | 'MANUAL_VERIFICATION_REQUIRED';

export type InstrumentRoleType =
  | 'CRITICAL_APPRAISAL_ROB' | 'GUIDELINE_APPRAISAL' | 'REPORTING_STANDARD'
  | 'EVIDENCE_CERTAINTY' | 'IMPLEMENTATION_FRAMEWORK';

export interface HumanVerificationDecision {
  status: 'APPROVED' | 'MODIFIED' | 'REJECTED' | 'UNCERTAIN' | 'PENDING';
  verifiedAt?: string; verifiedBy?: string; manualDocType?: StandardDocumentType;
  manualStudyDesign?: string; manualMethodology?: MethodologicalApproach;
  manualPurpose?: MethodologicalPurpose; manualInstrumentId?: string; rationale?: string;
}

export interface LegalActReference {
  actName: string; officialName?: string; shortCode?: string; officialShortCode?: string;
  sectionReference?: string; relevantSections?: string[]; jurisdiction?: string; lovdataUrl?: string;
  legalCategory: 'STATUTORY_DUTY' | 'ETHICS_RESEARCH_APPROVAL' | 'PRIVACY_DATA_PROTECTION' | 'PATIENT_RIGHT' | 'CONFIDENTIALITY_SECRECY' | 'PROFESSIONAL_RESPONSIBILITY' | 'ADMINISTRATIVE_LAW' | 'INTERNATIONAL_CONVENTION';
  legalCategoryName: string;
  normativeLevel: 'MANDATORY_STATUTORY_DUTY' | 'STATUTORY_RIGHT' | 'LEGAL_ETHICAL_REQUIREMENT' | 'PROFESSIONAL_GUIDELINE_RECOMMENDATION';
  snippetText: string; isStatutoryDuty: boolean; description: string; relevanceForAppraisal: string;
}

export interface LegalAnalysisResult {
  identifiedActs: LegalActReference[]; hasLegalActs?: boolean; hasStatutoryDuties: boolean;
  statutoryDutiesCount: number; statutoryDuties?: { rawText: string; legalBasis?: string }[];
  professionalAdvice?: { rawText: string; context?: string }[];
  ethicsAndPrivacyApprovals: { hasRekApproval: boolean; rekReference?: string; hasSiktNsdApproval: boolean; siktReference?: string; hasInformedConsent: boolean; hasDeclarationOfHelsinki: boolean; hasGdprCompliance: boolean };
  summary: string;
}

export type AuthorityLevel = 'original-source' | 'peer-reviewed-publication' | 'official-manual' | 'secondary-source' | 'gold-standard';
export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'PROTOTYPE' | 'DEPRECATED';
export type ScoringModelType = 'official' | 'none' | 'qualitative-judgement' | 'domain-based' | 'researcher-defined' | 'critical-domain-weighting' | 'not-verified';
export type MethodologyAlignmentStatus = 'INTERNAL_SOURCE_CONTROLLED' | 'OFFICIAL_SOURCE_REFERENCED' | 'PEER_REVIEWED_SUPPORT' | 'GOLD_STANDARD_REFERENCE' | 'ACTIVE_INTERNATIONAL_STANDARD' | 'PENDING_VERIFICATION' | 'INTERNALLY_COMPLIANCE_CHECKED' | 'NEEDS_REVISION';

export type MethodologicalFunctionType =
  | 'CRITICAL_APPRAISAL' | 'SYSTEMATIC_REVIEW_CONFIDENCE' | 'GUIDELINE_RIGOUR_EVALUATION'
  | 'GUIDELINE_QUALITY_APPRAISAL' | 'CERTAINTY_OF_EVIDENCE_GRADING' | 'EVIDENCE_CERTAINTY_RATING'
  | 'RISK_OF_BIAS_ASSESSMENT' | 'EFFECT_ESTIMATE_RISK_OF_BIAS' | 'REPORTING_TRANSPARENCY_STANDARD'
  | 'IMPLEMENTATION_DETERMINANT_MAPPING' | 'IMPLEMENTATION_PROCESS_MODEL';

export interface InstrumentQuestionItem {
  id: number | string; itemNumber?: number; shortTitle: string; questionText?: string; questionTextEn?: string;
  officialQuestion?: string; officialQuestionEn?: string; descriptionGuide?: string; categoryTitle?: string;
  domain?: string; domainTitle?: string; isCritical?: boolean; allowedAnswers?: string[];
}

export interface AppraisalInstrument {
  id: string; name: string; shortName: string; version: string; edition: string; year: number; latestUpdateYear: number;
  instrumentType: InstrumentType; methodologicalFunction: MethodologicalFunctionType; methodologicalFunctionDescription: string;
  unitOfAnalysis: string; academicOutputFormat: string; prohibitedAcademicPractices: string[]; epistemologicalRole: string;
  purpose: string; category: InstrumentCategory; categoryName: string; status: 'Available' | 'Active' | 'Beta'; itemCount: number;
  targetStudyDesign: string[]; targetPopulationOrContext: string; publisher: string; governingBody: string; authorityLevel: AuthorityLevel;
  officialSource: string; sourceUrl?: string; primaryPublication: string; doi?: string; licenseStatus: string; usagePermission: string;
  sourceAttribution: string; allowedAnswers: string[]; scoringModel: ScoringModelType; scoringModelExplanation: string;
  interpretationModel: string; criticalDomains?: string[]; knownLimitations: string; methodologyControlStatus?: string;
  methodologyAlignmentStatus: MethodologyAlignmentStatus; sourceReference: string; validationChecksum: string;
  applicableStudyTypes: string[]; qualityControlGuidelines: string; verificationStatus: VerificationStatus; verifiedAt: string; verifiedBy: string;
  questions?: InstrumentQuestionItem[];
}

export type AssessmentLifecycleStatus = 'DRAFT' | 'IN_REVIEW' | 'FINALIZED' | 'REOPENED' | 'AMENDED';
export type AiEvidenceStatus = 'AI_SUGGESTED' | 'HUMAN_VERIFIED' | 'REJECTED' | 'MANUAL_ENTRY';
export interface AssessmentSnapshot { assessmentId: string; studyId: string; instrumentId: string; instrumentName: string; instrumentVersion: string; instrumentEdition: string; instrumentVariant?: string; source: string; sourcePublication: string; doi?: string; studyDesign: string; createdAt: string; createdBy: string; finalizedAt?: string; finalizedBy?: string; documentHash?: string; immutableLockHash: string; lifecycleStatus: AssessmentLifecycleStatus; reopenHistory?: { reopenedAt: string; reopenedBy: string; reason: string; previousStatus: AssessmentLifecycleStatus }[]; }
export interface VersionLockMetadata { instrumentId: string; instrumentVersion: string; instrumentYear: number; source: string; sourcePublication: string; doi?: string; assessmentStartedAt: string; assessmentVersion: string; schemaVersion: string; immutableLockHash: string; }
export interface EvidenceLocation { page?: string; section?: string; table?: string; figure?: string; }
export interface JBIQuestion { id: number; shortTitle: string; officialQuestion: string; officialQuestionEn: string; descriptionGuide: string; category: 'metodisk_samsvar' | 'forskerrolle' | 'representasjon' | 'etikk' | 'konklusjon'; categoryTitle: string; whoControlPrinciple?: string; }
export interface JBIEvaluationItem { questionId: number; status: AssessmentStatus; justification: string; evidenceText?: string; location?: EvidenceLocation; sourceQuoteOrRef?: string; reviewerNotes?: string; candidateEvidenceVerified?: boolean; aiEvidenceStatus?: AiEvidenceStatus; aiSuggestionReason?: string; aiSuggestedStatus?: AssessmentStatus; }
export interface AuditTrailEntry { id: string; studyId: string; reviewer: string; instrumentId: string; version: string; itemId: number; itemTitle?: string; previousAnswer: string; newAnswer: string; previousRationale: string; newRationale: string; changedBy: string; timestamp: string; comment?: string; action?: string; previousHash?: string; entryHash?: string; }
export interface DualReviewComparison { studyId: string; studyTitle: string; reviewer1: { name: string; date: string; items: JBIEvaluationItem[]; verdict: string }; reviewer2: { name: string; date: string; items: JBIEvaluationItem[]; verdict: string }; itemComparisons: { questionId: number; questionTitle: string; r1Status: AssessmentStatus; r2Status: AssessmentStatus; isAgreement: boolean; r1Rationale: string; r2Rationale: string; consensusStatus?: AssessmentStatus; consensusRationale?: string; }[]; overallAgreementPercentage: number; totalAgreements: number; totalDisagreements: number; consensusVerdict?: 'Inkluder' | 'Ekskluder' | 'Søk mer informasjon'; }
export interface CandidateEvidence { questionId: number; suggestedStatus?: AssessmentStatus; relevanceScore: number; suggestedLocation: EvidenceLocation; extractedSnippet: string; confidenceReason: string; verifiedByResearcher: boolean; }
export interface DocumentAnalysisResult { fileName: string; analyzedAt: string; totalPassagesFound: number; disclaimer: string; goldenRule: string; candidateEvidence: CandidateEvidence[]; }
export type DocumentTypeCategory = 'PRIMARY_QUALITATIVE' | 'PRIMARY_QUANT_RCT' | 'PRIMARY_QUANT_OBSERVATIONAL' | 'PRIMARY_MIXED_METHODS' | 'PRIMARY_DIAGNOSTIC' | 'SECONDARY_SYSTEMATIC_REVIEW' | 'SECONDARY_SCOPING_REVIEW' | 'SECONDARY_QUALITATIVE_SYNTHESIS' | 'CLINICAL_GUIDELINE' | 'IMPLEMENTATION_QUALITY_IMPROVEMENT' | 'METHODOLOGICAL_PROTOCOL' | 'OTHER';

export interface ScoreCalculationResult { ja: number; uklart: number; nei: number; ikkeRelevant: number; total: number; answered: number; unanswered: number; completenessPercent: number; jaScorePercent: number; applicableTotal: number; applicableJaPercent: number; }
export interface VerdictRecommendation { verdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon' | 'Ufullstendig'; riskOfBias: 'Lav' | 'Moderat' | 'Høy' | 'Uavklart'; rationale: string; criticalFlaws: string[]; suggestedAction: string; }
export interface InterRaterAgreementResult { totalItems: number; agreedCount: number; disagreedCount: number; percentAgreement: number; cohensKappa: number; kappaInterpretation: 'Svært god (Almost perfect)' | 'Betydelig (Substantial)' | 'Moderat (Moderate)' | 'Middels (Fair)' | 'Dårlig (Poor)'; interpretation?: string; discrepancies: { questionId: number; questionTitle: string; r1Status: AssessmentStatus; r2Status: AssessmentStatus; r1Rationale?: string; r2Rationale?: string; }[]; }
export interface ValidationReport { isValid: boolean; instrumentId: string; instrumentName?: string; instrumentVersion?: string; timestamp: string; totalItems: number; answeredItems: number; completenessPercent: number; errors: string[]; warnings: string[]; counts: { yes: number; no: number; unclear: number; notApplicable: number; unanswered: number }; scoreCalculation: ScoreCalculationResult; verdictRecommendation: VerdictRecommendation; summaryVerdictSuggestion: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon' | 'Ufullstendig'; methodologyControl?: unknown; whoCompliance?: unknown; }

export interface ArticleAppraisal {
  id: string; instrumentId?: string; instrumentVersion?: string; lifecycleStatus?: AssessmentLifecycleStatus; snapshot?: AssessmentSnapshot; documentHash?: string; parsingStatus?: 'PARSED_COMPLETE' | 'PARSED_INCOMPLETE' | 'PARSED_WITH_WARNINGS' | 'NOT_PARSED'; methodologyAlignmentStatus?: MethodologyAlignmentStatus;
  authors: string; shortCitation: string; year: number; publicationYear?: number; title: string; journal: string; volumeIssue?: string; pages?: string; abstract?: string; doi: string; doiUrl: string; sourceUrl: string; sourceName: string; studyContext: string; design: string; studyDesign?: string;
}
