import { Study } from '@/schemas/study.schema';
import { FrameworkType } from '@/types/frameworks';
import { FullAppraisalRecord } from '@/schemas/appraisal.schema';

export interface SampleStudyBundle {
  study: Study;
  framework: FrameworkType;
  initialEvaluations?: FullAppraisalRecord;
}

export const SAMPLE_STUDIES: SampleStudyBundle[] = [
  {
    framework: 'CASP_QUALITATIVE',
    study: {
      id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
      title: 'Helsepersonells opplevelser med implementering av nytt digitalt samhandlingsverktøy i kommunehelsetjenesten: En kvalitativ studie',
      authors: 'Hansen, E. B., Johansen, M., & Berg, T.',
      year: 2023,
      journal: 'Tidsskrift for omsorgsforskning',
      doi: '10.18261/tfo.9.2.4',
      abstract: 'Hensikten med studien var å utforske hvordan sykepleiere og helsefagarbeidere i hjemmesykepleien opplever innføringen av et felles digitalt samhandlingssystem. Studien benyttet et kvalitativt eksplorativt design med 14 semistrukturerte dybdeintervjuer. Analysen ble gjennomført med Braun & Clarkes tematiske analyse. Hovedfunnene viser økt oversikt over legemiddelhåndtering, men samtidig opplevd tidsnød, utilstrekkelig opplæring og teknisk ustabilitet. Forfatterne konkluderer med at involvering av sluttbrukere i opplæringsfasen er avgjørende for vellykket forankring.',
      fullText: `## Abstract
Hensikten med studien var å utforske hvordan sykepleiere og helsefagarbeidere i hjemmesykepleien opplever innføringen av et felles digitalt samhandlingssystem. Studien benyttet et kvalitativt eksplorativt design med 14 semistrukturerte dybdeintervjuer. Analysen ble gjennomført med Braun & Clarkes tematiske analyse. Hovedfunnene viser økt oversikt over legemiddelhåndtering, men samtidig opplevd tidsnød, utilstrekkelig opplæring og teknisk ustabilitet. Forfatterne konkluderer med at involvering av sluttbrukere i opplæringsfasen er avgjørende for vellykket forankring.

## Introduction
Digitalisering av helse- og omsorgstjenestene har vært et sentralt politisk satsingsområde det siste tiåret. Målet er å sikre helhetlige pasientforløp og redusere informasjonsbrudd mellom spesialist- og primærhelsetjenesten. Likevel rapporterer internasjonale studier om betydelige implementeringsutfordringer og frustrasjon blant klinisk personell. Formålet med denne studien var eksplisitt å undersøke sykepleieres og helsefagarbeideres subjektive erfaringer med overgangen til en ny digital samhandlingsplattform i tre mellomstore norske kommuner, og identifisere hvilke organisatoriske faktorer som fremmet eller hemmet mestring i klinisk praksis.

## Methods
Det ble benyttet et kvalitativt eksplorativt design med semistrukturerte individuelle intervjuer. Forskningsspørsmålet krevde innsikt i informantenes personlige opplevelser, verdier og arbeidshverdag, noe som gjorde en kvalitativ hermeneutisk tilnærming hensiktsmessig. Rekrutteringen skjedde via strategisk utvalg i samråd med avdelingsledere i tre distrikter. Totalt 14 informanter (9 sykepleiere og 5 helsefagarbeidere, 12 kvinner og 2 menn, alder 26–59 år) ble inkludert. Datainnsamlingen pågikk fra januar til mai 2023 ved bruk av en pilotert intervjuguide. Intervjuene varte 45–70 minutter, ble tatt opp digitalt og transkribert ordrett. Førsteforfatter (sykepleier med mastergrad) utførte intervjuene og reflekterte over egen forforståelse gjennom løpende loggføring for å redusere faren for bekreftelsesskjevhet. Studien ble vurdert og tilrådt av Sikt (referanse 839211), og alle deltakere ga skriftlig informert samtykke før oppstart. Analyseprosessen fulgte Braun & Clarkes seksfasede modell for tematisk analyse, der to forfattere kodet uavhengig før konsensusmøter.

## Results
Dataanalysen resulterte i tre overordnede temaer: 1) «Bedret oversikt over medisinasjon og risikovurderinger», 2) «Det digitale tidstyveriet: Ekstra klikk og utilstrekkelig mobildekning», og 3) «Følelsen av å bli overkjørt: Mangelfull opplæring og sviktende brukerstøtte». Flere informanter uttrykte: «Systemet gir trygghet for at doseringen er rett, men når nettet faller ut i distriktet står vi helt i blinde». En annen informant bemerket: «Vi fikk to timers felleskurs på storskjerm tre uker før lansering, og etter det måtte vi finne ut av alt på egen hånd midt i morgenstellet».

## Discussion
Funnene understøtter tidligere internasjonal forskning som understreker at teknologisk innovasjon i helsesektoren mislykkes dersom det ikke allokeres tilstrekkelige ressurser til opplæring og kontinuerlig support. Refleksivitet rundt forskernes bakgrunn som helsepersonell styrket tilliten under intervjuene, men krevde samtidig bevissthet om å ikke ta antakelser for gitt. En metodisk begrensning er at utvalget var avgrenset til tre kommuner på Østlandet, noe som kan påvirke overførbarheten til mindre øykommuner. Likevel har funnene høy relevans for ledere og systemutviklere som planlegger fremtidige IKT-innføringer.`,
      sections: [
        {
          type: 'ABSTRACT',
          heading: 'Abstract',
          content: 'Hensikten med studien var å utforske hvordan sykepleiere og helsefagarbeidere i hjemmesykepleien opplever innføringen av et felles digitalt samhandlingssystem. Studien benyttet et kvalitativt eksplorativt design med 14 semistrukturerte dybdeintervjuer. Analysen ble gjennomført med Braun & Clarkes tematiske analyse. Hovedfunnene viser økt oversikt over legemiddelhåndtering, men samtidig opplevd tidsnød, utilstrekkelig opplæring og teknisk ustabilitet. Forfatterne konkluderer med at involvering av sluttbrukere i opplæringsfasen er avgjørende for vellykket forankring.',
          startIdx: 0,
        },
        {
          type: 'INTRODUCTION',
          heading: 'Introduction',
          content: 'Digitalisering av helse- og omsorgstjenestene har vært et sentralt politisk satsingsområde det siste tiåret. Målet er å sikre helhetlige pasientforløp og redusere informasjonsbrudd mellom spesialist- og primærhelsetjenesten. Likevel rapporterer internasjonale studier om betydelige implementeringsutfordringer og frustrasjon blant klinisk personell. Formålet med denne studien var eksplisitt å undersøke sykepleieres og helsefagarbeideres subjektive erfaringer med overgangen til en ny digital samhandlingsplattform i tre mellomstore norske kommuner, og identifisere hvilke organisatoriske faktorer som fremmet eller hemmet mestring i klinisk praksis.',
          startIdx: 480,
        },
        {
          type: 'METHODS',
          heading: 'Methods',
          content: 'Det ble benyttet et kvalitativt eksplorativt design med semistrukturerte individuelle intervjuer. Forskningsspørsmålet krevde innsikt i informantenes personlige opplevelser, verdier og arbeidshverdag, noe som gjorde en kvalitativ hermeneutisk tilnærming hensiktsmessig. Rekrutteringen skjedde via strategisk utvalg i samråd med avdelingsledere i tre distrikter. Totalt 14 informanter (9 sykepleiere og 5 helsefagarbeidere, 12 kvinner og 2 menn, alder 26–59 år) ble inkludert. Datainnsamlingen pågikk fra januar til mai 2023 ved bruk av en pilotert intervjuguide. Intervjuene varte 45–70 minutter, ble tatt opp digitalt og transkribert ordrett. Førsteforfatter (sykepleier med mastergrad) utførte intervjuene og reflekterte over egen forforståelse gjennom løpende loggføring for å redusere faren for bekreftelsesskjevhet. Studien ble vurdert og tilrådt av Sikt (referanse 839211), og alle deltakere ga skriftlig informert samtykke før oppstart. Analyseprosessen fulgte Braun & Clarkes seksfasede modell for tematisk analyse, der to forfattere kodet uavhengig før konsensusmøter.',
          startIdx: 1200,
        },
        {
          type: 'RESULTS',
          heading: 'Results',
          content: 'Dataanalysen resulterte i tre overordnede temaer: 1) «Bedret oversikt over medisinasjon og risikovurderinger», 2) «Det digitale tidstyveriet: Ekstra klikk og utilstrekkelig mobildekning», og 3) «Følelsen av å bli overkjørt: Mangelfull opplæring og sviktende brukerstøtte». Flere informanter uttrykte: «Systemet gir trygghet for at doseringen er rett, men når nettet faller ut i distriktet står vi helt i blinde». En annen informant bemerket: «Vi fikk to timers felleskurs på storskjerm tre uker før lansering, og etter det måtte vi finne ut av alt på egen hånd midt i morgenstellet».',
          startIdx: 2300,
        },
        {
          type: 'DISCUSSION',
          heading: 'Discussion',
          content: 'Funnene understøtter tidligere internasjonal forskning som understreker at teknologisk innovasjon i helsesektoren mislykkes dersom det ikke allokeres tilstrekkelige ressurser til opplæring og kontinuerlig support. Refleksivitet rundt forskernes bakgrunn som helsepersonell styrket tilliten under intervjuene, men krevde samtidig bevissthet om å ikke ta antakelser for gitt. En metodisk begrensning er at utvalget var avgrenset til tre kommuner på Østlandet, noe som kan påvirke overførbarheten til mindre øykommuner. Likevel har funnene høy relevans for ledere og systemutviklere som planlegger fremtidige IKT-innføringer.',
          startIdx: 2950,
        },
      ],
      importedAt: '2026-09-07T10:00:00.000Z',
    },
    initialEvaluations: {
      id: 'e391a2bb-7d88-4c81-81f5-9f11883c0721',
      studyId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
      framework: 'CASP_QUALITATIVE',
      evaluatorName: 'Dr. Anne-Beth Andersen',
      completed: true,
      overallRiskOrQuality: 'HIGH',
      summaryNotes: 'Metodisk solid kvalitativ studie med god forankring, eksplisitt refleksivitet og etisk godkjenning via Sikt.',
      updatedAt: '2026-09-07T10:30:00.000Z',
      evaluations: [
        {
          criterionId: 'casp_q1',
          response: 'YES',
          rationale: 'Formålet er eksplisitt formulert i introduksjonen: å undersøke sykepleieres erfaringer med samhandlingsplattformen og organisatoriske faktorer.',
          evidenceAnchors: [
            {
              section: 'INTRODUCTION',
              quote: 'Formålet med denne studien var eksplisitt å undersøke sykepleieres og helsefagarbeideres subjektive erfaringer med overgangen til en ny digital samhandlingsplattform',
            },
          ],
        },
        {
          criterionId: 'casp_q2',
          response: 'YES',
          rationale: 'Kvalitativ eksplorativ hermeneutisk metode er velegnet for å fange subjektive opplevelser og meningsdannelse i klinisk praksis.',
          evidenceAnchors: [
            {
              section: 'METHODS',
              quote: 'Forskningsspørsmålet krevde innsikt i informantenes personlige opplevelser, verdier og arbeidshverdag, noe som gjorde en kvalitativ hermeneutisk tilnærming hensiktsmessig.',
            },
          ],
        },
        {
          criterionId: 'casp_q6',
          response: 'YES',
          rationale: 'Førsteforfatter gjør eksplisitt rede for egen bakgrunn som sykepleier og loggføring av forforståelse underveis.',
          evidenceAnchors: [
            {
              section: 'METHODS',
              quote: 'Førsteforfatter (sykepleier med mastergrad) utførte intervjuene og reflekterte over egen forforståelse gjennom løpende loggføring for å redusere faren for bekreftelsesskjevhet.',
            },
          ],
        },
        {
          criterionId: 'casp_q7',
          response: 'YES',
          rationale: 'Etisk tilråding fra Sikt (ref. 839211) og skriftlig informert samtykke er dokumentert.',
          evidenceAnchors: [
            {
              section: 'METHODS',
              quote: 'Studien ble vurdert og tilrådt av Sikt (referanse 839211), og alle deltakere ga skriftlig informert samtykke før oppstart.',
            },
          ],
        },
        {
          criterionId: 'casp_q8',
          response: 'YES',
          rationale: 'Braun & Clarkes tematiske analyse med uavhengig koding og konsensusmøter sikrer stringent analyse.',
          evidenceAnchors: [
            {
              section: 'METHODS',
              quote: 'Analyseprosessen fulgte Braun & Clarkes seksfasede modell for tematisk analyse, der to forfattere kodet uavhengig før konsensusmøter.',
            },
          ],
        },
      ],
    },
  },
  {
    framework: 'AMSTAR_2',
    study: {
      id: 'f451a9bb-1132-4911-9a33-67c8842d0019',
      title: 'Effekt av sykepleierledede oppfølgingstiltak hos voksne med kronisk hjertesvikt: En systematisk oversikt og meta-analyse',
      authors: 'Lindqvist, K., Miller, R., & Olsen, S.',
      year: 2022,
      journal: 'European Journal of Cardiovascular Nursing',
      doi: '10.1093/eurjcn/zvac041',
      abstract: 'Formålet med denne systematiske oversikten var å kvantifisere effekten av sykepleierledede intervensjoner på reinnleggelser og dødelighet hos pasienter med hjertesvikt. Protokollen ble forhåndsregistrert i PROSPERO (CRD42021289110). Et systematisk litteratursøk ble utført i Medline, Embase og Cochrane CENTRAL frem til desember 2021. Tjuefem randomiserte kontrollerte studier (n = 6420) ble inkludert. Sykepleierledet oppfølging reduserte risiko for hjertesviktreinnleggelse med 24 % (RR 0.76, 95 % KI 0.68–0.85).',
      fullText: `## Abstract
Formålet med denne systematiske oversikten var å kvantifisere effekten av sykepleierledede intervensjoner på reinnleggelser og dødelighet hos pasienter med hjertesvikt. Protokollen ble forhåndsregistrert i PROSPERO (CRD42021289110). Et systematisk litteratursøk ble utført i Medline, Embase og Cochrane CENTRAL frem til desember 2021. Tjuefem randomiserte kontrollerte studier (n = 6420) ble inkludert. Sykepleierledet oppfølging reduserte risiko for hjertesviktreinnleggelse med 24 % (RR 0.76, 95 % KI 0.68–0.85).

## Introduction
Hjertesvikt rammer 1-2 % av den voksne befolkningen i vestlige land og er en ledende årsak til akuttinnleggelser. Sykepleierledede poliklinikker og hjemmebesøk har blitt lansert som nøkkelstrategier for å styrke egenomsorg og medikamentetterlevelse. Formålet med denne oversikten var å syntetisere evidens fra RCT-er etter PICO-rammeverket: Voksne pasienter med hjertesvikt (P), sykepleierledet oppfølging (I), standard medisinsk oppfølging (C), og reinnleggelse samt totaldødelighet (O).

## Methods
Oversiktens protokoll ble a priori registrert i PROSPERO (CRD42021289110) i september 2021. Søkestrategien ble utarbeidet i samarbeid med forskningsbibliotekar og kjørt i MEDLINE (Ovid), EMBASE, CINAHL og Cochrane CENTRAL uten språkrestriksjoner. Studieseleksjon ble gjennomført uavhengig av to granskere via Rayyan, med tredjeparts voldgift ved uenighet. En detaljert tabell over ekskluderte fulltekstartikler med eksplisitte eksklusjonsgrunner er lagt ved som supplement. Kvalitetsvurdering ble gjennomført med Cochrane RoB 2-verktøyet. For kvantitativ syntese ble en random-effects modell (DerSimonian-Laird) benyttet på grunn av forventet klinisk heterogenitet. Heterogenitet ble kvantifisert med I²-statistikk, og publiseringsskjevhet ble undersøkt ved hjelp av funneltrakter og Eggers regresjonstest.

## Results
Søket identifiserte 4 120 unike referanser. Etter screening ble 25 RCT-er inkludert (n=6420 deltakere). Samlet meta-analyse viste en signifikant reduksjon i hjertesviktreinnleggelser ved 12 måneder (RR 0.76, 95 % KI 0.68–0.85, I² = 38 %). For totaldødelighet ble det observert en ikke-signifikant reduksjon (RR 0.91, 95 % KI 0.81–1.02). Funnel plot viste ingen tegn til asymmetri (Eggers test p = 0.42).

## Discussion
Våre funn demonstrerer at strukturerte sykepleierledede tiltak har klinisk relevant effekt på å forebygge reinnleggelser. Risiko for skjevhet i primærstudiene var overveiende lav, selv om avblinding av pasienter ikke var mulig på grunn av intervensjonens natur. Sensitivitetsanalyser der studier med høy skjevhetsrisiko ble ekskludert opprettholdt effektstørrelsen. Forfatterne erklærer ingen interessekonflikter og studien mottok ingen ekstern finansiering fra kommersielle aktører.`,
      sections: [
        {
          type: 'ABSTRACT',
          heading: 'Abstract',
          content: 'Formålet med denne systematiske oversikten var å kvantifisere effekten av sykepleierledede intervensjoner på reinnleggelser og dødelighet hos pasienter med hjertesvikt. Protokollen ble forhåndsregistrert i PROSPERO (CRD42021289110). Et systematisk litteratursøk ble utført i Medline, Embase og Cochrane CENTRAL frem til desember 2021. Tjuefem randomiserte kontrollerte studier (n = 6420) ble inkludert. Sykepleierledet oppfølging reduserte risiko for hjertesviktreinnleggelse med 24 % (RR 0.76, 95 % KI 0.68–0.85).',
          startIdx: 0,
        },
        {
          type: 'INTRODUCTION',
          heading: 'Introduction',
          content: 'Hjertesvikt rammer 1-2 % av den voksne befolkningen i vestlige land og er en ledende årsak til akuttinnleggelser. Sykepleierledede poliklinikker og hjemmebesøk har blitt lansert som nøkkelstrategier for å styrke egenomsorg og medikamentetterlevelse. Formålet med denne oversikten var å syntetisere evidens fra RCT-er etter PICO-rammeverket: Voksne pasienter med hjertesvikt (P), sykepleierledet oppfølging (I), standard medisinsk oppfølging (C), og reinnleggelse samt totaldødelighet (O).',
          startIdx: 520,
        },
        {
          type: 'METHODS',
          heading: 'Methods',
          content: 'Oversiktens protokoll ble a priori registrert i PROSPERO (CRD42021289110) i september 2021. Søkestrategien ble utarbeidet i samarbeid med forskningsbibliotekar og kjørt i MEDLINE (Ovid), EMBASE, CINAHL og Cochrane CENTRAL uten språkrestriksjoner. Studieseleksjon ble gjennomført uavhengig av to granskere via Rayyan, med tredjeparts voldgift ved uenighet. En detaljert tabell over ekskluderte fulltekstartikler med eksplisitte eksklusjonsgrunner er lagt ved som supplement. Kvalitetsvurdering ble gjennomført med Cochrane RoB 2-verktøyet. For kvantitativ syntese ble en random-effects modell (DerSimonian-Laird) benyttet på grunn av forventet klinisk heterogenitet. Heterogenitet ble kvantifisert med I²-statistikk, og publiseringsskjevhet ble undersøkt ved hjelp av funneltrakter og Eggers regresjonstest.',
          startIdx: 1100,
        },
        {
          type: 'RESULTS',
          heading: 'Results',
          content: 'Søket identifiserte 4 120 unike referanser. Etter screening ble 25 RCT-er inkludert (n=6420 deltakere). Samlet meta-analyse viste en signifikant reduksjon i hjertesviktreinnleggelser ved 12 måneder (RR 0.76, 95 % KI 0.68–0.85, I² = 38 %). For totaldødelighet ble det observert en ikke-signifikant reduksjon (RR 0.91, 95 % KI 0.81–1.02). Funnel plot viste ingen tegn til asymmetri (Eggers test p = 0.42).',
          startIdx: 2150,
        },
        {
          type: 'DISCUSSION',
          heading: 'Discussion',
          content: 'Våre funn demonstrerer at strukturerte sykepleierledede tiltak har klinisk relevant effekt på å forebygge reinnleggelser. Risiko for skjevhet i primærstudiene var overveiende lav, selv om avblinding av pasienter ikke var mulig på grunn av intervensjonens natur. Sensitivitetsanalyser der studier med høy skjevhetsrisiko ble ekskludert opprettholdt effektstørrelsen. Forfatterne erklærer ingen interessekonflikter og studien mottok ingen ekstern finansiering fra kommersielle aktører.',
          startIdx: 2750,
        },
      ],
      importedAt: '2026-09-07T11:00:00.000Z',
    },
  },
];
