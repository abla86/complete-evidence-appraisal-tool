using System.Security.Cryptography;
using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;
using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

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
            throw new ArgumentException("A non-empty PDF file is required.");
        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException("PDF exceeds the 25 MB upload limit.");
        if (!string.Equals(Path.GetExtension(file.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Only PDF files are accepted.");

        await using var input = new MemoryStream();
        await file.CopyToAsync(input, cancellationToken);
        var bytes = input.ToArray();
        if (bytes.Length < 5 || Encoding.ASCII.GetString(bytes, 0, 5) != "%PDF-")
            throw new ArgumentException("The uploaded file does not have a valid PDF signature.");

        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var selected = instruments
            .Where(x => Rules.ContainsKey(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var warnings = new List<string>();
        if (selected.Length == 0)
            warnings.Add("No supported appraisal instrument was selected.");

        var pages = new List<PdfPageText>();
        var findings = new List<EvidenceFinding>();
        using var document = PdfDocument.Open(new MemoryStream(bytes, writable: false));

        foreach (var page in document.GetPages())
        {
            cancellationToken.ThrowIfCancellationRequested();
            var text = ContentOrderTextExtractor.GetText(page) ?? string.Empty;
            var normalized = text.Trim();
            if (includePageText)
                pages.Add(new PdfPageText(page.Number, normalized));

            foreach (var instrument in selected)
            {
                foreach (var rule in Rules[instrument])
                {
                    var match = rule.Value.FirstOrDefault(term => normalized.Contains(term, StringComparison.OrdinalIgnoreCase));
                    if (match is null) continue;
                    findings.Add(new EvidenceFinding(
                        instrument,
                        rule.Key,
                        page.Number,
                        match,
                        BuildExcerpt(normalized, match)));
                }
            }
        }

        if (pages.Count == 0 && findings.Count == 0)
            warnings.Add("No selectable text was extracted. The PDF may be scanned/image-only and may require OCR before reliable document analysis.");
        if (findings.Count > 0)
            warnings.Add("Findings are text-location candidates, not completed appraisal judgements. A researcher must verify the cited page and context.");

        return new PdfAnalysisResult(
            file.FileName,
            document.NumberOfPages,
            file.Length,
            hash,
            findings.Count == 0 && pages.Count == 0 ? "No selectable text" : "Text extracted",
            selected,
            findings,
            pages,
            warnings,
            "Document analysis locates potentially relevant passages. It does not decide AMSTAR 2, CASP, AGREE II or GRADE judgements and must not be treated as an automatic scientific appraisal.");
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
