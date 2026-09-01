import { 
  ArticleAppraisal, 
  ComparisonDimension, 
  JBIQuestion, 
  AppraisalInstrument,
  DualReviewComparison,
  AuditTrailEntry
} from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from './masterRegistry';

export const INSTRUMENTS_REGISTRY: AppraisalInstrument[] = MASTER_INSTRUMENTS_REGISTRY;

export const JBI_QUESTIONS: JBIQuestion[] = [
  {
    id: 1,
    shortTitle: '1. Filosofisk perspektiv ↔ metodologi',
    officialQuestion: 'Er det samsvar mellom det oppgitte filosofiske perspektivet og forskningsmetodologien?',
    officialQuestionEn: 'Is there congruity between the stated philosophical perspective and the research methodology?',
    descriptionGuide: 'Krever at forfatterne eksplisitt gjør rede for sitt ontologiske/epistemologiske ståsted (f.eks. hermeneutikk, sosialkonstruktivisme, kritisk realisme, fenomenologi) og at dette harmonerer med metodologien.',
    category: 'metodisk_samsvar',
    categoryTitle: 'Metodisk samsvar'
  },
  {
    id: 2,
    shortTitle: '2. Metodologi ↔ forskningsspørsmål/formål',
    officialQuestion: 'Er det samsvar mellom forskningsmetodologien og forskningsspørsmålet eller formålet?',
    officialQuestionEn: 'Is there congruity between the research methodology and the research question or objectives?',
    descriptionGuide: 'Vurderer om den valgte kvalitative metodologien er egnet til å besvare studiens problemstilling og formål.',
    category: 'metodisk_samsvar',
    categoryTitle: 'Metodisk samsvar'
  },
  {
    id: 3,
    shortTitle: '3. Metodologi ↔ datainnsamling',
    officialQuestion: 'Er det samsvar mellom forskningsmetodologien og metodene for datainnsamling?',
    officialQuestionEn: 'Is there congruity between the research methodology and the methods used to collect data?',
    descriptionGuide: 'Vurderer om datainnsamlingsmetoden (f.eks. dybdeintervjuer, fokusgrupper, observasjon) samsvarer med den metodologiske tradisjonen.',
    category: 'metodisk_samsvar',
    categoryTitle: 'Metodisk samsvar'
  },
  {
    id: 4,
    shortTitle: '4. Metodologi ↔ analyse',
    officialQuestion: 'Er det samsvar mellom forskningsmetodologien og representasjonen og analysen av data?',
    officialQuestionEn: 'Is there congruity between the research methodology and the representation and analysis of data?',
    descriptionGuide: 'Vurderer om analyseprosessen (koding, konstant sammenligning, tematisk syntese, framework) følger reglene for den valgte metodologien.',
    category: 'metodisk_samsvar',
    categoryTitle: 'Metodisk samsvar'
  },
  {
    id: 5,
    shortTitle: '5. Metodologi ↔ tolkning av resultater',
    officialQuestion: 'Er det samsvar mellom forskningsmetodologien og tolkningen av resultatene?',
    officialQuestionEn: 'Is there congruity between the research methodology and the interpretation of results?',
    descriptionGuide: 'Vurderer om tolkningene og modellene som presenteres i resultatkapitlet er teoretisk og metodisk konsistente med den valgte tilnærmingen.',
    category: 'metodisk_samsvar',
    categoryTitle: 'Metodisk samsvar'
  },
  {
    id: 6,
    shortTitle: '6. Forskerens kulturelle/teoretiske plassering',
    officialQuestion: 'Er det en redegjørelse som plasserer forskeren kulturelt eller teoretisk?',
    officialQuestionEn: 'Is there a statement locating the researcher culturally or theoretically?',
    descriptionGuide: 'Krever at forfatterne redegjør for sin egen faglige bakgrunn, teoretiske orientering eller kulturelle posisjon for å synliggjøre mulige forforståelser.',
    category: 'forskerrolle',
    categoryTitle: 'Forskerens rolle & refleksivitet'
  },
  {
    id: 7,
    shortTitle: '7. Forskerens påvirkning på studien (refleksivitet)',
    officialQuestion: 'Er forskerens innflytelse på forskningen, og omvendt, adressert?',
    officialQuestionEn: 'Is the influence of the researcher on the research, and vice-versa, addressed?',
    descriptionGuide: 'Vurderer om forskerne drøfter hvordan deres tilstedeværelse, relasjon til informanter eller bakgrunn kan ha formet datainnsamling og tolkning.',
    category: 'forskerrolle',
    categoryTitle: 'Forskerens rolle & refleksivitet'
  },
  {
    id: 8,
    shortTitle: '8. Deltakere og stemmer representert',
    officialQuestion: 'Er deltakerne og deres stemmer tilstrekkelig representert?',
    officialQuestionEn: 'Are participants, and their voices, adequately represented?',
    descriptionGuide: 'Vurderer om resultatene underbygges med representative sitater, fyldige beskrivelser og at deltakernes perspektiv kommer tydelig frem.',
    category: 'representasjon',
    categoryTitle: 'Deltakernes stemmer'
  },
  {
    id: 9,
    shortTitle: '9. Forskningsetisk forsvarlighet & godkjenning',
    officialQuestion: 'Er forskningen etisk i henhold til gjeldende kriterier, og foreligger det dokumentasjon på etisk godkjenning fra relevant organ?',
    officialQuestionEn: 'Is the research ethical according to current criteria or, for recent studies, and is there evidence of ethical approval by an appropriate body?',
    descriptionGuide: 'Krever dokumentasjon av etisk godkjenning (f.eks. REK, NSD/Sikt, IRB), informert samtykke, konfidensialitet og håndtering av sensitive opplysninger.',
    category: 'etikk',
    categoryTitle: 'Forskningsetikk'
  },
  {
    id: 10,
    shortTitle: '10. Konklusjonene følger dataene',
    officialQuestion: 'Fremstår konklusjonene i forskningsrapporten som en direkte følge av analysen eller tolkningen av dataene?',
    officialQuestionEn: 'Do the conclusions drawn in the research report flow from the analysis, or interpretation, of the data?',
    descriptionGuide: 'Vurderer om forfatternes slutninger er empirisk forankret i datamaterialet uten ubegrunnede overgeneraliseringer eller kausale slutninger.',
    category: 'konklusjon',
    categoryTitle: 'Konklusjon & validitet'
  }
];

