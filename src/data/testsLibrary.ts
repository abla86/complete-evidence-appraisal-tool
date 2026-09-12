import { StatisticalTestInfo } from "../types";

export const testsLibrary: StatisticalTestInfo[] = [
  {
    id: "independent-t-test",
    name: "Independent-Samples T-Test",
    category: "comparison",
    spssMenuPath: "Analyze → Compare Means → Independent-Samples T Test...",
    whenToUse:
      "Når man sammenligner gjennomsnittet i en kontinuerlig variabel mellom to uavhengige grupper (ulike personer i hver gruppe).",
    exampleQuestion:
      "Har intervensjonsgruppen med hjernetrening signifikant høyere kognitiv skår enn kontrollgruppen etter 8 uker?",
    independentVar: "Gruppe (kategorisk/dikotom: f.eks. Intervensjon vs. Kontroll)",
    dependentVar: "Kognitiv skår (kontinuerlig / skala)",
    h0: "H₀: Det er ingen forskjell i gjennomsnittlig kognitiv skår mellom gruppene (μ₁ = μ₂).",
    h1: "H₁: Det er en forskjell i gjennomsnittlig kognitiv skår mellom gruppene (μ₁ ≠ μ₂).",
    assumptions: [
      "Målenivå: Avhengig variabel må være på intervall-/forholds-nivå (kontinuerlig).",
      "Uavhengighet: Observasjonene må være uavhengige (ikke par, søsken eller gjentatte målinger).",
      "Normalfordeling: Den avhengige variabelen bør være tilnærmet normalfordelt i hver av de to gruppene.",
      "Homogenitet av varians (Homoscedastisitet): Variansen i de to gruppene bør være tilnærmet like (testes med Levene's test; hvis p < .05, leses 'Equal variances not assumed' / Welch t-test).",
      "Ingen ekstreme uteliggere (outliers).",
    ],
    nonParametricAlternative: "Mann–Whitney U-test",
    effectSizeMetric: "Cohen's d (liten: 0.20, medium: 0.50, stor: 0.80)",
    apaExample:
      "Det var en statistisk signifikant forskjell i kognitiv skår mellom intervensjonsgruppen (M = 28.10, SD = 1.45) og kontrollgruppen (M = 22.13, SD = 1.85), t(58) = 13.92, p < .001, 95% CI [5.11, 6.83], Cohen's d = 3.60.",
    apaTemplate:
      "Det ble gjennomført en to-utvalgs t-test (independent-samples t-test) for å sammenligne [utfall] mellom [gruppe 1] og [gruppe 2]. Det var en [statistisk signifikant / ikke-signifikant] forskjell, t([df]) = [t], p = [p], 95% CI [[ci_lower], [ci_upper]], d = [d].",
  },
  {
    id: "paired-t-test",
    name: "Paired-Samples T-Test (Paret t-test)",
    category: "comparison",
    spssMenuPath: "Analyze → Compare Means → Paired-Samples T Test...",
    whenToUse:
      "Når man sammenligner gjennomsnittet i to betingelser eller to tidspunkter for de samme personene (f.eks. pre-test og post-test).",
    exampleQuestion:
      "Er det en signifikant endring i deltakernes kognitive funksjon fra før intervensjonen (pre) til etter intervensjonen (post)?",
    independentVar: "Tidspunkt / betingelse (Pre vs. Post, paret måling)",
    dependentVar: "Kognitiv skår målt ved to tidspunkter (kontinuerlig)",
    h0: "H₀: Gjennomsnittlig differanse mellom de to målingene er null (μ_diff = 0).",
    h1: "H₁: Gjennomsnittlig differanse mellom de to målingene er ulik null (μ_diff ≠ 0).",
    assumptions: [
      "Paret design: Hver deltaker har to målinger på samme skala.",
      "Differanseskåren (Post - Pre) må være tilnærmet normalfordelt.",
      "Ingen ekstreme uteliggere blant differansene.",
    ],
    nonParametricAlternative: "Wilcoxon Signed-Rank Test",
    effectSizeMetric: "Cohen's d_z (eller d_av)",
    apaExample:
      "En paret t-test viste en signifikant økning i kognitiv skår fra pre-test (M = 23.40, SD = 1.88) til post-test (M = 28.13, SD = 1.46), t(14) = 11.20, p < .001, 95% CI [3.83, 5.63], d = 2.89.",
    apaTemplate:
      "En paret t-test viste [en signifikant / ingen signifikant] endring fra [tidspunkt 1] (M = [m1], SD = [sd1]) til [tidspunkt 2] (M = [m2], SD = [sd2]), t([df]) = [t], p = [p], 95% CI [[ci_lower], [ci_upper]], d = [d].",
  },
  {
    id: "one-way-anova",
    name: "One-Way ANOVA (Enveis variansanalyse)",
    category: "comparison",
    spssMenuPath: "Analyze → Compare Means → One-Way ANOVA...",
    whenToUse:
      "Når man sammenligner gjennomsnittet i en kontinuerlig variabel på tvers av tre eller flere uavhengige grupper.",
    exampleQuestion:
      "Er det forskjell i smertereduksjon mellom pasienter som mottok Fysioterapi, Kognitiv terapi eller Kombinasjonsbehandling?",
    independentVar: "Behandlingsprogram (kategorisk med 3+ grupper)",
    dependentVar: "Smertereduksjon (kontinuerlig / skala)",
    h0: "H₀: Gjennomsnittene er like i alle gruppene (μ₁ = μ₂ = μ₃).",
    h1: "H₁: Minst ett av gruppegjennomsnittene er signifikant forskjellig fra de andre.",
    assumptions: [
      "Kontinuerlig avhengig variabel.",
      "Uavhengige grupper og observasjoner.",
      "Normalfordelte residualer/feilledd i hver gruppe.",
      "Homogene varianser (Levene's test p > .05; hvis brudd, bruk Welch ANOVA eller Brown-Forsythe).",
      "Post-hoc testing (f.eks. Tukey HSD ved like varianser, Games-Howell ved ulike varianser).",
    ],
    nonParametricAlternative: "Kruskal–Wallis H-test",
    effectSizeMetric: "Eta-squared (η²) eller Partial η² (0.01 liten, 0.06 medium, 0.14 stor)",
    apaExample:
      "En enveis ANOVA viste en statistisk signifikant forskjell i smertereduksjon mellom de tre behandlingsgruppene, F(2, 21) = 28.45, p < .001, η² = .73. Post-hoc analyser med Tukey HSD indikerte at kombinasjonsbehandling ga signifikant større reduksjon enn både fysioterapi og kognitiv terapi (p < .01).",
    apaTemplate:
      "En enveis ANOVA viste [en statistisk signifikant / ingen signifikant] forskjell i [utfall] mellom gruppene, F([df1], [df2]) = [F], p = [p], η² = [eta2].",
  },
  {
    id: "repeated-measures-anova",
    name: "Repeated-Measures ANOVA",
    category: "comparison",
    spssMenuPath: "Analyze → General Linear Model → Repeated Measures...",
    whenToUse:
      "Når de samme deltakerne måles under tre eller flere betingelser eller tidspunkter (longitudinelt design).",
    exampleQuestion:
      "Endrer pasientenes funksjonsnivå seg systematisk fra baseline til 3 måneder, 6 måneder og 12 måneders oppfølging?",
    independentVar: "Tid / gjentatte målinger (3+ tidspunkter)",
    dependentVar: "Funksjonsskår (kontinuerlig)",
    h0: "H₀: Gjennomsnittet er identisk over alle tidspunkter (μ_t1 = μ_t2 = μ_t3).",
    h1: "H₁: Minst to tidspunkter har forskjellige gjennomsnitt.",
    assumptions: [
      "Normalfordeling av differansene mellom alle par av betingelser.",
      "Sfærisitet (Sphericity): Like varianser av differansene mellom alle nivåer. Testes med Mauchly's test. Ved brudd (p < .05) må Greenhouse-Geisser eller Huynh-Feldt korreksjon benyttes.",
    ],
    nonParametricAlternative: "Friedman Test",
    effectSizeMetric: "Partial Eta-squared (partial η²)",
    apaExample:
      "Gjentatte målinger ANOVA viste en signifikant hovedeffekt av tid på funksjon, F(2, 46) = 19.32, p < .001, partial η² = .46, med Greenhouse-Geisser korreksjon (ε = .84).",
    apaTemplate:
      "En repeated-measures ANOVA viste en [signifikant / ikke-signifikant] effekt av tid på [utfall], F([df1], [df2]) = [F], p = [p], partial η² = [p_eta2].",
  },
  {
    id: "mann-whitney-u",
    name: "Mann–Whitney U-Test (Wilcoxon Rank-Sum)",
    category: "nonparametric",
    spssMenuPath: "Analyze → Nonparametric Tests → Independent Samples... (eller Legacy Dialogs → 2 Independent Samples)",
    whenToUse:
      "Ikke-parametrisk alternativ til independent t-test. Brukes når man sammenligner to uavhengige grupper og dataene er ordinale eller har kraftige brudd på normalfordeling.",
    exampleQuestion:
      "Er det forskjell i median opplevd mestringsskår (ordinal/skjevfordelt) mellom to rehabiliteringsgrupper?",
    independentVar: "Gruppe (2 uavhengige kategorier)",
    dependentVar: "Utfall (ordinal eller kontinuerlig med skjev fordeling)",
    h0: "H₀: Fordelingene i de to populasjonene er like (lik median).",
    h1: "H₁: Fordelingene i de to populasjonene er systematisk forskjellige.",
    assumptions: [
      "Uavhengige observasjoner mellom og innad i gruppene.",
      "Ordinalt målenivå eller kontinuerlig variabel.",
      "Hvis fordelingene har lik form, kan testen tolkes som en test på forskjell i medianer.",
    ],
    effectSizeMetric: "r = z / √N (0.10 liten, 0.30 medium, 0.50 stor)",
    apaExample:
      "En Mann–Whitney U-test viste en signifikant forskjell i skår mellom intervensjonsgruppen (Mdn = 29.0) og kontrollgruppen (Mdn = 22.0), U = 4.50, z = -4.51, p < .001, r = .58.",
    apaTemplate:
      "En Mann–Whitney U-test viste [en signifikant / ingen signifikant] forskjell mellom [gruppe 1] (Mdn = [mdn1]) og [gruppe 2] (Mdn = [mdn2]), U = [u], z = [z], p = [p], r = [r].",
  },
  {
    id: "wilcoxon-signed-rank",
    name: "Wilcoxon Signed-Rank Test",
    category: "nonparametric",
    spssMenuPath: "Analyze → Nonparametric Tests → Related Samples... (eller Legacy Dialogs → 2 Related Samples)",
    whenToUse:
      "Ikke-parametrisk alternativ til paret t-test. Sammenligner to parede målinger når differansene ikke er normalfordelt eller dataene er ordinale.",
    exampleQuestion:
      "Er det forskjell i smerteopplevelse (VAS, 0–10) før og etter akupunkturbehandling hos samme pasienter?",
    independentVar: "Tidspunkt / betingelse (Paret)",
    dependentVar: "Ordinal eller skjev kontinuerlig differanse",
    h0: "H₀: Median differanse mellom de to parede målingene er null.",
    h1: "H₁: Median differanse er ulik null.",
    assumptions: ["Paret design.", "Ordinalt eller kontinuerlig målenivå."],
    effectSizeMetric: "r = z / √N",
    apaExample:
      "En Wilcoxon signed-rank test indikerte en signifikant reduksjon i smerte fra pre-test (Mdn = 7.0) til post-test (Mdn = 3.5), T = 12.0, z = -3.89, p < .001, r = .55.",
    apaTemplate:
      "En Wilcoxon signed-rank test viste [en statistisk signifikant / ingen signifikant] endring fra [pre] (Mdn = [m1]) til [post] (Mdn = [m2]), z = [z], p = [p], r = [r].",
  },
  {
    id: "kruskal-wallis",
    name: "Kruskal–Wallis H-Test",
    category: "nonparametric",
    spssMenuPath: "Analyze → Nonparametric Tests → Legacy Dialogs → K Independent Samples...",
    whenToUse:
      "Ikke-parametrisk alternativ til enveis ANOVA for 3 eller flere uavhengige grupper.",
    exampleQuestion:
      "Er det forskjell i tilfredshetsskår (1–5 Likert) mellom pasienter ved tre ulike sykehusavdelinger?",
    independentVar: "Sykehusavdeling (3+ grupper)",
    dependentVar: "Tilfredshet (ordinal)",
    h0: "H₀: Medianene i alle populasjonene er like.",
    h1: "H₁: Minst to grupper skiller seg fra hverandre i rangering.",
    assumptions: ["Uavhengige grupper.", "Ordinalt eller kontinuerlig utfall."],
    effectSizeMetric: "Epsilon-squared (ε²) eller η²_H",
    apaExample:
      "En Kruskal–Wallis test viste en signifikant forskjell i rangering på tvers av de tre avdelingene, H(2) = 14.82, p < .001.",
    apaTemplate:
      "En Kruskal–Wallis H-test viste [en signifikant / ingen signifikant] forskjell i [utfall] mellom de [k] gruppene, H([df]) = [H], p = [p].",
  },
  {
    id: "pearson-correlation",
    name: "Pearson Korrelasjon (r)",
    category: "correlation",
    spssMenuPath: "Analyze → Correlate → Bivariate... (Velg Pearson)",
    whenToUse:
      "Når man vil undersøke styrken og retningen på en lineær sammenheng mellom to kontinuerlige variabler.",
    exampleQuestion:
      "Er det en sammenheng mellom deltakernes alder og deres baseline kognitive skår?",
    independentVar: "Variabel X (kontinuerlig)",
    dependentVar: "Variabel Y (kontinuerlig)",
    h0: "H₀: Populasjonskorrelasjonen er null (ρ = 0).",
    h1: "H₁: Populasjonskorrelasjonen er ulik null (ρ ≠ 0).",
    assumptions: [
      "Begge variabler er kontinuerlige (skala).",
      "Lineær sammenheng (inspiser scatterplot).",
      "Bivariat normalfordeling (begge variabler omtrent normalfordelte).",
      "Homoscedastisitet (jevn spredning langs regresjonslinjen).",
      "Fravær av ekstreme bivariate uteliggere.",
    ],
    nonParametricAlternative: "Spearman rank korrelasjon (rho)",
    effectSizeMetric: "Pearson's r og r² (forklart varians)",
    apaExample:
      "Det var en sterk, negativ og statistisk signifikant korrelasjon mellom alder og kognitiv skår, r(28) = -.68, p < .001, 95% CI [-.84, -.42], r² = .46 (46% delt varians).",
    apaTemplate:
      "Det ble funnet en [positiv / negativ], [statistisk signifikant / ikke-signifikant] korrelasjon mellom [var1] og [var2], r([df]) = [r], p = [p], 95% CI [[ci_lower], [ci_upper]], r² = [r2].",
  },
  {
    id: "spearman-correlation",
    name: "Spearman Rank Korrelasjon (rho / r_s)",
    category: "correlation",
    spssMenuPath: "Analyze → Correlate → Bivariate... (Kryss av for Spearman)",
    whenToUse:
      "Undersøker monoton sammenheng mellom to variabler når minst én er ordinal eller fordelingen er skjev.",
    exampleQuestion:
      "Er det sammenheng mellom opplevd arbeidspress (rangering 1–5) og antall stressymptomer?",
    independentVar: "Variabel 1 (ordinal eller kontinuerlig)",
    dependentVar: "Variabel 2 (ordinal eller kontinuerlig)",
    h0: "H₀: Populasjonens Spearman-korrelasjon er null (ρ_s = 0).",
    h1: "H₁: Monoton sammenheng eksisterer (ρ_s ≠ 0).",
    assumptions: ["Monotont forhold.", "Ordinalt eller kontinuerlig målenivå."],
    effectSizeMetric: "Spearman's rho (r_s)",
    apaExample:
      "En Spearman korrelasjon viste en moderat positiv sammenheng mellom arbeidspress og utbrenthet, r_s(23) = .62, p = .001.",
    apaTemplate:
      "En Spearman rank-korrelasjon viste en [positiv / negativ] sammenheng mellom [var1] og [var2], r_s([df]) = [r_s], p = [p].",
  },
  {
    id: "chi-square",
    name: "Chi-Square Test of Independence (Kji-kvadrattest)",
    category: "correlation",
    spssMenuPath: "Analyze → Descriptive Statistics → Crosstabs... (Klikk Statistics → Chi-square)",
    whenToUse:
      "Når man vil undersøke om det er en statistisk signifikant sammenheng mellom to kategoriske variabler i en krysstabell.",
    exampleQuestion:
      "Er det forskjell i andelen som fullfører behandlingen (Fullført / Falt fra) mellom kvinner og menn?",
    independentVar: "Kjønn (kategorisk)",
    dependentVar: "Fullføring (kategorisk: Ja / Nei)",
    h0: "H₀: Variablene er uavhengige i populasjonen.",
    h1: "H₁: Variablene er assosierte (avhengige).",
    assumptions: [
      "Uavhengige observasjoner (hver deltaker kun i én celle).",
      "Forventede frekvenser (Expected counts): Minimum 80% av cellene må ha forventet frekvens ≥ 5, og ingen celler < 1. (Ved 2x2 tabell med lave tall, bruk Fisher's Exact Test).",
    ],
    effectSizeMetric: "Phi (φ for 2x2) eller Cramer's V (for større tabeller)",
    apaExample:
      "En kji-kvadrattest viste ingen signifikant sammenheng mellom kjønn og fullføringsgrad, χ²(1, N = 60) = 0.85, p = .357, Cramer's V = .12.",
    apaTemplate:
      "En kji-kvadrattest for uavhengighet viste [en statistisk signifikant / ingen signifikant] sammenheng mellom [var1] og [var2], χ²([df], N = [N]) = [chi2], p = [p], V = [V].",
  },
  {
    id: "linear-regression",
    name: "Linear / Multiple Regression (Lineær regresjon)",
    category: "regression",
    spssMenuPath: "Analyze → Regression → Linear...",
    whenToUse:
      "Når man vil predikere en kontinuerlig utfallsvariabel basert på én eller flere prediktorvariabler, samt vurdere forklart varians (R²).",
    exampleQuestion:
      "Hvor godt kan kognitiv post-skår predikeres ut fra deltakernes alder, baseline-skår og treningsetterlevelse?",
    independentVar: "Alder, Baseline-skår, Etterlevelse (kontinuerlige eller dummy-kodede)",
    dependentVar: "Post-kognitiv skår (kontinuerlig skala)",
    h0: "H₀: Regresjonsmodellen forklarer ingen varians i populasjonen (R² = 0). Alle koeffisienter β_i = 0.",
    h1: "H₁: Modellen forklarer en signifikant andel av variansen (R² > 0).",
    assumptions: [
      "Lineært forhold mellom prediktorer og utfall.",
      "Homoskedastisitet (konstant varians av residualene).",
      "Normalfordelte residualer (P-P plot eller histogram av standardiserte residualer).",
      "Ingen multikollinearitet mellom prediktorer: VIF < 5 (eller 10), Toleranse > 0.10.",
      "Uavhengige residualer (Durbin-Watson verdi nær 2.0, mellom 1.5 og 2.5).",
      "Ingen innflytelsesrike ekstremverdier (Cook's distance < 1.0).",
    ],
    effectSizeMetric: "R² (forklart varians) og Justert R²",
    apaExample:
      "Multippel lineær regresjon viste at modellen forklarte en signifikant andel av variansen i kognitiv post-skår, F(3, 56) = 24.18, p < .001, R² = .56, justert R² = .54. Etterlevelse var den sterkeste unike prediktoren (β = .48, p < .001).",
    apaTemplate:
      "En multippel regresjonsanalyse viste at prediktorene samlet forklarte en [signifikant / ikke-signifikant] andel av variansen i [utfall], F([df1], [df2]) = [F], p = [p], R² = [R2], justert R² = [adjR2].",
  },
  {
    id: "cronbach-alpha",
    name: "Cronbach's Alpha (Reliabilitetsanalyse)",
    category: "psychometrics",
    spssMenuPath: "Analyze → Scale → Reliability Analysis...",
    whenToUse:
      "Når man vil undersøke den indre konsistensen (intern reliabilitet) til en sammensatt psykometrisk skala eller et spørreskjema med flere ledd/items.",
    exampleQuestion:
      "Har den 5-leddede skalaen for opplevd arbeidsstress tilfredsstillende indre konsistens?",
    independentVar: "5 spørreskjemaledd (Likert 1–5)",
    dependentVar: "Skalaens samlede latente konstrukt",
    h0: "Ikke en formell nullhypotesetest, men en estimering av målenøyaktighet.",
    h1: "Tommelfingerregel: Alpha ≥ .70 regnes som akseptabelt, ≥ .80 som godt, ≥ .90 som utmerket.",
    assumptions: [
      "Unidimensionalitet: Alle leddene måler samme underliggende konstrukt.",
      "Alle ledd er skalert i samme retning (reverser eventuelle reverserte ledd før analyse).",
      "Målenivå minst ordinalt/intervall.",
    ],
    effectSizeMetric: "Cronbach's α koeffisient (0 til 1)",
    apaExample:
      "Skalaen for arbeidsrelatert stress demonstrerte høy intern konsistens i utvalget, Cronbach's α = .88 (5 ledd, N = 25). Sletting av enkelte ledd ville ikke forbedret reliabiliteten signifikant.",
    apaTemplate:
      "Reliabilitetsanalysen av [skala-navn] viste en [akseptabel / god / utmerket] intern konsistens med Cronbach's α = [alpha] på tvers av [k] ledd (N = [N]).",
  },
  {
    id: "ancova",
    name: "ANCOVA (Kovariansanalyse)",
    category: "advanced",
    spssMenuPath: "Analyze → General Linear Model → Univariate... (Legg kovariat i Covariate(s))",
    whenToUse:
      "Når man sammenligner gjennomsnitt mellom to eller flere grupper, men ønsker å statistisk kontrollere for en kontinuerlig forstyrrende variabel (kovariat, f.eks. alder eller baseline-skår).",
    exampleQuestion:
      "Er det forskjell i kognitiv post-skår mellom intervensjonsgruppe og kontrollgruppe når vi justerer for baseline-skår (pre-skår)?",
    independentVar: "Gruppe (kategorisk) + Kovariat (kontinuerlig, f.eks. Pre_Kognitiv)",
    dependentVar: "Post_Kognitiv (kontinuerlig)",
    h0: "H₀: Det er ingen forskjell i justerte gjennomsnitt mellom gruppene.",
    h1: "H₁: Minst én gruppe skiller seg ut etter justering for kovariaten.",
    assumptions: [
      "Alle forutsetninger for ANOVA (normalitet, varianshomogenitet).",
      "Linearitet mellom kovariaten og den avhengige variabelen.",
      "Homogenitet av regresjonsstigninger (Homogeneity of regression slopes): Interaksjonen mellom gruppe og kovariat må IKKE være signifikant (p > .05).",
      "Kovariaten måles uavhengig av behandlingen.",
    ],
    effectSizeMetric: "Partial Eta-squared (partial η²)",
    apaExample:
      "En enveis ANCOVA viste en signifikant effekt av intervensjon på post-kognitiv skår etter kontroll for baseline-skår, F(1, 57) = 48.12, p < .001, partial η² = .46.",
    apaTemplate:
      "En ANCOVA viste en [signifikant / ikke-signifikant] forskjell i [utfall] mellom gruppene etter kontroll for [kovariat], F([df1], [df2]) = [F], p = [p], partial η² = [p_eta2].",
  },
  {
    id: "logistic-regression",
    name: "Binary Logistic Regression (Logistisk regresjon)",
    category: "regression",
    spssMenuPath: "Analyze → Regression → Binary Logistic...",
    whenToUse:
      "Når man vil predikere sannsynligheten for et todelt/dikotomt utfall (f.eks. Frisk / Syk, Bestått / Strøket, Falt fra / Fullført) basert på kontinuerlige eller kategoriske prediktorer.",
    exampleQuestion:
      "Hvilke faktorer (alder, etterlevelse, kjønn) predikerer om en pasient oppnår klinisk meningsfull bedring (Ja/Nei)?",
    independentVar: "Alder, Etterlevelse, Kjønn",
    dependentVar: "Klinisk respons (Dikotom: 0 = Nei, 1 = Ja)",
    h0: "H₀: Ingen av prediktorene påvirker oddsene for utfallet (alle Odds Ratios = 1.0).",
    h1: "H₁: Minst én prediktor endrer oddsene for utfallet signifikant.",
    assumptions: [
      "Dikotom avhengig variabel.",
      "Uavhengige observasjoner.",
      "Linearitet i logit (Box-Tidwell test for kontinuerlige prediktorer).",
      "Ingen multikollinearitet.",
      "Tilstrekkelig utvalgsstørrelse (minst 10–15 hendelser per prediktor).",
    ],
    effectSizeMetric: "Odds Ratio (Exp(B)) og Nagelkerke Pseudo R²",
    apaExample:
      "Binær logistisk regresjon viste at høyere etterlevelse signifikant økte oddsen for klinisk bedring, OR = 1.08, 95% CI [1.03, 1.14], p = .003. Nagelkerke R² var .38.",
    apaTemplate:
      "Logistisk regresjonsanalyse indikerte at [prediktor] var en [signifikant / ikke-signifikant] prediktor for [utfall], OR = [or], 95% CI [[ci_l], [ci_u]], p = [p].",
  },
];
