using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using DocumentFormat.OpenXml.Packaging;
using EvidenceAppraisal.Api.Models;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace EvidenceAppraisal.Api.Services;

public sealed class DocumentAnalysisService
{
    public const long MaxFileSizeBytes = 25 * 1024 * 1024;
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".docx", ".txt", ".html", ".htm", ".xml" };

    private static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string[]>> Rules =
        new Dictionary<string, IReadOnlyDictionary<string, string[]>>(StringComparer.OrdinalIgnoreCase)
        {
            ["amstar2"] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Protocol/registration"] = ["PROSPERO", "protocol", "registration", "registered"],
                ["Search strategy"] = ["search strategy", "MEDLINE", "PubMed", "Embase", "Cochrane Library"],
                ["Study selection"] = ["two reviewers", "two authors", "independent reviewers", "independently screened"],
                ["Data extraction"] = ["data extraction", "two reviewers", "independently extracted"],
                ["Risk of bias"] = ["risk of bias", "RoB 2", "ROBINS-I", "quality assessment"],
                ["Publication bias"] = ["publication bias", "funnel plot", "Egger"],
                ["Funding/conflicts"] = ["funding", "financial support", "conflict of interest", "competing interests"]
            },
            ["casp"] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Study aim"] = ["aim", "objective", "research question"],
                ["Methods"] = ["methods", "methodology", "study design"],
                ["Recruitment"] = ["recruitment", "participants", "sample"],
                ["Results"] = ["results", "findings", "outcome"],
                ["Limitations"] = ["limitations", "strengths and limitations"],
                ["Conflicts/funding"] = ["conflict of interest", "funding", "sponsor"]
            },
            ["agree2"] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Scope and purpose"] = ["scope", "purpose", "objectives", "health question"],
                ["Stakeholder involvement"] = ["stakeholder", "patient", "user involvement", "target population"],
                ["Rigour of development"] = ["systematic literature search", "evidence review", "recommendation development", "external review"],
                ["Clarity of presentation"] = ["recommendation", "clearly presented"],
                ["Applicability"] = ["barriers", "facilitators", "resources", "implementation"],
                ["Editorial independence"] = ["editorial independence", "funding", "conflict of interest"]
            },
            ["grade"] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Risk of bias"] = ["risk of bias", "RoB 2", "ROBINS-I"],
                ["Inconsistency"] = ["inconsistency", "heterogeneity", "I2", "I²"],
                ["Indirectness"] = ["indirectness", "population", "intervention", "comparator", "outcome"],
                ["Imprecision"] = ["imprecision", "confidence interval", "95% CI", "95% confidence interval"],
                ["Publication bias"] = ["publication bias", "funnel plot", "small-study effects"],
                ["Certainty"] = ["GRADE", "certainty of evidence", "high certainty", "moderate certainty", "low certainty", "very low certainty"]
            }
        };

    public async Task<DocumentAnalysisResult> AnalyzeAsync(IFormFile file, IReadOnlyCollection<string> instruments, bool includeSourceText, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) throw new ArgumentException("A non-empty research document is required.");
        if (file.Length > MaxFileSizeBytes) throw new ArgumentException("The document exceeds the 25 MB upload limit.");
        var extension = Path.GetExtension(file.FileName);
        if (!SupportedExtensions.Contains(extension)) throw new ArgumentException("Supported formats: PDF, DOCX, TXT, HTML and XML/JATS.");

        await using var input = new MemoryStream();
        await file.CopyToAsync(input, cancellationToken);
        var bytes = input.ToArray();
        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var selected = instruments.Where(Rules.ContainsKey).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (selected.Length == 0) throw new ArgumentException("Select at least one supported appraisal instrument.");

        var warnings = new List<string>();
        var pages = new List<DocumentSourceUnit>();
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            using var document = PdfDocument.Open(new MemoryStream(bytes, writable: false));
            foreach (var page in document.GetPages())
            {
                cancellationToken.ThrowIfCancellationRequested();
                pages.Add(new DocumentSourceUnit(page.Number, ContentOrderTextExtractor.GetText(page)?.Trim() ?? string.Empty));
            }
        }
        else
        {
            var text = ExtractText(bytes, extension);
            pages.Add(new DocumentSourceUnit(1, text.Trim()));
        }

        var findings = new List<EvidenceFinding>();
        foreach (var unit in pages)
        {
            foreach (var instrument in selected)
            {
                foreach (var rule in Rules[instrument])
                {
                    foreach (var term in rule.Value)
                    {
                        if (!unit.Text.Contains(term, StringComparison.OrdinalIgnoreCase)) continue;
                        findings.Add(new EvidenceFinding(instrument, rule.Key, unit.Page, term, BuildExcerpt(unit.Text, term)));
                        break;
                    }
                }
            }
        }

        var hasText = pages.Any(x => !string.IsNullOrWhiteSpace(x.Text));
        if (!hasText) warnings.Add("No selectable text was extracted. The document may be scanned/image-only and may require OCR before reliable analysis.");
        if (findings.Count > 0) warnings.Add("Findings are candidate text locations, not completed appraisal judgements. Verify the cited source and surrounding context.");
        if (extension.Equals(".xml", StringComparison.OrdinalIgnoreCase)) warnings.Add("XML/JATS structure is preserved only as extracted text in this first-pass analysis; validate article metadata and section semantics before appraisal.");

        return new DocumentAnalysisResult(
            file.FileName, extension.TrimStart('.').ToUpperInvariant(), pages.Count, file.Length, hash,
            hasText ? "Text extracted" : "No selectable text", selected, findings,
            includeSourceText ? pages : Array.Empty<DocumentSourceUnit>(), warnings,
            "Document analysis locates potentially relevant passages. It does not decide AMSTAR 2, CASP, AGREE II or GRADE judgements and must not be treated as an automatic scientific appraisal.");
    }

    private static string ExtractText(byte[] bytes, string extension) => extension.ToLowerInvariant() switch
    {
        ".txt" => Encoding.UTF8.GetString(bytes),
        ".docx" => ExtractDocx(bytes),
        ".html" or ".htm" => StripMarkup(Encoding.UTF8.GetString(bytes)),
        ".xml" => ExtractXml(bytes),
        _ => throw new ArgumentException("Unsupported document format.")
    };

    private static string ExtractDocx(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes, writable: false);
        using var document = WordprocessingDocument.Open(stream, false);
        return document.MainDocumentPart?.Document?.Body?.InnerText ?? string.Empty;
    }

    private static string ExtractXml(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes, writable: false);
        var doc = XDocument.Load(stream, LoadOptions.PreserveWhitespace);
        return string.Join(" ", doc.DescendantNodes().OfType<XText>().Select(x => x.Value));
    }

    private static string StripMarkup(string html)
    {
        var withoutScripts = Regex.Replace(html, @"<(script|style)[^>]*>.*?</\1>", " ", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return System.Net.WebUtility.HtmlDecode(Regex.Replace(withoutScripts, "<[^>]+>", " "));
    }

    private static string BuildExcerpt(string text, string term)
    {
        var index = text.IndexOf(term, StringComparison.OrdinalIgnoreCase);
        if (index < 0) return string.Empty;
        var start = Math.Max(0, index - 180);
        var length = Math.Min(text.Length - start, term.Length + 360);
        return text.Substring(start, length).Replace('\n', ' ').Trim();
    }
}
