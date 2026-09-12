import { RetrievedStudy, GradeAssessment, ClinicalRecommendation } from '../types';

export const DEFAULT_CLINICAL_TASK = 
  'Finn forskning om effekten av kognitiv stimulering ved demens, vurder evidensen og gjør klart et beslutningsgrunnlag.';

export const INITIAL_STUDIES_POOL: RetrievedStudy[] = [
  {
    id: 'study-1',
    pmid: '36881472',
    doi: '10.1002/14651858.CD005562.pub3',
    title: 'Cognitive stimulation to improve cognitive functioning in people with dementia',
    authors: 'Woods B, Aguirre E, Spector AE, Orrell M',
    year: 2023,
    journal: 'Cochrane Database of Systematic Reviews',
    studyType: 'Systematisk oversikt (Cochrane/AMSTAR)',
    abstract: 'Bakgrunn: Kognitiv stimuleringsterapi (CST) er en strukturert gruppeintervensjon for personer med mild til moderat demens. Mål: Å vurdere effekter og sikkerhet av kognitiv stimulering sammenlignet med sedvanlig oppfølging. Metoder: Søk i Cochrane Dementia and Cognitive Improvement Group Register, PubMed og Embase. 36 randomiserte kontrollerte studier (n=2914) ble inkludert. Resultater: Kognitiv stimulering gir statistisk og klinisk signifikant forbedring i kognitiv funksjon (SMD 0.42, 95% KI 0.31 til 0.54, p < 0.00001, moderat evidens) og livskvalitet (SMD 0.28, 95% KI 0.16 til 0.40). Ingen alvorlige bivirkninger ble registrert.',
    screeningStatus: 'INCLUDED',
    keyFindingSummary: 'Cochrane-oversikt over 36 RCTer (n=2914). Viser konsistent og signifikant bedring i kognisjon (SMD 0.42) og selvrapportert livskvalitet. Ingen bivirkninger.',
    effectSizeEstimate: 'SMD 0.42 [0.31, 0.54] (Kognisjon), SMD 0.28 [0.16, 0.40] (Livskvalitet)',
    appraisal: {
      tool: 'AMSTAR_2',
      overallQuality: 'HIGH',
      confidenceRating: 94,
      criticalDeficiencies: [],
      nonCriticalDeficiencies: ['Kilde for finansiering av primærstudier var kun delvis rapportert i eldre inkluderte RCTer.'],
      concludingSummary: 'Systematisk oversikt med høy metodologisk kvalitet. Protokoll forhåndsregistrert (PROSPERO), omfattende søkestrategi i flere databaser, uavhengig dobbeltscreening og adekvat bruk av GRADE.',
      checklist: [
        { criterionId: 'A1', question: 'Inneholdt forskningsspørsmålet og inklusjonskriteriene PICO-komponenter?', rating: 'JA', evaluatorNote: 'Klart definert PICO for personer med demens og kognitiv stimulering.', isCriticalDomain: false },
        { criterionId: 'A2', question: 'Var oversiktens protokoll etablert og publisert før gjennomføring?', rating: 'JA', evaluatorNote: 'Protokoll publisert og forhåndsregistrert i Cochrane Library.', isCriticalDomain: true },
        { criterionId: 'A3', question: 'Forklarte forfatterne valg av studiedesign for inklusjon?', rating: 'JA', evaluatorNote: 'Kun randomiserte kontrollerte studier (RCT) ble inkludert.', isCriticalDomain: false },
        { criterionId: 'A4', question: 'Brukte forfatterne en omfattende litteratursøkestrategi?', rating: 'JA', evaluatorNote: 'Søkte i minst 5 databaser + grå litteratur og kliniske registere.', isCriticalDomain: true },
        { criterionId: 'A5', question: 'Ble studieseleksjon utført i duplikat (av minst to uavhengige)?', rating: 'JA', evaluatorNote: 'To uavhengige forskere screenet titler/abstrakt med dokumentert enighet.', isCriticalDomain: false },
        { criterionId: 'A6', question: 'Ble dataekstraksjon utført i duplikat?', rating: 'JA', evaluatorNote: 'Uavhengig datauttrekk med standardiserte skjema.', isCriticalDomain: false },
        { criterionId: 'A7', question: 'Ble en liste over ekskluderte studier med begrunnelse oppgitt?', rating: 'JA', evaluatorNote: 'Detaljert tabell over ekskluderte fulltekster med årsak (PRISMA).', isCriticalDomain: true },
        { criterionId: 'A8', question: 'Ble inkluderte studier beskrevet med tilstrekkelig detaljrikdom?', rating: 'JA', evaluatorNote: 'Populasjon, intervensjonsdose, kontrollbetingelse og utfall grundig tabellert.', isCriticalDomain: false },
        { criterionId: 'A9', question: 'Ble en tilfredsstillende teknikk brukt for å vurdere risiko for skjevhet (RoB)?', rating: 'JA', evaluatorNote: 'Cochrane RoB 2 verktøy benyttet for alle inkluderte studier.', isCriticalDomain: true },
        { criterionId: 'A10', question: 'Ble finansieringskilder til inkluderte studier rapportert?', rating: 'DELVIS', evaluatorNote: 'Ikke alle eldre studier oppga kommersiell eller statlig finansiering.', isCriticalDomain: false },
        { criterionId: 'A11', question: 'Var de statistiske metodene for metaanalysen adekvate?', rating: 'JA', evaluatorNote: 'Random-effects modell med vurdering av I² heterogenitet.', isCriticalDomain: true },
        { criterionId: 'A12', question: 'Ble risiko for skjevhet vurdert ved tolkning av metaanalyseresultatene?', rating: 'JA', evaluatorNote: 'Sensitivitetsanalyse ekskluderte studier med høy RoB uten at effekten falt bort.', isCriticalDomain: false },
        { criterionId: 'A13', question: 'Ble risiko for skjevhet tatt i betraktning i diskusjonen?', rating: 'JA', evaluatorNote: 'Tydelig drøfting av manglende blinding av deltakere (vanskelig ved psykososiale tiltak).', isCriticalDomain: true },
        { criterionId: 'A14', question: 'Ga forfatterne en tilfredsstillende forklaring og diskusjon av heterogenitet?', rating: 'JA', evaluatorNote: 'Undergruppeanalyser på demensalvorlighet og gruppesetting.', isCriticalDomain: false },
        { criterionId: 'A15', question: 'Ble publikasjonsskjevhet (funnel plot) undersøkt?', rating: 'JA', evaluatorNote: 'Egger test og traktplott viste lav sannsynlighet for skjevhet.', isCriticalDomain: true },
        { criterionId: 'A16', question: 'Rapporterte forfatterne eventuelle interessekonflikter?', rating: 'JA', evaluatorNote: 'Full åpenhet om opphavsrett til CST-manualer og uavhengig statistiker.', isCriticalDomain: false }
      ]
    }
  },
  {
    id: 'study-2',
    pmid: '12907483',
    doi: '10.1192/bjp.183.3.248',
    title: 'Efficacy of an evidence-based cognitive stimulation therapy programme for people with dementia: randomised controlled trial',
    authors: 'Spector A, Thorgrimsen L, Woods B, Royan L, Davies S, Orrell M',
    year: 2003,
    journal: 'British Journal of Psychiatry',
    studyType: 'Randomisert kontrollert studie (RCT)',
    abstract: 'Bakgrunn: Kognitiv stimuleringsterapi (CST) ble designet etter prinsippene for evidensbasert praksis. Metode: En multisenter randomisert kontrollert enkeltblindet studie i 23 dagsentre og sykehjem (n=201). Intervensjonsgruppen mottok CST to ganger ukentlig i 7 uker (14 sesjoner) ledet av trenede terapeuter. Kontrollgruppen fikk vanlig omsorg. Utfall: Kognisjon (ADAS-Cog, MMSE) og livskvalitet (QoL-AD). Resultater: ADAS-Cog viste signifikant bedring i intervensjonsgruppen sammenlignet med kontroll (differanse 2.3 poeng, 95% KI 0.4 til 4.2, p=0.017). QoL-AD bedret seg med 1.6 poeng (p=0.04).',
    screeningStatus: 'INCLUDED',
    keyFindingSummary: 'Landemerke multisenter RCT (n=201) som etablerte CST-protokollen. Påviste signifikant forbedring i ADAS-Cog (2.3 poeng, p=0.017) og QoL-AD.',
    effectSizeEstimate: 'ADAS-Cog: -2.3 poeng forbedring [0.4, 4.2], QoL-AD: +1.6 poeng [0.1, 3.1]',
    appraisal: {
      tool: 'CASP_RCT',
      overallQuality: 'HIGH',
      confidenceRating: 88,
      criticalDeficiencies: [],
      nonCriticalDeficiencies: ['Deltakerblinding umulig pga. intervensjonens natur; utfallsmålere var imidlertid strengt blindet.'],
      concludingSummary: 'Metodologisk robust multisenter-RCT. Randomisering og allokeringsskjuling adekvat utført. Blindet utfallsvurdering og ITT-analyse (intention-to-treat).',
      checklist: [
        { criterionId: 'C1', question: 'Adresserte studien et klart formulert forskningsspørsmål?', rating: 'JA', evaluatorNote: 'Tydelig formulert populasjon (demens), intervensjon (14-sesjoners CST) og kontroll.', isCriticalDomain: true },
        { criterionId: 'C2', question: 'Var allokeringen av deltakere til intervensjoner randomisert?', rating: 'JA', evaluatorNote: 'Datagenerert randomisering stratifisert etter senter.', isCriticalDomain: true },
        { criterionId: 'C3', question: 'Ble alle deltakere som ble inkludert gjort rede for ved studiens slutt?', rating: 'JA', evaluatorNote: 'Frafall under 10%, rapportert i CONSORT flytskjema med årsaker.', isCriticalDomain: true },
        { criterionId: 'C4', question: 'Var deltakere, helsepersonell og studiespersonell blindet for intervensjonen?', rating: 'DELVIS', evaluatorNote: 'Utfallsevaluatorer var strengt blindet; deltakere/terapeuter kunne ikke blindes.', isCriticalDomain: false },
        { criterionId: 'C5', question: 'Var gruppene likeverdige ved oppstart av studien (baseline-balanse)?', rating: 'JA', evaluatorNote: 'Ingen klinisk relevante forskjeller i alder, kjønn, MMSE eller medisinering.', isCriticalDomain: false },
        { criterionId: 'C6', question: 'Ble gruppene behandlet likt bortsett fra den navngitte intervensjonen?', rating: 'JA', evaluatorNote: 'Standard pleie og dagsentertilbud fortsatte uendret i begge grupper.', isCriticalDomain: false },
        { criterionId: 'C7', question: 'Hvor stor var behandlingseffekten?', rating: 'JA', evaluatorNote: 'Klar statistisk forbedring: ADAS-Cog differanse 2.3 poeng i favør CST.', isCriticalDomain: true },
        { criterionId: 'C8', question: 'Hvor presis var estimatet for behandlingseffekten (konfidensintervall)?', rating: 'JA', evaluatorNote: '95% KI rapportert (0.4 til 4.2), ekskluderer nullhypotese.', isCriticalDomain: false },
        { criterionId: 'C9', question: 'Kan resultatene overføres til lokal populasjon / klinisk praksis?', rating: 'JA', evaluatorNote: 'Gjennomført i representative sykehjem og dagsentre i primærhelsetjenesten.', isCriticalDomain: false },
        { criterionId: 'C10', question: 'Ble alle klinisk viktige utfall vurdert?', rating: 'JA', evaluatorNote: 'Kognisjon, livskvalitet og atferdssymptomer (NPI) ble målt.', isCriticalDomain: false },
        { criterionId: 'C11', question: 'Er nytteverdien verdt potensielle skader og kostnader?', rating: 'JA', evaluatorNote: 'Ingen uønskede hendelser rapportert; lav intervensjonskostnad.', isCriticalDomain: false }
      ]
    }
  },
  {
    id: 'study-3',
    pmid: '24687570',
    doi: '10.1136/bmj.g2237',
    title: 'Maintenance cognitive stimulation therapy for dementia: single-blind, multicentre, pragmatic randomised controlled trial',
    authors: 'Orrell M, Aguirre E, Spector A, Hoare Z, Woods RT, Russell IT, Knapp M, et al.',
    year: 2014,
    journal: 'BMJ (British Medical Journal)',
    studyType: 'Randomisert kontrollert studie (RCT)',
    abstract: 'Formål: Å undersøke effekten av vedlikeholds-CST (ukentlige gruppesamlinger i 24 uker) etter initiell 7-ukers standard CST. Design: Pragmatisk randomisert kontrollert studie ved 34 sentre (n=236). Primære utfallsmål: Kognitiv funksjon (ADAS-Cog) og livskvalitet (QoL-AD) etter 6 måneder. Resultater: Deltakere i vedlikeholdsgruppen opprettholdt signifikant høyere livskvalitet ved 6 måneder (justert differanse 1.83, 95% KI 0.47 til 3.19, p=0.009). Kognisjon viste en positiv trend (ADAS-Cog differanse -1.06, p=0.11), mest uttalt hos de som tok kolinesterasehemmere.',
    screeningStatus: 'INCLUDED',
    keyFindingSummary: 'BMJ RCT (n=236) som evaluerte langtidseffekt (6 mnd) av vedlikeholds-CST. Viste vedvarende signifikant forbedret livskvalitet (+1.83 poeng) og synergi med medisinsk behandling.',
    effectSizeEstimate: 'QoL-AD: +1.83 [0.47, 3.19] (p=0.009); ADAS-Cog: -1.06 [-2.37, 0.25]',
    appraisal: {
      tool: 'CASP_RCT',
      overallQuality: 'HIGH',
      confidenceRating: 90,
      criticalDeficiencies: [],
      nonCriticalDeficiencies: [],
      concludingSummary: 'Høykvalitets pragmatisk RCT publisert i BMJ. Registrert i ISRCTN. God statistisk kraft og pre-spesifiserte undergruppeanalyser.',
      checklist: [
        { criterionId: 'C1', question: 'Klart fokusert spørsmål?', rating: 'JA', evaluatorNote: 'Vedlikeholds-CST over 24 uker.', isCriticalDomain: true },
        { criterionId: 'C2', question: 'Randomisert allokering?', rating: 'JA', evaluatorNote: 'Uavhengig sentralisert telefontildeling.', isCriticalDomain: true },
        { criterionId: 'C3', question: 'Komplett oppfølging?', rating: 'JA', evaluatorNote: '81% fullførte ved 6 mnd, multippel imputering benyttet.', isCriticalDomain: true },
        { criterionId: 'C4', question: 'Blinding av evaluatorer?', rating: 'JA', evaluatorNote: 'Forskere opprettholdt blinding, brudd dokumentert (kun 3 tilfeller).', isCriticalDomain: false },
        { criterionId: 'C5', question: 'Baseline-balanse?', rating: 'JA', evaluatorNote: 'Velbalanserte kohorter ved baseline.', isCriticalDomain: false },
        { criterionId: 'C6', question: 'Likt tilbud utover intervensjon?', rating: 'JA', evaluatorNote: 'Vanlig omsorg videreført.', isCriticalDomain: false },
        { criterionId: 'C7', question: 'Størrelse på effekt?', rating: 'JA', evaluatorNote: 'Statistisk signifikant for livskvalitet (p=0.009).', isCriticalDomain: true },
        { criterionId: 'C8', question: 'Presisjon i effektmål?', rating: 'JA', evaluatorNote: '95% KI rapportert for alle primære og sekundære mål.', isCriticalDomain: false },
        { criterionId: 'C9', question: 'Generaliserbarhet?', rating: 'JA', evaluatorNote: 'Gjennomført i vanlige helsetjenester med pragmatiske kriterier.', isCriticalDomain: false },
        { criterionId: 'C10', question: 'Relevante utfall målt?', rating: 'JA', evaluatorNote: 'Livskvalitet, kognisjon, ADL og pårørendestress.', isCriticalDomain: false },
        { criterionId: 'C11', question: 'Nytte overstiger kostnad?', rating: 'JA', evaluatorNote: 'Kostnadseffektivitet dokumentert i helseøkonomisk analyse.', isCriticalDomain: false }
      ]
    }
  },
  {
    id: 'study-4',
    pmid: '16880456',
    doi: '10.1192/bjp.bp.105.010728',
    title: 'Cognitive stimulation therapy for dementia: cost-effectiveness analysis',
    authors: 'Knapp M, Thorgrimsen L, Patel A, Spector A, Kataoka A, Woods B, Orrell M',
    year: 2006,
    journal: 'British Journal of Psychiatry',
    studyType: 'Randomisert kontrollert studie (RCT)',
    abstract: 'Hensikt: Å evaluere kostnadseffektiviteten av kognitiv stimuleringsterapi for personer med demens sammenlignet med vanlig omsorg. Metode: Økonomisk evaluering integrert i multisenter-RCT. Kostnader for helsetjenester, omsorg og tiltak ble registrert. Resultater: CST var assosiert med forbedret livskvalitet til en gjennomsnittlig nettokostnad per deltaker på under £100 per uke. Sannsynligheten for at CST er kostnadseffektivt sammenlignet med vanlig oppfølging oversteg 80% for vanlige terskelverdier for betalingsvillighet.',
    screeningStatus: 'INCLUDED',
    keyFindingSummary: 'Helseøkonomisk analyse integrert i RCT. Dokumenterte at CST er klart kostnadseffektivt med >80% sannsynlighet innenfor etablerte helseøkonomiske terskler.',
    effectSizeEstimate: 'ICER: £75 per poengbedring i QoL-AD; høy kostnadseffektivitet',
    appraisal: {
      tool: 'CASP_RCT',
      overallQuality: 'HIGH',
      confidenceRating: 85,
      criticalDeficiencies: [],
      nonCriticalDeficiencies: [],
      concludingSummary: 'Metodisk solid kost-nytte evaluering med bootstrapping og sensitivitetsanalyser.',
      checklist: [
        { criterionId: 'C1', question: 'Klart forskningsspørsmål?', rating: 'JA', evaluatorNote: 'Kostnadseffektivitet av CST vs sedvanlig praksis.', isCriticalDomain: true },
        { criterionId: 'C7', question: 'Effektstørrelse?', rating: 'JA', evaluatorNote: 'ICER og CEAC-kurver levert.', isCriticalDomain: true },
        { criterionId: 'C11', question: 'Nytteverdi?', rating: 'JA', evaluatorNote: 'Dokumentert gunstig samfunnsøkonomisk profil.', isCriticalDomain: true }
      ]
    }
  },
  {
    id: 'study-5-duplicate',
    pmid: '12907483-dup',
    doi: '10.1192/bjp.183.3.248-mirror',
    title: 'Efficacy of an evidence-based cognitive stimulation therapy programme for people with dementia (Duplicate PubMed/Embase entry)',
    authors: 'Spector A, Woods B, Orrell M',
    year: 2003,
    journal: 'British Journal of Psychiatry / Embase Citation',
    studyType: 'Randomisert kontrollert studie (RCT)',
    abstract: 'Duplikatpost identifisert i Embase med identisk tittel og forfattergruppe fra multisenterstudien.',
    isDuplicate: true,
    screeningStatus: 'EXCLUDED',
    exclusionReason: 'Automatisk fjernet: Duplikatpost registrert i Embase (matchet mot PMID 12907483 med 99.4% tittel-/abstraktlikhet).',
    keyFindingSummary: 'Duplikat fjernet av Deduplication Agent.'
  },
  {
    id: 'study-6-excluded',
    pmid: '29871144',
    doi: '10.1016/j.ajp.2018.04.012',
    title: 'Transcranial direct current stimulation (tDCS) combined with computer games in vascular dementia',
    authors: 'Chen J, Zhao Y, Zhang H',
    year: 2018,
    journal: 'Asian Journal of Psychiatry',
    studyType: 'Kvasieksperimentell studie',
    abstract: 'Pilotstudie (n=18) som undersøkte elektrisk hjernestimulering (tDCS) kombinert med dataspill hos pasienter med vaskulær demens.',
    isDuplicate: false,
    screeningStatus: 'EXCLUDED',
    exclusionReason: 'Ekskludert ved tittel/abstrakt-screening: Intervensjonen er invasiv/elektrisk nevrostimulering (tDCS), ikke psykososial kognitiv stimulering (CST). Populasjon oppfylte heller ikke inklusjonskriteriet.',
    keyFindingSummary: 'Ikke-relevant intervensjon (tDCS/elektrisk apparat).'
  }
];

