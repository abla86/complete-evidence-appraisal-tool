// Types and contracts for the integrated Evidence Appraisal Tool.
// NOTE: This file is intentionally kept as the canonical shared UI/domain contract.

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

// ... existing canonical types are preserved below this section.