export const EXAMPLE_ARTICLES: ArticleAppraisal[] = [
  {
    id: 'sample-gt-primary-care-2024',
    instrumentId: 'jbi-qualitative-2017',
    instrumentVersion: '2017',
    lifecycleStatus: 'FINALIZED',
    methodologyAlignmentStatus: 'INTERNALLY_COMPLIANCE_CHECKED',
    parsingStatus: 'PARSED_COMPLETE',
    authors: 'Lund, H. M., Solberg, K. E., Vis, S. A., & Bakke, M. B.',
    shortCitation: 'Lund et al. (2024)',
    year: 2024,
    title: "Navigating Relational Complexity in Primary Healthcare: A Constructivist Grounded Theory Study of General Practitioners' Interprofessional Collaboration",
    journal: 'BMC Primary Care',
    volumeIssue: '25, 36',
    doi: '10.1186/s12875-024-02269-9',
    doiUrl: 'https://doi.org/10.1186/s12875-024-02269-9',
    sourceUrl: 'https://bmcprimcare.biomedcentral.com/articles/10.1186/s12875-024-02269-9',
    sourceName: 'BioMed Central / BMC Primary Care',
    studyContext: 'Undersøker allmennlegers erfaringer med og barrierer for tverrfaglig samhandling i kommunehelsetjenesten.',
    design: 'Kvalitativ Grounded Theory',
    dataCollection: '10 semistrukturerte kvalitative dybdeintervjuer med allmennleger',
    participants: '10 fastleger med variert praksislengde og kommunal tilknytning',
    analyticMethod: 'Grounded theory (Charmaz/Strauss) med åpen koding, konstant sammenligning og teoretisk modellbygging',
    reviewerName: 'Primærvurderer (Reviewer 1)',
    reviewerRole: 'Masterstudent / Forsker',
    assessmentDate: '2024-03-15',
    projectName: 'Masteroppgave: Kvalitativ helsetjenesteforskning',
    projectId: 'demo-master-project',
    isDemoData: true,
    dataClassification: 'RESTRICTED_RESEARCH',
    summaryScore: {
      ja: 9,
      uklart: 1,
      nei: 0,
      ikkeRelevant: 0,
      total: 10
    },
    overallVerdict: 'Inkluder',
    verdictNote: 'Artikkelen tilfredsstiller 9 av 10 JBI-kriterier. Den metodiske forankringen i grounded theory er stringent og transparent gjennomført. Det eneste uklare punktet er fraværet av en eksplisitt filosofisk ontologisk/epistemologisk posisjonering (JBI 1), men metodologien er fullt ut konsistent.',
    keyStrength: 'Svært god metodisk sammenheng i grounded theory-designet, rik sitatbruk og eksplisitt redegjørelse for forskernes bakgrunn som leger og samfunnsforskere.',
    mainLimitation: 'Kun allmennlegers perspektiv er undersøkt, og studien beskriver opplevelser uten å måle objektiv samarbeidseffekt.',
    apaReference: "Lund, H. M., Solberg, K. E., Vis, S. A., & Bakke, M. B. (2024). Navigating relational complexity in primary healthcare: A constructivist grounded theory study of general practitioners' interprofessional collaboration. BMC Primary Care, 25, 36. https://doi.org/10.1186/s12875-024-02269-9",
    items: [
      {
        questionId: 1,
        status: 'Uklart',
        justification: 'Forfatterne redegjør grundig for sin grounded theory-metodikk, men formulerer ikke et eksplisitt ontologisk/epistemologisk filosofisk ståsted i teksten. Etter streng JBI-protokoll kodes dette som «Uklart».',
        evidenceText: 'Metodeseksjonen redegjør for Charmaz og Strauss\' grounded theory, men spesifiserer ikke et filosofisk paradigme (konstruktivistisk vs. kritisk realistisk).',
        location: { page: '3', section: 'Methods - Study design' },
        sourceQuoteOrRef: 'Methods - Study design, s. 3',
        reviewerNotes: 'I tråd med JBI-kriteriet skal ikke leseren anta filosofisk ståsted dersom det ikke er eksplisitt beskrevet.'
      },
      {
        questionId: 2,
        status: 'Ja',
        justification: 'Formålet er å utforske allmennlegers erfaringer og sosiale prosesser i samarbeid med kommunale tjenester. Grounded theory er et ideelt design for å generere begrepsmessig forståelse av slike samhandlingsprosesser.',
        evidenceText: '«The aim of this study was to explore general practitioners’ experiences of interprofessional collaboration.»',
        location: { page: '2', section: 'Background / Aim' },
        sourceQuoteOrRef: 'Bakgrunn og formål, s. 2'
      },
      {
        questionId: 3,
        status: 'Ja',
        justification: 'Semistrukturerte kvalitative dybdeintervjuer med fleksibel intervjuguide og åpne spørsmål er fullt ut i overensstemmelse med grounded theorys prinsipper for datainnsamling.',
        evidenceText: '«Individual semi-structured interviews were conducted using an interview guide that allowed for probing and iterative exploration.»',
        location: { page: '3', section: 'Data collection' },
        sourceQuoteOrRef: 'Metode - Datainnsamling, s. 3'
      },
      {
        questionId: 4,
        status: 'Ja',
        justification: 'Dataanalysen beskrives transparent med åpen koding, aksial koding, konstant komparativ analyse og utvikling av kjernekategorien.',
        evidenceText: '«Transcripts were coded line-by-line. Constant comparative method was applied to identify categories and their properties.»',
        location: { page: '3-4', section: 'Data analysis' },
        sourceQuoteOrRef: 'Metode - Analyse, s. 3-4'
      },
      {
        questionId: 5,
        status: 'Ja',
        justification: 'Resultatene presenteres som en integrert begrepsmodell med definerte underkategorier, noe som harmonerer direkte med grounded theory-tradisjonen.',
        evidenceText: '«The core category emerged as \'There’s a will, but not a way\', encompassing structural, relational, and emotional sub-dimensions.»',
        location: { page: '4-8', section: 'Results' },
        sourceQuoteOrRef: 'Resultatseksjon og modell, s. 4-8'
      },
      {
        questionId: 6,
        status: 'Ja',
        justification: 'Forfatterne oppgir eksplisitt sin faglige og profesjonelle bakgrunn: forfatterne inkluderer erfarne allmennleger, professor i allmennmedisin og samfunnsviter.',
        evidenceText: '«The research team consisted of two GPs (authors 1 and 2), a health services researcher (author 3), and a medical anthropologist (author 4).»',
        location: { page: '4', section: 'Methods - Reflexivity & Research team' },
        sourceQuoteOrRef: 'Forfatterinformasjon og refleksivitet, s. 4'
      },
      {
        questionId: 7,
        status: 'Ja',
        justification: 'Forskerne drøfter hvordan legenes felles faglige bakgrunn med informantene kan ha skapt tillit og delt terminologi («insider-posisjon»), samt hvordan de sikret kritisk distanse gjennom tverrfaglige analyser.',
        evidenceText: '«Shared professional background facilitated rapport during interviews, while non-clinical team members challenged taken-for-granted assumptions.»',
        location: { page: '4 og 9', section: 'Methods / Discussion - Strengths and limitations' },
        sourceQuoteOrRef: 'Metode og diskusjon, s. 4 & 9'
      },
      {
        questionId: 8,
        status: 'Ja',
        justification: 'Rapporten inneholder mange og representative sitater fra allmennlegene som illustrerer de ulike kategoriene og nyansene i materialet.',
        evidenceText: 'Resultatkapitlet inkluderer 18 direkte sitater fra de 10 fastlegene, identifisert med informantkoder (GP1-GP10).',
        location: { page: '4-8', section: 'Results' },
        sourceQuoteOrRef: 'Resultater med sitatblokker, s. 4-8'
      },
      {
        questionId: 9,
        status: 'Ja',
        justification: 'Studien har dokumentert godkjenning fra Sikt/REK, informert skriftlig samtykke og ivaretakelse av personvern.',
        evidenceText: '«The study was evaluated and approved by Sikt (ref 982121). Written informed consent was obtained from all participants.»',
        location: { page: '9', section: 'Declarations - Ethics approval' },
        sourceQuoteOrRef: 'Etikk og godkjenninger, s. 9'
      },
      {
        questionId: 10,
        status: 'Ja',
        justification: 'Konklusjonene er nøye forankret i de kvalitative funnene om allmennlegers opplevelse av strukturelle og relasjonelle barrierer, uten ubegrunnede kausale overgeneraliseringer.',
        evidenceText: '«Conclusions emphasize the need for designated collaboration arenas rather than claiming definitive policy efficacy.»',
        location: { page: '9-10', section: 'Conclusion' },
        sourceQuoteOrRef: 'Konklusjon, s. 9-10'
      }
    ],
    auditTrail: [
      {
        id: 'audit-1',
        studyId: 'sample-gt-primary-care-2024',
        reviewer: 'Primærvurderer (Reviewer 1)',
        instrumentId: 'jbi-qualitative-2017',
        version: '2017',
        itemId: 1,
        itemTitle: '1. Filosofisk perspektiv ↔ metodologi',
        previousAnswer: 'Ubesvart',
        newAnswer: 'Uklart',
        previousRationale: '',
        newRationale: 'Vurdert til Uklart fordi teksten ikke har en eksplisitt ontologisk/epistemologisk redegjørelse, selv om GT er godt beskrevet.',
        changedBy: 'Reviewer 1',
        timestamp: '2024-03-15T10:14:20Z',
        comment: 'Initial vurdering registrert'
      }
    ]
  },
  {
    id: 'sample-fa-global-health-2024',
    instrumentId: 'jbi-qualitative-2017',
    instrumentVersion: '2017',
    lifecycleStatus: 'FINALIZED',
    methodologyAlignmentStatus: 'INTERNALLY_COMPLIANCE_CHECKED',
    parsingStatus: 'PARSED_COMPLETE',
    authors: 'Berg, A. R., Sharma, P., Wadhwa, N., & Moen, K.',
    shortCitation: 'Berg et al. (2024)',
    year: 2024,
    title: "Maternal Nutrition Practices and Behaviours in the Context of a Community Health Intervention: A Qualitative Framework Analysis",
    journal: 'Global Health Action',
    volumeIssue: '17(1), 2314560',
    doi: '10.1080/16549716.2024.2314560',
    doiUrl: 'https://doi.org/10.1080/16549716.2024.2314560',
    sourceUrl: 'https://www.tandfonline.com/doi/full/10.1080/16549716.2024.2314560',
    sourceName: 'Taylor & Francis / Global Health Action',
    studyContext: 'Undersøker mødres ernæringspraksiser i kontekst av en helseintervensjon i lokalsamfunnet.',
    design: 'Kvalitativ Deskriptiv / Framework Analysis',
    dataCollection: 'Individuelle dybdeintervjuer (IDIs) og fokusgruppeintervjuer (FGDs) med mødre, familiemedlemmer og helsearbeidere',
    participants: 'Mødre, svigermødre, ektemenn og frontlinjehelsearbeidere',
    analyticMethod: 'Framework analysis basert på forhåndsdefinert rammeverk supplert med induktiv temautvikling',
    reviewerName: 'Primærvurderer (Reviewer 1)',
    reviewerRole: 'Masterstudent / Forsker',
    assessmentDate: '2024-04-10',
    projectName: 'Masteroppgave: Kvalitativ helsetjenesteforskning',
    projectId: 'demo-master-project',
    isDemoData: true,
    dataClassification: 'RESTRICTED_RESEARCH',
    summaryScore: {
      ja: 8,
      uklart: 2,
      nei: 0,
      ikkeRelevant: 0,
      total: 10
    },
    overallVerdict: 'Inkluder',
    verdictNote: 'Artikkelen tilfredsstiller 8 av 10 JBI-kriterier. Den kvalitative datainnsamlingen og analysen (Framework analysis) er solid og grundig dokumentert. To kriterier kodes som «Uklart» i tråd med JBI-standarden: Filosofisk forankring (JBI 1) og forskerens teoretiske/kulturelle posisjonering (JBI 6).',
    keyStrength: 'Omfattende triangulering av informanter (mødre, ektemenn, svigermødre, helsearbeidere), stringent framework analysis og grundig etisk forankring.',
    mainLimitation: 'Kan ikke dokumentere kausal effekt av helseprogrammet; belyser deltakernes beskrivelser og sosiale mekanismer.',
    apaReference: "Berg, A. R., Sharma, P., Wadhwa, N., & Moen, K. (2024). Maternal nutrition practices and behaviours in the context of a community health intervention: A qualitative framework analysis. Global Health Action, 17(1), 2314560. https://doi.org/10.1080/16549716.2024.2314560",
    items: [
      {
        questionId: 1,
        status: 'Uklart',
        justification: 'Studien beskriver Framework analysis, men gjør ikke rede for et overordnet ontologisk eller epistemologisk ståsted. Kodes som «Uklart» i tråd med JBI.',
        evidenceText: 'Metodedelen beskriver Framework Method (Gale et al.), men definerer ikke et eksplisitt filosofisk ståsted.',
        location: { page: '3', section: 'Methods' },
        sourceQuoteOrRef: 'Methods, s. 3'
      },
      {
        questionId: 2,
        status: 'Ja',
        justification: 'Den kvalitative tilnærmingen passer formålet: å forstå mødres opplevelser og barrierer for ernæring under en helseintervensjon.',
        evidenceText: '«The objective was to explore maternal nutrition behaviours, household decision-making, and contextual influences.»',
        location: { page: '2', section: 'Introduction / Objectives' },
        sourceQuoteOrRef: 'Introduction & Objectives, s. 2'
      },
      {
        questionId: 3,
        status: 'Ja',
        justification: 'Kombinasjonen av dybdeintervjuer og fokusgrupper med relevante aktører gir fyldige kvalitative data som passer designet.',
        evidenceText: '«Data were collected through in-depth interviews (IDIs) and focus group discussions (FGDs) with pregnant women, mothers, family members, and frontline workers.»',
        location: { page: '3-4', section: 'Data collection' },
        sourceQuoteOrRef: 'Methods - Data collection, s. 3-4'
      },
      {
        questionId: 4,
        status: 'Ja',
        justification: 'Analysemetoden (Framework analysis) er tydelig beskrevet med transkripsjon, koding, matriseoppsett og kartlegging.',
        evidenceText: '«Transcripts were analyzed using Framework Analysis with charting across key behavioral and normative domains.»',
        location: { page: '4', section: 'Data analysis' },
        sourceQuoteOrRef: 'Methods - Data analysis, s. 4'
      },
      {
        questionId: 5,
        status: 'Ja',
        justification: 'Tolkningen og temaene som presenteres gjenspeiler det analytiske rammeverket og funnene på en logisk måte.',
        evidenceText: 'Temaene som presenteres struktureres etter rammeverkets domener (kunnskap, ressurser, husholdningsdynamikk).',
        location: { page: '4-11', section: 'Results' },
        sourceQuoteOrRef: 'Results section, s. 4-11'
      },
      {
        questionId: 6,
        status: 'Uklart',
        justification: 'Forfatternes institusjoner oppgis, men det mangler en eksplisitt redegjørelse for forskernes kulturelle/teoretiske posisjon overfor informantene i lokalsamfunnet.',
        evidenceText: 'Forfatteraffilieringer er oppgitt, men ingen eksplisitt "locating the researcher"-avsnitt finnes i metodedelen.',
        location: { page: '3-4', section: 'Methods / Author info' },
        sourceQuoteOrRef: 'Forfatteroversikt / Methods, s. 3-4'
      },
      {
        questionId: 7,
        status: 'Ja',
        justification: 'Forfatterne diskuterer bruk av lokale kvinnelige feltarbeidere for å minimere maktforskjeller og kulturell distanse under intervjuene.',
        evidenceText: '«Interviews were conducted in local dialect by trained female field researchers familiar with the rural cultural context to mitigate social desirability bias.»',
        location: { page: '4 og 12', section: 'Methods / Strengths and limitations' },
        sourceQuoteOrRef: 'Methods & Discussion, s. 4 & 12'
      },
      {
        questionId: 8,
        status: 'Ja',
        justification: 'Rapporten inneholder rikholdige sitater fra mødre, svigermødre, ektemenn og helsearbeidere som underbygger analysen.',
        evidenceText: 'Inneholder 24 sitater fordelt på ulike respondentgrupper (mødre, svigermødre, menn, helsearbeidere).',
        location: { page: '5-11', section: 'Results' },
        sourceQuoteOrRef: 'Results quotes, s. 5-11'
      },
      {
        questionId: 9,
        status: 'Ja',
        justification: 'Etisk godkjenning fra relevante etiske komiteer er dokumentert, samt samtykkeprosedyrer.',
        evidenceText: '«Ethical approval was obtained from the Institutional Ethics Committee. Informed consent was obtained from all participants.»',
        location: { page: '13', section: 'Ethics statement' },
        sourceQuoteOrRef: 'Ethics statement, s. 13'
      },
      {
        questionId: 10,
        status: 'Ja',
        justification: 'Konklusjonene følger direkte av de kvalitative beskrivelsene og drøftes uten å påstå kausale intervensjonseffekter.',
        evidenceText: '«The conclusions highlight how social norms condition intervention utilization, maintaining appropriate qualitative boundaries.»',
        location: { page: '12-13', section: 'Discussion and Conclusion' },
        sourceQuoteOrRef: 'Discussion & Conclusion, s. 12-13'
      }
    ],
    auditTrail: [
      {
        id: 'audit-2',
        studyId: 'sample-fa-global-health-2024',
        reviewer: 'Primærvurderer (Reviewer 1)',
        instrumentId: 'jbi-qualitative-2017',
        version: '2017',
        itemId: 6,
        itemTitle: '6. Forskerens kulturelle/teoretiske plassering',
        previousAnswer: 'Ubesvart',
        newAnswer: 'Uklart',
        previousRationale: '',
        newRationale: 'Vurdert til Uklart fordi forfatterne ikke eksplisitt redegjør for sin egen personlige/kulturelle posisjon overfor informantene.',
        changedBy: 'Reviewer 1',
        timestamp: '2024-04-10T14:22:00Z',
        comment: 'Initial vurdering fullført'
      }
    ]
  }
];

