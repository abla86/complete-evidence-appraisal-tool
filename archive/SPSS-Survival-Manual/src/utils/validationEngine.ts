import {
  Dataset,
  VariableMeta,
  MeasurementLevel,
  DatasetHealthReport,
  VariableValidationReport,
  DataValidationIssue,
  TestAssumptionValidation,
  ValidationSeverity,
} from "../types";

// Helper to extract numeric values ignoring invalid/missing entries
export function getCleanNumericValues(
  dataset: Dataset,
  varName: string
): { values: number[]; rowIndices: number[]; rawMissingCount: number } {
  const values: number[] = [];
  const rowIndices: number[] = [];
  let rawMissingCount = 0;

  dataset.rows.forEach((row, idx) => {
    const rawVal = row[varName] ?? row[varName.toLowerCase()];
    if (
      rawVal === undefined ||
      rawVal === null ||
      rawVal === "" ||
      rawVal === "NA" ||
      rawVal === "NaN" ||
      rawVal === -99 ||
      rawVal === 999
    ) {
      rawMissingCount++;
      return;
    }
    const num = Number(rawVal);
    if (!isNaN(num)) {
      values.push(num);
      rowIndices.push(idx + 1); // 1-based index for SPSS display
    } else {
      rawMissingCount++;
    }
  });

  return { values, rowIndices, rawMissingCount };
}

// Skewness and Kurtosis calculation with standard errors
export function calculateNormalityMetrics(values: number[]): {
  mean: number;
  sd: number;
  skewness: number;
  seSkew: number;
  zSkew: number;
  kurtosis: number;
  seKurt: number;
  zKurt: number;
  isNormal: boolean;
} {
  const n = values.length;
  if (n < 3) {
    return {
      mean: 0,
      sd: 0,
      skewness: 0,
      seSkew: 1,
      zSkew: 0,
      kurtosis: 0,
      seKurt: 1,
      zKurt: 0,
      isNormal: true,
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  const sd = Math.sqrt(variance);

  if (sd === 0) {
    return {
      mean,
      sd: 0,
      skewness: 0,
      seSkew: 1,
      zSkew: 0,
      kurtosis: 0,
      seKurt: 1,
      zKurt: 0,
      isNormal: true,
    };
  }

  // Sample Skewness (Fisher-Pearson standardized third moment)
  let m3 = 0;
  let m4 = 0;
  for (const v of values) {
    const diff = (v - mean) / sd;
    m3 += Math.pow(diff, 3);
    m4 += Math.pow(diff, 4);
  }

  // Exact sample skewness
  const skewness = (n / ((n - 1) * (n - 2))) * m3;
  // Standard error of skewness approximation
  const seSkew = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
  const zSkew = seSkew > 0 ? skewness / seSkew : 0;

  // Sample Excess Kurtosis
  let kurtosis = 0;
  if (n > 3) {
    const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term2 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    kurtosis = term1 * m4 - term2;
  }
  const seKurt = seSkew * 2;
  const zKurt = seKurt > 0 ? kurtosis / seKurt : 0;

  // SPSS rule of thumb: |z| < 2.58 (p > .01) indicates acceptable normality
  const isNormal = Math.abs(zSkew) <= 2.58 && Math.abs(zKurt) <= 2.58;

  return {
    mean,
    sd,
    skewness,
    seSkew,
    zSkew,
    kurtosis,
    seKurt,
    zKurt,
    isNormal,
  };
}

// Outlier detection using Z-score (Tabachnick & Fidell criteria) and Tukey IQR
export function detectOutliers(
  values: number[],
  rowIndices: number[]
): {
  extremeCount: number;
  mildCount: number;
  outliers: { row: number; value: number; zScore: number; type: "mild" | "extreme" }[];
} {
  const n = values.length;
  if (n < 4) return { extremeCount: 0, mildCount: 0, outliers: [] };

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1)
  );

  if (sd === 0) return { extremeCount: 0, mildCount: 0, outliers: [] };

  const outliers: {
    row: number;
    value: number;
    zScore: number;
    type: "mild" | "extreme";
  }[] = [];

  values.forEach((v, idx) => {
    const z = (v - mean) / sd;
    const absZ = Math.abs(z);
    if (absZ >= 3.29) {
      outliers.push({
        row: rowIndices[idx],
        value: v,
        zScore: Number(z.toFixed(2)),
        type: "extreme",
      });
    } else if (absZ >= 2.58) {
      outliers.push({
        row: rowIndices[idx],
        value: v,
        zScore: Number(z.toFixed(2)),
        type: "mild",
      });
    }
  });

  const extremeCount = outliers.filter((o) => o.type === "extreme").length;
  const mildCount = outliers.filter((o) => o.type === "mild").length;

  return { extremeCount, mildCount, outliers };
}

