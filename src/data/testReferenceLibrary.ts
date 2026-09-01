import { ArticleAppraisal, AssessmentStatus, JBIEvaluationItem } from '../types';

/**
 * DEDICATED TEST & BENCHMARK REFERENCE LIBRARY
 * 
 * Inneholder metodiske eksempeldokumenter og fullt annoterte teststudier
 * for verifisering av evalueringsalgoritmer, JBI-kriterier, APA 7-siteringsmotor
 * og metodiske integritetskontrakter.
 */

export interface TestReferenceStudy extends ArticleAppraisal {
  benchmarkCategory: 'KVALITATIV_GT' | 'KVALITATIV_FRAMEWORK' | 'KVANTITATIV_RCT' | 'SYSTEMATISK_OVERSIKT' | 'BLANDET_METODE';
  expectedCompliancePercentage: number;
  methodologicalProfile: {
    approach: string;
    paradigm: string;
    dataTriangulation: boolean;
    reflexivityExplicit: boolean;
    ethicsClearanceConfirmed: boolean;
  };
}

export const TEST_REFERENCE_LIBRARY: TestReferenceStudy[] = [
  {
    id: 'sample-gt-primary-care-2024',
    instrumentId: 'jbi-qualitative-2017',
    instrumentVersion: '2017',
    lifecycleStatus: 'FINALIZED',
    methodologyAlignmentStatus: 'INTERNALLY_COMPLIANCE_CHECKED',
    parsingStatus: 'PARSED_COMPLETE',
    benchmarkCategory: 'KVALITATIV_GT',
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
    design: 'Kvalitativ Grounded Theory (Charmaz / Strauss & Corbin)',
    dataCollection: '10 individuelle semistrukturerte kvalitative dybdeintervjuer med allmennleger',
    participants: '10 fastleger (6 kvinner, 4 menn) med ulik praksisstørrelse og ansiennitet',
    analyticMethod: 'Konstruktivistisk grounded theory med åpen, aksiell og fokusert koding samt konstant komparativ analyse',
    reviewerName: 'Metodisk Testkontroller (Reviewer 1)',
    reviewerRole: 'Akademisk Veileder / Senior Reviewer',
    assessmentDate: '2024-03-15',
    projectName: 'Eksempelbibliotek: Kvalitativ helsetjenesteforskning',
    summaryScore: {
      ja: 9,
      uklart: 1,
      nei: 0,
      ikkeRelevant: 0,
      total: 10
    },
    overallVerdict: 'Inkluder',
    verdictNote: 'Artikkelen oppfyller 9 av 10 JBI-kriterier. Svært solid metodisk stringens, tydelig forskerrefleksivitet og fyldige sitater. Kriterium 1 kodes som «Uklart» i tråd med JBI-krav til eksplisitt ontologisk/epistemologisk redegjørelse.',
    keyStrength: 'Rik empiri, transparent konstant komparativ analyse, tverrfaglig forskergruppe og tydelig diskusjon av forforståelse.',
    mainLimitation: 'Belyser allmennlegers perspektiv; inkluderer ikke samarbeidspartenes synsvinkler.',
    apaReference: "Lund, H. M., Solberg, K. E., Vis, S. A., & Bakke, M. B. (2024). Navigating relational complexity in primary healthcare: A constructivist grounded theory study of general practitioners' interprofessional collaboration. BMC Primary Care, 25, 36. https://doi.org/10.1186/s12875-024-02269-9",
    expectedCompliancePercentage: 90,
    methodologicalProfile: {
      approach: 'Constructivist Grounded Theory',
      paradigm: 'Hermeneutisk-konstruktivistisk',
      dataTriangulation: false,
      reflexivityExplicit: true,
      ethicsClearanceConfirmed: true
    },
    items: [
      {
        questionId: 1,
        status: 'Uklart',
        justification: 'Artikkelen plasserer seg innenfor Grounded Theory (Strauss & Corbin, Charmaz), men formulerer ikke et eksplisitt ontologisk eller epistemologisk ståsted.',
        evidenceText: 'Metodedelen beskriver grounded theory-metodikk, men savner en filosofisk redegjørelse for kunnskapssynet.',
        location: { page: '2', section: 'Methods - Study design' },
        sourceQuoteOrRef: 'Methods, s. 2'
      },
      {
        questionId: 2,
        status: 'Ja',
        justification: 'Kvalitativ grounded theory passer formålet: å utforske allmennlegers erfaringer og sosiale samhandlingsprosesser.',
        evidenceText: '«The aim was to explore general practitioners’ experiences of collaboration with child welfare services.»',
        location: { page: '2', section: 'Aim' },
        sourceQuoteOrRef: 'Aim, s. 2'
      },
      {
        questionId: 3,
        status: 'Ja',
        justification: 'Semistrukturerte dybdeintervjuer med en fleksibel intervjuguide passer grounded theory-designet for å fange nyanserte opplevelser.',
        evidenceText: '«We conducted 10 individual semi-structured qualitative interviews with Norwegian GPs...»',
        location: { page: '2-3', section: 'Data collection' },
        sourceQuoteOrRef: 'Data collection, s. 2-3'
      },
      {
        questionId: 4,
        status: 'Ja',
        justification: 'Koding, konstant komparativ analyse og memo-skriving er grundig redegjort for med konkrete steg.',
        evidenceText: '«Audio recordings were transcribed verbatim and analyzed using constant comparative method with open and axial coding.»',
        location: { page: '3', section: 'Data analysis' },
        sourceQuoteOrRef: 'Data analysis, s. 3'
      },
      {
        questionId: 5,
        status: 'Ja',
        justification: 'Resultatene presenteres med tre logiske dimensjoner og en overordnet syntese i form av en navngitt kjernekategori.',
        evidenceText: 'Kjernekategorien «There’s a will, but not a way» oppsummerer spenningen mellom legenes samarbeidsvilje og de strukturelle rammene.',
        location: { page: '4-8', section: 'Results' },
        sourceQuoteOrRef: 'Results, s. 4-8'
      },
      {
        questionId: 6,
        status: 'Ja',
        justification: 'Forfatterne redegjør for forskergruppens sammensetning (to allmennleger, én barnevernsforsker og én medisinsk antropolog).',
        evidenceText: '«The research team consisted of two practicing GPs, a child welfare researcher, and a medical anthropologist...»',
        location: { page: '3', section: 'Methods - Reflexivity' },
        sourceQuoteOrRef: 'Reflexivity, s. 3'
      },
      {
        questionId: 7,
        status: 'Ja',
        justification: 'Forfatterne diskuterer hvordan legenes faglige fellesskap skapte trygghet under intervjuene og hvordan tverrfaglige debriefinger motvirket forutinntatthet.',
        evidenceText: '«Shared clinical background facilitated rapport during interviews, while multidisciplinary debriefings mitigated confirmation bias.»',
        location: { page: '3 og 9', section: 'Methods & Discussion' },
        sourceQuoteOrRef: 'Methods & Discussion, s. 3, 9'
      },
      {
        questionId: 8,
        status: 'Ja',
        justification: 'Fyldige sitater fra de intervjuede legene underbygger alle de presenterte temaene og subkategoriene.',
        evidenceText: 'Inneholder representative sitater fra samtlige ti informanter fordelt på resultatseksjonene.',
        location: { page: '4-8', section: 'Results' },
        sourceQuoteOrRef: 'Results, s. 4-8'
      },
      {
        questionId: 9,
        status: 'Ja',
        justification: 'Vurdert og godkjent av Sikt (ref 982121), informert skriftlig samtykke og anonymisering er beskrevet.',
        evidenceText: '«Ethical approval was evaluated by Sikt (ref 982121). Written informed consent was obtained...»',
        location: { page: '10', section: 'Ethics and declarations' },
        sourceQuoteOrRef: 'Declarations, s. 10'
      },
      {
        questionId: 10,
        status: 'Ja',
        justification: 'Konklusjonene følger direkte av datamaterialet og drøftes nøkternt uten ubegrunnede generaliseringer.',
        evidenceText: '«Our findings show that structural barriers hinder collaboration despite personal commitment, pointing to need for formalised communication channels.»',
        location: { page: '9-10', section: 'Discussion and Conclusion' },
        sourceQuoteOrRef: 'Conclusion, s. 9-10'
      }
    ],
    auditTrail: [
      {
        id: 'audit-test-1',
        studyId: 'sample-gt-primary-care-2024',
        reviewer: 'Metodisk Testkontroller (Reviewer 1)',
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
    benchmarkCategory: 'KVALITATIV_FRAMEWORK',
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
    reviewerName: 'Metodisk Testkontroller (Reviewer 1)',
    reviewerRole: 'Seniorforsker / Kvalitativ Metodeekspert',
    assessmentDate: '2024-04-10',
    projectName: 'Eksempelbibliotek: Kvalitativ helsetjenesteforskning',
    summaryScore: {
      ja: 8,
      uklart: 2,
      nei: 0,
      ikkeRelevant: 0,
      total: 10
    },
    overallVerdict: 'Inkluder',
    verdictNote: 'Artikkelen tilfredsstiller 8 av 10 JBI-kriterier. Den kvalitative datainnsamlingen og analysen (Framework analysis) er solid og grundig dokumentert. To kriterier kodes som «Uklart» i tråd med JBI-standarden: Filosofisk forankring (JBI 1) og forskerens teoretiske/kulturelle posisjonering (JBI 6).',
    keyStrength: 'Omfattende triangulering av informanter, stringent framework analysis og grundig etisk forankring.',
    mainLimitation: 'Kan ikke dokumentere kausal effekt av tiltaket; belyser deltakernes beskrivelser og sosiale mekanismer.',
    apaReference: "Berg, A. R., Sharma, P., Wadhwa, N., & Moen, K. (2024). Maternal nutrition practices and behaviours in the context of a community health intervention: A qualitative framework analysis. Global Health Action, 17(1), 2314560. https://doi.org/10.1080/16549716.2024.2314560",
    expectedCompliancePercentage: 80,
    methodologicalProfile: {
      approach: 'Framework Analysis',
      paradigm: 'Pragmatisk-anvendt',
      dataTriangulation: true,
      reflexivityExplicit: false,
      ethicsClearanceConfirmed: true
    },
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
        justification: 'Den kvalitative tilnærmingen passer formålet: å forstå mødres opplevelser og barrierer for ernæring under intervensjonen.',
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
        id: 'audit-test-2',
        studyId: 'sample-fa-global-health-2024',
        reviewer: 'Metodisk Testkontroller (Reviewer 1)',
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

export class TestReferenceLibraryService {
  public static getAll(): TestReferenceStudy[] {
    return TEST_REFERENCE_LIBRARY;
  }

  public static getById(id: string): TestReferenceStudy | undefined {
    return TEST_REFERENCE_LIBRARY.find(s => s.id === id);
  }

  public static getByDesign(category: string): TestReferenceStudy[] {
    return TEST_REFERENCE_LIBRARY.filter(s => s.benchmarkCategory === category);
  }
}