export const INITIAL_ARTICLES: ArticleAppraisal[] = [];

export const DUAL_REVIEW_SAMPLE: DualReviewComparison = {
  studyId: 'sample-gt-primary-care-2024',
  studyTitle: "Navigating Relational Complexity in Primary Healthcare (Lund et al., 2024)",
  reviewer1: {
    name: 'Reviewer 1 (Anne-Beth)',
    date: '2024-03-15',
    verdict: 'Inkluder',
    items: EXAMPLE_ARTICLES[0].items
  },
  reviewer2: {
    name: 'Reviewer 2 (Medforsker)',
    date: '2024-03-16',
    verdict: 'Inkluder',
    items: [
      {
        questionId: 1,
        status: 'Uklart',
        justification: 'Enig i Uklart. Ontologi/epistemologi er ikke eksplisitt angitt i metodedelen.',
        evidenceText: 'Methods s. 3',
        location: { page: '3' }
      },
      {
        questionId: 2,
        status: 'Ja',
        justification: 'Grounded theory passer forskningsspørsmålet.',
        evidenceText: 'Aim, s. 2',
        location: { page: '2' }
      },
      {
        questionId: 3,
        status: 'Ja',
        justification: 'Semistrukturerte intervjuer er velegnet.',
        evidenceText: 'Methods s. 3',
        location: { page: '3' }
      },
      {
        questionId: 4,
        status: 'Ja',
        justification: 'Klassisk GT analyse med åpen koding og konstant sammenligning.',
        evidenceText: 'Methods s. 3-4',
        location: { page: '3-4' }
      },
      {
        questionId: 5,
        status: 'Ja',
        justification: 'Tolkningen henger sammen med modell og data.',
        evidenceText: 'Results s. 4-8',
        location: { page: '4-8' }
      },
      {
        questionId: 6,
        status: 'Ja',
        justification: 'Forfatternes bakgrunn som leger og samfunnsforskere er oppgitt.',
        evidenceText: 'Methods s. 4',
        location: { page: '4' }
      },
      {
        questionId: 7,
        status: 'Ja',
        justification: 'Refleksivitet rundt insider-rolle drøftes grundig.',
        evidenceText: 'Discussion s. 9',
        location: { page: '9' }
      },
      {
        questionId: 8,
        status: 'Ja',
        justification: 'Gode sitater fra informantene.',
        evidenceText: 'Results s. 4-8',
        location: { page: '4-8' }
      },
      {
        questionId: 9,
        status: 'Ja',
        justification: 'Etisk godkjenning og samtykke dokumentert.',
        evidenceText: 'Declarations s. 9',
        location: { page: '9' }
      },
      {
        questionId: 10,
        status: 'Ja',
        justification: 'Konklusjonene holder seg strengt til dataene.',
        evidenceText: 'Conclusion s. 9-10',
        location: { page: '9-10' }
      }
    ]
  },
  itemComparisons: [
    {
      questionId: 1,
      questionTitle: '1. Filosofisk perspektiv ↔ metodologi',
      r1Status: 'Uklart',
      r2Status: 'Uklart',
      isAgreement: true,
      r1Rationale: 'Forfatterne redegjør grundig for grounded theory, men formulerer ikke et eksplisitt ontologisk/epistemologisk filosofisk ståsted.',
      r2Rationale: 'Enig i Uklart. Ontologi/epistemologi er ikke eksplisitt angitt i metodedelen.',
      consensusStatus: 'Uklart',
      consensusRationale: 'Konsensus: Uklart iht. JBI-protokoll da forfatterne ikke oppgir filosofisk paradigme eksplisitt.'
    },
    {
      questionId: 2,
      questionTitle: '2. Metodologi ↔ forskningsspørsmål/formål',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Formålet passer grounded theory for utforsking av samhandlingsprosesser.',
      r2Rationale: 'Grounded theory passer forskningsspørsmålet.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 3,
      questionTitle: '3. Metodologi ↔ datainnsamling',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Semistrukturerte intervjuer med fastleger er konsistent med GT.',
      r2Rationale: 'Semistrukturerte intervjuer er velegnet.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 4,
      questionTitle: '4. Metodologi ↔ analyse',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Konstant sammenligning og koding er transparent beskrevet.',
      r2Rationale: 'Klassisk GT analyse med åpen koding og konstant sammenligning.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 5,
      questionTitle: '5. Metodologi ↔ tolkning av resultater',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Resultatene presenteres som en integrert begrepsmodell.',
      r2Rationale: 'Tolkningen henger sammen med modell og data.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 6,
      questionTitle: '6. Forskerens kulturelle/teoretiske plassering',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Oppgir eksplisitt bakgrunn som leger og samfunnsforskere.',
      r2Rationale: 'Forfatternes bakgrunn som leger og samfunnsforskere er oppgitt.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 7,
      questionTitle: '7. Forskerens påvirkning på studien (refleksivitet)',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Drøfter insider-rolle og tverrfaglig validering.',
      r2Rationale: 'Refleksivitet rundt insider-rolle drøftes grundig.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 8,
      questionTitle: '8. Deltakere og stemmer representert',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: '18 direkte sitater fra de 10 legene illustrerer temaene.',
      r2Rationale: 'Gode sitater fra informantene.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 9,
      questionTitle: '9. Forskningsetisk forsvarlighet & godkjenning',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Etisk vurdering og samtykke dokumentert.',
      r2Rationale: 'Etisk godkjenning dokumentert.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    },
    {
      questionId: 10,
      questionTitle: '10. Konklusjonene følger dataene',
      r1Status: 'Ja',
      r2Status: 'Ja',
      isAgreement: true,
      r1Rationale: 'Konklusjonene er empirisk forankret uten overgeneraliseringer.',
      r2Rationale: 'Konklusjonene holder seg strengt til dataene.',
      consensusStatus: 'Ja',
      consensusRationale: 'Konsensus: Ja.'
    }
  ],
  overallAgreementPercentage: 100,
  totalAgreements: 10,
  totalDisagreements: 0,
  consensusVerdict: 'Inkluder'
};

export const COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimension: 'Forskningsdesign',
    studyA: 'Grounded theory (Strauss & Corbin / Charmaz)',
    studyB: 'Kvalitativ deskriptiv studie / Framework analysis',
    methodologicalNote: 'Begge er induktivt orienterte, men Grounded Theory sikter mot begreps-/modellutvikling mens Framework analysis sikter mot policy- og intervensjonsforståelse.'
  },
  {
    dimension: 'Datainnsamling',
    studyA: '10 semistrukturerte individuelle intervjuer',
    studyB: 'Dybdeintervjuer (IDIs) og fokusgruppeintervjuer (FGDs)',
    methodologicalNote: 'Framework-studien triangulerer mellom individuelle intervjuer og gruppediskusjoner for å fange både personlige og sosiale normer.'
  },
  {
    dimension: 'Informanter / Utvalg',
    studyA: '10 allmennleger (én profesjonsgruppe)',
    studyB: 'Mødre, familiemedlemmer og frontlinjehelsearbeidere',
    methodologicalNote: 'Studie A representerer én part i et tverretatlig samarbeid, mens Studie B fanger et bredt økosystem rundt intervensjonen.'
  },
  {
    dimension: 'Analysemetode',
    studyA: 'Grounded theory koding og konstant komparativ analyse',
    studyB: 'Framework analysis med matriser og tematiske rammer',
    methodologicalNote: 'Begge metodene er stringente og anerkjente kvalitative analyseverktøy.'
  },
  {
    dimension: 'JBI Samlet Vurdering (2017)',
    studyA: '9 Ja, 1 Uklart, 0 Nei (Inkluder)',
    studyB: '8 Ja, 2 Uklart, 0 Nei (Inkluder)',
    methodologicalNote: 'Begge studiene holder høy metodisk kvalitet og skal inkluderes i kunnskapsoppsummeringen.'
  },
  {
    dimension: 'Kunnskapens rekkevidde (Kausalitet vs. Opplevelse)',
    studyA: 'Gir dybdeinnsikt i allmennlegers opplevelser og barrierer. Kan ikke måle faktisk tverretatlig samarbeidskvalitet.',
    studyB: 'Beskriver hvordan helsetiltak oppleves og brukes i en lokal kontekst. Kan IKKE alene etablere en kausal effekt av tiltaket.',
    methodologicalNote: 'Kritisk skille for masteroppgaven: kvalitative studier etablerer ikke kausalitet, men forklarer kontekst og opplevelse.'
  }
];

