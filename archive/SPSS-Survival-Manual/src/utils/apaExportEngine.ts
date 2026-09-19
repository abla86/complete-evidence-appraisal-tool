import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StatisticalTestInfo, OutputInterpretation } from "../types";

export interface ApaExportPayload {
  reportType: "analysis" | "interpretation" | "summary" | "data_quality";
  testInfo: StatisticalTestInfo;
  results?: any;
  datasetName: string;
  apaNarrative: string;
  interpretation?: OutputInterpretation;
  assumptions?: {
    name: string;
    status: "met" | "warning" | "violated" | "passed";
    measuredValue?: string;
    threshold?: string;
    explanation: string;
  }[];
  customTitle?: string;
  authorName?: string;
  institution?: string;
  includeTable?: boolean;
  includeInterpretation?: boolean;
  includeAssumptions?: boolean;
  includeSpssGuide?: boolean;
  language?: "no" | "en";
}

// Helper to format APA p-value
export function formatApaPValue(p?: number): string {
  if (p === undefined || p === null || isNaN(p)) return "-";
  if (p < 0.001) return "< .001";
  const str = p.toFixed(3);
  return str.startsWith("0.") ? str.slice(1) : str;
}

// -----------------------------------------------------------------------------
// 1. CLIENT-SIDE DOCX EXPORT (APA 7 COMPLIANT)
// -----------------------------------------------------------------------------

