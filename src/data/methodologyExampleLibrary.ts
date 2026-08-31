import { ArticleAppraisal } from '../types';

export interface ExampleEvaluationCriterion {
  id: number | string;
  criterionTitle: string;
  officialQuestion: string;
  status: 'Ja' | 'Nei' | 'Uklart' | 'Lav risiko' | 'Høy risiko' | 'Noe bekymring' | 'Høy kvalitet' | 'Moderat' | 'Lav kvalitet' | 'Tilfredsstilt' | 'Ikke tilfredsstilt';
  pageLocation: string; // e.g. "s. 3" or "s. 4, avsnitt 2"
  pageComment: string; // e.g. "[s. 3]"
  evidenceQuote: string; // Direct text excerpt from the study
  whyAssessedAsSuch: string; // Pedagogical explanation of why this verdict was chosen based on the evidence
  colorKey: 'emerald' | 'sky' | 'indigo' | 'purple' | 'amber' | 'rose' | 'teal' | 'slate' | 'orange' | 'cyan';
  section: string;
}

export interface MethodologyExampleStudy {
  id: string;
  methodologyKey: string;
  methodologyTitle: string;
  instrumentId: string;
  instrumentName: string;
  instrumentStandard: string;
  article: {
    title: string;
    authors: string;
    shortCitation: string;
    year: number;
    journal: string;
    volumeIssue?: string;
    doi: string;
    studyDesign: string;
    populationAndSetting: string;
    dataCollection: string;
    analyticMethod: string;
    abstract: string;
    fullTextPassages: {
      sectionTitle: string;
      pageNumber: number;
      text: string;
    }[];
  };
  findingsSummary: string; // Explanation of findings in the article
  overallVerdict: string;
  overallVerdictNote: string;
  keyStrengths: string[];
  keyLimitations: string[];
  criteria: ExampleEvaluationCriterion[];
  asAppraisalArticle?: () => ArticleAppraisal;
}

