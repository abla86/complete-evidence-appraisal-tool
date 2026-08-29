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
        // Instrument selection is optional at analysis time: classification must precede instrument choice.
        // An empty selection means classify and recommend; it must not default to AMSTAR 2 or another tool.

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
        var corpus = $" {fileName}\n{text}";
        var signals = new List<string>();
        var flags = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase)
        {
            ["systematic-review"] = ContainsAny(corpus, "systematic review", "systematic literature review"),
            ["meta-analysis"] = ContainsAny(corpus, "meta-analysis", "meta analysis"),
            ["guideline"] = ContainsAny(corpus, "clinical practice guideline", "clinical guideline", "guideline development"),
            ["national-guideline"] = ContainsAny(corpus, "national guideline", "nasjonal faglig retningslinje", "national clinical guideline"),
            ["protocol"] = ContainsAny(corpus, "study protocol", "protocol for", "protocol registration", "registered protocol", "prospective registration"),
            ["qualitative"] = ContainsAny(corpus, "qualitative study", "qualitative research", "thematic analysis", "phenomenological", "grounded theory", "ethnograph", "focus group"),
            ["mixed-methods"] = ContainsAny(corpus, "mixed methods", "mixed-methods", "convergent mixed", "sequential mixed"),
            ["rct"] = ContainsAny(corpus, "randomized controlled trial", "randomised controlled trial", "randomized trial", "randomised trial"),
            ["cohort"] = ContainsAny(corpus, "cohort study", "prospective cohort", "retrospective cohort"),
            ["case-control"] = ContainsAny(corpus, "case-control", "case control study"),
            ["cross-sectional"] = ContainsAny(corpus, "cross-sectional", "cross sectional study"),
            ["diagnostic"] = ContainsAny(corpus, "diagnostic accuracy", "sensitivity and specificity", "index test", "reference standard"),
            ["scoping-review"] = ContainsAny(corpus, "scoping review", "evidence mapping"),
            ["umbrella-review"] = ContainsAny(corpus, "umbrella review", "overview of reviews"),
            ["rapid-review"] = ContainsAny(corpus, "rapid review"),
            ["editorial"] = ContainsAny(corpus, "editorial", "commentary"),
            ["methodology"] = ContainsAny(corpus, "methodological study", "methods paper", "methodology paper")
        };

        foreach (var flag in flags.Where(x => x.Value))
            signals.Add($"{flag.Key} signal detected");

        string type;
        string confidence;
        var ambiguity = 0;

        if (flags["national-guideline"] || flags["guideline"])
        {
            type = flags["national-guideline"] ? "National clinical practice guideline" : "Clinical practice guideline";
            confidence = flags["national-guideline"] && flags["guideline"] ? "High" : "Moderate";
        }
        else if (flags["protocol"])
        {
            type = "Research protocol";
            confidence = "Moderate";
        }
        else if (flags["scoping-review"])
        {
            type = "Scoping review";
            confidence = "Moderate";
        }
        else if (flags["umbrella-review"])
        {
            type = "Umbrella review / overview of reviews";
            confidence = "Moderate";
        }
        else if (flags["rapid-review"])
        {
            type = "Rapid review";
            confidence = "Moderate";
        }
        else if (flags["systematic-review"] || flags["meta-analysis"])
        {
            type = flags["systematic-review"] && flags["meta-analysis"]
                ? "Systematic review with meta-analysis"
                : flags["systematic-review"] ? "Systematic review" : "Meta-analysis";
            confidence = flags["systematic-review"] && flags["meta-analysis"] ? "High" : "Moderate";
        }
        else if (flags["mixed-methods"])
        {
            type = "Mixed-methods primary research";
            confidence = "Moderate";
        }
        else if (flags["rct"])
        {
            type = "Randomized controlled trial";
            confidence = "Moderate";
        }
        else if (flags["diagnostic"])
        {
            type = "Diagnostic accuracy study";
            confidence = "Moderate";
        }
        else if (flags["cohort"])
        {
            type = "Cohort study";
            confidence = "Moderate";
        }
        else if (flags["case-control"])
        {
            type = "Case-control study";
            confidence = "Moderate";
        }
        else if (flags["cross-sectional"])
        {
            type = "Cross-sectional study";
            confidence = "Moderate";
        }
        else if (flags["qualitative"])
        {
            type = "Qualitative primary research";
            confidence = "Moderate";
        }
        else if (flags["methodology"])
        {
            type = "Methodological research";
            confidence = "Low";
        }
        else if (flags["editorial"])
        {
            type = "Editorial/commentary";
            confidence = "Moderate";
        }
        else
        {
            type = "Research/document type not confidently classified";
            confidence = "Low";
        }

        var positiveDesigns = flags.Count(x => x.Value);
        if (positiveDesigns > 1)
            ambiguity = positiveDesigns - 1;

        var notice = ambiguity > 0
            ? $"Multiple design signals were detected ({positiveDesigns}). Classification is a candidate classification, not a definitive study-design determination. Confirm the primary design from the methods section before appraisal."
            : "Document type is a candidate classification based on filename and extracted text. Confirm the design, purpose and publication type from the methods/source before selecting or interpreting an appraisal instrument.";

        return new DocumentClassification(type, confidence, signals, notice);
    }

    private static IReadOnlyCollection<string> RecommendInstruments(DocumentClassification classification)
    {
        return classification.DocumentType switch
        {
            var type when type.Contains("Systematic review", StringComparison.OrdinalIgnoreCase) => ["AMSTAR 2"],
            var type when type.Contains("Guideline", StringComparison.OrdinalIgnoreCase) => ["AGREE II"],
            var type when type.Contains("Randomized", StringComparison.OrdinalIgnoreCase) => ["RoB 2"],
            var type when type.Contains("Qualitative", StringComparison.OrdinalIgnoreCase) => ["JBI Qualitative", "CASP (design-specific)"],
            var type when type.Contains("Diagnostic", StringComparison.OrdinalIgnoreCase) => ["A design-appropriate diagnostic accuracy tool"],
            _ => Array.Empty<string>()
        };
    }

    private static IReadOnlyCollection<InstrumentSuitability> EvaluateSuitability(IEnumerable<string> instruments, string documentType)
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
