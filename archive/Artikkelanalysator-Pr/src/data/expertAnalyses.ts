import { ArticleAnalysis } from '../types';

export const EXPERT_ANALYSES: Record<string, ArticleAnalysis> = {
  'overhaug-2024': {
    articleId: 'overhaug-2024',
    articleType: 'Kvalitativ forskningsartikkel',
    typeJustification: 'Artikkelen er en empirisk kvalitativ studie som undersøker fastlegers subjektive erfaringer og opplevde barrierer i samarbeidet med barneverntjenesten. Den anvender systematisk koding (Corbin & Strauss grounded theory) og utvikler en empirisk forankret konseptuell modell («There’s a will, but not a way») med tre prosessuelle stadier, noe som er karakteristisk for kvalitativ metode.',
    theoreticalFramework: 'Grounded theory (Corbin & Strauss, 2008), relasjonell koordinering (Gittell, 2006) og biopsykososial modell / helhetlig pasientforståelse (whole-person care).',
    methodologicalQualityScore: 86,
    summary: {
      background: 'Negatve barndomserfaringer (ACE) har dokumentert sammenheng med senere fysisk og psykisk sykdom. Fastleger har en nøkkelrolle i å identifisere og støtte sårbare barn og samhandle med andre etater.',
      objective: 'Å utforske fastlegers erfaringer med samarbeidsprosessen med barneverntjenesten (CWS).',
      methods: 'Kvalitativ grounded theory-studie bestående av ti semistrukturerte intervjuer med fastleger i Norge (2020–2021) med ulik geografisk spredning (urbane og rurale strøk). Analysert gjennom åpen, aksial og selektiv koding.',
      results: 'Hovedfunnet er «There’s a will, but not a way». Tre stadier: (I) Familiar territory (helhetlig pasientbehandling), (II) Unfamiliar territory (enveis informasjonsvindu og lukket dør), og (III) Fragmented territory (tapte muligheter og manglende biter i pasienthistorien).',
      conclusion: 'Fastlegers vilje til samarbeid hindres av taushetspliktfortolkninger, enveis kommunikasjon og manglende felles digitale verktøy, noe som fører til tapte muligheter til å hjelpe sårbare familier.'
    },
    checklists: [
      {
        id: 'c1',
        question: 'Er formålet med studien klart formulert og begrunnet i et empirisk/teoretisk kunnskapsgap?',
        category: 'Formål & Design',
        answer: 'Ja',
        justification: 'Forfatterne redegjør grundig for tidligere forskning på varslingspraksis og identifisering, og påpeker mangelen på studier som undersøker selve samarbeidsprosessen mellom fastleger og barnevern.',
        evidenceQuote: 'With this study we aim to explore GPs’ experiences of the collaboration process with CWS. A grounded theory approach is therefore considered appropriate.'
      },
      {
        id: 'c2',
        question: 'Er det metodiske designet (grounded theory) egnet for å besvare forskningsspørsmålet?',
        category: 'Formål & Design',
        answer: 'Ja',
        justification: 'Grounded theory er svært egnet for å utforske sosiale prosesser, subjektive erfaringer og interaksjoner der eksisterende modeller ikke er testet på utvalget.',
        evidenceQuote: 'Grounded theory is a well suited method for exploration of a phenomena, subjective experience, social processes and interactions...'
      },
      {
        id: 'c3',
        question: 'Er utvalgsmetode og datainnsamling transparent beskrevet med hensyn til informasjonskraft?',
        category: 'Metode & Utvalg',
        answer: 'Ja',
        justification: 'Målrettet utvalg med ti erfarne fastleger fra både rurale og urbane strøk gir god variasjon og informasjonskraft, selv om utvalget er relativt lite.',
        evidenceQuote: 'We purposefully sampled GPs from urban and rural areas in Norway, with at least five years of experience as a GP...'
      },
      {
        id: 'c4',
        question: 'Er dataanalysen utført systematisk gjennom åpne, aksiale og selektive trinn?',
        category: 'Dataanalyse & Funn',
        answer: 'Ja',
        justification: 'Analysen følger Corbin & Strauss med memoer, koding, konstant komparativ analyse og diskusjon i tverrfaglig forskergruppe, noe som styrker bekreftbarheten.',
        evidenceQuote: 'Analytical strategies included analysis of similar issues... constant comparative analysis, and examining and elaborating on an issue’s... meaning.'
      },
      {
        id: 'c5',
        question: 'Er etiske hensyn, samtykke og taushetsplikt tilstrekkelig drøftet?',
        category: 'Etikk & Konklusjon',
        answer: 'Delvis',
        justification: 'Studien redegjør for samtykke, anonymisering og fritak fra Regional etisk komité (REK), men drøfter i mindre grad risikoen for indirekte gjenkjennelse av familier eller kommuner.',
        evidenceQuote: 'Informed consent to participate from all informants was obtained and they signed a written letter of consent.'
      }
    ],
    strengths: [
      'Tydelig og klinisk relevant problemstilling med stor praksisrelevans.',
      'God geografisk og demografisk variasjon i utvalget (både store byer og små rurale distrikter).',
      'Systematisk analyseprosess med tverrfaglig diskusjon i forskerteamet som styrker troverdigheten.',
      'Rike, illustrative sitater som binder data og teoretisk modell tett sammen.'
    ],
    limitations: [
      'Studien baserer seg utelukkende på fastlegenes perspektiv (ensidig informantgruppe i en bilateral prosess).',
      'Fire av de ti informantene var delvis kjent for førsteforfatteren gjennom et utvidet nettverk, noe som kan ha påvirket intervjudynamikken.',
      'Manglende deltakerverifisering (member checking) av de ferdige kategoriene og modellene.',
      'Begrenset dokumentasjon av den faktiske prosessen for teoretisk sampling og metning.'
    ],
    practicalImplications: 'For å styrke oppfølgingen av sårbare barn og familier er det kritisk å etablere sikre, toveis elektroniske kommunikasjonskanaler mellom fastlegekontor og barneverntjeneste som er integrert i EPJ-systemene.'
  },
  'sahota-2026': {
    articleId: 'sahota-2026',
    articleType: 'Kvalitativ forskningsartikkel',
    typeJustification: 'Studien undersøker dypere mekanismer for atferdsendring og ernæringspraksis i en pågående intervensjon ved hjelp av kvalitative intervjuer (IDIs) og fokusgruppearbeid (FGDs), analysert med en hybrid deduktiv-induktiv rammematrise.',
    theoreticalFramework: 'Hybrid deduktiv-induktiv tematisk analyse, framework matrix, teorier om Cash-Plus intervensjoner, intra-household bargaining og social behavior change communication (SBCC).',
    methodologicalQualityScore: 89,
    summary: {
      background: 'Underernæring blant barn og mødre i Sør-Asia krever intervensjoner som kombinerer kontantoverføringer med atferdsendring (Cash-Plus).',
      objective: 'Å utforske ernæringspraksiser og atferdsendringer blant gravide kvinner og mødre i Rajasthan, India, eksponert for en Cash-Plus-intervensjon.',
      methods: 'Kvalitativ studie med 46 dybdeintervjuer (IDIs) av mødre/gravide, 36 fedre, 34 familiemedlemmer samt 7 fokusgruppearbeid (FGDs) med 23 frontlinjearbeidere i fire stammedistrikter.',
      results: 'Fire hovedveier til atferdsendring ble identifisert: (1) kunnskapsoverføring gjennom veiledning, (2) økonomisk tilrettelegging via kontanter, (3) endret familiedynamikk (involvering av menn og svigermødre), og (4) normativ diffusjon i lokalsamfunnet.',
      conclusion: 'Cash-Plus intervensjoner som adresserer både kunnskap og strukturelle barrierer gjennom familieorienterte tilnærminger gir betydelige forbedringer i maternal og infantil ernæring.'
    },
    checklists: [
      {
        id: 'c1',
        question: 'Er formålet med studien klart formulert med forankring i tidligere global helseforskning?',
        category: 'Formål & Design',
        answer: 'Ja',
        justification: 'Artikkelen redegjør presist for intergenerasjonell underernæring og behovet for å forstå mekanismene bak Cash-Plus programmer.',
        evidenceQuote: 'This study aimed to explore nutrition practices and behaviours among pregnant women and mothers of children under 2 years...'
      },
      {
        id: 'c2',
        question: 'Er det kvalitative designet egnet for å fange opp komplekse familie- og samfunnsmekanismer?',
        category: 'Formål & Design',
        answer: 'Ja',
        justification: 'Kombinasjonen av individuelle intervjuer og fokusgrupper på tvers av familiemedlemmer gir en unik dybdeforståelse av maktforhold og atferdsendring.',
        evidenceQuote: 'A framework analysis approach was used to identify emerging concepts around practices and behaviours.'
      },
      {
        id: 'c3',
        question: 'Er utvalg og datainnsamling transparent rapportert med bred triangulering?',
        category: 'Metode & Utvalg',
        answer: 'Ja',
        justification: 'Studien utmerker seg med et svært bredt utvalg som inkluderer mødre, fedre, svigermødre og frontlinjearbeidere i fire ulike stammedistrikter.',
        evidenceQuote: 'Twenty-three IDIs were carried out with pregnant women and 23 with mothers of young children... 36 husbands, 28 mothers-in-law...'
      },
      {
        id: 'c4',
        question: 'Er dataanalysen utført systematisk med uavhengig koding og rammematrise?',
        category: 'Dataanalyse & Funn',
        answer: 'Ja',
        justification: 'Bruk av to uavhengige kodere (RS og AD), rammematrise i Excel og regelmessige konsensusmøter sikrer analytisk stringens.',
        evidenceQuote: 'All transcripts were independently coded by two researchers (RS and AD), and the coding framework was iteratively refined...'
      },
      {
        id: 'c5',
        question: 'Er forskningsetikk, lokalsamfunnssamtykke og sårbarhet ivaretatt?',
        category: 'Etikk & Konklusjon',
        answer: 'Ja',
        justification: 'Formelle godkjenninger fra etiske komiteer i India og Storbritannia, samt skriftlig informert samtykke og opptakssikring er behørig dokumentert.',
        evidenceQuote: 'Ethical approval was obtained from the Institutional Review Board of Institute of Health Management Research...'
      }
    ],
    strengths: [
      'Eksepsjonell informasjonsbredde og kildetriangulering på tvers av familiemedlemmer og helsearbeidere.',
      'Solid metodisk rammeverk med hybrid deduktiv-induktiv koding og uavhengig dobbelkoding.',
      'Tydelig kobling mellom empiriske funn og konkrete policy-anbefalinger for global helse.',
      'Grundig refleksjon rundt sosial ønskverdighet og forskerteamets posisjon.'
    ],
    limitations: [
      'Utfordrende å isolere effekten av Cash-Plus intervensjonen fra andre samtidige statlige ernæringsprogrammer i regionen.',
      'Selvrapporterte data kan være farget av deltakernes ønske om å fremstå gunstig overfor evaluatorer.',
      'Spesifikk stammekontekst i Rajasthan kan begrense direkte overførbarehet til helt andre kulturelle settinger.'
    ],
    practicalImplications: 'Politiske beslutningstakere i lav- og middelinntektsland bør designe fleksible, familieorienterte Cash-Plus programmer som aktivt involverer fedre og svigermødre for å bryte underernæringssyklusen.'
  }
};
