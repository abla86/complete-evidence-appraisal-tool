using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using DocumentFormat.OpenXml.Packaging;
using EvidenceAppraisal.Api.Models;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace EvidenceAppraisal.Api.Services;

public sealed class DocumentAnalysisService
{
    public const long MaxFileSizeBytes = 25 * 1024 * 1024;
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".docx", ".txt", ".html", ".htm", ".xml", ".jats" };

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
        ValidateSignature(extension, bytes);

        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var selected = instruments.Where(Rules.ContainsKey).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        // Instrument selection is optional at analysis time: classification must precede instrument choice.\n        // An empty selection means classify and recommend; it must not default to AMSTAR 2 or another tool.

        var warnings = new List<string>();
        var sourceUnits = ExtractSourceUnits(extension, bytes, cancellationToken);
        var combinedText = string.Join("\n", sourceUnits.Select(x => x.Text));
        var classification = ClassifyDocument(file.FileName, combinedText);
        var suitability = EvaluateSuitability(selected, classification.DocumentType);
        var findings = FindEvidence(sourceUnits, selected);
        var hasText = sourceUnits.Any(x => !string.IsNullOrWhiteSpace(x.Text));

        if (!hasText) warnings.Add("No selectable text was extracted. The document may be scanned/image-only and may require OCR before reliable analysis.");
        if (extension.Equals(".xml", StringComparison.OrdinalIgnoreCase) || extension.Equals(".jats", StringComparison.OrdinalIgnoreCase))
            warnings.Add("XML/JATS structure is used for text extraction, but section/table semantics are not yet preserved as structured fields. Verify context in the original article.");
        if (findings.Count > 0) warnings.Add("Findings are candidate text locations, not completed appraisal judgements. Verify the cited source and surrounding context.");
        if (findings.Count == 0) warnings.Add("No candidate passage was identified. This is not evidence that the criterion is absent; inspect the original document and supplementary material manually.");
        foreach (var item in suitability.Where(x => x.Status is "Caution" or "Not suitable")) warnings.Add($"{item.Instrument}: {item.Reason}");

        return new DocumentAnalysisResult(
            file.FileName,
            classification.DocumentType,
            sourceUnits.Count,
            file.Length,
            hash,
            hasText ? "Text extracted" : "No selectable text",
            selected,
            findings,
            includeSourceText ? sourceUnits : Array.Empty<DocumentSourceUnit>(),
            warnings.Distinct().ToArray(),
            classification,
            suitability,
            "Automated analysis identifies candidate evidence locations only. It never converts a missing text match into a No judgement. The researcher must verify the original source, context, supplement/protocol where relevant, and the authorised instrument before making a final appraisal.");
    }

    private static List<DocumentSourceUnit> ExtractSourceUnits(string extension, byte[] bytes, CancellationToken cancellationToken)
    {
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            using var document = PdfDocument.Open(new MemoryStream(bytes, writable: false));
            var pages = new List<DocumentSourceUnit>();
            foreach (var page in document.GetPages())
            {
                cancellationToken.ThrowIfCancellationRequested();
                pages.Add(new DocumentSourceUnit(page.Number, ContentOrderTextExtractor.GetText(page)?.Trim() ?? string.Empty));
            }
            return pages;
        }

        var text = ExtractText(bytes, extension);
        return [new DocumentSourceUnit(1, text.Trim())];
    }

    private static string ExtractText(byte[] bytes, string extension) => extension.ToLowerInvariant() switch
    {
        ".txt" => Encoding.UTF8.GetString(bytes),
        ".docx" => ExtractDocx(bytes),
        ".html" or ".htm" => StripMarkup(Encoding.UTF8.GetString(bytes)),
        ".xml" or ".jats" => ExtractXml(bytes),
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
        var settings = new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Ignore,
            XmlResolver = null,
            IgnoreComments = true,
            IgnoreWhitespace = false
        };
        using var reader = XmlReader.Create(stream, settings);
        var doc = XDocument.Load(reader, LoadOptions.PreserveWhitespace);
        return string.Join(" ", doc.DescendantNodes().OfType<XText>().Select(x => x.Value));
    }

    private static string StripMarkup(string html)
    {
        var withoutScripts = Regex.Replace(html, @"<(script|style)[^>]*>.*?</\1>", " ", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return System.Net.WebUtility.HtmlDecode(Regex.Replace(withoutScripts, "<[^>]+>", " "));
    }

    private static DocumentClassification ClassifyDocument(string fileName, string text)
    {
        var corpus = $"{fileName}\n{text}";
        var signals = new List<string>();
        var systematicReview = ContainsAny(corpus, "systematic review", "systematic literature review", "meta-analysis", "meta analysis", "PRISMA");
        var guideline = ContainsAny(corpus, "clinical practice guideline", "practice guideline", "clinical guideline", "guideline development", "recommendation development", "AGREE II");
        var protocol = ContainsAny(corpus, "study protocol", "protocol for", "protocol registration", "PROSPERO") && !systematicReview;
        var qualitative = ContainsAny(corpus, "qualitative study", "thematic analysis", "phenomenological", "grounded theory", "focus group");
        var primaryTrial = ContainsAny(corpus, "randomized controlled trial", "randomised controlled trial", "randomized trial", "randomised trial", "RCT");
        var diagnostic = ContainsAny(corpus, "diagnostic accuracy", "sensitivity and specificity", "QUADAS-2");

        if (systematicReview) signals.Add("systematic-review/meta-analysis terminology detected");
        if (guideline) signals.Add("guideline terminology detected");
        if (protocol) signals.Add("protocol terminology detected");
        if (qualitative) signals.Add("qualitative-research terminology detected");
        if (primaryTrial) signals.Add("randomized-trial terminology detected");
        if (diagnostic) signals.Add("diagnostic-accuracy terminology detected");

        string type;
        string confidence;
        if (guideline && systematicReview) { type = "Guideline with evidence review"; confidence = "Moderate"; }
        else if (guideline) { type = "Clinical practice guideline"; confidence = "High"; }
        else if (systematicReview) { type = "Systematic review / meta-analysis"; confidence = "High"; }
        else if (protocol) { type = "Research protocol"; confidence = "Moderate"; }
        else if (diagnostic) { type = "Diagnostic accuracy study"; confidence = "Moderate"; }
        else if (qualitative) { type = "Qualitative research"; confidence = "Moderate"; }
        else if (primaryTrial) { type = "Randomized trial"; confidence = "Moderate"; }
        else { type = "Research document (type not confidently classified)"; confidence = "Low"; }

        var notice = "Document type is a heuristic classification based on filename and extracted text. The researcher must confirm the study/document design before selecting or interpreting an appraisal instrument.";
        return new DocumentClassification(type, confidence, signals, notice);
    }

    private static IReadOnlyCollection<string> RecommendInstruments(DocumentClassification classification)\n    {\n        return classification.DocumentType switch\n        {\n            var type when type.Contains("Systematic review", StringComparison.OrdinalIgnoreCase) => ["AMSTAR 2"],\n            var type when type.Contains("Guideline", StringComparison.OrdinalIgnoreCase) => ["AGREE II"],\n            var type when type.Contains("Randomized", StringComparison.OrdinalIgnoreCase) => ["RoB 2"],\n            var type when type.Contains("Qualitative", StringComparison.OrdinalIgnoreCase) => ["JBI Qualitative", "CASP (design-specific)"],\n            var type when type.Contains("Diagnostic", StringComparison.OrdinalIgnoreCase) => ["A design-appropriate diagnostic accuracy tool"],\n            _ => Array.Empty<string>()\n        };\n    }\n\n    private static IReadOnlyCollection<InstrumentSuitability> EvaluateSuitability(IEnumerable<string> instruments, string documentType)
    {
        return instruments.Select(instrument => instrument.ToLowerInvariant() switch
        {
            "amstar2" when documentType.Contains("Systematic review", StringComparison.OrdinalIgnoreCase)
                => new InstrumentSuitability("AMSTAR 2", "Suitable", "Document classification is consistent with a systematic review/meta-analysis, the intended document type for AMSTAR 2."),
            "amstar2" => new InstrumentSuitability("AMSTAR 2", "Not suitable", "AMSTAR 2 is intended for systematic reviews of healthcare interventions. Confirm that the document is a systematic review before appraisal."),
            "agree2" when documentType.Contains("Guideline", StringComparison.OrdinalIgnoreCase)
                => new InstrumentSuitability("AGREE II", "Suitable", "Document classification is consistent with a clinical practice guideline."),
            "agree2" => new InstrumentSuitability("AGREE II", "Not suitable", "AGREE II is intended for clinical practice guidelines. The selected document was not confidently classified as a guideline."),
            "grade" => new InstrumentSuitability("GRADE", "Caution", "GRADE assesses certainty for outcomes within a body of evidence; a single document does not by itself establish the complete GRADE assessment."),
            "casp" => new InstrumentSuitability("CASP", "Caution", "CASP uses design-specific checklists. The researcher must select the checklist matching the confirmed study design; the current classifier does not select a CASP checklist automatically."),
            _ => new InstrumentSuitability(instrument, "Unknown", "No suitability rule is defined for this instrument.")
        }).ToArray();
    }

    private static List<EvidenceFinding> FindEvidence(IEnumerable<DocumentSourceUnit> units, IEnumerable<string> selected)
    {
        var findings = new List<EvidenceFinding>();
        foreach (var unit in units)
        foreach (var instrument in selected)
        foreach (var rule in Rules[instrument])
        {
            var match = rule.Value.FirstOrDefault(term => unit.Text.Contains(term, StringComparison.OrdinalIgnoreCase));
            if (match is null) continue;
            findings.Add(new EvidenceFinding(instrument, rule.Key, unit.Page, match, BuildExcerpt(unit.Text, match)));
        }
        return findings;
    }

    private static bool ContainsAny(string value, params string[] terms) => terms.Any(term => value.Contains(term, StringComparison.OrdinalIgnoreCase));

    private static void ValidateSignature(string extension, byte[] bytes)
    {
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            if (bytes.Length < 5 || Encoding.ASCII.GetString(bytes, 0, 5) != "%PDF-") throw new ArgumentException("The uploaded file does not have a valid PDF signature.");
            return;
        }
        if (extension.Equals(".docx", StringComparison.OrdinalIgnoreCase) && (bytes.Length < 4 || bytes[0] != 0x50 || bytes[1] != 0x4B)) throw new ArgumentException("The uploaded DOCX file is not a valid Office package.");
        if (extension.Equals(".xml", StringComparison.OrdinalIgnoreCase) || extension.Equals(".jats", StringComparison.OrdinalIgnoreCase))
        {
            if (!LooksLikeXml(bytes)) throw new ArgumentException("The uploaded XML/JATS file is not valid XML content.");
        }
    }

    private static bool LooksLikeXml(byte[] bytes)
    {
        try
        {
            using var stream = new MemoryStream(bytes, writable: false);
            var settings = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Ignore,
                XmlResolver = null,
                IgnoreComments = true,
                IgnoreWhitespace = false
            };
            using var reader = XmlReader.Create(stream, settings);
            _ = XDocument.Load(reader, LoadOptions.PreserveWhitespace);
            return true;
        }
        catch (XmlException) { return false; }
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
