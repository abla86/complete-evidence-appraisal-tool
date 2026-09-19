import { EvidenceOSProject } from '../types';

export const sampleProjectSGLT2: EvidenceOSProject = {
  id: 'sglt2-hfpef-review-2024',
  name: 'SGLT2-hemmere ved hjertesvikt med bevart ejeksjonsfraksjon (HFpEF)',
  createdAt: '2024-03-15T09:00:00Z',
  lastUpdated: '2024-04-10T14:30:00Z',
  question: {
    title: 'Effekt og sikkerhet av SGLT2-hemmere hos voksne med hjertesvikt og bevart ejeksjonsfraksjon',
    primaryQuestion: 'Hva er effekten av SGLT2-hemmere sammenlignet med placebo på kardiovaskulær død og sykehusinnleggelse for hjertesvikt hos voksne pasienter med hjertesvikt og bevart ejeksjonsfraksjon (LVEF > 40-50%)?',
    secondaryQuestions: [
      'Påvirker SGLT2-hemmere livskvalitet målt med Kansas City Cardiomyopathy Questionnaire (KCCQ)?',
      'Er det økt risiko for alvorlige bivirkninger som diabetisk ketoacidose eller urosepsis?'
    ],
    contextRationale: 'Hjertesvikt med bevart ejeksjonsfraksjon (HFpEF) utgjør omtrent halvparten av alle hjertesvikttilfeller og har historisk manglet evidensbaserte legemiddelbehandlinger med dokumentert reduksjon i mortalitet og morbiditet. Nylige store fase-3 randomiserte studier har undersøkt SGLT2-hemmere i denne populasjonen.',
    questionType: 'intervention',
    finer: {
      feasible: { score: 'Good', note: 'Flere store publiserte fase-3 RCTer foreligger med tilstrekkelig statistisk styrke.' },
      interesting: { score: 'Good', note: 'Kritisk kunnskapshull i kardiologi; direkte føringer for nasjonale og internasjonale retningslinjer (ESC / ACC).' },
      novel: { score: 'Good', note: 'Samler de nyeste dataene inkludert DELIVER og EMPEROR-Preserved i en helhetlig GRADE-evaluering.' },
      ethical: { score: 'Good', note: 'Sekundæranalyse av publiserte anonymiserte studiedata; ingen direkte etiske pasientkonflikter.' },
      relevant: { score: 'Good', note: 'Direkte relevant for klinisk praksis og refusjonsbeslutninger i spesialist- og primærhelsetjenesten.' },
    },
    protocolRegistration: 'PROSPERO CRD42024589211',
    lastModified: '2024-04-02T11:15:00Z',
  },
  pico: {
    frameworkType: 'PICO',
    population: 'Voksne pasienter (≥ 18 år) med symptomatisk hjertesvikt og dokumentert bevart eller mildt redusert ejeksjonsfraksjon (LVEF > 40%), forhøyet NT-proBNP og tegn på strukturell hjertesykdom.',
    intervention: 'SGLT2-hemmere (dapagliflozin, empagliflozin, canagliflozin, sotagliflozin) administrert oralt uavhengig av diabetesstatus.',
    comparison: 'Placebo eller standard medisinsk behandling (bakgrunnsbehandling uten SGLT2-hemmer).',
    primaryOutcome: 'Kombinert endepunkt av kardiovaskulær død eller første sykehusinnleggelse for forverret hjertesvikt.',
    secondaryOutcomes: [
      'All-cause mortalitet',
      'Endring i KCCQ total symptom score ved 8-12 måneder',
      'Forverring av nyrefunksjon (eGFR-fall ≥ 50% eller ESRD)',
      'Alvorlige bivirkninger (alvorlig hypoglykemi, ketoacidose, amputasjon)'
    ],
    studyDesigns: ['Randomiserte kontrollerte studier (RCT)', 'Dobbeltblinde placebokontrollerte fase-3 studier'],
    inclusionCriteria: [
      'Randomiserte kontrollerte studier med parallellgruppedesign',
      'Pasienter med hjertesvikt og LVEF > 40%',
      'Oppfølgingstid minimum 12 uker',
      'Rapporterer kardiovaskulære endepunkter eller standardiserte livskvalitetsskårer'
    ],
    exclusionCriteria: [
      'Ikke-randomiserte observasjonsstudier',
      'Studier som utelukkende inkluderte pasienter med LVEF ≤ 40% (HFrEF)',
      'Dyreforsøk eller in-vitro studier',
      'Konferanseabstrakt uten fagfellevurderte primærdata'
    ],
    meshTerms: [
      {
        domain: 'P',
        name: 'Heart Failure with Preserved Ejection Fraction',
        textWords: ['heart failure with preserved ejection fraction', 'HFpEF', 'diastolic heart failure'],
        meshDescriptors: ['Heart Failure, Diastolic[Mesh]', 'Ventricular Dysfunction, Left[Mesh]']
      },
      {
        domain: 'I',
        name: 'Sodium-Glucose Transporter 2 Inhibitors',
        textWords: ['SGLT2 inhibitor', 'dapagliflozin', 'empagliflozin', 'canagliflozin', 'sotagliflozin', 'gliflozin'],
        meshDescriptors: ['Sodium-Glucose Transporter 2 Inhibitors[Mesh]']
      },
      {
        domain: 'C',
        name: 'Placebo / Standard of Care',
        textWords: ['placebo', 'control', 'usual care', 'standard therapy'],
        meshDescriptors: ['Placebos[Mesh]']
      },
      {
        domain: 'O',
        name: 'Cardiovascular Outcomes & Mortality',
        textWords: ['cardiovascular death', 'heart failure hospitalization', 'mortality', 'KCCQ'],
        meshDescriptors: ['Cardiovascular Diseases/mortality[Mesh]', 'Hospitalization[Mesh]']
      }
    ]
  },
  search: {
    databases: [
      {
        id: 'db-pubmed',
        database: 'PubMed / MEDLINE',
        query: '("Heart Failure, Diastolic"[Mesh] OR "HFpEF"[tiab] OR ("heart failure"[tiab] AND "preserved ejection fraction"[tiab])) AND ("Sodium-Glucose Transporter 2 Inhibitors"[Mesh] OR "sglt2"[tiab] OR "dapagliflozin"[tiab] OR "empagliflozin"[tiab] OR "canagliflozin"[tiab]) AND (randomized controlled trial[pt] OR "controlled trial"[tiab])',
        hits: 642,
        dateExecuted: '2024-03-20',
        fieldsUsed: ['[Mesh]', '[tiab]', '[pt]'],
        notes: 'Søk oppdatert med Cochrane RCT sensitivity filter.'
      },
      {
        id: 'db-cochrane',
        database: 'Cochrane Library (CENTRAL)',
        query: '(MeSH descriptor: [Heart Failure, Diastolic] explode all trees OR (heart failure NEXT preserved):ti,ab,kw) AND (MeSH descriptor: [Sodium-Glucose Transporter 2 Inhibitors] explode all trees OR (dapagliflozin OR empagliflozin OR canagliflozin):ti,ab,kw) with Cochrane Library publication date Between Jan 2015 and Mar 2024',
        hits: 318,
        dateExecuted: '2024-03-20',
        fieldsUsed: ['ti,ab,kw', 'MeSH descriptor'],
        notes: 'Filtrert for Trials i CENTRAL.'
      },
      {
        id: 'db-embase',
        database: 'Embase',
        query: "('diastolic heart failure'/exp OR 'heart failure with preserved ejection fraction':ti,ab) AND ('sodium glucose cotransporter 2 inhibitor'/exp OR 'dapagliflozin':ti,ab OR 'empagliflozin':ti,ab) AND ('randomized controlled trial'/exp OR 'clinical trial':it)",
        hits: 512,
        dateExecuted: '2024-03-20',
        fieldsUsed: ['/exp', ':ti,ab', ':it'],
        notes: 'Ekskludert dyreforsøk via Embase human limit.'
      }
    ],
    totalRecordsIdentified: 1472,
    duplicatesRemoved: 428,
    recordsAfterDeduplication: 1044,
    searchFilterTags: ['RCT filter', 'Human only', '2015-2024', 'English & Scandinavian languages'],
    auditNotes: 'Deduping utført med EndNote og Rayyan deduplication algorithm med 95% tittel- og forfatteroverensstemmelse.'
  },
  studies: [
    {
      id: 'solomon_2022',
      citationKey: 'DELIVER (Solomon 2022)',
      title: 'Dapagliflozin in Heart Failure with Mildly Reduced or Preserved Ejection Fraction',
      authors: 'Solomon SD, McMurray JJV, Claggett B, de Boer RA, et al. (DELIVER Trial Investigators)',
      year: 2022,
      journal: 'New England Journal of Medicine',
      doi: '10.1056/NEJMoa2206286',
      pmid: '36027570',
      abstract: 'BACKGROUND: Patients with heart failure and a preserved ejection fraction represent a large proportion of patients with heart failure. We evaluated dapagliflozin in patients with heart failure and a left ventricular ejection fraction of more than 40%. METHODS: We randomly assigned 6263 patients to receive dapagliflozin (10 mg once daily) or matching placebo. The primary outcome was a composite of worsening heart failure (hospitalization or urgent visit) or cardiovascular death. RESULTS: The primary outcome occurred in 512 of 3131 patients (16.4%) in the dapagliflozin group and in 610 of 3132 patients (19.5%) in the placebo group (hazard ratio, 0.82; 95% CI, 0.73 to 0.92; P<0.001).',
      methodsSummary: 'Internasjonal multisenter, dobbeltblindet RCT med 6263 pasienter, sentralisert randomisering med interaktivt websystem (IWRS), oppfølging median 2.3 år.',
      status: 'fulltext_eligible',
      titleAbstractDecision: 'include',
      fullTextDecision: 'include',
      aiScreening: {
        recommendation: 'INCLUDE',
        confidence: 98,
        reason: 'Direkte match med PICO: Fase-3 RCT på dapagliflozin hos pasienter med LVEF > 40% med kardiovaskulære endepunkter.',
        keyQuote: 'We randomly assigned 6263 patients with heart failure and LVEF > 40% to dapagliflozin or matching placebo.'
      }
    },
    {
      id: 'anker_2021',
      citationKey: 'EMPEROR-Preserved (Anker 2021)',
      title: 'Empagliflozin in Heart Failure with a Preserved Ejection Fraction',
      authors: 'Anker SD, Butler J, Filippatos G, Ferreira JP, et al. (EMPEROR-Preserved Trial Investigators)',
      year: 2021,
      journal: 'New England Journal of Medicine',
      doi: '10.1056/NEJMoa2107038',
      pmid: '34449189',
      abstract: 'BACKGROUND: The efficacy of sodium-glucose cotransporter 2 (SGLT2) inhibitors in patients with heart failure and a preserved ejection fraction is unclear. METHODS: We randomly assigned 5988 patients with class II-IV heart failure and an ejection fraction of more than 40% to receive empagliflozin (10 mg once daily) or placebo. The primary outcome was a composite of cardiovascular death or hospitalization for heart failure. RESULTS: The primary outcome occurred in 415 of 2997 patients (13.8%) in the empagliflozin group and in 511 of 2991 patients (17.1%) in the placebo group (hazard ratio, 0.79; 95% CI, 0.69 to 0.90; P<0.001).',
      methodsSummary: 'Multinasjonal, dobbeltblindet, placebokontrollert RCT med 5988 pasienter, median oppfølging 26.2 måneder, uavhengig blindet endepunktskomité.',
      status: 'fulltext_eligible',
      titleAbstractDecision: 'include',
      fullTextDecision: 'include',
      aiScreening: {
        recommendation: 'INCLUDE',
        confidence: 99,
        reason: 'Kjernestudie: Stor randomisert placebokontrollert studie av empagliflozin ved HFpEF med harde kliniske endepunkter.',
        keyQuote: 'We randomly assigned 5988 patients with class II-IV heart failure and ejection fraction > 40% to empagliflozin or placebo.'
      }
    },
    {
      id: 'nassif_2021',
      citationKey: 'PRESERVED-HF (Nassif 2021)',
      title: 'The SGLT2 inhibitor dapagliflozin in heart failure with preserved ejection fraction: a multicenter randomized trial',
      authors: 'Nassif ME, Windsor SL, Borlaug BA, Kitzman DW, et al.',
      year: 2021,
      journal: 'Nature Medicine',
      doi: '10.1038/s41591-021-01536-x',
      pmid: '34711976',
      abstract: 'In patients with heart failure and preserved ejection fraction (HFpEF), symptoms and functional limitations are prevalent. In this multicenter, double-blind trial, 324 patients with HFpEF were randomized to dapagliflozin 10 mg daily or placebo for 12 weeks. Dapagliflozin significantly improved KCCQ Clinical Summary Score compared to placebo (effect size 5.8 points, 95% CI 2.3 to 9.2, P=0.001) and increased 6-minute walk distance.',
      methodsSummary: 'Dobbeltblindet randomisert multisenterstudie i USA med 324 pasienter, 12 ukers intervensjon, fokusert på pasientrapportert helsestatus og 6MWD.',
      status: 'fulltext_eligible',
      titleAbstractDecision: 'include',
      fullTextDecision: 'include',
      aiScreening: {
        recommendation: 'INCLUDE',
        confidence: 92,
        reason: 'Randomisert studie på dapagliflozin ved HFpEF, rapporterer primært livskvalitet (KCCQ) og sekundære kliniske hendelser.',
        keyQuote: '324 patients with HFpEF were randomized to dapagliflozin 10 mg daily or placebo for 12 weeks.'
      }
    },
    {
      id: 'spertus_2022',
      citationKey: 'CHIEF-HF (Spertus 2022)',
      title: 'The Canagliflozin: Impact on Health Status, Physical Function and Quality of Life in HF Study',
      authors: 'Spertus JA, Birmingham MC, Nassif M, Damaraju CV, et al.',
      year: 2022,
      journal: 'Journal of the American College of Cardiology',
      doi: '10.1016/j.jacc.2022.02.014',
      pmid: '35248443',
      abstract: 'The CHIEF-HF trial evaluated canagliflozin 100 mg daily versus placebo in 476 patients with heart failure (both HFrEF and HFpEF cohorts) using a decentralized virtual trial platform. In the HFpEF cohort (n=288), canagliflozin significantly improved KCCQ Total Symptom Score at 12 weeks (difference 4.5 points, 95% CI 1.1 to 7.9). Low rate of clinical events over 12 weeks.',
      methodsSummary: 'Desentralisert virtuell dobbeltblind RCT, 476 deltakere hvorav 288 hadde LVEF > 40%, oppfølging 12 uker med digitale måleverktøy.',
      status: 'fulltext_eligible',
      titleAbstractDecision: 'include',
      fullTextDecision: 'include',
      aiScreening: {
        recommendation: 'INCLUDE',
        confidence: 88,
        reason: 'Inkluderer subpopulasjon med HFpEF (LVEF > 40%) randomisert til canagliflozin mot placebo med KCCQ og sikkerhetsdata.',
        keyQuote: 'In the HFpEF cohort (n=288), canagliflozin significantly improved KCCQ Total Symptom Score.'
      }
    },
    {
      id: 'bhatt_2021',
      citationKey: 'SOLOIST-WHF (Bhatt 2021)',
      title: 'Sotagliflozin in Patients with Diabetes and Recent Worsening Heart Failure',
      authors: 'Bhatt DL, Szarek M, Steg PG, Cannon CP, et al. (SOLOIST-WHF Investigators)',
      year: 2021,
      journal: 'New England Journal of Medicine',
      doi: '10.1056/NEJMoa2030183',
      pmid: '33197159',
      abstract: 'Patients with diabetes and worsening heart failure are at high risk. In this double-blind trial, 1222 patients hospitalized for worsening heart failure were randomized to sotagliflozin or placebo. In the subgroup with preserved ejection fraction (n=256), sotagliflozin reduced total cardiovascular deaths and hospitalizations (hazard ratio, 0.48; 95% CI, 0.27 to 0.86).',
      methodsSummary: 'Multisenter RCT med 1222 pasienter med diabetes og nylig sykehusinnleggelse; forhåndsdefinert subgruppe med LVEF ≥ 50%.',
      status: 'fulltext_eligible',
      titleAbstractDecision: 'include',
      fullTextDecision: 'include',
      aiScreening: {
        recommendation: 'INCLUDE',
        confidence: 86,
        reason: 'Relevant forhåndsdefinert subgruppeanalyse for HFpEF (LVEF ≥ 50%) med kombinert SGLT1/2-hemmer sotagliflozin mot placebo.',
        keyQuote: 'In the subgroup with preserved ejection fraction (n=256), sotagliflozin reduced total cardiovascular deaths.'
      }
    },
    {
      id: 'dapa_hf_2019',
      citationKey: 'DAPA-HF (McMurray 2019)',
      title: 'Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction',
      authors: 'McMurray JJV, Solomon SD, Inzucchi SE, et al.',
      year: 2019,
      journal: 'New England Journal of Medicine',
      abstract: 'In patients with heart failure and reduced ejection fraction (LVEF ≤ 40%), the risk of worsening heart failure or death from cardiovascular causes was lower among those who received dapagliflozin than among those who received placebo.',
      status: 'screened_excluded',
      titleAbstractDecision: 'exclude',
      exclusionReason: 'Wrong population',
      exclusionNotes: 'Inkluderte utelukkende HFrEF (LVEF ≤ 40%). Ekskludert i henhold til PICO-kriteriene som spesifiserer bevart ejeksjonsfraksjon.',
      aiScreening: {
        recommendation: 'EXCLUDE',
        confidence: 96,
        reason: 'Ekskludert: Feil populasjon. Studien omhandler HFrEF (redusert ejeksjonsfraksjon ≤ 40%), ikke HFpEF.',
        keyQuote: 'In patients with heart failure and reduced ejection fraction (LVEF ≤ 40%)...'
      }
    },
    {
      id: 'chen_2023_animal',
      citationKey: 'Chen 2023 (Preclinical)',
      title: 'Molecular cardioprotective pathways of empagliflozin in hypertensive diabetic rats',
      authors: 'Chen Y, Liu X, Zhang H, et al.',
      year: 2023,
      journal: 'Cardiovascular Research',
      abstract: 'Sprague-Dawley rats with DOCA-salt induced diastolic stiffness were administered empagliflozin 10mg/kg daily. Myocardial fibrosis and titin phosphorylation were quantified post-mortem.',
      status: 'screened_excluded',
      titleAbstractDecision: 'exclude',
      exclusionReason: 'Ineligible study design',
      exclusionNotes: 'Dyreforsøk (preklinisk rotte-modell). Ekskludert ihht kriterier.',
      aiScreening: {
        recommendation: 'EXCLUDE',
        confidence: 99,
        reason: 'Ekskludert: Preklinisk dyreforsøk (rotter), ikke human klinisk randomisert studie.',
        keyQuote: 'Sprague-Dawley rats with DOCA-salt induced diastolic stiffness...'
      }
    }
  ],
  appraisal: {
    toolType: 'CASP_RCT',
    studiesAppraised: {
      solomon_2022: {
        items: [
          { id: 'casp-1', question: 'Did the study address a clearly focused issue?', response: 'Yes', comments: 'Klart definert PICO med LVEF > 40% og dapagliflozin vs placebo.' },
          { id: 'casp-2', question: 'Was the assignment of patients to treatments randomized?', response: 'Yes', comments: 'Sentralisert randomisering med interaktivt webbasert svarsystem (IWRS).' },
          { id: 'casp-3', question: 'Were all patients who entered the trial properly accounted for at its conclusion?', response: 'Yes', comments: 'Komplett oppfølging (> 99.8% av pasientene fullførte eller hadde kjent vitalstatus).' },
          { id: 'casp-4', question: 'Were patients, health workers and study personnel blind to treatment?', response: 'Yes', comments: 'Trippelblindet med identiske placebotabletter og uavhengig endepunktskomité.' },
          { id: 'casp-5', question: 'Were the groups similar at the start of the trial?', response: 'Yes', comments: 'God balanse i demografi, komorbiditet og bakgrunnsmedikasjon ved baseline.' },
          { id: 'casp-6', question: 'Aside from the experimental intervention, were the groups treated equally?', response: 'Yes', comments: 'Standard hjertesviktbehandling tillatt i begge grupper etter klinisk skjønn.' },
        ],
        overallRating: 'High Quality',
        strengths: 'Stor global populasjon (n=6263), grundig blindet metodikk, minimalt med tapt oppfølging.',
        limitations: 'Mindre andel pasienter med LVEF > 60% sammenlignet med 41-59%.'
      },
      anker_2021: {
        items: [
          { id: 'casp-1', question: 'Did the study address a clearly focused issue?', response: 'Yes', comments: 'Tydelig formulert problemstilling for empagliflozin ved HFpEF.' },
          { id: 'casp-2', question: 'Was the assignment of patients to treatments randomized?', response: 'Yes', comments: 'Datagenerert randomiseringssekvens stratifisert på region og diabetes.' },
          { id: 'casp-3', question: 'Were all patients accounted for at conclusion?', response: 'Yes', comments: 'Intention-to-treat analyse med under 0.2% tapt til oppfølging.' },
          { id: 'casp-4', question: 'Was blinding maintained across all actors?', response: 'Yes', comments: 'Dobbeltblindet med identisk matchende placebo.' },
          { id: 'casp-5', question: 'Were baseline characteristics balanced?', response: 'Yes', comments: 'Lik fordeling av alder, kjønn, eGFR og NT-proBNP.' },
          { id: 'casp-6', question: 'Were both groups treated equally otherwise?', response: 'Yes', comments: 'Identisk oppfølgingsprotokoll og besøksintervaller.' },
        ],
        overallRating: 'High Quality',
        strengths: 'Robust metodikk, uavhengig blindet adjudication committee, stor statistisk styrke.',
        limitations: 'Færre inkluderte fra afrikansk herkomst.'
      }
    }
  },
  robAssessments: {
    solomon_2022: {
      studyId: 'solomon_2022',
      d1_randomization: 'Low risk',
      d1_notes: 'Sentralisert IWRS-randomisering med skjult tildeling og balanserte baseline-karakteristika.',
      d2_deviations: 'Low risk',
      d2_notes: 'Dobbeltblindet med identisk placebo; adekvat håndtering av protokollavvik; ITT-analyse.',
      d3_missing_data: 'Low risk',
      d3_notes: 'Oppfølgingsdata for primærendepunktet foreligger for over 99.8% av pasientene.',
      d4_measurement: 'Low risk',
      d4_notes: 'Uavhengig, blindet klinisk endepunktskomité (CEC) vurderte alle kardiovaskulære hendelser.',
      d5_reporting: 'Low risk',
      d5_notes: 'Analysert i henhold til forhåndsregistrert statistisk analyseplan (SAP) på ClinicalTrials.gov (NCT03619213).',
      overall: 'Low risk',
      summaryComment: 'Meget høy metodisk kvalitet med lav risiko for skjevhet på tvers av samtlige fem domener.'
    },
    anker_2021: {
      studyId: 'anker_2021',
      d1_randomization: 'Low risk',
      d1_notes: 'Datagenerert randomisering med sentral interaktiv respons-teknologi (IRT).',
      d2_deviations: 'Low risk',
      d2_notes: 'Placebokontrollert, blindet pasient, behandler og utfallsevaluator.',
      d3_missing_data: 'Low risk',
      d3_notes: 'Kun 4 pasienter (< 0.1%) trakk samtykke for vitalstatus ved studiens slutt.',
      d4_measurement: 'Low risk',
      d4_notes: 'Blindet uavhengig klinisk vurderingskomité med standardiserte diagnostiske kriterier.',
      d5_reporting: 'Low risk',
      d5_notes: 'Publisert protokoll og SAP; alle forhåndsdefinerte primære og sekundære utfall er fullstendig rapportert.',
      overall: 'Low risk',
      summaryComment: 'Konsistent lav risiko for skjevhet i tråd med Cochrane RoB 2-kriteriene.'
    },
    nassif_2021: {
      studyId: 'nassif_2021',
      d1_randomization: 'Low risk',
      d1_notes: 'Randomisering 1:1 stratifisert etter senter med permuterte blokker.',
      d2_deviations: 'Low risk',
      d2_notes: 'Blindet administrasjon, god etterlevelse (> 95%).',
      d3_missing_data: 'Some concerns',
      d3_notes: '18 pasienter (5.5%) manglet KCCQ ved uke 12 på grunn av COVID-19 restriksjoner; multippel imputasjon benyttet.',
      d4_measurement: 'Low risk',
      d4_notes: 'Standardisert elektronisk KCCQ utfylt av pasienten selv før kontakt med studielege.',
      d5_reporting: 'Low risk',
      d5_notes: 'Protokoll forhåndsregistrert (NCT03030222), full rapportering.',
      overall: 'Some concerns',
      summaryComment: 'Noe bekymring i domene 3 på grunn av frafall ved uke 12 under pandemien, ellers metodisk solid.'
    },
    spertus_2022: {
      studyId: 'spertus_2022',
      d1_randomization: 'Low risk',
      d1_notes: 'Automatisert digital randomisering via smarttelefonapplikasjon og forsendelse av kodet legemiddel.',
      d2_deviations: 'Some concerns',
      d2_notes: 'Desentralisert oppsett uten fysiske klinikkbesøk kan ha medført noe variasjon i legemiddelinntak.',
      d3_missing_data: 'Low risk',
      d3_notes: 'Digital oppfølging med 92% fullføring av ukentlige registreringer.',
      d4_measurement: 'Low risk',
      d4_notes: 'Validerte pasientrapporterte utfallsmål innsamlet direkte.',
      d5_reporting: 'Low risk',
      d5_notes: 'Fullstendig rapportering iht protokoll.',
      overall: 'Some concerns',
      summaryComment: 'Desentralisert virtuell studiedesign gir noe usikkerhet rundt intervensjonsetterlevelse, men generelt god kvalitet.'
    },
    bhatt_2021: {
      studyId: 'bhatt_2021',
      d1_randomization: 'Low risk',
      d1_notes: 'Adekvat randomiseringssekvens og fordeling.',
      d2_deviations: 'Low risk',
      d2_notes: 'Dobbeltblindet placebokontrollert studie.',
      d3_missing_data: 'Some concerns',
      d3_notes: 'Studien ble avsluttet tidlig av sponsor på grunn av manglende finansiering under pandemien, noe som forkortet oppfølgingstiden.',
      d4_measurement: 'Low risk',
      d4_notes: 'Blindet adjudication av hendelser.',
      d5_reporting: 'Some concerns',
      d5_notes: 'Endring av primærendepunkt før avblinding grunnet tidlig avslutning av studien.',
      overall: 'Some concerns',
      summaryComment: 'Tidlig avslutning av studien gir noe bekymring, men HFpEF-subgruppeanalysen er likevel verdifull og konsistent.'
    }
  },
  extractions: {
    solomon_2022: {
      studyId: 'solomon_2022',
      country: 'Internasjonal (20 land, Nord-Amerika, Europa, Asia, Sør-Amerika)',
      studyDesign: 'Dobbeltblindet randomisert kontrollert fase-3 studie',
      sampleSizeTotal: 6263,
      sampleSizeIntervention: 3131,
      sampleSizeControl: 3132,
      meanAge: 71.7,
      femalePct: 43.8,
      followUpMonths: 27.6,
      interventionDetails: 'Dapagliflozin 10 mg oralt en gang daglig',
      controlDetails: 'Matchende placebo en gang daglig',
      outcomes: [
        {
          outcomeId: 'cv_death_hf',
          name: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
          type: 'dichotomous',
          eventsIntervention: 512,
          totalIntervention: 3131,
          eventsControl: 610,
          totalControl: 3132,
          notes: 'HR 0.82 (0.73-0.92), p < 0.001'
        },
        {
          outcomeId: 'all_cause_mortality',
          name: 'Total mortalitet (alle årsaker)',
          type: 'dichotomous',
          eventsIntervention: 497,
          totalIntervention: 3131,
          eventsControl: 526,
          totalControl: 3132,
          notes: 'HR 0.94 (0.83-1.07)'
        }
      ]
    },
    anker_2021: {
      studyId: 'anker_2021',
      country: 'Internasjonal (23 land, 612 sentre)',
      studyDesign: 'Dobbeltblindet randomisert kontrollert fase-3 studie',
      sampleSizeTotal: 5988,
      sampleSizeIntervention: 2997,
      sampleSizeControl: 2991,
      meanAge: 71.9,
      femalePct: 44.7,
      followUpMonths: 26.2,
      interventionDetails: 'Empagliflozin 10 mg oralt en gang daglig',
      controlDetails: 'Matchende placebo en gang daglig',
      outcomes: [
        {
          outcomeId: 'cv_death_hf',
          name: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
          type: 'dichotomous',
          eventsIntervention: 415,
          totalIntervention: 2997,
          eventsControl: 511,
          totalControl: 2991,
          notes: 'HR 0.79 (0.69-0.90), p < 0.001'
        },
        {
          outcomeId: 'all_cause_mortality',
          name: 'Total mortalitet (alle årsaker)',
          type: 'dichotomous',
          eventsIntervention: 422,
          totalIntervention: 2997,
          eventsControl: 427,
          totalControl: 2991,
          notes: 'HR 1.00 (0.87-1.15)'
        }
      ]
    },
    nassif_2021: {
      studyId: 'nassif_2021',
      country: 'USA (26 kliniske sentre)',
      studyDesign: 'Dobbeltblindet randomisert fase-2b/3 studie',
      sampleSizeTotal: 324,
      sampleSizeIntervention: 162,
      sampleSizeControl: 162,
      meanAge: 69.8,
      femalePct: 56.5,
      followUpMonths: 3.0,
      interventionDetails: 'Dapagliflozin 10 mg en gang daglig',
      controlDetails: 'Placebo en gang daglig',
      outcomes: [
        {
          outcomeId: 'cv_death_hf',
          name: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
          type: 'dichotomous',
          eventsIntervention: 8,
          totalIntervention: 162,
          eventsControl: 14,
          totalControl: 162,
          notes: 'Kort oppfølgingstid (12 uker)'
        }
      ]
    },
    spertus_2022: {
      studyId: 'spertus_2022',
      country: 'USA (desentralisert virtuell studie)',
      studyDesign: 'Desentralisert dobbeltblind RCT (HFpEF kohort)',
      sampleSizeTotal: 288,
      sampleSizeIntervention: 144,
      sampleSizeControl: 144,
      meanAge: 68.4,
      femalePct: 52.1,
      followUpMonths: 3.0,
      interventionDetails: 'Canagliflozin 100 mg en gang daglig',
      controlDetails: 'Matchende placebo en gang daglig',
      outcomes: [
        {
          outcomeId: 'cv_death_hf',
          name: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
          type: 'dichotomous',
          eventsIntervention: 6,
          totalIntervention: 144,
          eventsControl: 11,
          totalControl: 144,
          notes: '12 ukers hendelser'
        }
      ]
    },
    bhatt_2021: {
      studyId: 'bhatt_2021',
      country: 'Internasjonal (32 land)',
      studyDesign: 'Multisenter dobbeltblind RCT (HFpEF subgruppe LVEF ≥ 50%)',
      sampleSizeTotal: 256,
      sampleSizeIntervention: 128,
      sampleSizeControl: 128,
      meanAge: 70.1,
      femalePct: 49.2,
      followUpMonths: 9.0,
      interventionDetails: 'Sotagliflozin 200-400 mg oralt en gang daglig',
      controlDetails: 'Matchende placebo daglig',
      outcomes: [
        {
          outcomeId: 'cv_death_hf',
          name: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
          type: 'dichotomous',
          eventsIntervention: 21,
          totalIntervention: 128,
          eventsControl: 42,
          totalControl: 128,
          notes: 'HR 0.48 (0.27-0.86) i HFpEF-stratum'
        }
      ]
    }
  },
  gradeRows: [
    {
      id: 'grade-cv-death-hf',
      outcomeName: 'Kardiovaskulær død eller innleggelse for hjertesvikt',
      importance: 'Critical',
      studyCount: 5,
      participantsCount: 13119,
      studyDesign: 'Randomiserte kontrollerte studier (RCT)',
      riskOfBias: 'Not serious',
      riskOfBiasJustification: 'Hovedvekten av evidensen (DELIVER og EMPEROR-Preserved) har lav risiko for skjevhet på samtlige domener.',
      inconsistency: 'Not serious',
      inconsistencyJustification: 'Høy grad av samstemthet på tvers av studiene (I² = 0.0%, p = 0.81 for heterogenitet).',
      indirectness: 'Not serious',
      indirectnessJustification: 'Studiepopulasjonene, intervensjonene og utfallene samsvarer direkte med PICO-spørsmålet.',
      imprecision: 'Not serious',
      imprecisionJustification: 'Stort antall hendelser (> 2100 samlet) og smalt 95% konfidensintervall (RR 0.80, 95% CI 0.73-0.87) som utelukker klinisk betydningsløs effekt.',
      publicationBias: 'Undetected',
      publicationBiasJustification: 'Omfattende litteratursøk inkludert kliniske registere; symmetrisk trappetrinnsfordeling i traktplot.',
      relativeEffect: 'RR 0.80 (0.73 til 0.87)',
      anticipatedRiskControl: 184,
      anticipatedRiskIntervention: 147,
      absoluteEffectSummary: '37 færre per 1 000 (fra 24 færre til 50 færre)',
      certainty: 'High',
      plainLanguageSummary: 'SGLT2-hemmere reduserer risikoen for kardiovaskulær død eller sykehusinnleggelse for hjertesvikt hos pasienter med HFpEF (høy kvalitet på evidensen).'
    },
    {
      id: 'grade-all-cause-mortality',
      outcomeName: 'Totaldødelighet (all-cause mortality)',
      importance: 'Critical',
      studyCount: 2,
      participantsCount: 12251,
      studyDesign: 'Randomiserte kontrollerte studier (RCT)',
      riskOfBias: 'Not serious',
      riskOfBiasJustification: 'Begge inkluderte studier (DELIVER og EMPEROR-Preserved) har lav risiko for skjevhet.',
      inconsistency: 'Not serious',
      inconsistencyJustification: 'Ingen vesentlig heterogenitet (I² = 0.0%).',
      indirectness: 'Not serious',
      indirectnessJustification: 'Direkte populasjon og utfall.',
      imprecision: 'Serious (-1)',
      imprecisionJustification: 'Konfidensintervallet krysser 1.0 og inkluderer både en mulig 13% reduksjon og en mulig 4% økning i dødelighet (HR 0.97, 95% CI 0.89 til 1.06).',
      publicationBias: 'Undetected',
      publicationBiasJustification: 'Forhåndsregistrerte fase-3 multisenterstudier.',
      relativeEffect: 'RR 0.97 (0.89 til 1.06)',
      anticipatedRiskControl: 156,
      anticipatedRiskIntervention: 151,
      absoluteEffectSummary: '5 færre per 1 000 (fra 17 færre til 9 flere)',
      certainty: 'Moderate',
      plainLanguageSummary: 'SGLT2-hemmere gir trolig liten eller ingen forskjell i totaldødelighet over en median oppfølgingstid på to år (moderat kvalitet på evidensen pga. upresisjon).'
    },
    {
      id: 'grade-kccq-qol',
      outcomeName: 'Pasientrapportert helsestatus og livskvalitet (KCCQ Total Score)',
      importance: 'Important',
      studyCount: 4,
      participantsCount: 12863,
      studyDesign: 'Randomiserte kontrollerte studier (RCT)',
      riskOfBias: 'Not serious',
      riskOfBiasJustification: 'Gjennomgående god blindingsintegritet ved innsamling av pasientrapporterte utfall.',
      inconsistency: 'Not serious',
      inconsistencyJustification: 'Konsistente positive forbedringer på mellom 2.0 og 5.8 poeng på KCCQ-skalaen.',
      indirectness: 'Not serious',
      indirectnessJustification: 'Validerte hjertesviktspesifikke instrumenter.',
      imprecision: 'Not serious',
      imprecisionJustification: 'Tilstrekkelig utvalgsstørrelse med statistisk signifikant forbedring over placebo.',
      publicationBias: 'Undetected',
      publicationBiasJustification: 'Ingen holdepunkter for selektiv publisering.',
      relativeEffect: 'Gjennomsnittlig forskjell: +2.4 poeng (95% CI 1.5 til 3.3)',
      anticipatedRiskControl: 0,
      anticipatedRiskIntervention: 0,
      absoluteEffectSummary: 'Klinisk meningsfull forbedring i symptomer og fysisk funksjon (MCID ≥ 2.5 poeng)',
      certainty: 'High',
      plainLanguageSummary: 'SGLT2-hemmere forbedrer helserelatert livskvalitet og reduserer symptombelastning hos personer med HFpEF (høy kvalitet på evidensen).'
    }
  ],
  auditLog: [
    {
      id: 'audit-1',
      timestamp: '2024-03-15T09:00:00Z',
      stage: 'question',
      action: 'Protokoll og forskningsspørsmål opprettet',
      actor: 'Hovedforfatter (Dr. K. Hansen)',
      details: 'Registrert i PROSPERO under ID CRD42024589211.'
    },
    {
      id: 'audit-2',
      timestamp: '2024-03-18T14:20:00Z',
      stage: 'pico',
      action: 'PICO-rammeverk og MeSH-strategi godkjent',
      actor: 'Metodolog / Fagbibliotekar (M. Berg)',
      details: 'Validerte MeSH-termer for Diastolic Heart Failure og SGLT2i.'
    },
    {
      id: 'audit-3',
      timestamp: '2024-03-20T11:45:00Z',
      stage: 'search',
      action: 'Søkestrategier kjørt i PubMed, Cochrane CENTRAL og Embase',
      actor: 'Fagbibliotekar (M. Berg)',
      details: '1472 referanser importert, 428 duplikater fjernet automatisk.'
    },
    {
      id: 'audit-4',
      timestamp: '2024-03-25T16:00:00Z',
      stage: 'screening',
      action: 'Dual-screening fullført med AI-støtte',
      actor: 'Reviewer 1 & 2',
      details: '5 studier inkludert til fulltekst; 2 studier formelt ekskludert med årsak registrert.'
    },
    {
      id: 'audit-5',
      timestamp: '2024-03-29T10:10:00Z',
      stage: 'rob',
      action: 'Cochrane RoB 2-vurderinger gjennomført',
      actor: 'Reviewer 1 & Metodolog',
      details: '2 studier med lav risiko (DELIVER, EMPEROR-Preserved), 3 med enkelte bekymringer.'
    },
    {
      id: 'audit-6',
      timestamp: '2024-04-05T13:30:00Z',
      stage: 'synthesis',
      action: 'DerSimonian-Laird tilfeldige effekter metaanalyse utført',
      actor: 'Biostatistiker (T. Lie)',
      details: 'Beregnet samlet RR = 0.80 [0.73, 0.87], I² = 0.0%.'
    },
    {
      id: 'audit-7',
      timestamp: '2024-04-10T14:30:00Z',
      stage: 'grade',
      action: 'GRADE Summary of Findings tabell ferdigstilt',
      actor: 'Fagpanel og forfattergruppe',
      details: 'Høy evidensstyrke for primærendepunktet, moderat for totaldødelighet.'
    }
  ],
  synthesis: {
    metaAnalyses: [
      {
        outcomeName: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
        effectMeasure: 'RR',
        model: 'random',
        studies: [],
        pooledEffect: 0.80,
        pooledCiLower: 0.73,
        pooledCiUpper: 0.87,
        zValue: 4.88,
        pValue: 0.0001,
        cochranQ: 0.81,
        df: 3,
        qPValue: 0.84,
        iSquared: 0.0,
        tauSquared: 0.0,
      }
    ],
    narrativeSynthesis: 'I denne systematiske oversikten og metaanalysen av fase-3 randomiserte kontrollerte studier med SGLT2-hemmere (dapagliflozin, empagliflozin, sotagliflozin) hos pasienter med hjertesvikt og bevart ejeksjonsfraksjon (HFpEF), fant vi en robust og statistisk signifikant 20% reduksjon i risiko for det sammensatte primærendepunktet kardiovaskulær død eller sykehusinnleggelse for hjertesvikt (RR 0.80, 95% KI 0.73 til 0.87, p < 0.0001). Heterogeniteten mellom studiene var 0% (I² = 0.0%, Cochran Q = 0.81, p = 0.84), noe som reflekterer en påfallende konsistent behandlingseffekt på tvers av ulike molekyler i klassen.',
  },
  grade: {
    outcomeName: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
    studyCount: 4,
    participantsCount: 12534,
    studyDesign: 'Randomiserte kontrollerte studier (RCT)',
    riskOfBias: 'none',
    riskOfBiasExplanation: 'Lav risiko for skjevhet i de sentrale studiene (DELIVER og EMPEROR-Preserved).',
    inconsistency: 'none',
    inconsistencyExplanation: 'Ingen uforklart heterogenitet (I² = 0.0%).',
    indirectness: 'none',
    indirectnessExplanation: 'Direkte samsvar med populasjon og intervensjoner.',
    indirectnessJustification: 'Direkte samsvar med populasjon og intervensjoner.',
    imprecision: 'none',
    imprecisionExplanation: 'Tilstrekkelig statistisk styrke og over 2000 observerte hendelser.',
    publicationBias: 'none',
    publicationBiasExplanation: 'Omfattende internasjonale registre sjekket; ingen skjevhet identifisert.',
    relativeEffect: 'RR 0.80 (0.73 til 0.87)',
    absoluteRiskControl: 184,
    absoluteRiskIntervention: 147,
    riskDifferencePer1000: 37,
    overallCertainty: 'High',
    plainLanguageSummary: 'SGLT2-hemmere reduserer risikoen for kardiovaskulær død eller sykehusinnleggelse for hjertesvikt hos pasienter med hjertesvikt og bevart ejeksjonsfraksjon (høy kvalitet på dokumentasjonen).',
  },
  report: {
    abstract: `Bakgrunn: Hjertesvikt med bevart ejeksjonsfraksjon (HFpEF) utgjør omtrent 50 % av alle hjertesviktpasienter, og har lenge manglet evidensbasert farmakoterapi med dokumentert prognoseforbedring.
Mål: Å vurdere effekten og sikkerheten av natrium-glukose-kotransportør-2 (SGLT2)-hemmere hos pasienter med HFpEF.
Metoder: Vi gjennomførte et systematisk søk i PubMed/MEDLINE, Cochrane Library (CENTRAL) og Embase frem til april 2024. Randomiserte placebokontrollerte studier ble screenet og vurdert for risiko for skjevhet med Cochrane RoB 2. Data ble samlet i en tilfeldig effekt-metaanalyse (DerSimonian-Laird), og evidensens kvalitet ble vurdert med GRADE.
Resultater: Fire randomiserte studier med totalt 12 534 deltakere ble inkludert. Behandling med SGLT2-hemmer førte til en statistisk signifikant 20 % reduksjon i det sammensatte primærendepunktet kardiovaskulær død eller sykehusinnleggelse for hjertesvikt (RR 0.80, 95 % KI 0.73–0.87, p < 0.0001; I² = 0.0 %). Dette tilsvarer 37 færre hendelser per 1000 behandlede pasienter over en median oppfølgingstid på 2,3 år. Det ble også observert en signifikant forbedring i pasientrapportert livskvalitet målt med KCCQ.
Konklusjon: SGLT2-hemmere gir en entydig og klinisk meningsfull reduksjon i kardiovaskulære hendelser hos pasienter med HFpEF med høy evidensstyrke iht. GRADE.`,
    introduction: `Hjertesvikt med bevart ejeksjonsfraksjon (HFpEF) kjennetegnes av symptomer og tegn på hjertesvikt med normal eller tilnærmet normal venstre ventrikkel ejeksjonsfraksjon (LVEF ≥ 50 % eller 41–49 % for mildt redusert). Tilstanden er assosiert med høy morbiditet, hyppige sykehusinnleggelser og betydelig nedsatt livskvalitet.

Historisk har medikamentelle studier med ACE-hemmere, ARBer, betablokkere og MRA ikke klart å påvise en entydig reduksjon i harde kliniske endepunkter i denne undergruppen. Oppdagelsen av at SGLT2-hemmere (opprinnelig utviklet for type 2-diabetes) utøver systemiske kardiorenale beskyttende effekter, har ført til store fase 3-studier som DELIVER og EMPEROR-Preserved. Hensikten med denne systematiske oversikten er å sammenstille den samlede evidensen for SGLT2-hemmere ved HFpEF under anvendelse av PRISMA 2020- og GRADE-retningslinjene.`,
    methods: `Protokollen ble registrert i PROSPERO (CRD42024589211). Litteratursøket ble utført i PubMed/MEDLINE, Cochrane Central Register of Controlled Trials (CENTRAL) og Embase. Søkestrengene kombinerte kontrollerte emneord (MeSH/Emtree) og friteksttermer for hjertesvikt med bevart ejeksjonsfraksjon og SGLT2-hemmere.

To uavhengige granskere screenet titler, abstrakter og fulltekstartikler etter forhåndsdefinerte PICO-kriterier. Diskrepanter ble løst ved konsensus. Metodisk kvalitet og risiko for skjevhet ble vurdert ved hjelp av Cochrane RoB 2-verktøyet for fem spesifikke domener.

Kvantitativ metaanalyse ble utført med DerSimonian-Laird tilfeldig effekt-modell for å beregne samlet relativ risiko (RR) og 95 % konfidensintervaller. Statistisk heterogenitet ble kvantifisert med Cochrans Q-test og I²-statistikk. Evidensens sikkerhet ble gradert i henhold til GRADE (Grading of Recommendations Assessment, Development and Evaluation).`,
    results: `Det systematiske søket identifiserte 1472 unike referanser. Etter fjerning av 428 duplikater, ble 1044 referanser screenet på tittel og abstraktnivå. 12 artikler ble vurdert i fulltekst, hvorav 4 uavhengige fase-3 RCTer (DELIVER, EMPEROR-Preserved, SOLOIST-WHF og PRESERVED-HF) med 12 534 deltakere oppfylte samtlige inklusjonskriterier.

Risiko for skjevhet ble vurdert som lav for de to store pivotale studiene (DELIVER og EMPEROR-Preserved) over samtlige fem RoB 2-domener. PRESERVED-HF og SOLOIST-WHF hadde enkelte metodiske bekymringer knyttet til oppfølgingstid og frafall.

Metaanalysen viste en signifikant reduksjon i primærendepunktet kardiovaskulær død eller sykehusinnleggelse for hjertesvikt med pooled RR 0.80 (95 % KI 0.73–0.87, p < 0.0001). Heterogenitetsanalysen viste I² = 0.0 % og Cochran Q = 0.81 (p = 0.84), noe som indikerer fullstendig konsistens i retning og størrelsesorden på behandlingseffekten.`,
    discussion: `Funnene i denne systematiske oversikten bekrefter at SGLT2-hemmere representerer et fundamentalt gjennombrudd i behandlingen av HFpEF. Med en relativ risikoreduksjon på 20 % og en absoluttrisikoreduksjon på 37 færre hendelser per 1000 pasienter over 2 år, understøtter evidensgrunnlaget en sterk klasse I-anbefaling i kliniske retningslinjer.

GRADE-vurderingen konkluderte med HØY kvalitet på evidensen for reduksjon i sykehusinnleggelse for hjertesvikt og sammensatt kardiovaskulær morbiditet. For totaldødelighet isolert sett var effekten mer nøytral (RR 0.97, 95 % KI 0.89–1.06), og evidensen ble gradert til MODERAT på grunn av upresisjon som inkluderer både mulig reduksjon og økning.

Styrkene ved denne oversikten omfatter stringent overholdelse av PRISMA 2020, forhåndsregistrert PROSPERO-protokoll, og inklusjon av studier med høy metodisk standard.`,
    conclusion: `SGLT2-hemmere gir en signifikant og klinisk viktig reduksjon i risikoen for sykehusinnleggelse for hjertesvikt og kardiovaskulær død hos voksne med hjertesvikt og bevart ejeksjonsfraksjon. Det foreligger høy evidenssikkerhet for at denne effekten er reell og reproduserbar på tvers av pasientgrupper.`,
  },
  metadata: {
    authors: ['EvidenceOS Research Consortium', 'Dr. K. Hansen, MD PhD', 'M. Berg, MSc'],
    institution: 'Institutt for klinisk medisin & Senter for evidensbasert praksis',
  },
};

export const sampleProject = sampleProjectSGLT2;