export async function exportToDocx(payload: ApaExportPayload): Promise<void> {
  const {
    testInfo,
    results,
    datasetName,
    apaNarrative,
    interpretation,
    assumptions,
    customTitle,
    authorName = "Forsker / Student",
    institution = "Institutt for samfunnsvitenskap og psykologi",
    includeTable = true,
    includeInterpretation = true,
    includeAssumptions = true,
    includeSpssGuide = true,
    language = "no",
  } = payload;

  const dateStr = new Date().toLocaleDateString(language === "no" ? "no-NO" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mainTitle = customTitle || `Statistisk Forskningsrapport: ${testInfo.name}`;

  const docChildren: any[] = [];

  // Title Page / Top Section (APA 7 Student Paper Style)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: mainTitle,
          bold: true,
          size: 28, // 14pt
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: authorName,
          size: 24, // 12pt
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: institution,
          size: 24,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Datasett: ${datasetName} • ${dateStr}`,
          italics: true,
          size: 22,
          font: "Times New Roman",
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: "— Standardisert i henhold til American Psychological Association (APA 7th edition) —",
          size: 20,
          font: "Times New Roman",
          color: "64748b",
        }),
      ],
    })
  );

  // Section 1: Problemstilling og Metode
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: language === "no" ? "1. Problemstilling og Analysevalg" : "1. Research Question and Analysis Selection",
          bold: true,
          size: 24,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      indent: { firstLine: 720 }, // 0.5 in indent
      children: [
        new TextRun({
          text: language === "no"
            ? `Formålet med analysen er å undersøke følgende forskningsspørsmål: «${testInfo.exampleQuestion}». `
            : `The purpose of the analysis is to examine the research question: "${testInfo.exampleQuestion}". `,
          font: "Times New Roman",
          size: 24,
        }),
        new TextRun({
          text: language === "no"
            ? `For å teste hypotesene ble det gjennomført en ${testInfo.name.toLowerCase()}. `
            : `To test the hypotheses, a ${testInfo.name} was conducted. `,
          font: "Times New Roman",
          size: 24,
        }),
        new TextRun({
          text: testInfo.whenToUse,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: language === "no" ? "Hypoteser for undersøkelsen:" : "Study Hypotheses:",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      indent: { left: 720 },
      children: [
        new TextRun({ text: "H₀ (Nullhypotese): ", italics: true, bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: testInfo.h0, font: "Times New Roman", size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 180 },
      indent: { left: 720 },
      children: [
        new TextRun({ text: "H₁ (Alternativhypotese): ", italics: true, bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: testInfo.h1, font: "Times New Roman", size: 24 }),
      ],
    })
  );

  // Section 2: APA 7 Table (if applicable)
  if (includeTable && results) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: language === "no" ? "2. Statistiske Resultater og APA-tabell" : "2. Statistical Results and APA Table",
            bold: true,
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "Table 1",
            bold: true,
            font: "Times New Roman",
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `Descriptive Statistics and Test Results for ${testInfo.name}`,
            italics: true,
            font: "Times New Roman",
            size: 24,
          }),
        ],
      })
    );

    // Build APA 7 Table: Top line (1.5pt), Header bottom line (1pt), Bottom line (1.5pt), NO VERTICAL LINES
    const apaTable = createDocxApaTable(testInfo, results);
    if (apaTable) {
      docChildren.push(apaTable);
      docChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 200 },
          children: [
            new TextRun({ text: "Note. ", italics: true, font: "Times New Roman", size: 20 }),
            new TextRun({
              text: `M = gjennomsnitt (mean); SD = standardavvik (standard deviation); CI = konfidensintervall for differansen; ${testInfo.effectSizeMetric} = effektstørrelse. *p < .05. **p < .01. ***p < .001.`,
              font: "Times New Roman",
              size: 20,
              color: "334155",
            }),
          ],
        })
      );
    }
  }

  // Section 3: Resultatbeskrivelse i løpende tekst (APA 7 Narrative)
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: language === "no" ? "3. Akademisk Resultatavsnitt (APA 7 Format)" : "3. Academic Results Section (APA 7 Format)",
          bold: true,
          size: 24,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      indent: { firstLine: 720 },
      children: [
        new TextRun({
          text: `«${apaNarrative}»`,
          italics: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    })
  );

  // Section 4: Tolkning og Praktisk Betydning
  if (includeInterpretation && interpretation) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: language === "no" ? "4. Metodisk Tolkning og Betydning" : "4. Methodological Interpretation and Meaning",
            bold: true,
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: "Hva resultatet betyr: ", bold: true, font: "Times New Roman", size: 24 }),
          new TextRun({ text: interpretation.whatItMeans, font: "Times New Roman", size: 24 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: "Hva resultatet IKKE betyr (Viktig metodisk presisering): ", bold: true, font: "Times New Roman", size: 24 }),
          new TextRun({ text: interpretation.whatItDoesNotMean, font: "Times New Roman", size: 24 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 160 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({ text: "Vurdering av effektstørrelse: ", bold: true, font: "Times New Roman", size: 24 }),
          new TextRun({ text: interpretation.effectSizeAssessment || "Effektstørrelsen gir et standardisert uttrykk for styrken på funnet uavhengig av utvalgsstørrelse (N).", font: "Times New Roman", size: 24 }),
        ],
      })
    );
  }

  // Section 5: Forutsetningskontroll
  if (includeAssumptions && assumptions && assumptions.length > 0) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: language === "no" ? "5. Kontroll av Metodiske Forutsetninger" : "5. Check of Methodological Assumptions",
            bold: true,
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({
            text: "I henhold til SPSS Survival Manual (Pallant, 2020) er gyldigheten av statistiske slutninger betinget av at forutsetningene er tilfredsstilt eller at testen er robust mot observerte avvik.",
            font: "Times New Roman",
            size: 24,
          }),
        ],
      })
    );

    assumptions.forEach((a) => {
      const statusSymbol = a.status === "met" || a.status === "passed" ? "[OPPFYLT]" : a.status === "warning" ? "[ADVARSEL]" : "[BRUDD]";
      docChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${statusSymbol} ${a.name}: `, bold: true, font: "Times New Roman", size: 22 }),
            new TextRun({ text: `${a.explanation} `, font: "Times New Roman", size: 22 }),
            new TextRun({
              text: a.measuredValue ? `(Målt: ${a.measuredValue}; Kriterium: ${a.threshold || "-"})` : "",
              italics: true,
              font: "Times New Roman",
              size: 20,
              color: "475569",
            }),
          ],
        })
      );
    });
  }

  // Section 6: SPSS Veiledning
  if (includeSpssGuide) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: language === "no" ? "6. SPSS Gjennomføring & Menysti" : "6. SPSS Execution & Menu Path",
            bold: true,
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Menysti i IBM SPSS Statistics: ", bold: true, font: "Times New Roman", size: 24 }),
          new TextRun({ text: testInfo.spssMenuPath, font: "Courier New", size: 22, color: "0f766e" }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { firstLine: 720 },
        children: [
          new TextRun({
            text: "Rapporter alltid gjennomsnitt (M) og standardavvik (SD) med to desimaler. P-verdi rapporteres nøyaktig med tre desimaler (f.eks. p = .024) uten ledende null. Dersom p < .001, oppgis det som p < .001.",
            italics: true,
            font: "Times New Roman",
            size: 22,
            color: "334155",
          }),
        ],
      })
    );
  }

  // Create Document with APA standard 1-inch margins and Running Header
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24,
          },
          paragraph: {
            spacing: { line: 280 }, // 1.15 to 1.5 line spacing
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${testInfo.name.toUpperCase()} — APA 7 RAPPORT  |  Side `,
                    font: "Times New Roman",
                    size: 18,
                    color: "64748b",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Times New Roman",
                    size: 18,
                    color: "64748b",
                  }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  // Pack and Save
  const blob = await Packer.toBlob(doc);
  const safeFilename = `${testInfo.id}_APA7_Rapport.docx`;
  saveAs(blob, safeFilename);
}

// Helper to construct APA 7 docx Table
function createDocxApaTable(testInfo: StatisticalTestInfo, results: any): Table | null {
  const topBorder = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
  const bottomBorder = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
  const headerBottomBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

  // Independent T-Test / Paired T-Test
  if (results.group1Stats && results.group2Stats) {
    const headers = ["Gruppe / Variabel", "N", "M", "SD", "t", "df", "p", "95% CI", "Cohen's d"];
    const colWidths = [2400, 700, 900, 900, 800, 700, 800, 1600, 1100];

    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(
        (h, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            margins: cellMargins,
            borders: {
              top: topBorder,
              bottom: headerBottomBorder,
              left: noBorder,
              right: noBorder,
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, font: "Times New Roman", size: 22 })],
              }),
            ],
          })
      ),
    });

    const ciText = results.ciLower !== undefined ? `[${results.ciLower.toFixed(2)}, ${results.ciUpper.toFixed(2)}]` : "-";
    const pText = formatApaPValue(results.pValue);
    const dText = results.cohensD !== undefined ? results.cohensD.toFixed(2) : "-";

    const row1 = new TableRow({
      children: [
        new TableCell({
          width: { size: colWidths[0], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.group1Stats.name, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[1], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: String(results.group1Stats.n), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[2], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.group1Stats.mean.toFixed(2), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[3], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.group1Stats.sd.toFixed(2), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[4], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.t ? results.t.toFixed(2) : "-", font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[5], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: String(results.df ?? "-"), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[6], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: pText, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[7], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: ciText, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[8], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: dText, font: "Times New Roman", size: 22 })] })],
        }),
      ],
    });

    const row2 = new TableRow({
      children: [
        new TableCell({
          width: { size: colWidths[0], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.group2Stats.name, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[1], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: String(results.group2Stats.n), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[2], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.group2Stats.mean.toFixed(2), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[3], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: results.group2Stats.sd.toFixed(2), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[4], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[5], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[6], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[7], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[8], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 22 })] })],
        }),
      ],
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, row1, row2],
    });
  }

  // One-way ANOVA
  if (results.groups && Array.isArray(results.groups) && results.f !== undefined) {
    const headers = ["Gruppe", "N", "M", "SD", "F", "df1, df2", "p", "η²"];
    const colWidths = [2600, 900, 1100, 1100, 1000, 1100, 1000, 1000];

    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(
        (h, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: topBorder, bottom: headerBottomBorder, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: "Times New Roman", size: 22 })] })],
          })
      ),
    });

    const rows = results.groups.map((g: any, idx: number) => {
      const isLast = idx === results.groups.length - 1;
      const bStyle = isLast ? bottomBorder : noBorder;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: colWidths[0], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: g.name, font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[1], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: String(g.n), font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[2], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: g.mean.toFixed(2), font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[3], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: g.sd.toFixed(2), font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[4], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: idx === 0 ? results.f.toFixed(2) : "-", font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[5], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: idx === 0 ? `${results.dfBetween}, ${results.dfWithin}` : "-", font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[6], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: idx === 0 ? formatApaPValue(results.pValue) : "-", font: "Times New Roman", size: 22 })] })],
          }),
          new TableCell({
            width: { size: colWidths[7], type: WidthType.DXA },
            margins: cellMargins,
            borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [new TextRun({ text: idx === 0 ? results.etaSquared.toFixed(2) : "-", font: "Times New Roman", size: 22 })] })],
          }),
        ],
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...rows],
    });
  }

  // Correlation / General 2-column or 4-column summary
  const genericHeaders = ["Statistisk Parameter", "Verdi", "Tolkning", "APA 7 Kriterium"];
  const colWidths = [3000, 1800, 2600, 2400];

  const headerRow = new TableRow({
    tableHeader: true,
    children: genericHeaders.map(
      (h, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: topBorder, bottom: headerBottomBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: "Times New Roman", size: 22 })] })],
        })
    ),
  });

  const rawRows: { param: string; val: string; tolkn: string; krit: string }[] = [];
  if (results.r !== undefined) {
    rawRows.push({ param: "Korrelasjon (r)", val: results.r.toFixed(3), tolkn: Math.abs(results.r) > 0.5 ? "Sterk sammenheng" : Math.abs(results.r) > 0.3 ? "Moderat" : "Svak", krit: "-1.00 til +1.00" });
    rawRows.push({ param: "p-verdi", val: formatApaPValue(results.pValue), tolkn: results.pValue < 0.05 ? "Statistisk signifikant" : "Ikke-signifikant", krit: "p < .05" });
    rawRows.push({ param: "Forklart varians (r²)", val: `${((results.rSquared || (results.r * results.r)) * 100).toFixed(1)}%`, tolkn: "Andel delt varians", krit: "r² = r × r" });
    if (results.ciLower !== undefined) {
      rawRows.push({ param: "95% Konfidensintervall", val: `[${results.ciLower.toFixed(2)}, ${results.ciUpper.toFixed(2)}]`, tolkn: "Populasjonsparameter estimat", krit: "Inkluderer ikke 0" });
    }
  } else if (results.u !== undefined) {
    rawRows.push({ param: "Mann-Whitney U", val: results.u.toFixed(1), tolkn: "Ikke-parametrisk rangsum", krit: "U statistikk" });
    rawRows.push({ param: "Z-verdi", val: results.z.toFixed(2), tolkn: "Standardisert testobservator", krit: "|z| > 1.96 for p < .05" });
    rawRows.push({ param: "Asymptotisk p-verdi", val: formatApaPValue(results.pValue), tolkn: results.pValue < 0.05 ? "Signifikant forskjell i medianer" : "Ikke-signifikant", krit: "p < .05" });
    rawRows.push({ param: "Effektstørrelse (r = z / √N)", val: results.r.toFixed(2), tolkn: Math.abs(results.r) > 0.3 ? "Moderat effekt" : "Liten effekt", krit: ".10 = liten, .30 = medium, .50 = stor" });
  } else if (results.rSquared !== undefined && results.f !== undefined) {
    rawRows.push({ param: "Modell R²", val: results.rSquared.toFixed(3), tolkn: `${(results.rSquared * 100).toFixed(1)}% forklart varians`, krit: "0.00 til 1.00" });
    rawRows.push({ param: "F-test for modellen", val: `F(${results.df1 ?? 1}, ${results.df2 ?? results.df ?? 30}) = ${results.f.toFixed(2)}`, tolkn: "Samlet modellsignifikans", krit: "F > F_kritisk" });
    rawRows.push({ param: "Modell p-verdi", val: formatApaPValue(results.pValue), tolkn: results.pValue < 0.05 ? "Signifikant regresjonsmodell" : "Ikke signifikant", krit: "p < .05" });
  } else {
    rawRows.push({ param: "Testobservator", val: results.testStatistic || results.t || results.chiSquare || "-", tolkn: "Beregnet testverdi", krit: "Jf. tabellkritisk verdi" });
    rawRows.push({ param: "P-verdi", val: formatApaPValue(results.pValue), tolkn: results.pValue < 0.05 ? "Statistisk signifikant" : "Ikke signifikant", krit: "p < .05" });
  }

  const rows = rawRows.map((item, idx) => {
    const isLast = idx === rawRows.length - 1;
    const bStyle = isLast ? bottomBorder : noBorder;
    return new TableRow({
      children: [
        new TableCell({
          width: { size: colWidths[0], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: item.param, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[1], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: item.val, font: "Times New Roman", size: 22, bold: true })] })],
        }),
        new TableCell({
          width: { size: colWidths[2], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: item.tolkn, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: colWidths[3], type: WidthType.DXA },
          margins: cellMargins,
          borders: { top: noBorder, bottom: bStyle, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [new TextRun({ text: item.krit, font: "Times New Roman", size: 22, color: "64748b" })] })],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...rows],
  });
}

// -----------------------------------------------------------------------------
// 2. CLIENT-SIDE PDF EXPORT (APA 7 COMPLIANT VIA JSPDF & AUTOTABLE)
// -----------------------------------------------------------------------------

export async function exportToPdf(payload: ApaExportPayload): Promise<void> {
  const {
    testInfo,
    results,
    datasetName,
    apaNarrative,
    interpretation,
    assumptions,
    customTitle,
    authorName = "Forsker / Student",
    institution = "Institutt for samfunnsvitenskap og psykologi",
    includeTable = true,
    includeInterpretation = true,
    includeAssumptions = true,
    language = "no",
  } = payload;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54; // 0.75 in / 54pt
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    const pageNum = (doc as any).internal.getNumberOfPages();
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${testInfo.name.toUpperCase()} — APA 7 RAPPORT`, margin, 36);
    doc.text(`Side ${pageNum}`, pageWidth - margin, 36, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 42, pageWidth - margin, 42);
  };

  drawRunningHeader();

  // Document Title (APA 7 Header Style)
  const titleText = customTitle || `Statistisk Forskningsrapport: ${testInfo.name}`;
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(titleText, contentWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: "center" });
  y += titleLines.length * 20 + 8;

  // Author & Affiliation
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(`${authorName} • ${institution}`, pageWidth / 2, y, { align: "center" });
  y += 16;

  const dateStr = new Date().toLocaleDateString(language === "no" ? "no-NO" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Datasett: «${datasetName}» • Dato: ${dateStr} • Generert i henhold til APA 7`, pageWidth / 2, y, {
    align: "center",
  });
  y += 24;

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  // Section 1: Problemstilling & Hypoteser
  checkPageBreak(80);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(language === "no" ? "1. Problemstilling og Analysegrunnlag" : "1. Research Question and Rationale", margin, y);
  y += 16;

  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);

  const introText = language === "no"
    ? `For å undersøke problemstillingen «${testInfo.exampleQuestion}», ble det utført en ${testInfo.name.toLowerCase()} i henhold til retningslinjene i SPSS Survival Manual (Pallant, 2020). ${testInfo.whenToUse}`
    : `To investigate the research question "${testInfo.exampleQuestion}", a ${testInfo.name} was conducted in accordance with SPSS guidelines. ${testInfo.whenToUse}`;
  
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 14 + 10;

  // Hypotheses
  checkPageBreak(50);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text(`H₀: ${testInfo.h0}`, margin + 15, y);
  y += 14;
  doc.text(`H₁: ${testInfo.h1}`, margin + 15, y);
  y += 22;

  // Section 2: APA 7 Table via autoTable
  if (includeTable && results) {
    checkPageBreak(120);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(language === "no" ? "2. Statistiske Resultater (APA 7 Tabell)" : "2. Statistical Results (APA 7 Table)", margin, y);
    y += 16;

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("Table 1", margin, y);
    y += 13;

    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.text(`Descriptive Statistics and Analysis Results for ${testInfo.name}`, margin, y);
    y += 10;

    const { head, body } = getAutoTableData(testInfo, results);

    autoTable(doc, {
      startY: y,
      head: [head],
      body: body,
      theme: "plain",
      margin: { left: margin, right: margin },
      styles: {
        font: "times",
        fontSize: 9,
        cellPadding: 4,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fontStyle: "bold",
        textColor: [0, 0, 0],
        lineWidth: { top: 1.2, bottom: 0.8 },
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        lineWidth: 0,
      },
      didDrawPage: () => {
        drawRunningHeader();
      },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    // Draw APA bottom line on table
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Table Note
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const noteText = `Note. M = gjennomsnitt; SD = standardavvik; CI = 95% konfidensintervall; ${testInfo.effectSizeMetric} = effektstørrelse. *p < .05. **p < .01. ***p < .001.`;
    const noteLines = doc.splitTextToSize(noteText, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 11 + 16;
  }

  // Section 3: Resultatavsnitt (APA 7 narrative)
  checkPageBreak(90);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(language === "no" ? "3. Resultatbeskrivelse i Løpende Tekst (APA 7)" : "3. In-Text Narrative Results (APA 7)", margin, y);
  y += 16;

  // Shaded box for APA narrative
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);

  const narrativeLines = doc.splitTextToSize(`«${apaNarrative}»`, contentWidth - 24);
  const boxHeight = narrativeLines.length * 14 + 18;

  checkPageBreak(boxHeight + 10);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, "FD");

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(narrativeLines, margin + 12, y + 15);
  y += boxHeight + 18;

  // Section 4: Tolkning & Pedagogisk mening
  if (includeInterpretation && interpretation) {
    checkPageBreak(110);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(language === "no" ? "4. Tolkning og Betydning" : "4. Interpretation and Practical Meaning", margin, y);
    y += 16;

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("Hva resultatet betyr:", margin, y);
    y += 13;

    doc.setFont("times", "normal");
    const meansLines = doc.splitTextToSize(interpretation.whatItMeans, contentWidth);
    doc.text(meansLines, margin, y);
    y += meansLines.length * 13 + 10;

    checkPageBreak(60);
    doc.setFont("times", "bold");
    doc.text("Hva resultatet IKKE betyr:", margin, y);
    y += 13;

    doc.setFont("times", "normal");
    const notMeansLines = doc.splitTextToSize(interpretation.whatItDoesNotMean, contentWidth);
    doc.text(notMeansLines, margin, y);
    y += notMeansLines.length * 13 + 16;
  }

  // Section 5: Forutsetningskontroll
  if (includeAssumptions && assumptions && assumptions.length > 0) {
    checkPageBreak(90);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(language === "no" ? "5. Kontroll av Metodiske Forutsetninger" : "5. Methodological Assumptions Audit", margin, y);
    y += 16;

    assumptions.forEach((a) => {
      checkPageBreak(30);
      const isPassed = a.status === "met" || a.status === "passed";
      const tag = isPassed ? "✓ OPPFYLT" : a.status === "warning" ? "▲ ADVARSEL" : "✗ BRUDD";
      doc.setFont("times", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(isPassed ? 16 : a.status === "warning" ? 180 : 220, isPassed ? 120 : 80, isPassed ? 70 : 30);
      doc.text(`${tag} ${a.name}:`, margin, y);

      doc.setFont("times", "normal");
      doc.setTextColor(51, 65, 85);
      const expl = `${a.explanation} ${a.measuredValue ? `(Målt: ${a.measuredValue})` : ""}`;
      const lines = doc.splitTextToSize(expl, contentWidth - 140);
      doc.text(lines, margin + 140, y);
      y += lines.length * 13 + 6;
    });
    y += 10;
  }

  // SPSS menysti footer
  checkPageBreak(40);
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`SPSS Menysti: ${testInfo.spssMenuPath}`, margin, y);

  doc.save(`${testInfo.id}_APA7_Rapport.pdf`);
}

// Helper for autoTable columns and data
function getAutoTableData(testInfo: StatisticalTestInfo, results: any): { head: string[]; body: any[][] } {
  if (results.group1Stats && results.group2Stats) {
    const head = ["Gruppe", "N", "M", "SD", "t", "df", "p", "95% CI", "d"];
    const ciText = results.ciLower !== undefined ? `[${results.ciLower.toFixed(2)}, ${results.ciUpper.toFixed(2)}]` : "-";
    const body = [
      [
        results.group1Stats.name,
        String(results.group1Stats.n),
        results.group1Stats.mean.toFixed(2),
        results.group1Stats.sd.toFixed(2),
        results.t ? results.t.toFixed(2) : "-",
        String(results.df ?? "-"),
        formatApaPValue(results.pValue),
        ciText,
        results.cohensD !== undefined ? results.cohensD.toFixed(2) : "-",
      ],
      [
        results.group2Stats.name,
        String(results.group2Stats.n),
        results.group2Stats.mean.toFixed(2),
        results.group2Stats.sd.toFixed(2),
        "-",
        "-",
        "-",
        "-",
        "-",
      ],
    ];
    return { head, body };
  }

  if (results.groups && Array.isArray(results.groups) && results.f !== undefined) {
    const head = ["Gruppe", "N", "M", "SD", "F", "df", "p", "η²"];
    const body = results.groups.map((g: any, idx: number) => [
      g.name,
      String(g.n),
      g.mean.toFixed(2),
      g.sd.toFixed(2),
      idx === 0 ? results.f.toFixed(2) : "-",
      idx === 0 ? `${results.dfBetween}, ${results.dfWithin}` : "-",
      idx === 0 ? formatApaPValue(results.pValue) : "-",
      idx === 0 ? results.etaSquared.toFixed(2) : "-",
    ]);
    return { head, body };
  }

  // Fallback 2-column or 4-column key metrics
  const head = ["Statistisk Parameter", "Verdi", "Tolkning", "Kriterium"];
  const body: any[][] = [];

  if (results.r !== undefined) {
    body.push(["Korrelasjon (r)", results.r.toFixed(3), Math.abs(results.r) > 0.5 ? "Sterk" : "Moderat", "-1.00 til 1.00"]);
    body.push(["Signifikans (p)", formatApaPValue(results.pValue), results.pValue < 0.05 ? "Signifikant" : "Ikke-signifikant", "p < .05"]);
    body.push(["Delt varians (r²)", `${((results.rSquared || (results.r * results.r)) * 100).toFixed(1)}%`, "Effektstørrelse", "Andel varians"]);
    if (results.ciLower !== undefined) {
      body.push(["95% CI", `[${results.ciLower.toFixed(2)}, ${results.ciUpper.toFixed(2)}]`, "Populasjonsintervall", "Inkluderer ikke 0"]);
    }
  } else {
    body.push(["Testobservator", String(results.testStatistic || results.t || results.u || results.f || "-"), "Beregnet verdi", "-"]);
    body.push(["p-verdi", formatApaPValue(results.pValue), results.pValue < 0.05 ? "Signifikant" : "Ikke signifikant", "p < .05"]);
    body.push(["Effektstørrelse", String(results.effectSize || results.r || results.cohensD || testInfo.effectSizeMetric), "Standardisert styrke", "-"]);
  }

  return { head, body };
}

// -----------------------------------------------------------------------------
// 3. CLIENT-SIDE CSV EXPORT (APA 7 COMPLIANT CSV SPECIFICATION)
// -----------------------------------------------------------------------------

export function exportToCsv(payload: ApaExportPayload): void {
  const { testInfo, results, datasetName, apaNarrative } = payload;

  const rows: string[][] = [];

  // Metadata headers
  rows.push(["# APA 7 STATISTICAL EXPORT REPORT"]);
  rows.push(["Test:", `"${testInfo.name}"`]);
  rows.push(["Datasett:", `"${datasetName}"`]);
  rows.push(["Dato:", `"${new Date().toISOString().split("T")[0]}"`]);
  rows.push(["SPSS Menysti:", `"${testInfo.spssMenuPath}"`]);
  rows.push(["APA 7 Narrative:", `"${apaNarrative.replace(/"/g, '""')}"`]);
  rows.push([]); // blank line

  // Primary Table
  if (results) {
    if (results.group1Stats && results.group2Stats) {
      rows.push(["Group", "N", "Mean", "StdDev", "t", "df", "pValue", "CI_Lower", "CI_Upper", "Cohens_d"]);
      rows.push([
        `"${results.group1Stats.name}"`,
        String(results.group1Stats.n),
        results.group1Stats.mean.toFixed(4),
        results.group1Stats.sd.toFixed(4),
        results.t ? results.t.toFixed(4) : "",
        String(results.df ?? ""),
        results.pValue !== undefined ? results.pValue.toFixed(6) : "",
        results.ciLower !== undefined ? results.ciLower.toFixed(4) : "",
        results.ciUpper !== undefined ? results.ciUpper.toFixed(4) : "",
        results.cohensD !== undefined ? results.cohensD.toFixed(4) : "",
      ]);
      rows.push([
        `"${results.group2Stats.name}"`,
        String(results.group2Stats.n),
        results.group2Stats.mean.toFixed(4),
        results.group2Stats.sd.toFixed(4),
        "", "", "", "", "", "",
      ]);
    } else if (results.groups && Array.isArray(results.groups)) {
      rows.push(["Group", "N", "Mean", "StdDev", "F", "dfBetween", "dfWithin", "pValue", "EtaSquared"]);
      results.groups.forEach((g: any, i: number) => {
        rows.push([
          `"${g.name}"`,
          String(g.n),
          g.mean.toFixed(4),
          g.sd.toFixed(4),
          i === 0 && results.f !== undefined ? results.f.toFixed(4) : "",
          i === 0 ? String(results.dfBetween ?? "") : "",
          i === 0 ? String(results.dfWithin ?? "") : "",
          i === 0 && results.pValue !== undefined ? results.pValue.toFixed(6) : "",
          i === 0 && results.etaSquared !== undefined ? results.etaSquared.toFixed(4) : "",
        ]);
      });
    } else {
      rows.push(["Parameter", "Value"]);
      Object.entries(results).forEach(([k, v]) => {
        if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
          rows.push([`"${k}"`, `"${String(v)}"`]);
        }
      });
    }
  }

  // Convert to CSV string with UTF-8 BOM
  const csvContent = "\ufeff" + rows.map((r) => r.join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${testInfo.id}_APA7_Data.csv`);
}
