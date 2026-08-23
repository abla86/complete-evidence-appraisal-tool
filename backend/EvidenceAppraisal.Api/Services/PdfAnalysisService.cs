using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using DocumentFormat.OpenXml.Packaging;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;
using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

// Retained name for API compatibility; the service now analyses supported research-document formats.
public sealed class PdfAnalysisService
{
    public const long MaxFileSizeBytes = 25 * 1024 * 1024;

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
                ["Limitations"] = ["limitations", "limitations of the study", "strengths and limitations"],
                ["Conflicts/funding"] = ["conflict of interest", "funding", "sponsor"]
            },
            ["agree2"] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Scope and purpose"] = ["scope", "purpose", "objectives", "health question"],
                ["Stakeholder involvement"] = ["stakeholder", "patient", "user involvement", "target population"],
                ["Rigour of development"] = ["systematic literature search", "evidence review", "recommendation development", "external review"],
                ["Clarity of presentation"] = ["recommendation", "recommendations", "clearly presented"],
                ["Applicability"] = ["barriers", "facilitators", "resources", "implementation"],
                ["Editorial independence"] = ["editorial independence", "funding", "conflict of interest"]
            },
            ["grade"] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Risk of bias"] = ["risk of bias", "RoB 2", "ROBINS-I"],
                ["Inconsistency"] = ["inconsistency", "heterogeneity", "I2", "I²"],
                ["Indirectness"] = ["indirectness", "indirect", "population", "intervention", "comparator", "outcome"],
                ["Imprecision"] = ["imprecision", "confidence interval", "95% CI", "95% confidence interval"],
                ["Publication bias"] = ["publication bias", "funnel plot", "small-study effects"],
                ["Certainty"] = ["GRADE", "certainty of evidence", "high certainty", "moderate certainty", "low certainty", "very low certainty"]
            }
        };

    public async Task<PdfAnalysisResult> AnalyzeAsync(IFormFile file, IReadOnlyCollection<string> instruments, bool includePageText, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            throw new ArgumentException("A non-empty research document is required.");
        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException("The document exceeds the 25 MB upload limit.");

        var extension = Path.GetExtension(file.FileName);
        var supported = new[] { ".pdf", ".docx", ".txt", ".html", ".htm", ".xml" };
        if (!supported.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("Supported document formats: PDF, DOCX, TXT, HTML/HTM and XML/JATS.");

        await using var input = new MemoryStream();
        await file.CopyToAsync(input, cancellationToken);
        var bytes = input.ToArray();
        ValidateSignature(extension, bytes);

        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var selected = instruments
            .Where(x => Rules.ContainsKey(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var warnings = new List<string>();
        if (selected.Length == 0)
            warnings.Add("No supported appraisal instrument was selected.");

        var pages = ExtractPages(extension, bytes);
        var findings = FindEvidence(pages, selected);

        if (pages.Count == 0 || pages.All(x => string.IsNullOrWhiteSpace(x.Text)))
            warnings.Add("No selectable text was extracted. A scanned/image-only document may require OCR before reliable analysis.");
        if (extension.Equals(".xml", StringComparison.OrdinalIgnoreCase))
            warnings.Add("XML/JATS structure is preserved only as extracted text in this version; verify section/table context in the source document.");
        if (findings.Count > 0)
            warnings.Add("Findings are text-location candidates, not completed appraisal judgements. A researcher must verify the cited location and context.");

        return new PdfAnalysisResult(
            file.FileName,
            pages.Count,
            file.Length,
            hash,
            pages.Any(x => !string.IsNullOrWhiteSpace(x.Text)) ? "Text extracted" : "No selectable text",
            selected,
            findings,
            includePageText ? pages : Array.Empty<PdfPageText>(),
            warnings,
            "Document analysis locates potentially relevant passages. It does not decide AMSTAR 2, CASP, AGREE II or GRADE judgements and must not be treated as an automatic scientific appraisal.");
    }

    private static List<PdfPageText> ExtractPages(string extension, byte[] bytes)
    {
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            using var document = PdfDocument.Open(new MemoryStream(bytes, writable: false));
            return document.GetPages()
                .Select(page => new PdfPageText(page.Number, ContentOrderTextExtractor.GetText(page)?.Trim() ?? string.Empty))
                .ToList();
        }

        var text = extension.Equals(".docx", StringComparison.OrdinalIgnoreCase)
            ? ExtractDocx(bytes)
            : extension.Equals(".xml", StringComparison.OrdinalIgnoreCase)
                ? ExtractXml(bytes)
                : Encoding.UTF8.GetString(bytes);

        if (extension.Equals(".html", StringComparison.OrdinalIgnoreCase) || extension.Equals(".htm", StringComparison.OrdinalIgnoreCase))
            text = Regex.Replace(text, "<[^>]+>", " ");

        text = Regex.Replace(text, @"\s+", " ").Trim();
        return string.IsNullOrWhiteSpace(text) ? new List<PdfPageText>() : [new PdfPageText(1, text)];
    }

    private static string ExtractDocx(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes, writable: false);
        using var document = WordprocessingDocument.Open(stream, false);
        return string.Join("\n", document.MainDocumentPart?.Document.Body?.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>().Select(x => x.Text) ?? []);
    }

    private static string ExtractXml(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes, writable: false);
        var xml = XDocument.Load(stream, LoadOptions.PreserveWhitespace);
        return string.Join(" ", xml.DescendantNodes().OfType<XText>().Select(x => x.Value));
    }

    private static List<EvidenceFinding> FindEvidence(IEnumerable<PdfPageText> pages, IEnumerable<string> selected)
    {
        var findings = new List<EvidenceFinding>();
        foreach (var page in pages)
        {
            var text = page.Text;
            foreach (var instrument in selected)
            foreach (var rule in Rules[instrument])
            {
                var match = rule.Value.FirstOrDefault(term => text.Contains(term, StringComparison.OrdinalIgnoreCase));
                if (match is null) continue;
                findings.Add(new EvidenceFinding(instrument, rule.Key, page.Page, match, BuildExcerpt(text, match)));
            }
        }
        return findings;
    }

    private static void ValidateSignature(string extension, byte[] bytes)
    {
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            if (bytes.Length < 5 || Encoding.ASCII.GetString(bytes, 0, 5) != "%PDF-")
                throw new ArgumentException("The uploaded file does not have a valid PDF signature.");
            return;
        }

        if (extension.Equals(".docx", StringComparison.OrdinalIgnoreCase) && (bytes.Length < 4 || bytes[0] != 0x50 || bytes[1] != 0x4B))
            throw new ArgumentException("The uploaded DOCX file is not a valid Office package.");
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