export const DEFAULT_GRADE_ASSESSMENTS: GradeAssessment[] = [
  {
    outcome: 'Kognitiv funksjon (ADAS-Cog, MMSE)',
    importance: 'KRITISK',
    studyCount: 36,
    participants: 2914,
    riskOfBias: 'Ingen alvorlig',
    inconsistency: 'Ingen alvorlig',
    indirectness: 'Ingen alvorlig',
    imprecision: 'Ingen alvorlig',
    publicationBias: 'Usannsynlig',
    certainty: 'MODERATE',
    relativeEffect: 'SMD 0.42 [95% KI: 0.31 til 0.54]',
    absoluteEffect: 'Tilsvarer ca. 2.0–2.5 poeng forbedring på ADAS-Cog skala (klinisk relevant)',
    clinicalInterpretation: 'Moderat evidens for at kognitiv stimulering gir en reell, målbar forbedring i global kognisjon hos personer med mild til moderat demens. Effekten tilsvarer eller overgår farmakologisk behandling med kolinesterasehemmere.'
  },
  {
    outcome: 'Selvopplevd livskvalitet (QoL-AD)',
    importance: 'KRITISK',
    studyCount: 22,
    participants: 1980,
    riskOfBias: 'Ingen alvorlig',
    inconsistency: 'Ingen alvorlig',
    indirectness: 'Ingen alvorlig',
    imprecision: 'Ingen alvorlig',
    publicationBias: 'Usannsynlig',
    certainty: 'MODERATE',
    relativeEffect: 'SMD 0.28 [95% KI: 0.16 til 0.40]',
    absoluteEffect: 'Gjennomsnittlig bedring på 1.6–1.8 poeng på QoL-AD skala',
    clinicalInterpretation: 'Moderat evidens for at deltakerne selv opplever økt trivsel, sosial tilhørighet og bedre livskvalitet under og etter CST-sesjoner.'
  },
  {
    outcome: 'Dagliglivets aktiviteter (ADL)',
    importance: 'VIKTIG',
    studyCount: 15,
    participants: 1320,
    riskOfBias: 'Alvorlig (-1)',
    inconsistency: 'Alvorlig (-1)',
    indirectness: 'Ingen alvorlig',
    imprecision: 'Ingen alvorlig',
    publicationBias: 'Usannsynlig',
    certainty: 'LOW',
    relativeEffect: 'SMD 0.11 [95% KI: -0.05 til 0.27]',
    absoluteEffect: 'Liten til usikker endring i formell ADL-score',
    clinicalInterpretation: 'Lav evidensstyrke for direkte overføringsverdi til basale ADL-ferdigheter (påkledning/mating). Kognitiv stimulering er rettet mot tenkning og sosial interaksjon, ikke spesifikk ADL-trening.'
  },
  {
    outcome: 'Pårørendebelastning og velvære',
    importance: 'VIKTIG',
    studyCount: 12,
    participants: 890,
    riskOfBias: 'Ingen alvorlig',
    inconsistency: 'Ingen alvorlig',
    indirectness: 'Ingen alvorlig',
    imprecision: 'Alvorlig (-1)',
    publicationBias: 'Usannsynlig',
    certainty: 'MODERATE',
    relativeEffect: 'SMD -0.19 [95% KI: -0.38 til 0.00]',
    absoluteEffect: 'Tendens til redusert opplevd omsorgsbelastning (Zarit Burden Interview)',
    clinicalInterpretation: 'Moderat evidens for gunstig effekt på pårørende når personen med demens deltar i strukturerte gruppetilbud.'
  },
  {
    outcome: 'Sikkerhet og uønskede hendelser',
    importance: 'KRITISK',
    studyCount: 28,
    participants: 2450,
    riskOfBias: 'Ingen alvorlig',
    inconsistency: 'Ingen alvorlig',
    indirectness: 'Ingen alvorlig',
    imprecision: 'Ingen alvorlig',
    publicationBias: 'Usannsynlig',
    certainty: 'HIGH',
    relativeEffect: 'RR 1.01 [95% KI: 0.92 til 1.11]',
    absoluteEffect: 'Ingen økning i fall, forvirringstilstander eller depressive episoder',
    clinicalInterpretation: 'Høy evidensstyrke for at kognitiv stimuleringsterapi er trygg og bivirkningsfri.'
  }
];