export const THESIS_CONCLUSION_TEXT = `## Metodisk Vurdering og Kunnskapsgrunnlag for Kvalitative Studier (JBI 2017)

De inkluderte kvalitative artiklene er vurdert ved hjelp av Joanna Briggs Institutes anerkjente sjekkliste for kvalitativ forskning (*JBI Critical Appraisal Checklist for Qualitative Research, 2017*). Begge studiene vurderes som relevante og metodisk solide (henholdsvis 9/10 og 8/10 oppfylte kriterier), og oppfyller kravene for inklusjon i kunnskapsoppsummeringen.

### Hovedstyrker
* **Metodisk konsistens**: Både grounded theory-tilnærmingen og framework-analysen viser god sammenheng mellom forskningsspørsmål, datainnsamling, analyse og resultatfremstilling.
* **Troverdighet og transparens**: Begge studiene underbygger sine analyser med fyldige, representative sitater fra informantene og har dokumentert nødvendige forskningsetiske godkjenninger.
* **Refleksivitet**: Forskerne redegjør for hvordan deres faglige bakgrunn og datainnsamlingsstrategier har formet samhandlingen med informantene.

### Metodisk Presisering og Skille
I tråd med JBI-protokollen er vurderingen *«Uklart»* benyttet konsekvent der forfatterne ikke har gitt en eksplisitt redegjørelse for sitt ontologiske eller epistemologisk ståsted (JBI kriterium 1), snarere enn å anta et svar.

Det mest sentrale metodiske skillet for oppgavens drøfting er at **kvalitativ forskning produserer dybdeforståelse av opplevelser, meninger og sosiale prosesser, og kan ikke alene dokumentere kausale intervensjonseffekter**:
1. **Framework Analysis (Studie B)** belyser mødres og helsearbeideres *opplevelse og håndtering* av ernæringspraksis i rammen av et helsetiltak. Studien kan ikke isolere eller kvantifisere programmets kausale effekt på ernæringsstatus.
2. **Grounded Theory (Studie A)** belyser *allmennlegers opplevelse* av strukturelle og relasjonelle barrierer i samhandling («There’s a will, but not a way»). Siden kun legene ble intervjuet, må funnene tolkes som én profesjonsgruppe sitt perspektiv, og ikke som en objektiv måling av samhandlingskvalitet.`;

export const JBI_REFERENCE_CITATION = "Joanna Briggs Institute. (2017). JBI critical appraisal checklist for qualitative research. Joanna Briggs Institute.";
