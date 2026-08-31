export interface MetaResearchSample {
  id: string;
  title: string;
  categoryName: string;
  expectedType: string;
  description: string;
  fileName: string;
  text: string;
}

export const META_RESEARCH_SAMPLES: MetaResearchSample[] = [
  {
    id: 'qualitative-grounded-theory',
    title: 'Bakke et al. (2024) – Pasienters opplevelser i akuttpsykiatri',
    categoryName: 'Kvalitativ forskning',
    expectedType: 'PRIMARY_QUALITATIVE',
    description: 'Kvalitativ intervjustudie basert på konstruktivistisk Grounded Theory med 16 dybdeintervjuer.',
    fileName: 'Bakke_2024_GroundedTheory_Psychiatry.pdf',
    text: `Tittel: Rom for verdighet: En konstruktivistisk grounded theory-studie av pasienters opplevelser av relasjonell trygghet i akuttpsykiatriske avdelinger.
Forfattere: Astrid Bakke, Lars-Petter Kristiansen, Solveig M. Vik.
Tidsskrift: Tidsskrift for psykisk helsearbeid, Vol 21, Nr 2, s. 112–126. DOI: 10.18261/tph.2024.02.04.

Sammendrag / Abstract:
Hensikt: Formålet med denne studien var å utforske hvordan pasienter innlagt i akuttpsykiatriske døgnavdelinger erfarer relasjonell trygghet og samhandling med helsepersonell, og hvilke meningsbærende prosesser som fremmer opplevelsen av verdighet under akutte kriser.
Metode og vitenskapsteori: Studien har et eksplorerende kvalitativt design forankret i en konstruktivistisk grounded theory-tilnærming (Charmaz, 2014) og hermeneutisk fenomenologi. Datamaterialet består av 16 individuelle dybdeintervjuer med tidligere innlagte pasienter (10 kvinner, 6 menn, alder 22–64 år). Rekruttering foregikk via brukerorganisasjoner og DPS inntil teoretisk metning (saturation) ble oppnådd.
Analyse: Datamaterialet ble analysert gjennom initiell linje-for-linje koding, fokusert koding og konstant komparativ metode med fortløpende memos.
Forskerrefleksivitet og forforståelse: Førsteforfatter er psykiatrisk sykepleier med 12 års klinisk erfaring. Forfattergruppen diskuterte eksplisitt egen forforståelse, maktasymmetri og emosjonelle reaksjoner underveis i forskningsprosessen. Transkripsjonene ble revidert i tverrfaglig forskergruppe for å sikre at deltakernes egne stemmer ikke ble overstyrt av kliniske kategoriseringer.
Etiske hensyn: Prosjektet er godkjent av Regional komité for medisinsk og helsefaglig forskningsetikk (REK Sør-Øst, ref: 2023/49182) og SIKT (ref: 849201). Alle deltakere ga skriftlig informert samtykke etter grundig muntlig orientering.
Finansiering og interessekonflikter: Studien er finansiert av Helse Sør-Øst RHF (stipendnr. 2022-041). Forfatterne erklærer ingen interessekonflikter.
Datatilgjengelighet: Anonymiserte intervjuutdrag og kodebøker er tilgjengelige via NSD/SIKT forskningsdataarkiv ved begrunnet henvendelse.
Resultater og konklusjon: Analysen avdekket kjerne-kategorien «Å bli møtt som et likeverdig subjekt bak diagnosen». Forfatterne konkluderer med at relasjonell tilstedeværelse reduserer opplevelsen av tvang og avmakt, men påpeker studiens begrensning i at den kun omfatter pasienter som var i stand til å samtykke i etterkant av akuttfasen.`
  },
  {
    id: 'rct-cardiology',
    title: 'Henriksen et al. (2025) – Telemedisinsk oppfølging ved hjertesvikt (RCT)',
    categoryName: 'Kvantitativ RCT',
    expectedType: 'PRIMARY_QUANT_RCT',
    description: 'Dobbeltblindet randomisert kontrollert studie (RCT) som tester digital monitorering mot standardbehandling.',
    fileName: 'Henriksen_2025_TeleHealth_RCT.pdf',
    text: `Title: Digital Remote Telemonitoring versus Standard Care for Chronic Heart Failure: A Multicenter Parallel-Group Randomized Controlled Trial.
Authors: Martin Henriksen, Camilla Sunde, Torstein G. Berg, Elena Rostova.
Journal: Scandinavian Cardiovascular Journal, Vol 59(1), pp. 45-56. DOI: 10.1080/14017431.2025.210491.

Abstract:
Objective: To determine whether structured digital remote telemonitoring reduces 12-month all-cause hospital readmission rates in patients with NYHA Class II-IV chronic heart failure compared to standard outpatient care.
Methods: In this multicenter, parallel-group, open-label randomized controlled trial with blinded endpoint evaluation (PROBE design), 420 patients (mean age 68.4 years; 38% female) were randomly allocated (1:1) using computerized block randomization (block size 4 and 6, stratified by center and baseline ejection fraction) to receive either daily telemonitoring via biometric sensors (n=210) or usual outpatient clinic follow-up (n=210).
Power calculation: A sample size of 390 patients was calculated a priori to detect an absolute risk reduction of 12% in the primary composite endpoint with 85% statistical power and alpha = 0.05 (allowing for 7% loss to follow-up).
Primary Outcome: All-cause unplanned readmission or all-cause mortality at 12 months, analyzed according to the intention-to-treat (ITT) principle using Cox proportional hazards regression.
Ethics and Trial Registration: The study protocol was prospectively registered at ClinicalTrials.gov (NCT05491028) and approved by the National Medical Research Ethics Committee (REK Nord, #2023/18402). Written informed consent was obtained prior to randomization.
Funding and Conflict of Interest: Supported by the Research Council of Norway (Grant #319402). The telemonitoring devices were provided without commercial restrictions; authors declare no financial ties.
Data Availability: De-identified participant dataset and analytic R scripts are available on the Open Science Framework (OSF DOI: 10.17605/OSF.IO/CARDIO2025).
Results & Conclusion: Telemonitoring resulted in a significant 28% hazard reduction in readmissions (HR 0.72, 95% CI 0.55-0.94, p=0.014). Blinding of outcome adjudicators was maintained throughout.`
  },
  {
    id: 'systematic-review-meta-analysis',
    title: 'Larsen & Moen (2024) – Fysisk aktivitet ved alvorlig depresjon (Meta-analyse)',
    categoryName: 'Systematisk oversikt',
    expectedType: 'SECONDARY_SYSTEMATIC_REVIEW',
    description: 'Systematisk oversikt og meta-analyse basert på PRISMA 2020 av 28 randomiserte studier.',
    fileName: 'Larsen_Moen_2024_Exercise_Depression_SR.pdf',
    text: `Tittel: Effekt av strukturert fysisk trening som tilleggsbehandling ved moderat til alvorlig depresjon hos voksne: En systematisk oversikt og meta-analyse.
Forfattere: Kari Larsen, Johannes Moen, Christian H. Eide.
Publisert i: Cochrane Database / Scandinavian Journal of Public Health, 2024;52(3):280-295. DOI: 10.1177/1403494824110294.

Sammendrag:
Hensikt: Å syntetisere effekten av aerob og anaerob trening sammenlignet med venteliste eller standard farmakoterapi på depressive symptomer (målt med HAM-D og BDI-II).
Metode og søkestrategi: Den systematiske oversikten fulgte PRISMA 2020 og en forhåndsregistrert protokoll på PROSPERO (CRD42023419082). Systematiske søk ble gjennomført i MEDLINE, Embase, PsycINFO, CINAHL og Cochrane CENTRAL fra oppstart til mai 2024 uten språkbegrensninger. Søkestrenger og grå litteratur er fullt dokumentert i tilleggsmateriale.
Studieutvelgelse og datainnsamling: To uavhengige forskere screenet titler/sammendrag og fulltekstartikler (Cohen's Kappa = 0.89). Uenigheter ble løst gjennom konsensusmøter med en tredje overlege.
Kvalitetsvurdering og bias: Risiko for skjevhet ble vurdert med Cochrane RoB 2.
Statistisk syntese: Tilfeldige effekter meta-analyse (DerSimonian-Laird) ble benyttet med Standardized Mean Difference (SMD). Heterogenitet ble kvantifisert med I²-statistikk og subgruppeanalyser for treningsintensitet. Publikasjonsbias ble testet med Egger's test og trappetrinn-funnel plots.
Etikk og finansiering: Ingen direkte pasientdata; uavhengig akademisk stipend fra Folkehelseinstituttet. Ingen kommersielle bindinger.
Resultater: 28 RCT-er med totalt 2410 deltakere ble inkludert. Trening viste moderat til sterk effekt (SMD -0.62, 95% KI -0.79 til -0.45, p<0.001; I²=44%). Forfatterne diskuterer risiko for manglende blinding av deltakere i treningsintervensjoner.`
  },
  {
    id: 'clinical-guideline-agree',
    title: 'Helsedirektoratet (2024) – Nasjonal faglig retningslinje for diabetesbehandling',
    categoryName: 'Klinisk retningslinje',
    expectedType: 'CLINICAL_GUIDELINE',
    description: 'Nasjonal retningslinje utgitt av Helsedirektoratet for diagnostikk, blodsukkermål og tverrfaglig oppfølging.',
    fileName: 'Helsedirektoratet_Nasjonal_Retningslinje_Diabetes_2024.pdf',
    text: `Dokument: Nasjonal faglig retningslinje for diabetesbehandling i primær- og spesialisthelsetjenesten (IS-2840).
Utgiver: Helsedirektoratet, Avdeling for retningslinjer og fagutvikling, Oslo.
Publisert: Januar 2024. Lovhjemmel: Helse- og omsorgstjenesteloven § 12-5.

Formål og målgruppe:
Retningslinjen gir normerende faglige anbefalinger for utredning, behandling og forebygging av senkomplikasjoner ved diabetes type 1 og type 2. Målgruppen er fastleger, endokrinologer, diabetessykepleiere, kliniske ernæringsfysiologer og pasienter.

Metode for retningslinjeutvikling (AGREE II / GRADE):
Retningslinjearbeidet er gjennomført i henhold til Helsedirektoratets veileder for retningslinjeutvikling.
Arbeidsgruppe og brukermedvirkning: En tverrfaglig arbeidsgruppe med 14 representanter (inkludert 2 pasientrepresentanter fra Diabetesforbundet og allmennleger) har utarbeidet anbefalingene.
Kunnskapsgrunnlag: Kunnskapssenterets systematiske oversikter og Cochrane-rapporter ble benyttet som grunnlag. Tillit til kunnskapsgrunnlaget ble gradert ved hjelp av GRADE (Grading of Recommendations Assessment, Development and Evaluation).
Høring og forankring: Utkastet har vært på 3 måneders åpen offentlig høring med 45 skriftlige høringsinnspill fra RHF-er, kommuner og Legeforeningen.
Interessekonflikter: Alle arbeidsgruppemedlemmer har signert obligatoriske habilitetserklæringer; ingen medlemmer hadde honorarer eller aksjer i legemiddelselskaper med relevante legemidler.
Implementering og ressursvurdering: Økonomiske og organisatoriske konsekvenser er vurdert i eget kapittel med revisjonsintervall satt til 3 år.`
  },
  {
    id: 'mixed-methods-mmat',
    title: 'Solberg et al. (2024) – Mixed methods studie av samvalg ved kreftbehandling',
    categoryName: 'Blandet metode (Mixed Methods)',
    expectedType: 'PRIMARY_MIXED_METHODS',
    description: 'Konvergent parallell mixed methods studie som kombinerer pasientsurvey (n=180) med kvalitative intervjuer (n=20).',
    fileName: 'Solberg_2024_SharedDecisionMaking_MixedMethods.pdf',
    text: `Tittel: Pasienters opplevelse av samvalg ved persontilpasset kreftbehandling: En konvergent parallell mixed methods-studie.
Forfattere: Hilde Solberg, Trond E. Nygård, Anne L. Vik.
Tidsskrift: BMC Health Services Research, 2024;24:412. DOI: 10.1186/s12913-024-10822-1.

Sammendrag:
Hensikt og design: Hensikten var å undersøke i hvilken grad pasienter med avansert kreft opplever reelt samvalg (Shared Decision-Making) og hvilke barrierer som hemmer medbestemmelse. Studien benyttet et konvergent blandet metodedesign (convergent parallel mixed methods design, Creswell & Plano Clark, 2018).
Kvantitativ komponent: Tverrsnittsundersøkelse av 180 pasienter ved onkologisk poliklinikk ved bruk av det validerte spørreskjemaet CollaboRATE og SDM-Q-9.
Kvalitativ komponent: Semistrukturerte dybdeintervjuer med et strategisk delutvalg på 20 pasienter med ulik grad av rapportert samvalg.
Integrasjon og analyse: Kvantitative deskriptive og multivariate regresjonsanalyser ble integrert med tematisk innholdsanalyse i en felles visningsmatrise (joint display matrix). Studien drøfter eksplisitt diskrepanser der pasienter skåret høyt på standardiserte skjema, men likevel beskrev dyp opplevelse av maktesløshet i dybdeintervjuene.
Etikk og samtykke: Godkjent av REK Midt (#2023/1102) og SIKT.
Finansiering og COI: Kreftforeningen (stipendnr. 21904). Ingen interessekonflikter deklarert.`
  },
  {
    id: 'implementation-cfir',
    title: 'Gundersen et al. (2025) – Implementering av FACT-team i rurale kommuner (CFIR)',
    categoryName: 'Implementeringsstudie',
    expectedType: 'IMPLEMENTATION_QUALITY_IMPROVEMENT',
    description: 'Fler-senters implementeringsstudie strukturert etter CFIR 2.0 (Consolidated Framework for Implementation Research).',
    fileName: 'Gundersen_2025_FACT_Implementation_CFIR.pdf',
    text: `Tittel: Implementering av Fleksibel Aktivt Oppsøkende Behandling (FACT) i spredtbygde distriktskommuner: En kvalitativ prosess- og determinantanalyse basert på CFIR 2.0.
Forfattere: Stian Gundersen, Elisabeth Aas, Berit K. Olsen.
Tidsskrift: Nordic Journal of Health Economics and Implementation Science, 2025;9(1):15-32. DOI: 10.18261/njheis.2025.01.02.

Sammendrag:
Bakgrunn: FACT-modellen er utviklet for tettbygde strøk, og overføring til rurale områder med store reiseavstander skaper særskilte implementeringsbarrierer.
Metodisk rammeverk: Studien benytter Consolidated Framework for Implementation Research (CFIR 2.0, Damschroder et al., 2022) for å kartlegge determinanter over 5 domener: 1) Innovasjonskarakteristika, 2) Ytre kontekst, 3) Indre kontekst, 4) Individkarakteristika, og 5) Implementeringsprosess.
Datainnsamling: 24 semistrukturerte fokusgruppe- og enkeltintervjuer med FACT-ledere, kommuneleger, NAV-veiledere og brukerrepresentanter i 6 pilotkommuner, kombinert med dokumentanalyse av lokale samarbeidsavtaler.
Etiske hensyn og samtykke: Godkjent av SIKT (ref. 719204). Informert samtykke innhentet.
Finansiering: Helsedirektoratets tilskuddsordning for distriktspsykiatri.
Resultater og konklusjon: Studien identifiserer reisetid, ulik IT-infrastruktur og uklare ansvarslinjer mellom spesialist- og primærhelsetjeneste som sentrale barrierer. CFIR-rammeverket muliggjorde presis identifisering av kontekstuelle suksessfaktorer.`
  },
  {
    id: 'cohort-observational-robins',
    title: 'Bergström et al. (2024) – Langtidsoppfølging av biologisk behandling ved leddgikt',
    categoryName: 'Observasjonell Kohort',
    expectedType: 'PRIMARY_QUANT_OBSERVATIONAL',
    description: 'Prospektiv registerbasert kohortstudie med 10 års oppfølging av 3400 pasienter.',
    fileName: 'Bergstrom_2024_RheumatoidArthritis_Cohort.pdf',
    text: `Title: Long-term Risk of Serious Infections in Patients with Rheumatoid Arthritis Treated with Biologic DMARDs versus Targeted Synthetic DMARDs: A 10-Year Prospective Register Cohort Study.
Authors: Johan Bergström, Anna Lindqvist, Stefan H. Holmberg.
Journal: Annals of the Rheumatic Diseases, 2024;83(7):890-899. DOI: 10.1136/ard-2023-225012.

Abstract:
Objectives: To compare the 10-year incidence rate of serious infections requiring hospitalization in patients with rheumatoid arthritis starting TNF inhibitors versus JAK inhibitors in routine clinical practice.
Methods: Prospective multicenter cohort study linking the National Quality Register for Arthritis with National Patient and Prescribed Drug Registries (2014-2024). 3,450 treatment episodes were analyzed.
Confounding control: Propensity score weighting and multivariable Cox proportional hazards regression adjusting for baseline DAS28, age, glucocorticoid dosage, and comorbidities (Charlson Comorbidity Index).
Target Trial Specification: The observational design was framed against a hypothetical pragmatic target trial with explicit specification of assignment, wash-out periods, and intention-to-treat analog follow-up.
Ethics: Approved by the National Ethical Review Authority (#2023-0192).
Funding & COI: Swedish Research Council (#2022-031). Non-restricted register research; authors declare no commercial conflicts.
Results: 320 serious infections occurred over 14,200 person-years. Propensity-adjusted HR was 1.14 (95% CI 0.91-1.42). Loss to follow-up was <2.1%.`
  }
];
