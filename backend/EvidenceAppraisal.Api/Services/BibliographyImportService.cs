using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class BibliographyImportService
{
    public static readonly IReadOnlyDictionary<string, string> SupportedFormats = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".ris"] = "RIS", [".bib"] = "BibTeX", [".bibtex"] = "BibTeX", [".nbib"] = "PubMed/MEDLINE", [".xml"] = "PubMed/bibliografisk XML", [".enw"] = "EndNote Tagged"
    };

    public List<StudyMetadata> Parse(string content, string extension) => extension.ToLowerInvariant() switch
    {
        ".ris" => ParseRis(content),
        ".bib" or ".bibtex" => ParseBibTeX(content),
        ".nbib" => ParseNbib(content),
        ".enw" => ParseEndNote(content),
        ".xml" => ParseXml(content),
        _ => throw new ArgumentException($"Unsupported bibliography format '{extension}'.")
    };

    private static List<StudyMetadata> ParseRis(string content)
    {
        var records = Regex.Split(content.Replace("\r\n", "\n"), @"(?m)(?=^TY\s*-")
            .Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        return records.Select(ParseRisRecord).Where(x => x is not null).Cast<StudyMetadata>().ToList();
    }

    private static StudyMetadata? ParseRisRecord(string record)
    {
        var title = TagValues(record, "TI", "T1").FirstOrDefault()?.Trim();
        if (string.IsNullOrWhiteSpace(title)) return null;
        var authors = TagValues(record, "AU", "A1").Select(NormalizeAuthor).Where(x => x.Length > 0).ToList();
        var doi = NormalizeDoi(TagValues(record, "DO", "M3").FirstOrDefault());
        var year = TagValues(record, "PY", "Y1", "DA").Select(x => Regex.Match(x, @"\b(19|20)\d{2}\b").Value).FirstOrDefault(x => x.Length == 4);
        var journal = TagValues(record, "JO", "JF", "T2").FirstOrDefault();
        var type = TagValues(record, "TY").FirstOrDefault();
        return Build(title, authors, year, doi, journal, null, type);
    }

    private static List<StudyMetadata> ParseBibTeX(string content)
    {
        var entries = Regex.Matches(content, @"@\w+\s*\{(?<key>[^,]+),(?<body>.*?)\n\}", RegexOptions.Singleline);
        var result = new List<StudyMetadata>();
        foreach (Match entry in entries)
        {
            var body = entry.Groups["body"].Value;
            var title = BibValue(body, "title");
            if (string.IsNullOrWhiteSpace(title)) continue;
            var authors = BibValue(body, "author").Split(" and ", StringSplitOptions.RemoveEmptyEntries).Select(NormalizeAuthor).ToList();
            var year = BibValue(body, "year");
            var doi = NormalizeDoi(BibValue(body, "doi"));
            var journal = BibValue(body, "journal");
            if (string.IsNullOrWhiteSpace(journal)) journal = BibValue(body, "booktitle");
            result.Add(Build(title, authors, year, doi, journal, BibValue(body, "abstract"), entry.Value.Split('{')[0].Trim().TrimStart('@')));
        }
        return result;
    }

    private static List<StudyMetadata> ParseNbib(string content)
    {
        var blocks = Regex.Split(content.Replace("\r\n", "\n"), @"(?m)(?=^PMID-)").Where(x => !string.IsNullOrWhiteSpace(x));
        return blocks.Select(block => Build(PubmedValue(block, "TI-"), PubmedValues(block, "AU-").Select(NormalizeAuthor).ToList(), Regex.Match(PubmedValue(block, "DP-"), @"\b(19|20)\d{2}\b").Value, NormalizeDoi(PubmedValues(block, "LID-").FirstOrDefault(x => x.Contains("doi.org", StringComparison.OrdinalIgnoreCase))), PubmedValue(block, "JT-"), PubmedValue(block, "AB-"), "MEDLINE")).Where(x => !string.IsNullOrWhiteSpace(x.Title)).ToList();
    }

    private static List<StudyMetadata> ParseEndNote(string content)
    {
        var blocks = Regex.Split(content.Replace("\r\n", "\n"), @"(?m)(?=^%0)").Where(x => !string.IsNullOrWhiteSpace(x));
        return blocks.Select(block => Build(EndNoteValue(block, "%T"), EndNoteValues(block, "%A").Select(NormalizeAuthor).ToList(), EndNoteValue(block, "%D"), NormalizeDoi(EndNoteValue(block, "%R")), EndNoteValue(block, "%J"), EndNoteValue(block, "%X"), EndNoteValue(block, "%0"))).Where(x => !string.IsNullOrWhiteSpace(x.Title)).ToList();
    }

    private static List<StudyMetadata> ParseXml(string content)
    {
        var doc = XDocument.Parse(content);
        var articles = doc.Descendants().Where(x => x.Name.LocalName.Equals("PubmedArticle", StringComparison.OrdinalIgnoreCase)).ToList();
        if (articles.Count == 0) articles = doc.Descendants().Where(x => x.Name.LocalName.Equals("article", StringComparison.OrdinalIgnoreCase)).ToList();
        return articles.Select(article =>
        {
            string Text(string name) => article.Descendants().FirstOrDefault(x => x.Name.LocalName.Equals(name, StringComparison.OrdinalIgnoreCase))?.Value.Trim() ?? "";
            var title = Text("ArticleTitle"); if (title.Length == 0) title = Text("article-title");
            var authors = article.Descendants().Where(x => x.Name.LocalName.Equals("Author", StringComparison.OrdinalIgnoreCase)).Select(a => string.Join(" ", a.Descendants().Where(x => x.Name.LocalName is "ForeName" or "LastName" or "Given" or "Family").Select(x => x.Value.Trim()))).Where(x => x.Length > 0).ToList();
            var doi = NormalizeDoi(article.Descendants().FirstOrDefault(x => x.Name.LocalName.Equals("ELocationID", StringComparison.OrdinalIgnoreCase) && (string?)x.Attribute("EIdType") == "doi")?.Value ?? Text("doi"));
            return Build(title, authors, Regex.Match(Text("PubDate"), @"\b(19|20)\d{2}\b").Value, doi, Text("Title"), Text("AbstractText"), "XML");
        }).Where(x => !string.IsNullOrWhiteSpace(x.Title)).ToList();
    }

    private static StudyMetadata Build(string title, List<string> authors, string? year, string? doi, string? journal, string? abstractText, string? type) => new()
    {
        Title = Clean(title), Authors = authors, Year = string.IsNullOrWhiteSpace(year) ? null : year.Trim(), Doi = NormalizeDoi(doi), Journal = CleanNullable(journal), Abstract = CleanNullable(abstractText), Type = CleanNullable(type), ImportFingerprint = Fingerprint(title, authors, year, doi)
    };

    private static IEnumerable<string> TagValues(string record, params string[] tags) => Regex.Matches(record, @"(?m)^([A-Z0-9]{2})\s*-\s*(.*)$").Cast<Match>().Where(m => tags.Contains(m.Groups[1].Value, StringComparer.OrdinalIgnoreCase)).Select(m => m.Groups[2].Value.Trim());
    private static string BibValue(string body, string field) => Regex.Match(body, $@"(?im)^\s*{Regex.Escape(field)}\s*=\s*[\{{\""](?<v>.*?)[\}}\""]\s*,?\s*$").Groups["v"].Value.Trim();
    private static string PubmedValue(string block, string tag) => Regex.Match(block, $@"(?m)^{Regex.Escape(tag)}\s*-\s*(.*)$").Groups[1].Value.Trim();
    private static IEnumerable<string> PubmedValues(string block, string tag) => Regex.Matches(block, $@"(?m)^{Regex.Escape(tag)}\s*-\s*(.*)$").Cast<Match>().Select(m => m.Groups[1].Value.Trim());
    private static string EndNoteValue(string block, string tag) => Regex.Match(block, $@"(?m)^{Regex.Escape(tag)}\s+(.*)$").Groups[1].Value.Trim();
    private static IEnumerable<string> EndNoteValues(string block, string tag) => Regex.Matches(block, $@"(?m)^{Regex.Escape(tag)}\s+(.*)$").Cast<Match>().Select(m => m.Groups[1].Value.Trim());
    private static string NormalizeAuthor(string value) => value.Replace("  ", " ").Trim();
    private static string? NormalizeDoi(string? value) { if (string.IsNullOrWhiteSpace(value)) return null; var m = Regex.Match(value, @"10\.\d{4,9}/[^\s<>\"']+", RegexOptions.IgnoreCase); return m.Success ? m.Value.TrimEnd('.', ',', ';', ')') : null; }
    private static string Clean(string value) => Regex.Replace(value.Replace("\n", " "), @"\s+", " ").Trim();
    private static string? CleanNullable(string? value) => string.IsNullOrWhiteSpace(value) ? null : Clean(value);
    private static string Fingerprint(string title, IEnumerable<string> authors, string? year, string? doi) { var doiPart = NormalizeDoi(doi) ?? string.Empty; var raw = $"{doiPart}|{Clean(title).ToLowerInvariant()}|{string.Join("|", authors).ToLowerInvariant()}|{year}"; return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant(); }
}