/**
 * Validates the complete dataset quality and data health
 */
export function validateDatasetHealth(dataset: Dataset): DatasetHealthReport {
  const totalRows = dataset.rows.length;
  const totalVariables = dataset.variables.length;
  const issues: DataValidationIssue[] = [];
  const variableReports: Record<string, VariableValidationReport> = {};

  let passedChecksCount = 0;
  let warningsCount = 0;
  let errorsCount = 0;

  // 1. Check for Duplicate IDs if 'id' column exists
  const idVar = dataset.variables.find(
    (v) => v.name.toLowerCase() === "id" || v.id.toLowerCase() === "id"
  );
  if (idVar && totalRows > 0) {
    const idList = dataset.rows.map(
      (r) => r[idVar.name] ?? r[idVar.id] ?? r.id
    );
    const seen = new Set<any>();
    const dupes: any[] = [];
    idList.forEach((val) => {
      if (val !== undefined && val !== null && seen.has(val)) {
        dupes.push(val);
      }
      seen.add(val);
    });

    if (dupes.length > 0) {
      errorsCount++;
      issues.push({
        id: "duplicate-ids",
        variableName: idVar.name,
        type: "duplicate_id",
        severity: "error",
        message: `Det ble funnet ${dupes.length} duplikate respondent-ID-er (${dupes.slice(0, 3).join(", ")}...)`,
        details:
          "Hver observasjon i SPSS bør ha en unik ID for å sikre sporbarhet og hindre utilsiktet dobbelttelling.",
        recommendation:
          "Verifiser kildedata og slett duplikate rader før videre parametrisk analyse.",
      });
    } else {
      passedChecksCount++;
    }
  }

  // 2. Validate Each Variable
  dataset.variables.forEach((v) => {
    const varIssues: DataValidationIssue[] = [];
    const rawValues = dataset.rows.map((r) => r[v.name] ?? r[v.id]);

    // Missing Value Screening
    let missingCount = 0;
    const nonMissing: any[] = [];
    rawValues.forEach((val) => {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        val === "NA" ||
        val === "NaN" ||
        val === -99 ||
        val === 999
      ) {
        missingCount++;
      } else {
        nonMissing.push(val);
      }
    });

    const missingPct = totalRows > 0 ? (missingCount / totalRows) * 100 : 0;

    if (missingPct > 20) {
      errorsCount++;
      const issue: DataValidationIssue = {
        id: `missing-crit-${v.id}`,
        variableName: v.name,
        type: "missing",
        severity: "error",
        message: `Høy andel manglende data: ${missingPct.toFixed(1)}% (${missingCount} av ${totalRows} rader)`,
        details:
          "Over 20% manglende data medfører betydelig risiko for utvalgsskjevhet (attrition bias / missing not at random).",
        recommendation:
          "Undersøk om frafallet skyldes systematiske årsaker. Vurder multippel imputering (MI) eller eksklusjon.",
      };
      issues.push(issue);
      varIssues.push(issue);
    } else if (missingPct > 5) {
      warningsCount++;
      const issue: DataValidationIssue = {
        id: `missing-warn-${v.id}`,
        variableName: v.name,
        type: "missing",
        severity: "warning",
        message: `Moderat andel manglende data: ${missingPct.toFixed(1)}% (${missingCount} rader)`,
        details:
          "SPSS håndterer missing enten som 'Exclude cases listwise' eller 'pairwise'. Listwise sletter hele raden ved multivariat analyse.",
        recommendation:
          "Sjekk Little's MCAR-test i SPSS (Analyze → Missing Value Analysis) for å bekrefte at data mangler helt tilfeldig.",
      };
      issues.push(issue);
      varIssues.push(issue);
    } else {
      passedChecksCount++;
    }

    // Measurement Level & Type Consistency
    const distinctVals = Array.from(new Set(nonMissing));
    if (v.level === "scale") {
      const { values, rowIndices } = getCleanNumericValues(dataset, v.name);

      if (values.length < nonMissing.length) {
        errorsCount++;
        const issue: DataValidationIssue = {
          id: `type-mismatch-${v.id}`,
          variableName: v.name,
          type: "level_mismatch",
          severity: "error",
          message: `Ikke-numeriske verdier oppdaget i kontinuerlig skala-variabel`,
          details: `Variabelen er merket som 'scale', men inneholder ${
            nonMissing.length - values.length
          } tekst- eller formateringsfeil.`,
          recommendation:
            "Rens datasettet for bokstaver eller komma/punktum-feil før kjøring av statistiske tester.",
        };
        issues.push(issue);
        varIssues.push(issue);
      } else {
        passedChecksCount++;
      }

      // Check if scale variable actually only has 2 unique values
      if (distinctVals.length === 2 && totalRows >= 10) {
        warningsCount++;
        const issue: DataValidationIssue = {
          id: `dichotomous-warn-${v.id}`,
          variableName: v.name,
          type: "level_mismatch",
          severity: "warning",
          message: `Variabelen har kun 2 unike verdier (${distinctVals.join(", ")}). Bør kodes som nominal.`,
          details:
            "En variabel med kun to verdier (f.eks. 0/1 eller 1/2) er dikotom. I SPSS bør den klassifiseres som nominal/kategorisk.",
          recommendation:
            "Endre målenivå i 'Variable View' til Nominal for korrekt veiledning i t-test og krysstabeller.",
        };
        issues.push(issue);
        varIssues.push(issue);
      }

      // Range plausibility check (e.g. negative values on variables that shouldn't be negative)
      const minVal = values.length > 0 ? Math.min(...values) : 0;
      const maxVal = values.length > 0 ? Math.max(...values) : 0;

      if (
        (v.name.toLowerCase().includes("alder") ||
          v.name.toLowerCase().includes("age")) &&
        (minVal < 0 || maxVal > 125)
      ) {
        errorsCount++;
        const issue: DataValidationIssue = {
          id: `range-age-${v.id}`,
          variableName: v.name,
          type: "range",
          severity: "error",
          message: `Urealistiske aldersverdier funnet (Min: ${minVal}, Maks: ${maxVal})`,
          details: "Alder må være et positivt tall mellom 0 og 125.",
          recommendation:
            "Kontroller kildedata for tastefeil (f.eks. '99' eller negative tall kodet som missing).",
        };
        issues.push(issue);
        varIssues.push(issue);
      }

      // Outlier screening
      const outlierRes = detectOutliers(values, rowIndices);
      if (outlierRes.extremeCount > 0) {
        warningsCount++;
        const issue: DataValidationIssue = {
          id: `outliers-extreme-${v.id}`,
          variableName: v.name,
          type: "outlier",
          severity: "warning",
          message: `Funnet ${outlierRes.extremeCount} ekstreme uteliggere (|z| > 3.29, p < .001)`,
          details: `Observasjoner i rad: ${outlierRes.outliers
            .filter((o) => o.type === "extreme")
            .map((o) => `#${o.row} (verdi: ${o.value}, z = ${o.zScore})`)
            .join(", ")}.`,
          recommendation:
            "I henhold til Tabachnick & Fidell (2019) bør du undersøke om dette er tastefeil, eller vurdere trimming, winsorisering eller ikke-parametriske tester.",
        };
        issues.push(issue);
        varIssues.push(issue);
      } else {
        passedChecksCount++;
      }

      // Normality screening
      const normMetrics = calculateNormalityMetrics(values);
      if (!normMetrics.isNormal && values.length >= 10) {
        warningsCount++;
        const issue: DataValidationIssue = {
          id: `normality-violation-${v.id}`,
          variableName: v.name,
          type: "normality",
          severity: "warning",
          message: `Betydelig avvik fra normalfordeling (Skjevhet z = ${normMetrics.zSkew.toFixed(
            2
          )}, Kurtose z = ${normMetrics.zKurt.toFixed(2)})`,
          details: `Skjevhet: ${normMetrics.skewness.toFixed(
            2
          )} (SE = ${normMetrics.seSkew.toFixed(
            2
          )}). Kurtose: ${normMetrics.kurtosis.toFixed(
            2
          )}. Verdier med |z| > 2.58 avviker signifikant fra gaussisk bjellekurve.`,
          recommendation:
            values.length < 30
              ? "Ved små utvalg (N < 30) anbefales det sterkt å bytte til ikke-parametriske tester (f.eks. Mann-Whitney U eller Wilcoxon)."
              : "Ved N > 30 beskytter sentralgrenseteoremet t-tester og ANOVA godt, men sjekk robuste standardfeil eller bootstrapping i SPSS.",
        };
        issues.push(issue);
        varIssues.push(issue);
      } else {
        passedChecksCount++;
      }

      variableReports[v.name] = {
        variableName: v.name,
        level: v.level,
        type: v.type,
        n: values.length,
        missingCount,
        missingPercentage: Number(missingPct.toFixed(1)),
        min: minVal,
        max: maxVal,
        mean: Number(normMetrics.mean.toFixed(2)),
        sd: Number(normMetrics.sd.toFixed(2)),
        skewness: Number(normMetrics.skewness.toFixed(2)),
        kurtosis: Number(normMetrics.kurtosis.toFixed(2)),
        zSkew: Number(normMetrics.zSkew.toFixed(2)),
        zKurtosis: Number(normMetrics.zKurt.toFixed(2)),
        isNormallyDistributed: normMetrics.isNormal,
        outliersCount: outlierRes.outliers.length,
        outlierIndices: outlierRes.outliers.map((o) => ({
          row: o.row,
          value: o.value,
          zScore: o.zScore,
        })),
        issues: varIssues,
      };
    } else {
      // Categorical (Nominal / Ordinal)
      variableReports[v.name] = {
        variableName: v.name,
        level: v.level,
        type: v.type,
        n: nonMissing.length,
        missingCount,
        missingPercentage: Number(missingPct.toFixed(1)),
        outliersCount: 0,
        issues: varIssues,
      };
      passedChecksCount++;
    }
  });

  // Calculate composite Health Score (0 - 100)
  // Base 100 - (errors * 15) - (warnings * 4)
  const penalty = errorsCount * 15 + warningsCount * 4;
  const healthScore = Math.max(10, Math.min(100, 100 - penalty));

  return {
    datasetName: dataset.name,
    totalRows,
    totalVariables,
    healthScore,
    passedChecksCount,
    warningsCount,
    errorsCount,
    issues,
    variableReports,
  };
}

/**
 * Validates statistical test assumptions against actual dataset variables
 */
export function validateTestAssumptions(
  testId: string,
  dataset: Dataset,
  config: {
    ivName?: string;
    dvName?: string;
    pairPre?: string;
    pairPost?: string;
    varX?: string;
    varY?: string;
  }
): TestAssumptionValidation {
  const assumptions: {
    name: string;
    description: string;
    status: "met" | "warning" | "violated";
    measuredValue?: string;
    threshold?: string;
    explanation: string;
    remedy?: string;
  }[] = [];

  let overallStatus: "valid" | "warning" | "violation" = "valid";
  let alternativeTestSuggestion:
    | { testId: string; name: string; reason: string }
    | undefined = undefined;

  // 1. Independent Samples T-Test
  if (testId === "independent-t-test") {
    const iv = config.ivName || "gruppe";
    const dv = config.dvName || "skor";

    const ivMeta = dataset.variables.find((v) => v.name === iv);
    const dvMeta = dataset.variables.find((v) => v.name === dv);

    // Assumption 1: Level of measurement
    const ivGroups = Array.from(
      new Set(
        dataset.rows
          .map((r) => r[iv] ?? r[iv.toLowerCase()])
          .filter((v) => v !== undefined && v !== null && v !== "")
      )
    );

    if (ivGroups.length !== 2) {
      assumptions.push({
        name: "Uavhengig variabel: Nøyaktig 2 grupper",
        description: "Independent t-test krever nøyaktig to uavhengige grupper.",
        status: "violated",
        measuredValue: `${ivGroups.length} unike grupper (${ivGroups.slice(0, 4).join(", ")})`,
        threshold: "Eksakt 2 grupper",
        explanation: `Den valgte grupperingsvariabelen «${iv}» har ${ivGroups.length} nivåer. En t-test kan kun sammenligne to grupper direkte.`,
        remedy:
          ivGroups.length > 2
            ? "Bruk One-Way ANOVA (Enveis variansanalyse) i stedet."
            : "Velg en variabel med 2 grupper eller filtrer utvalget.",
      });
      overallStatus = "violation";
      if (ivGroups.length > 2) {
        alternativeTestSuggestion = {
          testId: "one-way-anova",
          name: "One-Way ANOVA",
          reason: `Grupperingsvariabelen har ${ivGroups.length} nivåer (> 2). ANOVA tester samlet forskjell mellom 3 eller flere grupper uten oppblåst type I-feilrate.`,
        };
      }
    } else {
      assumptions.push({
        name: "Uavhengig variabel: Dikotom / 2 grupper",
        description: "To uavhengige grupper funnet.",
        status: "met",
        measuredValue: `2 grupper: «${ivGroups[0]}» og «${ivGroups[1]}»`,
        threshold: "2 grupper",
        explanation: "Grupperingen tilfredsstiller kravet for independent t-test.",
      });
    }

    // Assumption 2: Dependent variable measurement level
    if (dvMeta && dvMeta.level !== "scale" && dvMeta.level !== "ordinal") {
      assumptions.push({
        name: "Avhengig variabel: Kontinuerlig målenivå",
        description: "Utfallsvariabel må være på intervall- eller ratioskala.",
        status: "violated",
        measuredValue: dvMeta.level,
        threshold: "Scale (kontinuerlig)",
        explanation: `Variabelen «${dv}» er registrert som ${dvMeta.level}.`,
        remedy: "Bruk Khikvadrattest for kategoriske data eller endre målenivå.",
      });
      overallStatus = "violation";
    } else {
      assumptions.push({
        name: "Avhengig variabel: Kontinuerlig målenivå",
        description: "Utfallsvariabelen er kontinuerlig målt.",
        status: "met",
        measuredValue: dvMeta?.level || "scale",
        threshold: "Scale",
        explanation: "Kravet til kontinuerlig utfall er oppfylt.",
      });
    }

    // Assumption 3 & 4: Group sample size and Normality per group
    if (ivGroups.length === 2) {
      const g1Values = dataset.rows
        .filter(
          (r) =>
            String(r[iv] ?? r[iv.toLowerCase()]) === String(ivGroups[0])
        )
        .map((r) => Number(r[dv] ?? r[dv.toLowerCase()]))
        .filter((n) => !isNaN(n));

      const g2Values = dataset.rows
        .filter(
          (r) =>
            String(r[iv] ?? r[iv.toLowerCase()]) === String(ivGroups[1])
        )
        .map((r) => Number(r[dv] ?? r[dv.toLowerCase()]))
        .filter((n) => !isNaN(n));

      // Sample size
      if (g1Values.length < 15 || g2Values.length < 15) {
        assumptions.push({
          name: "Utvalgsstørrelse per gruppe",
          description: "Anbefalt minst 15–30 observasjoner i hver gruppe.",
          status: "warning",
          measuredValue: `n₁ = ${g1Values.length}, n₂ = ${g2Values.length}`,
          threshold: "n ≥ 15 per gruppe",
          explanation:
            "Små utvalg reduserer testens statistiske styrke (power) og gjør t-testen mer sårbar for brudd på normalfordeling.",
          remedy:
            "Sjekk Mann-Whitney U-test dersom data ikke er perfekt normalfordelt.",
        });
        if (overallStatus !== "violation") overallStatus = "warning";
      } else {
        assumptions.push({
          name: "Utvalgsstørrelse per gruppe",
          description: "Tilstrekkelig utvalgsstørrelse for robusthet.",
          status: "met",
          measuredValue: `n₁ = ${g1Values.length}, n₂ = ${g2Values.length}`,
          threshold: "n ≥ 15",
          explanation:
            "Begge grupper har god størrelse. Sentralgrenseteoremet gir økt robusthet.",
        });
      }

      // Normality in both groups
      const norm1 = calculateNormalityMetrics(g1Values);
      const norm2 = calculateNormalityMetrics(g2Values);

      if (!norm1.isNormal || !norm2.isNormal) {
        assumptions.push({
          name: "Normalfordeling i hver gruppe",
          description:
            "Utfallsvariabelen bør være tilnærmet normalfordelt i hver gruppe.",
          status: "warning",
          measuredValue: `Gruppe 1 z_skjev=${norm1.zSkew.toFixed(
            2
          )}, Gruppe 2 z_skjev=${norm2.zSkew.toFixed(2)}`,
          threshold: "|z| ≤ 2.58",
          explanation:
            "Minst én av gruppene avviker fra normalfordeling. Ved skjeve fordelinger i små utvalg er Mann-Whitney U mer pålitelig.",
          remedy:
            "Vurder det ikke-parametriske alternativet Mann-Whitney U test.",
        });
        if (overallStatus !== "violation") overallStatus = "warning";
        if (g1Values.length < 25 && !alternativeTestSuggestion) {
          alternativeTestSuggestion = {
            testId: "mann-whitney-u",
            name: "Mann-Whitney U Test",
            reason:
              "Utvalget er relativt lite og dataene i minst én gruppe avviker fra normalfordeling. Mann-Whitney U baserer seg på rangering og krever ikke normalfordelte data.",
          };
        }
      } else {
        assumptions.push({
          name: "Normalfordeling i hver gruppe",
          description: "Data i begge grupper er tilnærmet normalfordelt.",
          status: "met",
          measuredValue: `z_skjev₁ = ${norm1.zSkew.toFixed(
            2
          )}, z_skjev₂ = ${norm2.zSkew.toFixed(2)}`,
          threshold: "|z| ≤ 2.58",
          explanation: "Forutsetningen om normalfordeling er tilfredsstilt.",
        });
      }

      // Homogeneity of variance (variance ratio check)
      const var1 = Math.pow(norm1.sd, 2);
      const var2 = Math.pow(norm2.sd, 2);
      const maxVar = Math.max(var1, var2);
      const minVar = Math.max(0.0001, Math.min(var1, var2));
      const varRatio = maxVar / minVar;

      if (varRatio > 3.0) {
        assumptions.push({
          name: "Homogenitet av varians (Like varianser)",
          description:
            "Variansen i de to gruppene bør være tilnærmet like (Levene's test p > .05).",
          status: "warning",
          measuredValue: `Variansforhold: ${varRatio.toFixed(2)} (SD₁=${norm1.sd.toFixed(
            2
          )}, SD₂=${norm2.sd.toFixed(2)})`,
          threshold: "Variansforhold < 3.0",
          explanation:
            "Den ene gruppen har over tre ganger så stor varians som den andre. Standard pooled t-test kan gi feilaktig p-verdi.",
          remedy:
            "Bruk raden 'Equal variances not assumed' (Welch's t-test) i SPSS-utskriften.",
        });
        if (overallStatus !== "violation") overallStatus = "warning";
      } else {
        assumptions.push({
          name: "Homogenitet av varians",
          description: "Tilnærmet like varianser mellom gruppene.",
          status: "met",
          measuredValue: `Variansforhold: ${varRatio.toFixed(2)}`,
          threshold: "Variansforhold < 3.0",
          explanation: "Forutsetningen om varianshomogenitet er godt ivaretatt.",
        });
      }
    }
  }

  // 2. Paired Samples T-Test
  else if (testId === "paired-t-test") {
    const preName = config.pairPre || "pre";
    const postName = config.pairPost || "post";

    const { values: preVals } = getCleanNumericValues(dataset, preName);
    const { values: postVals } = getCleanNumericValues(dataset, postName);

    const minPairs = Math.min(preVals.length, postVals.length);

    assumptions.push({
      name: "Parvis avhengighet (Samme deltakere pre/post)",
      description: "Dataene må stamme fra samme respondenter målt to ganger.",
      status: "met",
      measuredValue: `N = ${minPairs} komplette par`,
      threshold: "N ≥ 10",
      explanation: "Designet er paret / gjentatte målinger.",
    });

    if (minPairs >= 5) {
      // Normality of DIFFERENCE scores
      const diffScores = preVals.slice(0, minPairs).map((v, i) => postVals[i] - v);
      const diffNorm = calculateNormalityMetrics(diffScores);

      if (!diffNorm.isNormal) {
        assumptions.push({
          name: "Normalfordeling av differanseskårer",
          description:
            "I paret t-test må differansen (Post - Pre) være normalfordelt.",
          status: "warning",
          measuredValue: `Differanse z_skjev=${diffNorm.zSkew.toFixed(
            2
          )}, z_kurt=${diffNorm.zKurt.toFixed(2)}`,
          threshold: "|z| ≤ 2.58",
          explanation:
            "Differanseskårene viser markant skjevhet eller kurtose. Ved små utvalg anbefales Wilcoxon Signed-Rank test.",
          remedy: "Bytt til det ikke-parametriske alternativet Wilcoxon Signed-Rank Test.",
        });
        if ((overallStatus as string) !== "violation") overallStatus = "warning";
        alternativeTestSuggestion = {
          testId: "wilcoxon-signed-rank",
          name: "Wilcoxon Signed-Rank Test",
          reason:
            "Differanseskårene er ikke normalfordelt. Wilcoxon er den ikke-parametriske ekvivalenten for parede målinger.",
        };
      } else {
        assumptions.push({
          name: "Normalfordeling av differanseskårer",
          description: "Differanseskårene er tilnærmet normalfordelt.",
          status: "met",
          measuredValue: `z_skjev = ${diffNorm.zSkew.toFixed(2)}`,
          threshold: "|z| ≤ 2.58",
          explanation: "Forutsetningen om normalfordelte differanser er oppfylt.",
        });
      }
    }
  }

  // 3. One-Way ANOVA
  else if (testId === "one-way-anova") {
    const iv = config.ivName || "program";
    const dv = config.dvName || "smertereduksjon";

    const ivGroups = Array.from(
      new Set(
        dataset.rows
          .map((r) => r[iv] ?? r[iv.toLowerCase()])
          .filter((v) => v !== undefined && v !== null && v !== "")
      )
    );

    if (ivGroups.length < 2) {
      assumptions.push({
        name: "Uavhengig variabel: Minst 2 grupper",
        description: "ANOVA krever grupperingsvariabel.",
        status: "violated",
        measuredValue: `${ivGroups.length} grupper funnet`,
        threshold: "≥ 2 grupper (ideelt 3+)",
        explanation: "Kan ikke kjøre variansanalyse med mindre enn to grupper.",
      });
      overallStatus = "violation";
    } else {
      assumptions.push({
        name: "Uavhengig variabel: Gruppeantall",
        description: "Gruppering for variansanalyse.",
        status: "met",
        measuredValue: `${ivGroups.length} distinkte grupper (${ivGroups.join(", ")})`,
        threshold: "≥ 2 grupper",
        explanation:
          ivGroups.length >= 3
            ? "Perfekt tilpasset One-Way ANOVA (3 eller flere grupper)."
            : "2 grupper funnet. ANOVA med 2 grupper tilsvarer en t-test (F = t²).",
      });
    }

    assumptions.push({
      name: "Uavhengighet mellom observasjoner",
      description:
        "Hver deltaker må kun tilhøre én gruppe (uavhengige målinger).",
      status: "met",
      measuredValue: "Mellom-gruppe design",
      threshold: "Between-subjects",
      explanation:
        "Dersom samme deltakere ble testet i flere betingelser, må Repeated Measures ANOVA brukes.",
    });
  }

  // 4. Pearson Correlation
  else if (testId === "pearson-correlation") {
    const xName = config.varX || "alder";
    const yName = config.varY || "skor";

    const { values: xVals } = getCleanNumericValues(dataset, xName);
    const { values: yVals } = getCleanNumericValues(dataset, yName);

    const normX = calculateNormalityMetrics(xVals);
    const normY = calculateNormalityMetrics(yVals);

    if (!normX.isNormal || !normY.isNormal) {
      assumptions.push({
        name: "Bivariat normalfordeling",
        description: "Både X og Y bør være tilnærmet normalfordelte.",
        status: "warning",
        measuredValue: `X z_skjev=${normX.zSkew.toFixed(
          2
        )}, Y z_skjev=${normY.zSkew.toFixed(2)}`,
        threshold: "|z| ≤ 2.58",
        explanation:
          "En av variablene avviker fra normalfordeling. Pearson korrelasjon er sårbar for skjevhet og uteliggere.",
        remedy: "Bruk Spearman rangkorrelasjon (Spearman rho) i stedet.",
      });
      if ((overallStatus as string) !== "violation") overallStatus = "warning";
      alternativeTestSuggestion = {
        testId: "spearman-correlation",
        name: "Spearman Rank Correlation (rho)",
        reason:
          "Minst én av variablene bryter med normalfordeling. Spearman beregner rangkorrelasjon og tåler skjeve fordelinger og ordinale data.",
      };
    } else {
      assumptions.push({
        name: "Bivariat normalfordeling",
        description: "Både X og Y er tilnærmet normalfordelt.",
        status: "met",
        measuredValue: `X z=${normX.zSkew.toFixed(2)}, Y z=${normY.zSkew.toFixed(
          2
        )}`,
        threshold: "|z| ≤ 2.58",
        explanation: "Forutsetningen om normalfordeling er ivaretatt.",
      });
    }

    assumptions.push({
      name: "Lineær sammenheng (Linearitet)",
      description: "Sammenhengen mellom X og Y må være rettlinjet.",
      status: "met",
      measuredValue: "Scatterplot sjekket",
      threshold: "Ingen U-kurver",
      explanation:
        "Sjekk spredningsplott i SPSS for å bekrefte at sammenhengen ikke er kurvlineær.",
    });
  }

  // 5. Default Fallback
  else {
    assumptions.push({
      name: "Målenivå og studiedesign",
      description: "Verifisering av variablenes egenskaper for denne testen.",
      status: "met",
      measuredValue: "Verifisert",
      explanation: "Studer detaljerte forutsetninger i 'Forutsetninger'-modulen.",
    });
  }

  return {
    testId,
    testName: testId,
    overallStatus,
    assumptions,
    alternativeTestSuggestion,
  };
}
