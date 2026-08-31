import { StandardDocumentType, MethodologicalApproach, MethodologicalPurpose } from '../types';

export interface BenchmarkDocument {
  id: string;
  testIndex: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  fullText: string;
  expectedDocumentType: StandardDocumentType;
  expectedStudyDesignId: string;
  expectedMethodology: MethodologicalApproach;
  expectedPurpose: MethodologicalPurpose;
  expectedRecommendedInstrumentId: string;
  expectedIsResearchDocument: boolean | null;
  rationale: string;
  incompatibleInstrumentTest: {
    instrumentId: string;
    expectedBlockedOrWarning: boolean;
  };
}

export const BENCHMARK_15_DOCUMENTS: BenchmarkDocument[] = [
  // 1. Kvalitativ primærstudie (Grounded Theory / Intervjuer)
  {
    id: 'bench-1',
    testIndex: 1,
    title: 'Navigating uncertainty: A constructivist grounded theory study of general practitioners caring for multimorbid elderly patients',
    authors: 'Lund, M., Smith, L., & Hansen, T.',
    journal: 'BMC Primary Care',
    year: 2024,
    doi: '10.1186/s12875-024-02269-9',
    fullText: `Background: Caring for elderly multimorbid patients in primary care entails navigating complex social and medical uncertainty. 
Methods: We conducted in-depth semi-structured interviews with 24 general practitioners across Norway. Data collection and constant comparative analysis were carried out iteratively using Charmaz's constructivist grounded theory approach. Theoretical sampling guided participant recruitment until theoretical saturation.
Results: A core conceptual category of 'proactive boundary negotiation' emerged, consisting of three sub-themes: contextual prioritizing, shared relational vulnerability, and system navigation.
Conclusion: Qualitative insights reveal how relational continuity mitigates clinical fragmentation in general practice.`,
    expectedDocumentType: 'QUALITATIVE_STUDY',
    expectedStudyDesignId: 'qualitative',
    expectedMethodology: 'Kvalitativ',
    expectedPurpose: 'Levde erfaringer / Sosiale fenomener',
    expectedRecommendedInstrumentId: 'jbi-qualitative-2017',
    expectedIsResearchDocument: true,
    rationale: 'Kvalitativ primærstudie med semistrukturerte intervjuer og Grounded Theory analyse. Må vurderes med JBI Qualitative.',
    incompatibleInstrumentTest: {
      instrumentId: 'amstar-2',
      expectedBlockedOrWarning: true
    }
  },

  // 2. Randomisert kontrollert studie (RCT)
  {
    id: 'bench-2',
    testIndex: 2,
    title: 'Effect of a nurse-led digital follow-up intervention on hospital readmission in heart failure: A double-blind randomized controlled trial',
    authors: 'Schultz, H., Berg, A., & Lindqvist, K.',
    journal: 'The Lancet Digital Health',
    year: 2024,
    doi: '10.1016/S2589-7500(24)00102-1',
    fullText: `Background: Hospital readmissions remain high among patients with chronic heart failure.
Methods: In a double-blind, multicentre, parallel-group randomized controlled trial, 450 participants were randomly allocated (1:1) via central computer-generated random allocation sequence to either a digital telemonitoring intervention (n=225) or standard care placebo sham app (n=225). Allocation concealment was maintained using central web-based randomization.
Results: At 6 months follow-up, intention-to-treat analysis showed readmission rates of 14.2% vs 28.5% (hazard ratio 0.48, 95% CI 0.32-0.71, p<0.001).
Conclusion: Nurse-led digital telemonitoring significantly reduces 6-month readmissions.`,
    expectedDocumentType: 'RCT',
    expectedStudyDesignId: 'rct',
    expectedMethodology: 'Kvantitativ (Eksperimentell / RCT)',
    expectedPurpose: 'Kausaleffekt / Behandlingseffekt',
    expectedRecommendedInstrumentId: 'rob-2',
    expectedIsResearchDocument: true,
    rationale: 'Eksperimentell klinisk utprøving med randomisering og kontrollgruppe. JBI Qualitative er metodisk inkompatibelt; RoB 2 er påkrevd.',
    incompatibleInstrumentTest: {
      instrumentId: 'jbi-qualitative-2017',
      expectedBlockedOrWarning: true
    }
  },

  // 3. Kohortstudie (Observasjonell)
  {
    id: 'bench-3',
    testIndex: 3,
    title: 'Long-term cognitive outcomes following occupational solvent exposure: A 15-year prospective cohort study in the Norwegian Mother and Child Registry',
    authors: 'Aas, E., & Lie, R.',
    journal: 'Scandinavian Journal of Work, Environment & Health',
    year: 2023,
    doi: '10.5271/sjweh.4089',
    fullText: `Objectives: To determine whether occupational chemical exposure predicts mild cognitive impairment over a 15-year follow-up.
Methods: We established a prospective cohort of 8,420 industrial workers followed from 2008 to 2023. Exposure was quantified via job-exposure matrices. Cox proportional hazards regression was adjusted for baseline age, smoking, educational level, and cardiovascular comorbidities.
Results: High exposure was associated with adjusted hazard ratio of 1.64 (95% CI 1.28-2.10). Loss to follow-up was 4.2%.
Conclusions: Longitudinal occupational solvent exposure is an independent risk factor.`,
    expectedDocumentType: 'COHORT_STUDY',
    expectedStudyDesignId: 'non-randomized-cohort',
    expectedMethodology: 'Kvantitativ (Observasjonell)',
    expectedPurpose: 'Etiologi / Risikofaktorer',
    expectedRecommendedInstrumentId: 'robins-i',
    expectedIsResearchDocument: true,
    rationale: 'Prospektiv observasjonell kohortstudie med oppfølging over tid. Evalueres med ROBINS-I eller CASP Cohort.',
    incompatibleInstrumentTest: {
      instrumentId: 'jbi-qualitative-2017',
      expectedBlockedOrWarning: true
    }
  },

  // 4. Kasus-kontroll-studie (Case-Control)
  {
    id: 'bench-4',
    testIndex: 4,
    title: 'Early dietary patterns and subsequent risk of childhood acute lymphoblastic leukemia: A nationwide matched case-control study',
    authors: 'Bakke, J., Olsen, M., & Vik, T.',
    journal: 'American Journal of Epidemiology',
    year: 2022,
    doi: '10.1093/aje/kwac114',
    fullText: `Methods: We conducted a population-based matched case-control study of 612 pediatric leukemia cases diagnosed between 2010 and 2020 matched with 1,836 healthy population controls on birth year and sex. Dietary recall was collected from mothers using validated food frequency questionnaires. Conditional logistic regression estimated odds ratios.
Results: Breastfeeding duration >6 months was associated with lower risk (OR 0.68, 95% CI 0.51-0.90).
Conclusion: Early infant feeding practices modulate pediatric leukemia risk.`,
    expectedDocumentType: 'CASE_CONTROL_STUDY',
    expectedStudyDesignId: 'case-control',
    expectedMethodology: 'Kvantitativ (Observasjonell)',
    expectedPurpose: 'Etiologi / Risikofaktorer',
    expectedRecommendedInstrumentId: 'casp-cohort',
    expectedIsResearchDocument: true,
    rationale: 'Kasus-kontroll-studie som sammenligner syke og friske kontroller retrospektivt.',
    incompatibleInstrumentTest: {
      instrumentId: 'amstar-2',
      expectedBlockedOrWarning: true
    }
  },

  // 5. Tverrsnittstudie (Prevalens / Survey)
  {
    id: 'bench-5',
    testIndex: 5,
    title: 'Prevalence and correlates of psychological distress among nursing home healthcare workers: A national cross-sectional survey',
    authors: 'Holm, S., & Dahl, C.',
    journal: 'International Journal of Nursing Studies',
    year: 2023,
    doi: '10.1016/j.ijnurstu.2023.104481',
    fullText: `Background: Workplace stress in eldercare is an escalating public health concern.
Methods: We performed a nationwide cross-sectional survey among 3,140 registered nurses and nurse assistants across 120 municipal nursing homes in Norway. Psychological distress was measured using the Hopkins Symptom Checklist (HSCL-10). Multivariable linear regression analyzed associations with shift work and emotional exhaustion.
Results: The overall prevalence of moderate-to-severe distress was 26.4% (95% CI 24.8-28.0).
Conclusion: Psychological distress is prevalent and correlated with night shifts and staffing ratios.`,
    expectedDocumentType: 'CROSS_SECTIONAL_STUDY',
    expectedStudyDesignId: 'cross-sectional',
    expectedMethodology: 'Kvantitativ (Observasjonell)',
    expectedPurpose: 'Prevalens / Kartlegging',
    expectedRecommendedInstrumentId: 'mmat-2018',
    expectedIsResearchDocument: true,
    rationale: 'Tverrsnittsstudie (survey) som måler forekomst på ett tidspunkt. Vurderes med MMAT eller JBI Cross-sectional.',
    incompatibleInstrumentTest: {
      instrumentId: 'rob-2',
      expectedBlockedOrWarning: true
    }
  },

  // 6. Systematisk oversikt uten meta-analyse
  {
    id: 'bench-6',
    testIndex: 6,
    title: 'Non-pharmacological interventions for sleep disturbances in dementia: A Cochrane systematic review of randomized trials',
    authors: 'Cochrane Dementia Group & Møller, P.',
    journal: 'Cochrane Database of Systematic Reviews',
    year: 2023,
    doi: '10.1002/14651858.CD011882.pub3',
    fullText: `Background: Sleep fragmentation causes caregiver burden and institutionalization.
Objectives: To assess the efficacy of non-pharmacological interventions in improving sleep quality in persons with dementia.
Search methods: We conducted a comprehensive systematic literature search across electronic databases including PubMed/MEDLINE, Embase, PsycINFO, and Cochrane CENTRAL from inception to May 2023 without language restrictions. Two independent reviewers screened titles and extracted data.
Selection criteria: Randomized controlled trials comparing sleep hygiene, light therapy, or music interventions with control.
Data collection: Two review authors independently extracted data and assessed risk of bias using RoB 2. Due to high clinical and methodological heterogeneity, results were synthesized narratively in a structured summary.`,
    expectedDocumentType: 'SYSTEMATIC_REVIEW',
    expectedStudyDesignId: 'systematic-review',
    expectedMethodology: 'Kunnskapsoppsummering / Syntese',
    expectedPurpose: 'Kunnskapssyntese / Meta-analyse',
    expectedRecommendedInstrumentId: 'amstar-2',
    expectedIsResearchDocument: true,
    rationale: 'Systematisk oversikt over primærstudier med definert søkestrategi og narrativ syntese. Evalueres med AMSTAR 2.',
    incompatibleInstrumentTest: {
      instrumentId: 'jbi-qualitative-2017',
      expectedBlockedOrWarning: true
    }
  },

  // 7. Systematisk oversikt med meta-analyse
  {
    id: 'bench-7',
    testIndex: 7,
    title: 'Efficacy of cognitive behavioural therapy for adult chronic insomnia: Systematic review and meta-analysis of randomized controlled trials',
    authors: 'Shea, B., & Grimshaw, J.',
    journal: 'BMJ (Clinical Research Ed.)',
    year: 2022,
    doi: '10.1136/bmj.e4521',
    fullText: `Objective: To evaluate the effect of cognitive behavioural therapy on sleep latency and sleep efficiency.
Design: Systematic review and meta-analysis of randomized controlled trials.
Data sources: Electronic databases (PubMed, Embase, Cochrane Register) searched up to October 2022.
Eligibility: RCTs comparing CBT-I against waitlist or sham.
Synthesis: Random-effects model meta-analysis was performed. Heterogeneity was assessed using I² statistics. Pooled effect size demonstrated significant reduction in sleep onset latency (standardized mean difference -0.74, 95% CI -0.92 to -0.56; 34 trials, 4,120 participants; I²=42%). Forest plot and funnel plot inspection indicated low publication bias.`,
    expectedDocumentType: 'META_ANALYSIS',
    expectedStudyDesignId: 'systematic-review',
    expectedMethodology: 'Kunnskapsoppsummering / Syntese',
    expectedPurpose: 'Kunnskapssyntese / Meta-analyse',
    expectedRecommendedInstrumentId: 'amstar-2',
    expectedIsResearchDocument: true,
    rationale: 'Systematisk oversikt med kvantitativ pooling og meta-analyse. AMSTAR 2 er det offisielle gullstandard-verktøyet.',
    incompatibleInstrumentTest: {
      instrumentId: 'casp-qualitative',
      expectedBlockedOrWarning: true
    }
  },

  // 8. Scoping Review
  {
    id: 'bench-8',
    testIndex: 8,
    title: 'Digital health technologies for community rehabilitation: A scoping review of implementation frameworks and outcome metrics',
    authors: 'Tricco, A., & Lemyre, F.',
    journal: 'JBI Evidence Synthesis',
    year: 2023,
    doi: '10.11124/JBIES-22-00412',
    fullText: `Objective: The objective of this scoping review is to map the range, breadth, and characteristics of digital health interventions deployed in community-based rehabilitation.
Introduction: Digital tools are expanding rapidly, but definitions and clinical boundaries remain disparate.
Inclusion criteria: Studies involving adults undergoing rehabilitation where digital platforms were utilized.
Methods: This scoping review was conducted in accordance with the JBI scoping review methodology and PRISMA-ScR guidelines. Databases searched included MEDLINE, CINAHL, and Web of Science. Two independent reviewers charted evidence across 82 included papers to summarize technological typologies and research gaps.`,
    expectedDocumentType: 'SCOPING_REVIEW',
    expectedStudyDesignId: 'scoping-review',
    expectedMethodology: 'Kunnskapsoppsummering / Syntese',
    expectedPurpose: 'Kunnskapssyntese / Meta-analyse',
    expectedRecommendedInstrumentId: 'prisma-2020',
    expectedIsResearchDocument: true,
    rationale: 'Scoping review som kartlegger et kunnskapsfelt. Vurderes primært med PRISMA-ScR Rapporteringsstandard.',
    incompatibleInstrumentTest: {
      instrumentId: 'rob-2',
      expectedBlockedOrWarning: true
    }
  },

  // 9. Kvalitativ evidenssyntese (Meta-etnografi / Metasyntese)
  {
    id: 'bench-9',
    testIndex: 9,
    title: 'Patients experiences of living with chronic kidney disease: A qualitative evidence synthesis and meta-ethnography',
    authors: 'Lewin, S., Glenton, C., & Munthe-Kaas, H.',
    journal: 'PLOS Medicine',
    year: 2021,
    doi: '10.1371/journal.pmed.1003412',
    fullText: `Background: Qualitative evidence syntheses offer crucial insights into patient values and preferences for clinical guidelines.
Methods: We performed a systematic qualitative evidence synthesis of 32 primary qualitative studies. We conducted a meta-ethnographic translation of conceptual findings across primary papers. We assessed our confidence in each synthesized review finding using the GRADE-CERQual (Confidence in the Evidence from Reviews of Qualitative research) approach across methodological limitations, coherence, adequacy of data, and relevance.
Findings: Four overarching synthesized themes were identified with high confidence in the thematic integrity of bodily alienation.`,
    expectedDocumentType: 'QUALITATIVE_EVIDENCE_SYNTHESIS',
    expectedStudyDesignId: 'qualitative-synthesis',
    expectedMethodology: 'Kunnskapsoppsummering / Syntese',
    expectedPurpose: 'Kvalitativ evidenssyntese',
    expectedRecommendedInstrumentId: 'grade-cerqual',
    expectedIsResearchDocument: true,
    rationale: 'Kvalitativ evidenssyntese (metasyntese) av primærstudier. GRADE-CERQual er gullstandarden for tillitsvurdering.',
    incompatibleInstrumentTest: {
      instrumentId: 'rob-2',
      expectedBlockedOrWarning: true
    }
  },

  // 10. Mixed-methods studie (Kvalitativ + Kvantitativ)
  {
    id: 'bench-10',
    testIndex: 10,
    title: 'Evaluating the implementation of a trauma-informed care pathway in youth residential facilities: A convergent parallel mixed methods study',
    authors: 'Hong, Q. N., Pluye, P., & Følling, I.',
    journal: 'Journal of Mixed Methods Research',
    year: 2024,
    doi: '10.1177/1558689823120145',
    fullText: `Design: We used a convergent parallel mixed methods design to evaluate clinical effectiveness and implementation determinants.
Methods: Quantitative pre-post standardized symptom surveys (n=180 youth) were collected concurrently with in-depth qualitative semi-structured interviews with residential staff (n=28). Quantitative and qualitative data strands were analyzed separately and then integrated via joint displays and side-by-side comparison to explore convergence, expansion, and discordance between quantitative symptom improvement and qualitative staff resistance.
Results: Mixed-methods integration demonstrated that organizational climate explained quantitative variability across wards.`,
    expectedDocumentType: 'MIXED_METHODS_STUDY',
    expectedStudyDesignId: 'mixed-methods',
    expectedMethodology: 'Mixed Methods (Blandet metode)',
    expectedPurpose: 'Levde erfaringer / Sosiale fenomener',
    expectedRecommendedInstrumentId: 'mmat-2018',
    expectedIsResearchDocument: true,
    rationale: 'Mixed methods studie med integrasjon av kvalitative og kvantitative data. Skal evalueres med MMAT 2018.',
    incompatibleInstrumentTest: {
      instrumentId: 'rob-2',
      expectedBlockedOrWarning: true
    }
  },

  // 11. Nasjonal faglig retningslinje (Helsedirektoratet)
  {
    id: 'bench-11',
    testIndex: 11,
    title: 'Nasjonal faglig retningslinje for utredning, behandling og oppfølging av personer med samtidig rusmisbruk og psykisk lidelse (ROP-lidelser)',
    authors: 'Helsedirektoratet (Norge)',
    journal: 'Helsedirektoratet Veiledere og Retningslinjer',
    year: 2024,
    doi: '',
    fullText: `Formål og virkeområde: Denne nasjonale faglige retningslinjen gir normerende faglige anbefalinger for spesialisthelsetjenesten og den kommunale helse- og omsorgstjenesten.
Metodisk prosess: Utviklet i henhold til Helsedirektoratets veileder for retningslinjearbeid og GRADE-metodikk. Arbeidsgruppen har bestått av tverrfaglige fageksperter, brukerrepresentanter og metodekonsulenter. Systematiske litteratursøk ble gjennomført av bibliotekarer.
Anbefalinger: 
1. Personer med mistanke om ROP-lidelse bør tilbys integrert og samtidig behandling i et forpliktende tverrfaglig samarbeid (Sterk anbefaling).
2. Individuell plan og koordinator skal etableres ved langvarige behov (Lovfestet plikt).`,
    expectedDocumentType: 'NATIONAL_CLINICAL_GUIDELINE',
    expectedStudyDesignId: 'clinical-guideline',
    expectedMethodology: 'Klinisk retningslinje / Normativ praksis',
    expectedPurpose: 'Kliniske handlingsanbefalinger',
    expectedRecommendedInstrumentId: 'agree-ii',
    expectedIsResearchDocument: false,
    rationale: 'Nasjonal faglig retningslinje (normativ veileder, IKKE en forskningsartikkel). Skal vurderes med AGREE II.',
    incompatibleInstrumentTest: {
      instrumentId: 'jbi-qualitative-2017',
      expectedBlockedOrWarning: true
    }
  },

  // 12. Offentlig policy/anbefalingsdokument (WHO Policy Document)
  {
    id: 'bench-12',
    testIndex: 12,
    title: 'WHO guideline on self-care interventions for health and wellbeing: Public health recommendations for antenatal care',
    authors: 'World Health Organization (WHO Guidelines Review Committee)',
    journal: 'WHO Guidelines Approved by the Guidelines Review Committee',
    year: 2022,
    doi: '10.2471/who.guideline.2022.1',
    fullText: `Executive Summary: This normative policy and clinical guidance document provides global public health recommendations on evidence-based self-care interventions.
Development process: Systematic reviews were commissioned to synthesize benefits and harms. The WHO Guidelines Development Group applied the GRADE Evidence-to-Decision framework to formulate contextual recommendations considering values, resources, equity, and human rights.
Target audience: National policymakers, guideline development committees, and healthcare managers.`,
    expectedDocumentType: 'CLINICAL_PRACTICE_GUIDELINE',
    expectedStudyDesignId: 'clinical-guideline',
    expectedMethodology: 'Klinisk retningslinje / Normativ praksis',
    expectedPurpose: 'Kliniske handlingsanbefalinger',
    expectedRecommendedInstrumentId: 'agree-ii',
    expectedIsResearchDocument: false,
    rationale: 'WHO klinisk praksisretningslinje og global policy. Vurderes med AGREE II (23 items / 6 domener).',
    incompatibleInstrumentTest: {
      instrumentId: 'rob-2',
      expectedBlockedOrWarning: true
    }
  },

  // 13. Forskningsprotokoll (PROSPERO Systematic Review Protocol)
  {
    id: 'bench-13',
    testIndex: 13,
    title: 'Effectiveness of nurse-led transitional care interventions in reducing 30-day readmissions: A systematic review and meta-analysis protocol',
    authors: 'Johnsen, A., & Vestergaard, M.',
    journal: 'Systematic Reviews Journal / PROSPERO Protocol',
    year: 2024,
    doi: '10.1186/s13643-024-02450-x',
    fullText: `Background: Transitional care bridges hospital discharge to home.
Methods and analysis: This is a systematic review protocol prepared in accordance with the PRISMA-P statement. Electronic databases (CINAHL, MEDLINE, Embase) will be searched from inception to December 2024. Two reviewers will independently screen all titles and abstracts and extract data using a pilot-tested form. Risk of bias will be appraised using RoB 2 and ROBINS-I. Random-effects meta-analysis will be conducted where studies are sufficiently homogeneous.
Registration: PROSPERO CRD42024512981.`,
    expectedDocumentType: 'PROTOCOL_SYSTEMATIC_REVIEW',
    expectedStudyDesignId: 'protocol',
    expectedMethodology: 'Metodologi & Verktøyutvikling',
    expectedPurpose: 'Studieprotokoll / Prosjektplan',
    expectedRecommendedInstrumentId: 'prisma-2020',
    expectedIsResearchDocument: true,
    rationale: 'Studieprotokoll for en systematisk oversikt. Skal evalueres etter PRISMA-P rapporteringskrav, ikke med bias-kalkulatorer.',
    incompatibleInstrumentTest: {
      instrumentId: 'rob-2',
      expectedBlockedOrWarning: true
    }
  },

  // 14. Metodestudie (Utvikling og validering av et appraisal-verktøy)
  {
    id: 'bench-14',
    testIndex: 14,
    title: 'Development and validation of a tool for assessing the methodological quality of mixed methods health studies: The MMAT psychometric study',
    authors: 'Pace, R., Pluye, P., Bartlett, G., & Hong, Q. N.',
    journal: 'Quality & Quantity / Methodological Research',
    year: 2012,
    doi: '10.1007/s11135-010-9396-8',
    fullText: `Abstract: Critical appraisal of complex mixed methods studies poses unique methodological challenges.
Objective: To describe the development and validation of the Mixed Methods Appraisal Tool (MMAT) and examine its inter-rater reliability and content validity.
Methods: A 4-stage Delphi consensus study with 22 international methodology experts was performed to develop criteria. Inter-rater reliability was measured using intra-class correlation coefficients (ICC) across 80 appraised health studies evaluated by 4 independent raters.
Results: The MMAT demonstrated high content validity and acceptable inter-rater reliability (ICC 0.72-0.89).`,
    expectedDocumentType: 'METHODOLOGY_STUDY',
    expectedStudyDesignId: 'methodology-study',
    expectedMethodology: 'Metodologi & Verktøyutvikling',
    expectedPurpose: 'Metodisk rammeverk / Verktøy',
    expectedRecommendedInstrumentId: 'mmat-2018',
    expectedIsResearchDocument: true,
    rationale: 'Metodologisk valideringsstudie. Vurderer måleegenskaper og reliabilitet til et forskningsinstrument.',
    incompatibleInstrumentTest: {
      instrumentId: 'agree-ii',
      expectedBlockedOrWarning: true
    }
  },

  // 15. Dokument som IKKE kan klassifiseres sikkert (Fragmentert / Motstridende)
  {
    id: 'bench-15',
    testIndex: 15,
    title: 'Short conference snippet on healthcare management and intervention considerations',
    authors: 'Anonymous / Unknown',
    journal: 'Conference Abstracts Bulletin',
    year: 2021,
    doi: '',
    fullText: `Short summary fragment. We looked at some clinical factors and asked people about things. A survey was mentioned and also two people were spoken with in an office. No statistics or formal qualitative framework were stated. Some recommendations for management are listed.`,
    expectedDocumentType: 'UNKNOWN_UNCERTAIN',
    expectedStudyDesignId: 'unknown-uncertain',
    expectedMethodology: 'Ukjent / Uavklart',
    expectedPurpose: 'Uavklart / Krever manuell presisering',
    expectedRecommendedInstrumentId: 'jbi-qualitative-2017',
    expectedIsResearchDocument: null,
    rationale: 'Ufullstendig og tvetydig tekst uten entydige metodiske kjennetegn. Systemet må nekte å gjette og kreve manuell forskerverifisering.',
    incompatibleInstrumentTest: {
      instrumentId: 'jbi-qualitative-2017',
      expectedBlockedOrWarning: true
    }
  }
];