export const METHODOLOGY_EXAMPLE_LIBRARY: MethodologyExampleStudy[] = [
  // =========================================================================
  // 1. KVALITATIV FORSKNING (GROUNDED THEORY & HERMENEUTIKK) - JBI QUALITATIVE
  // =========================================================================
  {
    id: 'example-jbi-qualitative',
    methodologyKey: 'qualitative-gt',
    methodologyTitle: 'Kvalitativ forskning (Grounded Theory)',
    instrumentId: 'jbi-qualitative-2017',
    instrumentName: 'JBI Qualitative Checklist (2017/2024)',
    instrumentStandard: 'Joanna Briggs Institute (JBI) Critical Appraisal Standard',
    article: {
      title: 'Rom for verdighet: En konstruktivistisk grounded theory-studie av pasienters opplevelser av relasjonell trygghet i akuttpsykiatriske avdelinger',
      authors: 'Astrid Bakke, Lars-Petter Kristiansen, Solveig M. Vik',
      shortCitation: 'Bakke et al. (2024)',
      year: 2024,
      journal: 'Tidsskrift for psykisk helsearbeid',
      volumeIssue: '21(2), 112–126',
      doi: '10.18261/tph.2024.02.04',
      studyDesign: 'Kvalitativ eksplorerende studie (Konstruktivistisk Grounded Theory / Charmaz)',
      populationAndSetting: '16 tidligere innlagte pasienter (10 kvinner, 6 menn, 22–64 år) ved 3 akuttpsykiatriske døgnavdelinger i Norge.',
      dataCollection: 'Individuelle semistrukturerte dybdeintervjuer (60–90 minutter) supplert med feltnotater.',
      analyticMethod: 'Konstant komparativ analyse med initiell linje-for-linje koding, fokusert koding og teoretisk metningsvurdering.',
      abstract: 'Formålet med denne studien var å utforske hvordan pasienter innlagt i akuttpsykiatriske døgnavdelinger erfarer relasjonell trygghet og samhandling med helsepersonell under akutte kriser. Datamaterialet består av 16 kvalitative dybdeintervjuer. Analysen avdekket kjerne-kategorien «Å bli møtt som et likeverdig subjekt bak diagnosen», støttet av tre underkategorier: rom for sårbarhet, forutsigbarhet i maktstrukturer, og bekreftende tilstedeværelse. Studien konkluderer med at relasjonell tilstedeværelse reduserer opplevelsen av tvang og avmakt.',
      fullTextPassages: [
        {
          sectionTitle: 'Innledning og vitenskapsteoretisk forankring',
          pageNumber: 1,
          text: 'Akuttpsykiatrisk innleggelse innebærer ofte tap av autonomi og akutt eksistensiell krise. Studien forankres i en hermeneutisk-konstruktivistisk vitenskapsteoretisk tradisjon (Charmaz, 2014) der kunnskap forstås som co-konstruert mellom forsker og informant. Forskningsspørsmålet søker å belyse informantenes levde erfaringer og meningsskaping.'
        },
        {
          sectionTitle: 'Metode, utvalg og datainnsamling',
          pageNumber: 2,
          text: 'Informanter ble rekruttert via brukerorganisasjoner og DPS etter utskrivning. Inklusjonskriterier: alder >18 år, erfaring fra akuttpost siste 2 år, og samtykkekompetent. 16 dybdeintervjuer ble gjennomført i nøytrale lokaler eller via kryptert video. Intervjuguiden var åpen og lot informantene lede narrativet.'
        },
        {
          sectionTitle: 'Dataanalyse og konstant komparativ metode',
          pageNumber: 3,
          text: 'Lydopptak ble transkribert ordrett. Analysen fulgte Charmaz\' (2014) retningslinjer: 1) Initiell åpen koding av hendelser og handlinger, 2) Fokusert koding av sentrale temaer, og 3) Teoretisk koding med utarbeidelse av memoer inntil ingen nye konsepter fremkom (teoretisk metning).'
        },
        {
          sectionTitle: 'Forskerrefleksivitet og etikk',
          pageNumber: 4,
          text: 'Førsteforfatter har 12 års erfaring som psykiatrisk sykepleier. Egen forforståelse og risiko for terapeutisk bias ble eksplisitt adressert gjennom refleksjonsnotater og kritisk granskning i forfatterteamet. Studien er godkjent av REK Sør-Øst (ref. 2023/49182) og SIKT. Skriftlig informert samtykke ble innhentet fra samtlige.'
        },
        {
          sectionTitle: 'Resultater og deltakernes stemmer',
          pageNumber: 5,
          text: 'Deltakerne beskrev hvordan små relasjonelle handlinger utgjorde forskjellen mellom trygghet og traumatisering. Informant 4 uttalte: «Da pleieren satte seg ned på sengekanten uten permen i hånda og bare pustet med meg, kjente jeg for første gang at jeg var et menneske, ikke bare en diagnose.»'
        }
      ]
    },
    findingsSummary: 'Studien dokumenterer at pasienter i akuttpsykiatriske poster opplever relasjonell trygghet primært gjennom likeverdig menneskelig kontakt og forutsigbarhet, snarere enn fysiske eller medikamentelle rammer. Kjernekategorien «Å bli møtt som et likeverdig subjekt» viser hvordan relasjonelt nærvær reduserer opplevelsen av tvang og avmakt.',
    overallVerdict: 'Inkluder (Høy metodisk kvalitet)',
    overallVerdictNote: 'Studien oppfyller 9 av 10 JBI-kriterier. Svært solid metodisk stringens, transparent analyse, fyldig sitatbruk og eksplisitt forskerrefleksivitet. Kriterium 1 vurderes som Uklart på grunn av manglende eksplisitt ontologisk drøfting i metodedelen.',
    keyStrengths: [
      'Gjennomgående konstant komparativ analyse med teoretisk metning',
      'Fyldige, autentiske pasientsitater som underbygger alle teoretiske kategorier',
      'Eksplisitt redegjørelse for førsteforfatters kliniske forforståelse og maktasymmetri',
      'Tydelig REK- og SIKT-godkjenning med ivaretakelse av sårbar gruppe'
    ],
    keyLimitations: [
      'Omfatter kun pasienter som var i stand til å gjennomføre intervju i etterkant av akuttfasen',
      'Eksplisitt ontologisk/epistemologisk premiss kunne vært utdypet ytterligere i teoridelen'
    ],
    criteria: [
      {
        id: 1,
        criterionTitle: 'Filosofisk og metodisk kongruens',
        officialQuestion: 'Er det samsvar mellom det oppgitte filosofiske perspektivet og forskningsmetodikken?',
        status: 'Uklart',
        pageLocation: 's. 1',
        pageComment: '[s. 1]',
        evidenceQuote: 'Studien forankres i en hermeneutisk-konstruktivistisk vitenskapsteoretisk tradisjon (Charmaz, 2014)...',
        whyAssessedAsSuch: 'Artikkelen refererer til Charmaz og hermeneutisk konstruktivisme, men utdyper ikke det ontologiske grunnsynet utover metodehenvisningen. I henhold til JBIs strenge kriterier kreves en eksplisitt drøfting av kunnskapssyn.',
        colorKey: 'amber',
        section: 'Innledning'
      },
      {
        id: 2,
        criterionTitle: 'Metodikk og forskningsspørsmål',
        officialQuestion: 'Er det samsvar mellom forskningsmetodikken og forskningsspørsmålet eller målene?',
        status: 'Ja',
        pageLocation: 's. 1',
        pageComment: '[s. 1]',
        evidenceQuote: 'Formålet med denne studien var å utforske hvordan pasienter innlagt i akuttpsykiatriske døgnavdelinger erfarer relasjonell trygghet...',
        whyAssessedAsSuch: 'Formålet er eksplorerende og fenomenologisk/opplevelsesorientert, noe som passer perfekt med konstruktivistisk Grounded Theory for å avdekke sosiale og relasjonelle prosesser.',
        colorKey: 'emerald',
        section: 'Innledning'
      },
      {
        id: 3,
        criterionTitle: 'Datainnsamlingsmetode',
        officialQuestion: 'Er det samsvar mellom forskningsmetodikken og datainnsamlingsmetodene?',
        status: 'Ja',
        pageLocation: 's. 2',
        pageComment: '[s. 2]',
        evidenceQuote: '16 individuelle dybdeintervjuer (60–90 minutter) supplert med feltnotater... Intervjuguiden var åpen og lot informantene lede narrativet.',
        whyAssessedAsSuch: 'Semistrukturerte dybdeintervjuer med åpne prober og feltnotater er gullstandarden for datainnsamling i Grounded Theory for å fange dybde og nyanser.',
        colorKey: 'sky',
        section: 'Metode'
      },
      {
        id: 4,
        criterionTitle: 'Dataanalyse og syntese',
        officialQuestion: 'Er det samsvar mellom forskningsmetodikken og representasjonen og analysen av data?',
        status: 'Ja',
        pageLocation: 's. 3',
        pageComment: '[s. 3]',
        evidenceQuote: 'Analysen fulgte Charmaz\' (2014) retningslinjer: 1) Initiell åpen koding, 2) Fokusert koding, og 3) Teoretisk koding med utarbeidelse av memoer inntil teoretisk metning.',
        whyAssessedAsSuch: 'Analysetrinnene følger nøyaktig Charmaz\' metodikk med konstant komparativ metode, memos og dokumentert metningspunkt.',
        colorKey: 'indigo',
        section: 'Analyse'
      },
      {
        id: 5,
        criterionTitle: 'Tolkning av resultater',
        officialQuestion: 'Er det samsvar mellom forskningsmetodikken og tolkningen av resultatene?',
        status: 'Ja',
        pageLocation: 's. 5',
        pageComment: '[s. 5]',
        evidenceQuote: 'Analysen avdekket kjerne-kategorien «Å bli møtt som et likeverdig subjekt bak diagnosen», støttet av tre underkategorier...',
        whyAssessedAsSuch: 'Resultatene presenteres som en koherent teoretisk modell med kjernekategori og underkategorier, helt i tråd med Grounded Theory.',
        colorKey: 'purple',
        section: 'Resultater'
      },
      {
        id: 6,
        criterionTitle: 'Forskerens forforståelse og posisjon (Refleksivitet)',
        officialQuestion: 'Er det en redegjørelse for forskerens kulturelle eller teoretiske posisjon?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Førsteforfatter har 12 års erfaring som psykiatrisk sykepleier. Egen forforståelse og risiko for terapeutisk bias ble eksplisitt adressert gjennom refleksjonsnotater...',
        whyAssessedAsSuch: 'Forfatterne redegjør eksplisitt for klinisk bakgrunn, maktrelasjon og hvordan bias ble motvirket i tverrfaglig analyseteam.',
        colorKey: 'rose',
        section: 'Refleksivitet'
      },
      {
        id: 7,
        criterionTitle: 'Forskerens innflytelse på studien',
        officialQuestion: 'Er forskerens innflytelse på forskningen, og omvendt, adressert?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: '...og kritisk granskning i forfatterteamet. Transkripsjonene ble revidert i tverrfaglig forskergruppe for å sikre at deltakernes egne stemmer ikke ble overstyrt.',
        whyAssessedAsSuch: 'Artikkelen drøfter aktivt hvordan forskerens tilstedeværelse under intervjuene påvirket datagenereringen.',
        colorKey: 'teal',
        section: 'Refleksivitet'
      },
      {
        id: 8,
        criterionTitle: 'Representasjon av deltakernes stemmer',
        officialQuestion: 'Er deltakernes stemmer og opplevelser representert på en tilfredsstillende måte?',
        status: 'Ja',
        pageLocation: 's. 5',
        pageComment: '[s. 5]',
        evidenceQuote: 'Informant 4 uttalte: «Da pleieren satte seg ned på sengekanten uten permen i hånda og bare pustet med meg, kjente jeg for første gang at jeg var et menneske...»',
        whyAssessedAsSuch: 'Artikkelen inneholder rikelig med direkte sitater fra ulike informanter som illustrerer hvert enkelt analysetema.',
        colorKey: 'cyan',
        section: 'Resultater'
      },
      {
        id: 9,
        criterionTitle: 'Forskningsetisk godkjenning',
        officialQuestion: 'Er forskningen etisk forsvarlig i henhold til gjeldende kriterier (godkjenning, samtykke)?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Studien er godkjent av REK Sør-Øst (ref. 2023/49182) og SIKT. Skriftlig informert samtykke ble innhentet fra samtlige.',
        whyAssessedAsSuch: 'Både REK- og SIKT-referansenummer er oppgitt, og prosessen rundt informert samtykke hos sårbare pasienter er beskrevet.',
        colorKey: 'emerald',
        section: 'Etikk'
      },
      {
        id: 10,
        criterionTitle: 'Konklusjonens forankring i data',
        officialQuestion: 'Flyter konklusjonene i rapporten naturlig fra analysen eller tolkningen av dataene?',
        status: 'Ja',
        pageLocation: 's. 5',
        pageComment: '[s. 5]',
        evidenceQuote: 'Studien konkluderer med at relasjonell tilstedeværelse reduserer opplevelsen av tvang og avmakt, men påpeker studiens begrensning i at den kun omfatter pasienter i stand til samtykke.',
        whyAssessedAsSuch: 'Konklusjonene er direkte underbygget av empirien og overdriver ikke funnene utover studiens rammer.',
        colorKey: 'slate',
        section: 'Diskusjon'
      }
    ]
  },

  // =========================================================================
  // 2. RANDOMISERT KONTROLLERT STUDIE (RCT) - COCHRANE ROB 2
  // =========================================================================
  {
    id: 'example-rob2-rct',
    methodologyKey: 'quant-rct',
    methodologyTitle: 'Randomisert kontrollert studie (RCT)',
    instrumentId: 'cochrane-rob-2',
    instrumentName: 'Cochrane Risk of Bias 2 (RoB 2)',
    instrumentStandard: 'Cochrane Handbook for Systematic Reviews of Interventions',
    article: {
      title: 'Digital Remote Telemonitoring versus Standard Care for Chronic Heart Failure: A Multicenter Parallel-Group Randomized Controlled Trial',
      authors: 'Martin Henriksen, Camilla Sunde, Torstein G. Berg, Elena Rostova',
      shortCitation: 'Henriksen et al. (2025)',
      year: 2025,
      journal: 'Scandinavian Cardiovascular Journal',
      volumeIssue: '59(1), 45–56',
      doi: '10.1080/14017431.2025.210491',
      studyDesign: 'Multisenter, parallellgruppe, åpen randomisert kontrollert studie med blindet endepunktsvurdering (PROBE design)',
      populationAndSetting: '420 voksne pasienter med kronisk hjertesvikt (NYHA klasse II–IV) rekruttert fra 5 norske sykehus.',
      dataCollection: 'Daglige biometriske sensordata (blodtrykk, vekt, puls) via kryptert 4G-hub vs. ordinære polikliniske kontroller.',
      analyticMethod: 'Intention-to-treat (ITT) analyse med Cox proporsjonal hazard regresjon for sammensatt primærendepunkt ved 12 måneder.',
      abstract: 'Formålet med denne studien var å teste om strukturert digital telemonitorering reduserer 12-måneders reinnleggelser og mortalitet hos hjertesviktpasienter. 420 pasienter ble randomisert 1:1 ved sentralisert datastyrt blokkrandomisering. Telemonitorering ga en 28 % signifikant reduksjon i reinnleggelser (HR 0.72, 95% KI 0.55–0.94, p=0.014). Blinding av endepunktskomité ble opprettholdt gjennom hele studien.',
      fullTextPassages: [
        {
          sectionTitle: 'Randomisering og allokeringsskjuling',
          pageNumber: 2,
          text: 'Pasienter ble allokert (1:1) ved hjelp av et web-basert sentralisert randomiseringssystem med permuterte blokker (størrelse 4 og 6), stratifisert etter senter og baseline ejeksjonsfraksjon. Klinikere hadde ingen tilgang til allokeringssekvensen før pasienten var registrert.'
        },
        {
          sectionTitle: 'Intervensjon og blinding',
          pageNumber: 3,
          text: 'Gitt intervensjonens natur (daglig bruk av nettbrett og sensorer) var blinding av pasienter og behandlende sykepleiere ikke mulig. For å motvirke observatørbias benyttet vi PROBE-design (Prospective Randomized Open Blended Endpoint), der en uavhengig klinisk endepunktskomité vurderte alle reinnleggelser i fullstendig avidentifisert form.'
        },
        {
          sectionTitle: 'Frafall og Intention-to-Treat (ITT)',
          pageNumber: 4,
          text: 'Frafall ved 12 måneder var 4.8 % (10 i telemonitoreringsgruppen, 10 i kontrollgruppen). Alle 420 randomiserte pasienter ble inkludert i den primære ITT-analysen. Multiple imputering ble utført for manglende kovariater som sensitivitetsanalyse.'
        }
      ]
    },
    findingsSummary: 'Studien viser at digital telemonitorering reduserer akutte sykehusinnleggelser for hjertesvikt med 28 % over 12 måneder sammenlignet med standard poliklinisk oppfølging, med god statistisk styrke og lavt frafall.',
    overallVerdict: 'Lav risiko for skjevhet (Low Risk of Bias)',
    overallVerdictNote: 'Studien benytter robust allokeringsskjuling, sentralisert randomisering, uavhengig blindet endepunktsvurdering (PROBE) og komplett ITT-analyse. Domene 2 vurderes til Noe bekymring på grunn av manglende blinding av deltakere, men risikoen for avvik er lav.',
    keyStrengths: [
      'Sentralisert web-randomisering med allokeringsskjuling',
      'Blindet uavhengig endepunktskomité (PROBE)',
      'Under 5 % frafall og streng Intention-to-Treat analyse',
      'Forhåndsregistrert protokoll på ClinicalTrials.gov (NCT05491028)'
    ],
    keyLimitations: [
      'Åpen design for pasienter og behandlere kan teoretisk påvirke egenrapportert helseatferd'
    ],
    criteria: [
      {
        id: 'D1',
        criterionTitle: 'Domene 1: Randomiseringsprosess',
        officialQuestion: 'Oppstår det skjevhet fra randomiseringsprosessen (sekvensgenerering og allokeringsskjuling)?',
        status: 'Lav risiko',
        pageLocation: 's. 2',
        pageComment: '[s. 2]',
        evidenceQuote: 'Pasienter ble allokert (1:1) ved hjelp av et web-basert sentralisert randomiseringssystem med permuterte blokker...',
        whyAssessedAsSuch: 'Datastyrt randomisering og sentralisert allokeringsskjuling forhindrer seleksjonsbias.',
        colorKey: 'emerald',
        section: 'Randomisering'
      },
      {
        id: 'D2',
        criterionTitle: 'Domene 2: Avvik fra tiltenkte intervensjoner',
        officialQuestion: 'Oppstår det skjevhet på grunn av avvik fra tiltenkte intervensjoner (manglende blinding)?',
        status: 'Noe bekymring',
        pageLocation: 's. 3',
        pageComment: '[s. 3]',
        evidenceQuote: 'Gitt intervensjonens natur var blinding av pasienter og behandlende sykepleiere ikke mulig...',
        whyAssessedAsSuch: 'Selv om PROBE ble brukt for utfall, var pasienter og klinikere ublindet, noe som ifølge RoB 2-algoritmen gir «Some concerns».',
        colorKey: 'amber',
        section: 'Intervensjon'
      },
      {
        id: 'D3',
        criterionTitle: 'Domene 3: Manglende utfallsdata',
        officialQuestion: 'Oppstår det skjevhet på grunn av manglende utfallsdata (frafall/attrition)?',
        status: 'Lav risiko',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Frafall ved 12 måneder var 4.8 %... Alle 420 randomiserte pasienter ble inkludert i den primære ITT-analysen.',
        whyAssessedAsSuch: 'Frafallet er under 5 %, balansert mellom gruppene, og ITT-prinsippet ble fulgt.',
        colorKey: 'emerald',
        section: 'Frafall'
      },
      {
        id: 'D4',
        criterionTitle: 'Domene 4: Måling av utfallet',
        officialQuestion: 'Oppstår det skjevhet i målingen av utfallet (observatørbias)?',
        status: 'Lav risiko',
        pageLocation: 's. 3',
        pageComment: '[s. 3]',
        evidenceQuote: '...en uavhengig klinisk endepunktskomité vurderte alle reinnleggelser i fullstendig avidentifisert form.',
        whyAssessedAsSuch: 'Utfallsvurdererne var fullstendig blindet for behandlingstildeling.',
        colorKey: 'sky',
        section: 'Måling'
      },
      {
        id: 'D5',
        criterionTitle: 'Domene 5: Seleksjon av rapportert resultat',
        officialQuestion: 'Er det fare for selektiv rapportering av analyser eller utfall?',
        status: 'Lav risiko',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Protokollen var forhåndsregistrert på ClinicalTrials.gov (NCT05491028) med definert primærendepunkt.',
        whyAssessedAsSuch: 'Rapporterte analyser samsvarer fullstendig med den forhåndsdefinerte protokollen.',
        colorKey: 'purple',
        section: 'Rapportering'
      }
    ]
  },

  // =========================================================================
  // 3. SYSTEMATISK OVERSIKT & META-ANALYSE - AMSTAR 2
  // =========================================================================
  {
    id: 'example-amstar2-sr',
    methodologyKey: 'secondary-sr',
    methodologyTitle: 'Systematisk oversikt og meta-analyse',
    instrumentId: 'amstar-2',
    instrumentName: 'AMSTAR 2 (2017)',
    instrumentStandard: 'A MeaSurement Tool to Assess Systematic Reviews (Shea et al., BMJ 2017)',
    article: {
      title: 'Effekt av strukturert fysisk trening som tilleggsbehandling ved moderat til alvorlig depresjon hos voksne: En systematisk oversikt og meta-analyse',
      authors: 'Kari Larsen, Johannes Moen, Christian H. Eide',
      shortCitation: 'Larsen & Moen (2024)',
      year: 2024,
      journal: 'Scandinavian Journal of Public Health',
      volumeIssue: '52(3), 280–295',
      doi: '10.1177/1403494824110294',
      studyDesign: 'Systematisk oversikt og random effects meta-analyse i henhold til PRISMA 2020 og Cochrane Handbook',
      populationAndSetting: '28 randomiserte kontrollerte studier med totalt 2410 voksne deltakere diagnostisert med depressiv lidelse.',
      dataCollection: 'Systematiske søk i 5 databaser (MEDLINE, Embase, PsycINFO, CINAHL, Cochrane CENTRAL) supplert med grå litteratur.',
      analyticMethod: 'DerSimonian-Laird tilfeldige effekter modell med Standardized Mean Difference (SMD), I² heterogenitetsanalyse og Egger test.',
      abstract: 'Denne systematiske oversikten undersøkte effekten av fysisk trening ved depresjon. 28 RCT-er ble inkludert. Trening ga en moderat til sterk symptomreduksjon (SMD -0.62, 95% KI -0.79 til -0.45, p<0.001; I²=44%). To uavhengige forskere screenet og ekstraherte data. Risiko for skjevhet ble vurdert med RoB 2. Protokollen var forhåndsregistrert på PROSPERO (CRD42023419082).',
      fullTextPassages: [
        {
          sectionTitle: 'Protokoll og PICO-spørsmål',
          pageNumber: 1,
          text: 'Oversikten fulgte en a priori publisert protokoll registrert på PROSPERO (CRD42023419082). Forskningsspørsmålet ble eksplisitt definert i henhold til PICO: Populasjon (voksne >18 med unipolar depresjon), Intervensjon (strukturert aerob/anaerob trening), Sammenligning (venteliste eller vanlig behandling), Utfall (depresjonsskår på HAM-D/BDI).'
        },
        {
          sectionTitle: 'Søkestrategi og screening',
          pageNumber: 2,
          text: 'Søk ble gjennomført i fem databaser frem til mai 2024 uten språkbegrensninger. Fullstendige søkestrenger er vedlagt i tilleggstabell S1. To uavhengige forfattere (KL og JM) screenet titler, sammendrag og fulltekster. Uenigheter ble løst ved konsensus med tredjeforfatter (CHE). Inter-rater reliabilitet var høy (Cohen\'s Kappa = 0.89).'
        },
        {
          sectionTitle: 'Ekskluderte studier og kvalitetsvurdering',
          pageNumber: 3,
          text: 'En fullstendig liste over 42 ekskluderte fulltekstartikler med spesifikke begrunnelser for eksklusjon er oppgitt i Appendiks 2. Kvalitetsvurdering ble gjennomført uavhengig i par ved bruk av Cochrane RoB 2-verktøyet.'
        },
        {
          sectionTitle: 'Meta-analyse og publikasjonsbias',
          pageNumber: 4,
          text: 'Syntesen ble utført med tilfeldige effekter meta-analyse. Heterogenitet ble undersøkt med I²-statistikk (44 %) og forhåndsdefinerte subgruppeanalyser (aerob vs. anaerob). Publikasjonsbias ble vurdert med trappetrinn-funnel plot og Egger\'s regresjonstest (p=0.28, ingen signifikant asymmetri).'
        }
      ]
    },
    findingsSummary: 'Meta-analysen konkluderer med at fysisk trening har en robust og klinisk meningsfull tilleggseffekt ved behandling av moderat til alvorlig depresjon (SMD -0.62), spesielt for aerob trening av moderat intensitet.',
    overallVerdict: 'Høy metodisk kvalitet (High Overall Confidence)',
    overallVerdictNote: 'Oversikten oppfyller alle 7 kritiske domener i AMSTAR 2: forhåndsregistrert protokoll (PROSPERO), omfattende litteratursøk, dobbel uavhengig screening, liste over ekskluderte studier med begrunnelse, RoB 2-vurdering, adekvat meta-analytisk metode, og drøfting av risiko for skjevhet i tolkningen.',
    keyStrengths: [
      'Forhåndsregistrert PROSPERO-protokoll',
      'Uavhengig dobbeltscreening med høy inter-rater enighet (Kappa 0.89)',
      'Transparent liste over ekskluderte artikler med begrunnelse',
      'Adekvat random-effects modellering og test for publikasjonsbias'
    ],
    keyLimitations: [
      'Primærstudiene hadde i stor grad ublindede deltakere'
    ],
    criteria: [
      {
        id: 'Q2',
        criterionTitle: 'Kritisk domene 2: Forhåndsregistrert protokoll',
        officialQuestion: 'Inneholdt rapporten en eksplisitt a priori etablert protokoll (f.eks. PROSPERO)?',
        status: 'Ja',
        pageLocation: 's. 1',
        pageComment: '[s. 1]',
        evidenceQuote: 'Oversikten fulgte en a priori publisert protokoll registrert på PROSPERO (CRD42023419082)...',
        whyAssessedAsSuch: 'Registrert før oppstart med alle PICO-komponenter og analysespesifikasjoner intakt.',
        colorKey: 'emerald',
        section: 'Protokoll'
      },
      {
        id: 'Q4',
        criterionTitle: 'Kritisk domene 4: Omfattende litteratursøk',
        officialQuestion: 'Benyttet forfatterne en omfattende og dokumentert litteratursøkestrategi?',
        status: 'Ja',
        pageLocation: 's. 2',
        pageComment: '[s. 2]',
        evidenceQuote: 'Søk ble gjennomført i fem databaser frem til mai 2024 uten språkbegrensninger. Fullstendige søkestrenger er vedlagt i tilleggstabell S1.',
        whyAssessedAsSuch: 'Søket dekker 5 store databaser, grå litteratur og gjengir komplette søkestrenger.',
        colorKey: 'sky',
        section: 'Søk'
      },
      {
        id: 'Q7',
        criterionTitle: 'Kritisk domene 7: Liste over ekskluderte studier',
        officialQuestion: 'Oppga forfatterne en liste over ekskluderte studier med begrunnelse for eksklusjon?',
        status: 'Ja',
        pageLocation: 's. 3',
        pageComment: '[s. 3]',
        evidenceQuote: 'En fullstendig liste over 42 ekskluderte fulltekstartikler med spesifikke begrunnelser for eksklusjon er oppgitt i Appendiks 2.',
        whyAssessedAsSuch: 'Oppfyller AMSTAR 2-kravet om fullstendig liste over fulltekster som ble vurdert, men ekskludert.',
        colorKey: 'indigo',
        section: 'Eksklusjon'
      },
      {
        id: 'Q9',
        criterionTitle: 'Kritisk domene 9: Risiko for skjevhet (RoB)',
        officialQuestion: 'Benyttet forfatterne et anerkjent verktøy for å vurdere risiko for skjevhet i primærstudiene?',
        status: 'Ja',
        pageLocation: 's. 3',
        pageComment: '[s. 3]',
        evidenceQuote: 'Kvalitetsvurdering ble gjennomført uavhengig i par ved bruk av Cochrane RoB 2-verktøyet.',
        whyAssessedAsSuch: 'RoB 2 er gullstandarden for RCT-vurdering i systematiske oversikter.',
        colorKey: 'purple',
        section: 'Kvalitetsvurdering'
      },
      {
        id: 'Q11',
        criterionTitle: 'Kritisk domene 11: Statistiske syntesemetoder',
        officialQuestion: 'Var de statistiske metodene for kvantitativ syntese (meta-analyse) adekvate?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Syntesen ble utført med tilfeldige effekter meta-analyse... Heterogenitet ble undersøkt med I²-statistikk (44 %)...',
        whyAssessedAsSuch: 'Bruk av random effects-modell ved forventet klinisk heterogenitet er korrekt metode.',
        colorKey: 'teal',
        section: 'Meta-analyse'
      },
      {
        id: 'Q13',
        criterionTitle: 'Kritisk domene 13: Vurdering av RoB i tolkningen',
        officialQuestion: 'Ble risiko for skjevhet tatt i betraktning ved tolkningen av oversiktens resultater?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Forfatterne diskuterer risiko for manglende blinding av deltakere i treningsintervensjoner som en begrensning ved evidensstyrken.',
        whyAssessedAsSuch: 'Forfatterne nyanserer konklusjonen basert på svakheter i primærstudiene.',
        colorKey: 'rose',
        section: 'Diskusjon'
      },
      {
        id: 'Q14',
        criterionTitle: 'Kritisk domene 14: Publikasjonsbias',
        officialQuestion: 'Gjennomførte forfatterne en tilfredsstillende undersøkelse av publikasjonsbias?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Publikasjonsbias ble vurdert med trappetrinn-funnel plot og Egger\'s regresjonstest (p=0.28, ingen signifikant asymmetri).',
        whyAssessedAsSuch: 'Både grafisk (funnel plot) og statistisk (Egger) test ble utført ettersom antall studier var >10.',
        colorKey: 'cyan',
        section: 'Publikasjonsbias'
      }
    ]
  },

  // =========================================================================
  // 4. OBSERVASJONELL KOHORTSTUDIE - ROBINS-I / JBI COHORT
  // =========================================================================
  {
    id: 'example-robins-cohort',
    methodologyKey: 'quant-cohort',
    methodologyTitle: 'Observasjonell prospektiv kohortstudie',
    instrumentId: 'robins-i',
    instrumentName: 'ROBINS-I / JBI Cohort Checklist',
    instrumentStandard: 'Risk Of Bias In Non-randomized Studies - of Interventions (BMJ 2016)',
    article: {
      title: 'Long-term Risk of Serious Infections in Patients with Rheumatoid Arthritis Treated with Biologic DMARDs versus Targeted Synthetic DMARDs: A 10-Year Prospective Register Cohort Study',
      authors: 'Johan Bergström, Anna Lindqvist, Stefan H. Holmberg',
      shortCitation: 'Bergström et al. (2024)',
      year: 2024,
      journal: 'Annals of the Rheumatic Diseases',
      volumeIssue: '83(7), 890–899',
      doi: '10.1136/ard-2023-225012',
      studyDesign: 'Prospektiv multisenter kohortstudie med kobling mot nasjonale helseregistre og target trial emulering',
      populationAndSetting: '3450 pasienter med leddgikt fra Norsk kvalitetsregister for artritt koblet med Norsk pasientregister (NPR) og Reseptregisteret (2014–2024).',
      dataCollection: 'Løpende registrering av legemiddeloppstart, sykehusinnleggelser for alvorlig infeksjon og dødsfall.',
      analyticMethod: 'Propensity score-vekting (IPTW) og multivariabel Cox regresjon justert for alder, komorbiditet (Charlson) og sykdomsaktivitet (DAS28).',
      abstract: 'Målet var å sammenligne 10-års insidensrate av alvorlige infeksjoner hos pasienter med leddgikt som startet TNF-hemmere versus JAK-hemmere. 3450 pasienter ble fulgt over 14 200 personår. Propensity-justert hazard ratio var 1.14 (95% KI 0.91–1.42). Frafall fra registeroppfølging var under 2.1 %.',
      fullTextPassages: [
        {
          sectionTitle: 'Kohortdefinisjon og Target Trial Emulering',
          pageNumber: 2,
          text: 'For å unngå immortal time bias spesifiserte vi en hypotetisk målstudie (target trial emulation) der tid null (T0) ble definert som dato for første reseptekspedisjon med wash-out periode på 6 måneder.'
        },
        {
          sectionTitle: 'Konfunderingskontroll (Confounding)',
          pageNumber: 3,
          text: 'Viktige forvekslingsfaktorer (alder, kjønn, komorbiditetsindeks, samtidig prednisolonbruk og baseline DAS28) ble kontrollert ved hjelp av Inverse Probability of Treatment Weighting (IPTW). Standardized mean differences etter vekting var <0.05 for alle kovariater.'
        }
      ]
    },
    findingsSummary: 'Studien finner ingen statistisk signifikant forskjell i risikoen for alvorlige infeksjoner mellom biologiske legemidler (bDMARD) og målrettede syntetiske legemidler (tsDMARD) hos leddgiktpasienter over en 10-årsperiode.',
    overallVerdict: 'Moderat til Lav risiko for skjevhet',
    overallVerdictNote: 'Svært veldesignet registerstudie med target trial emulering, robust IPTW-vekting og nær komplett registerdekning.',
    keyStrengths: [
      'Target trial emulering motvirker seleksjons- og tidsbias',
      'Kobling mot komplette nasjonale helseregistre (NPR og Reseptregisteret)',
      'Svært lavt tap til oppfølging (<2.1 %)'
    ],
    keyLimitations: [
      'Restkonfundering fra uoppgitte livsstilsfaktorer (som røyking) kan ikke utelukkes helt'
    ],
    criteria: [
      {
        id: 'C1',
        criterionTitle: 'Bias ved forveksling (Confounding)',
        officialQuestion: 'Er det tilfredsstillende kontroll for viktige prognostiske forvekslingsfaktorer?',
        status: 'Lav risiko',
        pageLocation: 's. 3',
        pageComment: '[s. 3]',
        evidenceQuote: 'Viktige forvekslingsfaktorer... ble kontrollert ved hjelp av Inverse Probability of Treatment Weighting (IPTW). Standardized mean differences <0.05.',
        whyAssessedAsSuch: 'Omfattende IPTW-justering for alle sentrale kliniske kovariater balanserte gruppene optimalt.',
        colorKey: 'emerald',
        section: 'Konfundering'
      },
      {
        id: 'C2',
        criterionTitle: 'Bias ved seleksjon av deltakere',
        officialQuestion: 'Ble deltakerne inkludert på en måte som forhindrer seleksjonsbias og immortal time bias?',
        status: 'Lav risiko',
        pageLocation: 's. 2',
        pageComment: '[s. 2]',
        evidenceQuote: '...spesifiserte vi en hypotetisk målstudie der tid null (T0) ble definert som dato for første reseptekspedisjon...',
        whyAssessedAsSuch: 'Target trial emulering med nøyaktig T0-definisjon eliminerer immortal time bias.',
        colorKey: 'sky',
        section: 'Kohortdesign'
      }
    ]
  },

  // =========================================================================
  // 5. KLINISK RETNINGSLINJE - AGREE II
  // =========================================================================
  {
    id: 'example-agree2-guideline',
    methodologyKey: 'clinical-guideline',
    methodologyTitle: 'Klinisk faglig retningslinje',
    instrumentId: 'agree-2',
    instrumentName: 'AGREE II (Appraisal of Guidelines for Research & Evaluation)',
    instrumentStandard: 'AGREE Next Steps Consortium / WHO Guideline Standards',
    article: {
      title: 'Nasjonal faglig retningslinje for diabetesbehandling i primær- og spesialisthelsetjenesten (IS-2840)',
      authors: 'Helsedirektoratet, Avdeling for retningslinjer og fagutvikling',
      shortCitation: 'Helsedirektoratet (2024)',
      year: 2024,
      journal: 'Helsedirektoratets retningslinjebase',
      volumeIssue: 'IS-2840, Revidert utgave',
      doi: '10.21904/helsedir.is2840',
      studyDesign: 'Klinisk faglig retningslinje utarbeidet etter Helsedirektoratets veileder for retningslinjeutvikling og GRADE',
      populationAndSetting: 'Barn, unge og voksne med diabetes type 1 eller type 2 i Norge.',
      dataCollection: 'Systematisk kunnskapsoppsummering fra Cochrane, SBU, FHI og systematiske søk.',
      analyticMethod: 'GRADE-metodikk for gradering av evidenskvalitet og styrke på anbefalinger (sterk/svak).',
      abstract: 'Retningslinjen gir normerende faglige anbefalinger for diagnostikk, blodsukkermål, legemiddelvalg, og forebygging av senkomplikasjoner ved diabetes. Arbeidet er utført av en tverrfaglig arbeidsgruppe med pasientrepresentanter. Retningslinjen var gjenstand for 3 måneders offentlig høring.',
      fullTextPassages: [
        {
          sectionTitle: 'Målgruppe og brukermedvirkning',
          pageNumber: 2,
          text: 'Arbeidsgruppen besto av 14 fagpersoner fra allmennmedisin, endokrinologi, sykepleie og klinisk ernæring, samt 2 representanter utpekt av Diabetesforbundet som deltok i samtlige konsensusmøter.'
        },
        {
          sectionTitle: 'Metodisk stringens og GRADE',
          pageNumber: 4,
          text: 'Kunnskapsgrunnlaget bygger på systematiske oversikter gradert etter GRADE. Kriterier for sterke versus svake anbefalinger er eksplisitt beskrevet i henhold til balanse mellom nytte og ulempe, verdier, preferanser og ressursbruk.'
        },
        {
          sectionTitle: 'Habilitet og interessekonflikter',
          pageNumber: 6,
          text: 'Alle deltakere fylte ut Helsedirektoratets standard habilitetsskjema. Ingen medlemmer i arbeidsgruppen hadde aksjer, styreverv eller betalte konsulentoppdrag for legemiddelfirmaer som markedsfører antidiabetika i Norge.'
        }
      ]
    },
    findingsSummary: 'Retningslinjen gir klare, GRADE-baserte anbefalinger for persontilpassede HbA1c-mål, tidlig oppstart med SGLT2-hemmere og GLP-1-analoger ved hjerte- og nyresykdom, samt strukturert årskontroll i allmennpraksis.',
    overallVerdict: 'Svært høy kvalitet (Anbefales til bruk uten modifikasjon)',
    overallVerdictNote: 'Skårer over 90 % på samtlige 6 domener i AGREE II: Formål, Interessenter, Metodisk stringens, Klarhet, Anvendbarhet og Redaksjonell uavhengighet.',
    keyStrengths: [
      'Sterk brukermedvirkning med 2 pasientrepresentanter',
      'Systematisk bruk av GRADE for alle anbefalinger',
      'Omfattende åpen høring med 45 høringsinnspill',
      'Fullstendig habilitetsgjennomgang'
    ],
    keyLimitations: [
      'Ressurskonsekvenser for kommunale fysioterapitjenester kunne vært kvantifisert mer detaljert'
    ],
    criteria: [
      {
        id: 'D1',
        criterionTitle: 'Domene 1: Formål og hensikt',
        officialQuestion: 'Er retningslinjens overordnede formål, helsespørsmål og populasjon tydelig beskrevet?',
        status: 'Tilfredsstilt',
        pageLocation: 's. 1',
        pageComment: '[s. 1]',
        evidenceQuote: 'Retningslinjen gir normerende faglige anbefalinger for utredning, behandling og forebygging...',
        whyAssessedAsSuch: 'Målsetting og målgruppe er krystallklart formulert.',
        colorKey: 'emerald',
        section: 'Formål'
      },
      {
        id: 'D2',
        criterionTitle: 'Domene 2: Interessenter og brukere',
        officialQuestion: 'Inkluderer utviklingsgruppen alle relevante fagfelt og pasienters preferanser?',
        status: 'Tilfredsstilt',
        pageLocation: 's. 2',
        pageComment: '[s. 2]',
        evidenceQuote: 'Arbeidsgruppen besto av 14 fagpersoner... samt 2 representanter utpekt av Diabetesforbundet...',
        whyAssessedAsSuch: 'Tverrfaglig sammensetning med reell pasientmedvirkning i alle konsensusmøter.',
        colorKey: 'sky',
        section: 'Interessenter'
      },
      {
        id: 'D3',
        criterionTitle: 'Domene 3: Metodisk stringens',
        officialQuestion: 'Er systematiske søk, utvelgelseskriterier og GRADE-metode dokumentert?',
        status: 'Tilfredsstilt',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Kunnskapsgrunnlaget bygger på systematiske oversikter gradert etter GRADE...',
        whyAssessedAsSuch: 'Transparent kobling mellom evidens, GRADE-profiler og anbefalingenes styrke.',
        colorKey: 'indigo',
        section: 'Metode'
      },
      {
        id: 'D6',
        criterionTitle: 'Domene 6: Redaksjonell uavhengighet',
        officialQuestion: 'Er det erklært uavhengighet fra finansieringskilde og kommersielle bindinger?',
        status: 'Tilfredsstilt',
        pageLocation: 's. 6',
        pageComment: '[s. 6]',
        evidenceQuote: 'Alle deltakere fylte ut Helsedirektoratets standard habilitetsskjema. Ingen medlemmer hadde bindinger...',
        whyAssessedAsSuch: 'Strenge habilitetskrav oppfylt og offentliggjort.',
        colorKey: 'purple',
        section: 'Habilitet'
      }
    ]
  },

  // =========================================================================
  // 6. MIXED METHODS (BLANDET METODE) - MMAT 2018
  // =========================================================================
  {
    id: 'example-mmat-mixed-methods',
    methodologyKey: 'mixed-methods',
    methodologyTitle: 'Blandet metode (Mixed Methods Research)',
    instrumentId: 'mmat-2018',
    instrumentName: 'Mixed Methods Appraisal Tool (MMAT 2018)',
    instrumentStandard: 'Hong et al. / McGill University Mixed Methods Guidelines',
    article: {
      title: 'Pasienters opplevelse av samvalg ved persontilpasset kreftbehandling: En konvergent parallell mixed methods-studie',
      authors: 'Hilde Solberg, Trond E. Nygård, Anne L. Vik',
      shortCitation: 'Solberg et al. (2024)',
      year: 2024,
      journal: 'BMC Health Services Research',
      volumeIssue: '24, 412',
      doi: '10.1186/s12913-024-10822-1',
      studyDesign: 'Konvergent parallell blandet metodedesign (Convergent Parallel Mixed Methods / Creswell & Plano Clark)',
      populationAndSetting: '180 pasienter i kvantitativ survey + 20 pasienter i kvalitative dybdeintervjuer ved 2 onkologiske avdelinger.',
      dataCollection: 'Kvantitativ survey med SDM-Q-9 og CollaboRATE kombinert med semistrukturerte dybdeintervjuer.',
      analyticMethod: 'Deskriptiv/multivariabel regresjonsanalyse integrert med tematisk analyse i en felles visningsmatrise (joint display matrix).',
      abstract: 'Hensikten var å undersøke i hvilken grad kreftpasienter opplever reelt samvalg og identifisere barrierer for medbestemmelse. Kvantitative skårer viste generelt høy tilfredshet (82 %), mens de kvalitative intervjuene avdekket en underliggende opplevelse av informasjonsavmakt og utilstrekkelig tid til refleksjon. Integrasjonen via joint display belyste et markant paradoks mellom survey-skår og levd erfaring.',
      fullTextPassages: [
        {
          sectionTitle: 'Metodisk begrunnelse for Mixed Methods',
          pageNumber: 2,
          text: 'Valget av et konvergent blandet design (QUAN + QUAL) var motivert av behovet for å både kvantifisere utbredelsen av opplevd samvalg og dybdeutforske de underliggende nyansene og årsakene til pasientenes opplevelser.'
        },
        {
          sectionTitle: 'Integrasjon og felles analyse (Joint Display)',
          pageNumber: 4,
          text: 'Data ble integrert på analysestadiet ved hjelp av en felles visningsmatrise (joint display matrix). Kvantitative skår ble matchet mot deltakernes kvalitative narrativer for å identifisere konvergens, divergens og komplementaritet.'
        }
      ]
    },
    findingsSummary: 'Studien avdekker at selv om 8 av 10 kreftpasienter skårer høyt på standardiserte samvalgsskjema (survey), beskriver dybdeintervjuene at pasientene opplever reell beslutningsangst og savner tid til å drøfte alternativer med pårørende før behandlingsstart.',
    overallVerdict: 'Høy metodisk kvalitet (5/5 MMAT-stjerner)',
    overallVerdictNote: 'Utmerket metodisk integrasjon. Studien oppfyller begge screeningkriterier og samtlige 5 kvalitetskriterier for mixed methods i MMAT 2018.',
    keyStrengths: [
      'Krystallklar begrunnelse for hvorfor mixed methods var nødvendig',
      'Eksemplarisk integrasjon via felles visningsmatrise (Joint Display Matrix)',
      'Aktiv og transparent drøfting av divergens mellom kvantitative og kvalitative funn'
    ],
    keyLimitations: [
      'Kvantitativt utvalg var begrenset til to helseforetak'
    ],
    criteria: [
      {
        id: 'MM1',
        criterionTitle: 'Begrunnelse for blandet design',
        officialQuestion: 'Er det en klar begrunnelse for å samle både kvantitative og kvalitative data?',
        status: 'Ja',
        pageLocation: 's. 2',
        pageComment: '[s. 2]',
        evidenceQuote: 'Valget av et konvergent blandet design (QUAN + QUAL) var motivert av behovet for å både kvantifisere utbredelsen og dybdeutforske nyansene...',
        whyAssessedAsSuch: 'Tydelig formulert merverdi av å kombinere metodene for å besvare forskningsspørsmålet.',
        colorKey: 'emerald',
        section: 'Design'
      },
      {
        id: 'MM2',
        criterionTitle: 'Integrasjon av metoder',
        officialQuestion: 'Er de ulike metodene effektivt integrert for å besvare forskningsspørsmålet?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Data ble integrert på analysestadiet ved hjelp av en felles visningsmatrise (joint display matrix)...',
        whyAssessedAsSuch: 'Bruker en anerkjent metodisk integrasjonsteknikk (Joint Display) på datanivå.',
        colorKey: 'sky',
        section: 'Integrasjon'
      },
      {
        id: 'MM3',
        criterionTitle: 'Tolkning av integrerte resultater',
        officialQuestion: 'Er resultatene fra de to komponentene tilstrekkelig integrert i tolkningen?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: 'Kvantitative skår ble matchet mot deltakernes kvalitative narrativer for å identifisere konvergens, divergens og komplementaritet.',
        whyAssessedAsSuch: 'Forfatterne forklarer paradokset mellom høye tall og sårbare intervjuopplevelser grundig.',
        colorKey: 'indigo',
        section: 'Tolkning'
      },
      {
        id: 'MM4',
        criterionTitle: 'Håndtering av inkonsistens / divergens',
        officialQuestion: 'Er uoverensstemmelser og divergens mellom kvantitative og kvalitative funn drøftet?',
        status: 'Ja',
        pageLocation: 's. 4',
        pageComment: '[s. 4]',
        evidenceQuote: '...belyste et markant paradoks mellom survey-skår og levd erfaring.',
        whyAssessedAsSuch: 'Divergensen overses ikke, men brukes som en sentral kilde til ny teoretisk innsikt.',
        colorKey: 'purple',
        section: 'Divergens'
      }
    ]
  }
];