export const DEFAULT_CLINICAL_RECOMMENDATION: ClinicalRecommendation = {
  direction: 'FOR',
  strength: 'STERK',
  statement: 'Personer med mild til moderat demens bør tilbys kognitiv stimuleringsterapi (CST) i gruppe som en integrert del av helse- og omsorgstilbudet i kommunehelsetjenesten og på dagsentre.',
  targetPopulation: 'Hjemmeboende og sykehjemsbeboere med diagnostisert mild til moderat demens (f.eks. Alzheimer, vaskulær eller blandet demens; typisk MMSE 12–24).',
  implementationConsiderations: [
    'Intervensjonen bør gjennomføres etter evidensbasert manual (f.eks. 14 sesjoner à 45 minutter, 2 ganger per uke, i grupper på 6–8 personer).',
    'Gruppeledere bør ha gjennomført standardisert CST-opplæring for å sikre intervensjonstroskap (fidelity).',
    'Vedlikeholds-CST (ukentlige samlinger) bør vurderes for å opprettholde effekt over tid.',
    'Tilbudet bør kombineres med eventuell medikamentell behandling (kolinesterasehemmere) da studier viser additiv effekt.'
  ],
  monitoringAndFollowUp: 'Evaluering av kognitiv funksjon og livskvalitet etter 7 uker og ved 6 måneder ved bruk av validerte instrumenter.',
  valuesAndPreferences: 'Brukere og pårørende verdsetter det sosiale fellesskapet høyt, og tiltaket oppleves som meningsfullt, verdighetsbevarende og uten stigmatisering.'
};
