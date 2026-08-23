using System.Globalization;
using System.Text;
using System.Text.Json;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using EvidenceAppraisal.Api.Models;
using MigraDoc.DocumentObjectModel;
using MigraDoc.Rendering;

namespace EvidenceAppraisal.Api.Services;

public sealed class ImplementationExportService
{
    public ExportFile ExportJson(ImplementationAssessment assessment)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(new
        {
            exportSchema = "evidence-appraisal-tool/implementation/v1",
            exportedAtUtc = DateTime.UtcNow,
            assessment,
            methodologicalNotice = "Researcher-entered CFIR/KTA data. The export is not a validated scientific conclusion and must be interpreted with the official framework guidance."
        }, new JsonSerializerOptions { WriteIndented = true });
        return new ExportFile(bytes, "application/json", "json");
    }

    public ExportFile ExportCsv(ImplementationAssessment assessment)
    {
        var rows = assessment.Kta.Actions.Select(a => new[]
        {
            a.Id.ToString(), a.Title, a.Description, a.KtaPhaseNumber.ToString(CultureInfo.InvariantCulture),
            a.OwnerCode, a.DueDateUtc?.ToString("O", CultureInfo.InvariantCulture) ?? string.Empty,
            a.Status.ToString(), string.Join("; ", a.LinkedCfirConstructKeys)
        });
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", new[] { "Id", "Title", "Description", "KtaPhase", "OwnerCode", "DueDateUtc", "Status", "LinkedCFIRConstructs" }.Select(Csv)));
        foreach (var row in rows) sb.AppendLine(string.Join(",", row.Select(Csv)));
        return new ExportFile(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv; charset=utf-8", "csv");
    }

    public ExportFile ExportXlsx(ImplementationAssessment assessment)
    {
        using var stream = new MemoryStream();
        using (var doc = SpreadsheetDocument.Create(stream, SpreadsheetDocumentType.Workbook))
        {
            var workbookPart = doc.AddWorkbookPart();
            workbookPart.Workbook = new Workbook();
            var worksheetPart = workbookPart.AddNewPart<WorksheetPart>();
            var sheetData = new SheetData();
            worksheetPart.Worksheet = new Worksheet(sheetData);

            AppendRow(sheetData, "KTA Actions", "Description", "KTA Phase", "Owner", "Due date", "Status", "Linked CFIR constructs");
            foreach (var action in assessment.Kta.Actions)
                AppendRow(sheetData, action.Title, action.Description, action.KtaPhaseNumber.ToString(CultureInfo.InvariantCulture), action.OwnerCode,
                    action.DueDateUtc?.ToString("O", CultureInfo.InvariantCulture) ?? string.Empty, action.Status.ToString(), string.Join("; ", action.LinkedCfirConstructKeys));

            var sheets = workbookPart.Workbook.AppendChild(new Sheets());
            sheets.Append(new Sheet { Id = workbookPart.GetIdOfPart(worksheetPart), SheetId = 1, Name = "KTA Actions" });
            workbookPart.Workbook.Save();
        }
        return new ExportFile(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
    }

    public ExportFile ExportDocx(ImplementationAssessment assessment)
    {
        using var stream = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
        {
            var main = doc.AddMainDocumentPart();
            main.Document = new DocumentFormat.OpenXml.Wordprocessing.Document(
                new DocumentFormat.OpenXml.Wordprocessing.Body());
            var body = main.Document.Body!;
            body.Append(new DocumentFormat.OpenXml.Wordprocessing.Paragraph(
                new DocumentFormat.OpenXml.Wordprocessing.Run(
                    new DocumentFormat.OpenXml.Wordprocessing.Text("CFIR 2.0 + KTA implementation record"))));
            body.Append(new DocumentFormat.OpenXml.Wordprocessing.Paragraph(
                new DocumentFormat.OpenXml.Wordprocessing.Run(
                    new DocumentFormat.OpenXml.Wordprocessing.Text($"Innovation: {assessment.Cfir.InnovationName}"))));
            body.Append(new DocumentFormat.OpenXml.Wordprocessing.Paragraph(
                new DocumentFormat.OpenXml.Wordprocessing.Run(
                    new DocumentFormat.OpenXml.Wordprocessing.Text($"Project: {assessment.Kta.ProjectName}"))));
            foreach (var action in assessment.Kta.Actions)
            {
                body.Append(new DocumentFormat.OpenXml.Wordprocessing.Paragraph(
                    new DocumentFormat.OpenXml.Wordprocessing.Run(
                        new DocumentFormat.OpenXml.Wordprocessing.Text($"{action.Title} — phase {action.KtaPhaseNumber} — {action.Status}"))));
                body.Append(new DocumentFormat.OpenXml.Wordprocessing.Paragraph(
                    new DocumentFormat.OpenXml.Wordprocessing.Run(
                        new DocumentFormat.OpenXml.Wordprocessing.Text(action.Description))));
                body.Append(new DocumentFormat.OpenXml.Wordprocessing.Paragraph(
                    new DocumentFormat.OpenXml.Wordprocessing.Run(
                        new DocumentFormat.OpenXml.Wordprocessing.Text($"CFIR links: {string.Join(", ", action.LinkedCfirConstructKeys)}"))));
            }
            main.Document.Save();
        }
        return new ExportFile(stream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx");
    }

    public ExportFile ExportPdf(ImplementationAssessment assessment)
    {
        var document = new Document();
        var section = document.AddSection();
        section.PageSetup.TopMargin = Unit.FromCentimeter(2);
        section.PageSetup.BottomMargin = Unit.FromCentimeter(2);
        section.AddParagraph("CFIR 2.0 + KTA implementation record").Format.Font.Size = 18;
        section.AddParagraph($"Innovation: {assessment.Cfir.InnovationName}");
        section.AddParagraph($"Project: {assessment.Kta.ProjectName}");
        foreach (var action in assessment.Kta.Actions)
        {
            section.AddParagraph($"{action.Title} — phase {action.KtaPhaseNumber} — {action.Status}").Format.Font.Bold = true;
            section.AddParagraph(action.Description);
            section.AddParagraph($"CFIR links: {string.Join(", ", action.LinkedCfirConstructKeys)}");
        }
        section.AddParagraph("Methodological notice: this report contains researcher-entered documentation and does not constitute an automatic implementation-effectiveness judgement.");

        using var stream = new MemoryStream();
        var renderer = new PdfDocumentRenderer { Document = document };
        renderer.RenderDocument();
        renderer.PdfDocument.Save(stream, false);
        return new ExportFile(stream.ToArray(), "application/pdf", "pdf");
    }

    public ExportFile ExportCsv(ImplementationAssessmentSnapshot snapshot) => ExportCsv(Map(snapshot));
    public ExportFile ExportXlsx(ImplementationAssessmentSnapshot snapshot) => ExportXlsx(Map(snapshot));
    public ExportFile ExportDocx(ImplementationAssessmentSnapshot snapshot) => ExportDocx(Map(snapshot));
    public ExportFile ExportPdf(ImplementationAssessmentSnapshot snapshot) => ExportPdf(Map(snapshot));

    private static ImplementationAssessment Map(ImplementationAssessmentSnapshot snapshot)
    {
        return new ImplementationAssessment
        {
            Cfir = new CfirAssessment
            {
                Id = snapshot.Cfir.Id,
                InnovationName = snapshot.Cfir.InnovationName,
                InnerSetting = snapshot.Cfir.InnerSetting,
                OuterSetting = snapshot.Cfir.OuterSetting,
                ReviewerCode = snapshot.Cfir.ReviewerCode,
                SecondReviewerCode = snapshot.Cfir.SecondReviewerCode,
                ConsensusReviewerCode = snapshot.Cfir.ConsensusReviewerCode,
                ConsensusStatus = snapshot.Cfir.ConsensusStatus,
                ConsensusRationale = snapshot.Cfir.ConsensusRationale,
                CfirVersion = snapshot.Cfir.CfirVersion,
                AssessmentDateUtc = snapshot.Cfir.AssessmentDateUtc,
                Status = snapshot.Cfir.Status,
                Items = snapshot.Cfir.Items.Select(x => new CfirAssessmentItem
                {
                    Domain = Enum.Parse<CfirDomain>(x.Domain),
                    Construct = x.Construct,
                    Influence = Enum.Parse<CfirInfluence>(x.Influence),
                    EvidenceSummary = x.EvidenceSummary,
                    Rationale = x.Rationale,
                    EvidenceLocation = x.EvidenceLocation
                }).ToArray()
            },
            Kta = new KtaAssessment
            {
                Id = snapshot.Kta.Id,
                ProjectName = snapshot.Kta.ProjectName,
                ReviewerCode = snapshot.Kta.ReviewerCode,
                KtaFrameworkVersion = snapshot.Kta.KtaFrameworkVersion,
                AssessmentDateUtc = snapshot.Kta.AssessmentDateUtc,
                Status = snapshot.Kta.Status,
                Phases = snapshot.Kta.Phases.Select(x => new KtaPhase
                {
                    Number = x.Number,
                    Name = x.Name,
                    Status = Enum.Parse<KtaPhaseStatus>(x.Status),
                    Documentation = x.Documentation
                }).ToArray(),
                Actions = snapshot.Kta.Actions.Select(x => new ImplementationAction
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = x.Description,
                    KtaPhaseNumber = x.KtaPhaseNumber,
                    OwnerCode = x.OwnerCode,
                    DueDateUtc = x.DueDateUtc,
                    Status = Enum.Parse<ImplementationActionStatus>(x.Status),
                    LinkedCfirConstructKeys = x.CfirLinks.Select(l => l.CfirConstructKey).ToArray()
                }).ToArray()
            }
        };
    }

    private static string Csv(string value) => $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";

    private static void AppendRow(SheetData sheetData, params string[] values)
    {
        var row = new Row();
        foreach (var value in values)
            row.Append(new Cell { CellValue = new CellValue(value), DataType = CellValues.String });
        sheetData.Append(row);
    }
}

public sealed record ExportFile(byte[] Content, string ContentType, string Extension);
