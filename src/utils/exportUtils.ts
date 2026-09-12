import * as XLSX from "xlsx";
import { Dataset, StatisticalTestInfo, DatasetHealthReport } from "../types";

/**
 * Utility for exporting data to Microsoft Excel (.xlsx), Microsoft Word (.doc),
 * and triggering print / PDF generation.
 */

// -------------------------------------------------------------
// 1. EXCEL EXPORTS (.xlsx)
// -------------------------------------------------------------

export function exportDatasetToExcel(dataset: Dataset): void {
  const wb = XLSX.utils.book_new();

  // 1. Data Sheet
  const cleanRows = dataset.rows.map((row) => {
    const cleanRow: Record<string, any> = {};
    dataset.variables.forEach((v) => {
      cleanRow[v.name] = row[v.name] ?? row[v.id] ?? "";
    });
    return cleanRow;
  });
  const dataSheet = XLSX.utils.json_to_sheet(cleanRows);
  XLSX.utils.book_append_sheet(wb, dataSheet, "Rådata");

  // 2. Variables Metadata Sheet
  const varRows = dataset.variables.map((v) => ({
    "Variabelnavn": v.name,
    "Etikett (Label)": v.label,
    "Type": v.type,
    "Målenivå (Measure)": v.level,
    "Kategoriverdier": v.values
      ? Object.entries(v.values).map(([k, val]) => `${k}=${val}`).join("; ")
      : "Ingen",
    "Manglende data": v.missingCount,
  }));
  const varSheet = XLSX.utils.json_to_sheet(varRows);
  XLSX.utils.book_append_sheet(wb, varSheet, "Variabeloppsett");

  // Save file
  const fileName = `${dataset.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_SPSS_Data.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportAnalysisToExcel(
  testInfo: StatisticalTestInfo,
  testResults: any,
  datasetName: string,
  apaNarrative: string
): void {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryRows = [
    { "Egenskap": "Statistisk test", "Verdi": testInfo.name },
    { "Egenskap": "Datasett", "Verdi": datasetName },
    { "Egenskap": "SPSS Menysti", "Verdi": testInfo.spssMenuPath },
    { "Egenskap": "Uavhengig variabel (IV)", "Verdi": testInfo.independentVar },
    { "Egenskap": "Avhengig variabel (DV)", "Verdi": testInfo.dependentVar },
    { "Egenskap": "H0 (Nullhypotese)", "Verdi": testInfo.h0 },
    { "Egenskap": "H1 (Alternativhypotese)", "Verdi": testInfo.h1 },
    { "Egenskap": "Effektstørrelsesmål", "Verdi": testInfo.effectSizeMetric },
    { "Egenskap": "APA 7 Resultattekst", "Verdi": apaNarrative },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Oppsummering");

  // Statistical Results Sheet
  if (testResults) {
    const rawMetrics: Record<string, any>[] = [];
    Object.entries(testResults).forEach(([key, value]) => {
      if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        rawMetrics.push({ "Parameter": key, "Verdi": value });
      }
    });
    if (rawMetrics.length > 0) {
      const metricsSheet = XLSX.utils.json_to_sheet(rawMetrics);
      XLSX.utils.book_append_sheet(wb, metricsSheet, "Beregnede_Nøkkeltall");
    }

    // If groups exist (t-test / ANOVA)
    if (testResults.group1Stats && testResults.group2Stats) {
      const grpRows = [
        {
          Gruppe: testResults.group1Stats.name,
          N: testResults.group1Stats.n,
          Mean: testResults.group1Stats.mean,
          Std_Deviation: testResults.group1Stats.sd,
        },
        {
          Gruppe: testResults.group2Stats.name,
          N: testResults.group2Stats.n,
          Mean: testResults.group2Stats.mean,
          Std_Deviation: testResults.group2Stats.sd,
        },
      ];
      const grpSheet = XLSX.utils.json_to_sheet(grpRows);
      XLSX.utils.book_append_sheet(wb, grpSheet, "Gruppestatistikk");
    } else if (testResults.groups && Array.isArray(testResults.groups)) {
      const anovaGrpRows = testResults.groups.map((g: any) => ({
        Gruppe: g.name,
        N: g.n,
        Mean: g.mean,
        Std_Deviation: g.sd,
      }));
      const anovaGrpSheet = XLSX.utils.json_to_sheet(anovaGrpRows);
      XLSX.utils.book_append_sheet(wb, anovaGrpSheet, "Gruppestatistikk");
    }
  }

  const fileName = `${testInfo.id}_SPSS_Resultater.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportDecisionTreeToExcel(decisionData: {
  goal: string;
  designType: string;
  outcomeType: string;
  isNormal: string;
  recommendedTest: string;
  justification: string;
  spssMenuPath: string;
}): void {
  const wb = XLSX.utils.book_new();
  const rows = [
    { Parameter: "Formål / Problemstilling", Valg: decisionData.goal },
    { Parameter: "Forskningsdesign", Valg: decisionData.designType },
    { Parameter: "Målenivå for utfall", Valg: decisionData.outcomeType },
    { Parameter: "Forutsetning: Normalfordeling", Valg: decisionData.isNormal },
    { Parameter: "Anbefalt Statistisk Test", Valg: decisionData.recommendedTest },
    { Parameter: "Metodisk Begrunnelse", Valg: decisionData.justification },
    { Parameter: "SPSS Menysti", Valg: decisionData.spssMenuPath },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, sheet, "Beslutningsvei");
  XLSX.writeFile(wb, "SPSS_Beslutningstre_Analysevalg.xlsx");
}

// -------------------------------------------------------------
// 2. WORD EXPORTS (.doc with HTML / Word XML)
// -------------------------------------------------------------

function downloadWordDocument(htmlBody: string, filename: string): void {
  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${filename}</title>
<style>
  @page {
    size: 21.0cm 29.7cm; /* A4 */
    margin: 2.54cm 2.54cm 2.54cm 2.54cm; /* APA standard 1 inch margins */
    mso-page-orientation: portrait;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111827;
  }
  h1 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 12pt;
    color: #0f172a;
  }
  h2 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 18pt;
    margin-bottom: 6pt;
    color: #1e293b;
  }
  p {
    margin-bottom: 8pt;
    text-indent: 0.5in;
  }
  .no-indent {
    text-indent: 0 !important;
  }
  .disclaimer-box {
    border: 1px solid #b45309;
    background-color: #fef3c7;
    color: #78350f;
    padding: 8pt 12pt;
    font-size: 10pt;
    font-weight: bold;
    margin: 12pt 0;
    text-align: center;
    text-indent: 0;
  }
  /* APA 7 Table standard: Three horizontal lines only, no vertical lines */
  table.apa-table {
    border-collapse: collapse;
    width: 100%;
    margin: 14pt 0;
    font-size: 10pt;
  }
  table.apa-table thead tr:first-child th {
    border-top: 1.5pt solid #000;
    border-bottom: 1pt solid #000;
    padding: 5pt;
    text-align: left;
    font-weight: bold;
  }
  table.apa-table tbody tr td {
    padding: 4pt 5pt;
    border-top: none;
    border-bottom: none;
    border-left: none;
    border-right: none;
  }
  table.apa-table tbody tr:last-child td {
    border-bottom: 1.5pt solid #000;
  }
  .table-title {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 2pt;
    text-indent: 0;
  }
  .table-subtitle {
    font-size: 10pt;
    font-style: italic;
    margin-bottom: 6pt;
    text-indent: 0;
  }
  .table-note {
    font-size: 9pt;
    font-style: italic;
    color: #475569;
    margin-top: 4pt;
    text-indent: 0;
  }
  .narrative-box {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 10pt;
    font-style: italic;
    margin: 10pt 0;
  }
  .meta-grid {
    border: 1px solid #e2e8f0;
    width: 100%;
    margin-bottom: 14pt;
  }
  .meta-grid td {
    padding: 4pt 8pt;
    font-size: 10pt;
  }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  const blob = new Blob(["\ufeff", header], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAnalysisToWord(
  testInfo: StatisticalTestInfo,
  testResults: any,
  apaNarrative: string,
  datasetName: string
): void {
  const currentDate = new Date().toLocaleDateString("no-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let tablesHtml = "";
  if (testResults && testResults.group1Stats && testResults.group2Stats) {
    tablesHtml = `
      <div class="table-title">Tabell 1</div>
      <div class="table-subtitle">Deskriptiv statistikk for ${testInfo.name}</div>
      <table class="apa-table">
        <thead>
          <tr>
            <th>Gruppe</th>
            <th>N</th>
            <th>M</th>
            <th>SD</th>
            <th>t</th>
            <th>df</th>
            <th>p</th>
            <th>95% CI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${testResults.group1Stats.name}</td>
            <td>${testResults.group1Stats.n}</td>
            <td>${testResults.group1Stats.mean.toFixed(2)}</td>
            <td>${testResults.group1Stats.sd.toFixed(2)}</td>
            <td>${testResults.t ? testResults.t.toFixed(2) : "-"}</td>
            <td>${testResults.df ?? "-"}</td>
            <td>${testResults.pValue !== undefined ? (testResults.pValue < 0.001 ? "< .001" : testResults.pValue.toFixed(3)) : "-"}</td>
            <td>${testResults.ciLower !== undefined ? `[${testResults.ciLower.toFixed(2)}, ${testResults.ciUpper.toFixed(2)}]` : "-"}</td>
          </tr>
          <tr>
            <td>${testResults.group2Stats.name}</td>
            <td>${testResults.group2Stats.n}</td>
            <td>${testResults.group2Stats.mean.toFixed(2)}</td>
            <td>${testResults.group2Stats.sd.toFixed(2)}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <div class="table-note">Note. M = gjennomsnitt; SD = standardavvik; CI = konfidensintervall for gjennomsnittsdifferansen. Statistically significant at p &lt; .05.</div>
    `;
  }

  const htmlBody = `
    <h1>Statistisk Forskningsrapport</h1>
    <p class="no-indent" style="text-align: center; color: #64748b; font-size: 10pt; margin-bottom: 16pt;">
      Generert fra SPSS Survival Manual Digital • Dato: ${currentDate} • Datasett: ${datasetName}
    </p>

    <div class="disclaimer-box">
      GENERERT FORSLAG – MÅ KONTROLLERES AV FORSKER FØR INNLEVERING
    </div>

    <h2>1. Metodisk grunnlag & Problemstilling</h2>
    <p class="no-indent">
      <strong>Analysevalg:</strong> ${testInfo.name}<br/>
      <strong>SPSS menysti:</strong> <code>${testInfo.spssMenuPath}</code><br/>
      <strong>Uavhengig variabel (IV):</strong> ${testInfo.independentVar}<br/>
      <strong>Avhengig variabel (DV):</strong> ${testInfo.dependentVar}<br/>
      <strong>Nullhypotese (H₀):</strong> ${testInfo.h0}<br/>
      <strong>Alternativhypotese (H₁):</strong> ${testInfo.h1}
    </p>

    <h2>2. Statistisk analyse og tabell</h2>
    ${tablesHtml}

    <h2>3. Resultatbeskrivelse (APA 7 format)</h2>
    <div class="narrative-box">
      «${apaNarrative}»
    </div>

    <h2>4. Pedagogisk og metodisk vurdering</h2>
    <p>
      Ved tolkning av analysen er det avgjørende å skille mellom statistisk signifikans (p-verdi) og praktisk relevans.
      Effektstørrelsen (${testInfo.effectSizeMetric}) angir styrken på funnet uavhengig av utvalgsstørrelsen.
    </p>
    <p class="no-indent">
      <strong>Forutsetninger vurdert:</strong>
    </p>
    <ul style="font-size: 10pt; color: #334155; padding-left: 20pt;">
      ${testInfo.assumptions.map((a) => `<li>${a}</li>`).join("")}
    </ul>
  `;

  downloadWordDocument(htmlBody, `${testInfo.id}_Forskningsrapport`);
}

export function exportDecisionTreeToWord(treeData: {
  goal: string;
  designType: string;
  outcomeType: string;
  isNormal: string;
  recommendedTest: StatisticalTestInfo;
  userVars?: { ivName: string; dvName: string };
}): void {
  const currentDate = new Date().toLocaleDateString("no-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const test = treeData.recommendedTest;

  const htmlBody = `
    <h1>Metodisk Analysebegrunnelse (Beslutningstre)</h1>
    <p class="no-indent" style="text-align: center; color: #64748b; font-size: 10pt; margin-bottom: 16pt;">
      SPSS Survival Manual Digital • Vitenskapelig metode & testvalg • ${currentDate}
    </p>

    <div class="disclaimer-box">
      GENERERT METODEBEGRUNNELSE FOR MASTEROPPGAVE / FORSKNINGSPROTOKOLL
    </div>

    <h2>1. Valgt statistisk metode</h2>
    <p class="no-indent">
      Basert på metodiske kriterier og forutsetninger er <strong>${test.name}</strong> identifisert som den metodisk korrekte analysen.
    </p>

    <h2>2. Beslutningssti fra det visuelle beslutningstreet</h2>
    <table class="apa-table">
      <thead>
        <tr>
          <th>Trinn</th>
          <th>Metodisk spørsmål</th>
          <th>Valgt forutsetning / svar</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>Formål med undersøkelsen</td>
          <td>${treeData.goal}</td>
        </tr>
        <tr>
          <td>2</td>
          <td>Forskningsdesign & Uavhengighet</td>
          <td>${treeData.designType}</td>
        </tr>
        <tr>
          <td>3</td>
          <td>Målenivå for utfallsvariabel (DV)</td>
          <td>${treeData.outcomeType}</td>
        </tr>
        <tr>
          <td>4</td>
          <td>Forutsetning om normalfordeling</td>
          <td>${treeData.isNormal}</td>
        </tr>
      </tbody>
    </table>

    ${
      treeData.userVars
        ? `
      <h2>3. Spesifikke forskningsvariabler</h2>
      <p class="no-indent">
        <strong>Uavhengig variabel (IV):</strong> ${treeData.userVars.ivName || "Ikke spesifisert"}<br/>
        <strong>Avhengig variabel (DV):</strong> ${treeData.userVars.dvName || "Ikke spesifisert"}
      </p>
    `
        : ""
    }

    <h2>4. Teoretisk og praktisk begrunnelse</h2>
    <p>${test.whenToUse}</p>
    <p class="no-indent">
      <strong>SPSS fremgangsmåte:</strong> <code>${test.spssMenuPath}</code><br/>
      <strong>Effektstørrelse:</strong> ${test.effectSizeMetric}
    </p>

    <h2>5. Hypoteser</h2>
    <p class="no-indent">
      <strong>Nullhypotese:</strong> <code>${test.h0}</code><br/>
      <strong>Alternativhypotese:</strong> <code>${test.h1}</code>
    </p>

    <h2>6. Mal for vitenskapelig rapportering (APA 7)</h2>
    <div class="narrative-box">
      «${test.apaExample}»
    </div>
  `;

  downloadWordDocument(htmlBody, `Metodebegrunnelse_${test.id}`);
}

export function exportValidationReportToExcel(report: DatasetHealthReport): void {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryRows = [
    { "Egenskap": "Datasett", "Verdi": report.datasetName },
    { "Egenskap": "Totalt antall rader (N)", "Verdi": report.totalRows },
    { "Egenskap": "Totalt antall variabler", "Verdi": report.totalVariables },
    { "Egenskap": "Datakvalitetsscore (0-100)", "Verdi": `${report.healthScore}/100` },
    { "Egenskap": "Beståtte sjekker", "Verdi": report.passedChecksCount },
    { "Egenskap": "Advarsler", "Verdi": report.warningsCount },
    { "Egenskap": "Kritiske feil", "Verdi": report.errorsCount },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Sammendrag");

  // Variables Quality Overview Sheet
  const varRows = Object.values(report.variableReports).map((vr) => ({
    "Variabel": vr.variableName,
    "Målenivå": vr.level,
    "Type": vr.type,
    "Gyldige N": vr.n,
    "Missing N": vr.missingCount,
    "Missing %": `${vr.missingPercentage}%`,
    "Min": vr.min ?? "",
    "Maks": vr.max ?? "",
    "Gjennomsnitt": vr.mean ?? "",
    "SD": vr.sd ?? "",
    "Skjevhet": vr.skewness ?? "",
    "Kurtose": vr.kurtosis ?? "",
    "Normalfordelt": vr.isNormallyDistributed ? "Ja" : "Nei / Avvik",
    "Uteliggere funnet": vr.outliersCount,
  }));
  const varSheet = XLSX.utils.json_to_sheet(varRows);
  XLSX.utils.book_append_sheet(wb, varSheet, "Variabelkontroll");

  // Issues Sheet
  if (report.issues.length > 0) {
    const issueRows = report.issues.map((iss) => ({
      "Alvorlighetsgrad": iss.severity.toUpperCase(),
      "Variabel": iss.variableName,
      "Type sjekk": iss.type,
      "Beskrivelse": iss.message,
      "Detaljer": iss.details,
      "Anbefaling": iss.recommendation,
    }));
    const issueSheet = XLSX.utils.json_to_sheet(issueRows);
    XLSX.utils.book_append_sheet(wb, issueSheet, "Avvik_og_Advarsler");
  }

  const fileName = `${report.datasetName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Valideringsrapport.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportValidationReportToWord(report: DatasetHealthReport): void {
  const htmlBody = `
    <h1>Datakontroll & Valideringsrapport</h1>
    <p style="text-align: center; color: #64748b; font-size: 10pt;">
      SPSS Survival Manual Digital • Screening og Datakvalitet
    </p>

    <div style="border: 1px solid #0284c7; background-color: #f0f9ff; color: #0369a1; padding: 10pt; font-size: 11pt; margin: 12pt 0;">
      <strong>Datasett:</strong> ${report.datasetName} | 
      <strong>Antall rader (N):</strong> ${report.totalRows} | 
      <strong>Variabler:</strong> ${report.totalVariables} | 
      <strong>Kvalitetsscore:</strong> ${report.healthScore}/100
    </div>

    <h2>1. Sammendrag av datakvalitet</h2>
    <p class="no-indent">
      Det ble gjennomført en systematisk screening av datasettet i henhold til retningslinjene i SPSS Survival Manual (Pallant, 2020) og Tabachnick & Fidell (2019).
      Datasettet oppnår en samlet helsescore på <strong>${report.healthScore}/100</strong> (${report.passedChecksCount} godkjente sjekker, ${report.warningsCount} metodiske advarsler og ${report.errorsCount} kritiske feil).
    </p>

    <h2>2. Statistisk fordelings- og uteliggersjekk</h2>
    <table class="apa-table">
      <thead>
        <tr>
          <th>Variabel</th>
          <th>Nivå</th>
          <th>Gyldig N</th>
          <th>Missing</th>
          <th>M</th>
          <th>SD</th>
          <th>Skjevhet</th>
          <th>Normalfordelt</th>
          <th>Uteliggere</th>
        </tr>
      </thead>
      <tbody>
        ${Object.values(report.variableReports)
          .map(
            (vr) => `
          <tr>
            <td>${vr.variableName}</td>
            <td>${vr.level}</td>
            <td>${vr.n}</td>
            <td>${vr.missingCount} (${vr.missingPercentage}%)</td>
            <td>${vr.mean ?? "-"}</td>
            <td>${vr.sd ?? "-"}</td>
            <td>${vr.skewness ?? "-"}</td>
            <td>${vr.isNormallyDistributed ? "Ja" : "Nei / Avvik"}</td>
            <td>${vr.outliersCount}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <h2>3. Identifiserte avvik og anbefalte tiltak</h2>
    ${
      report.issues.length === 0
        ? "<p>Ingen kritiske feil eller advarsler funnet. Datasettet er klart for analyse.</p>"
        : `
      <ul>
        ${report.issues
          .map(
            (iss) => `
          <li style="margin-bottom: 8pt;">
            <strong>[${iss.severity.toUpperCase()}] ${iss.variableName} (${iss.type}):</strong> ${iss.message}<br/>
            <em>Detaljer:</em> ${iss.details}<br/>
            <em>Anbefalt tiltak:</em> ${iss.recommendation}
          </li>
        `
          )
          .join("")}
      </ul>
    `
    }
  `;

  downloadWordDocument(htmlBody, `Datakontroll_${report.datasetName.replace(/[^a-zA-Z0-9_-]/g, "_")}`);
}

// -------------------------------------------------------------
// 3. PRINT & PDF TRIGGER UTILITY
// -------------------------------------------------------------

export function triggerPrint(): void {
  window.print();
}
