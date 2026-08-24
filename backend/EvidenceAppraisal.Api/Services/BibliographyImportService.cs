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
        [".ris"] = "RIS",
        [".bib"] = "BibTeX",
        [".bibtex"] = "BibTeX",
        [".nbib"] = "PubMed/MEDLINE",
        [".xml"] = "PubMed/bibliografisk XML",
        [".enw"] = "EndNote Tagged"
    };

    public List<StudyMetadata> Parse(string content, string extension)
    {
        if (string.IsNullOrWhiteSpace(content))
            return new List<StudyMetadata>();

        if (string.IsNullOrWhiteSpace(extension))
            throw new ArgumentException("Bibliography format is required.", nameof(extension));

        return extension.ToLowerInvariant() switch
        {
            ".ris" => ParseRis(content),
            ".bib" or ".bibtex" => ParseBibTeX(content),
            ".nbib" => ParseNbib(content),
            ".enw" => ParseEndNote(content),
            ".xml" => ParseXml(content),
            _ => throw new ArgumentException($"Unsupported bibliography format '{extension}'.", nameof(extension))
        };
    }

    private static List<StudyMetadata> ParseRis(string content)
    {
        var normalized = content.Replace("\r\n", "\n").Replace('\r', '\n');
        var records = Regex.Split(normalized, @"(?m)(?=^TY\s*-")
            .Where(x => !string.IsNullOrWhiteSpace(x));

        return records
            .Select(ParseRisRecord)
            .Where(x => x is not null)
            .Cast<StudyMetadata>()
            .ToList();
    }

    private static StudyMetadata? ParseRisRecord(string record)
    {
        var fields = ParseTaggedLines(record, @"^(?<tag>[A-Z0-9]{2})\s*-\s*(?<value>.*)$");
        var title = First(fields, "TI", "T1");
        if (string.IsNullOrWhiteSpace(title)) return null;

        var authors = Values(fields, "AU", "A1")
            .Select(NormalizeAuthor)
            .Where(x => x.Length > 0)
            .ToList();
        var doi = NormalizeDoi(First(fields, "DO", "M3"));
        var year = ExtractYear(First(fields, "PY", "Y1", "DA"));
        var journal = First(fields, "JO", "JF", "T2");
        var type = First(fields, "TY");

        return Build(title, authors, year, doi, journal, null, type);
    }

    private static Dictionary<string, List<string>> ParseTaggedLines(string record, string pattern)
    {
        var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        string? currentTag = null;

        foreach (var rawLine in record.Split('\n'))
        {
            var line = rawLine.TrimEnd();
            var match = Regex.Match(line, pattern, RegexOptions.CultureInvariant);
            if (match.Success)
            {
                currentTag = match.Groups["tag"].Value.ToUpperInvariant();
                if (!result.TryGetValue(currentTag, out var values))
                {
                    values = new List<string>();
                    result[currentTag] = values;
                }
                values.Add(match.Groups["value"].Value.Trim());
                continue;
            }

            if (currentTag is not null && line.Length > 0 && char.IsWhiteSpace(rawLine.FirstOrDefault()))
            {
                var values = result[currentTag];
                values[^1] = $"{values[^1]} {line.Trim()}".Trim();
            }
        }

        return result;
    }

    private static List<StudyMetadata> ParseBibTeX(string content)
    {
        var result = new List<StudyMetadata>();
        foreach (var entry in ExtractBibEntries(content))
        {
            var title = BibValue(entry.Body, "title");
            if (string.IsNullOrWhiteSpace(title)) continue;

            var authors = BibValue(entry.Body, "author")
                .Split(" and ", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(NormalizeAuthor)
                .Where(x => x.Length > 0)
                .ToList();

            var year = BibValue(entry.Body, "year");
            var doi = NormalizeDoi(BibValue(entry.Body, "doi"));
            var journal = BibValue(entry.Body, "journal");
            if (string.IsNullOrWhiteSpace(journal)) journal = BibValue(entry.Body, "booktitle");

            result.Add(Build(title, authors, year, doi, journal, BibValue(entry.Body, "abstract"), entry.Type));
        }
        return result;
    }

    private static IEnumerable<(string Type, string Body)> ExtractBibEntries(string content)
    {
        var i = 0;
        while (i < content.Length)
        {
            var at = content.IndexOf('@', i);
            if (at < 0) yield break;

            var typeStart = at + 1;
            var brace = content.IndexOf('{', typeStart);
            var paren = content.IndexOf('(', typeStart);
            var open = brace >= 0 && (paren < 0 || brace < paren) ? brace : paren;
            if (open < 0) yield break;

            var type = content[typeStart..open].Trim();
            var depth = 0;
            var inQuote = false;
            var close = -1;
            for (var j = open; j < content.Length; j++)
            {
                var c = content[j];
                if (c == '"' && (j == 0 || content[j - 1] != '\\')) inQuote = !inQuote;
                if (inQuote) continue;
                if (c == '{' || c == '(') depth++;
                else if (c == '}' || c == ')')
                {
                    depth--;
                    if (depth == 0) { close = j; break; }
                }
            }

            if (close < 0) yield break;
            var entry = content[(open + 1)..close];
            var comma = entry.IndexOf(',');
            if (comma >= 0) yield return (type, entry[(comma + 1)..]);
            i = close + 1;
        }
    }

    private static string BibValue(string body, string field)
    {
        var match = Regex.Match(body, $@"(?is)(?:^|,)\s*{Regex.Escape(field)}\s*=\s*(?<value>\{{(?:[^{{}}]|\{{[^{{}}]*\}})*\}}|\"(?:[^\"\\]|\\.)*\"|[^,]+)");
        if (!match.Success) return string.Empty;
        var value = match.Groups["value"].Value.Trim().TrimEnd(',').Trim();
        if (value.Length >= 2 && ((value[0] == '{' && value[^1] == '}') || (value[0] == '"' && value[^1] == '"')))
            value = value[1..^1];
        return Regex.Replace(value, @"\s+", " ").Trim();
    }

    private static List<StudyMetadata> ParseNbib(string content)
    {
        var blocks = Regex.Split(content.Replace("\r\n", "\n").Replace('\r', '\n'), @"(?m)(?=^PMID-\s*)")
            .Where(x => !string.IsNullOrWhiteSpace(x));

        return blocks.Select(block =>
        {
            var title = PubmedValue(block, "TI");
            var authors = PubmedValues(block, "AU").Select(NormalizeAuthor).Where(x => x.Length > 0).ToList();
            var doi = NormalizeDoi(PubmedValues(block, "LID").FirstOrDefault(x => x.Contains("doi.org", StringComparison.OrdinalIgnoreCase) || x.Contains("[doi]", StringComparison.OrdinalIgnoreCase)));
            return Build(title, authors, ExtractYear(PubmedValue(block, "DP")), doi, PubmedValue(block, "JT"), PubmedValue(block, "AB"), "MEDLINE");
        }).Where(x => !string.IsNullOrWhiteSpace(x.Title)).ToList();
    }

    private static List<StudyMetadata> ParseEndNote(string content)
    {
        var blocks = Regex.Split(content.Replace("\r\n", "\n").Replace('\r', '\n'), @"(?m)(?=^%0\s)")
            .Where(x => !string.IsNullOrWhiteSpace(x));

        return blocks.Select(block => Build(
            EndNoteValue(block, "%T"),
            EndNoteValues(block, "%A").Select(NormalizeAuthor).Where(x => x.Length > 0).ToList(),
            ExtractYear(EndNoteValue(block, "%D")),
            NormalizeDoi(EndNoteValue(block, "%R")),
            EndNoteValue(block, "%J"),
            EndNoteValue(block, "%X"),
            EndNoteValue(block, "%0")))
            .Where(x => !string.IsNullOrWhiteSpace(x.Title))
            .ToList();
    }

    private static List<StudyMetadata> ParseXml(string content)
    {
        var doc = XDocument.Parse(content, LoadOptions.PreserveWhitespace);
        var articles = doc.Descendants().Where(x => x.Name.LocalName.Equals("PubmedArticle", StringComparison.OrdinalIgnoreCase)).ToList();
        if (articles.Count == 0) articles = doc.Descendants().Where(x => x.Name.LocalName.Equals("article", StringComparison.OrdinalIgnoreCase)).ToList();

        return articles.Select(article =>
        {
            string Text(string name) => article.Descendants().FirstOrDefault(x => x.Name.LocalName.Equals(name, StringComparison.OrdinalIgnoreCase))?.Value.Trim() ?? string.Empty;
            var title = Text("ArticleTitle");
            if (title.Length == 0) title = Text("article-title");
            var authors = article.Descendants().Where(x => x.Name.LocalName.Equals("Author", StringComparison.OrdinalIgnoreCase))
                .Select(a =>
                {
                    var collective = a.Descendants().FirstOrDefault(x => x.Name.LocalName.Equals("CollectiveName", StringComparison.OrdinalIgnoreCase))?.Value.Trim();
                    if (!string.IsNullOrWhiteSpace(collective)) return collective;
                    var family = a.Descendants().FirstOrDefault(x => x.Name.LocalName is "LastName" or "Family")?.Value.Trim();
                    var given = a.Descendants().FirstOrDefault(x => x.Name.LocalName is "ForeName" or "Given")?.Value.Trim();
                    return string.Join(" ", new[] { given, family }.Where(x => !string.IsNullOrWhiteSpace(x)));
                }).Where(x => x.Length > 0).ToList();
            var doiNode = article.Descendants().FirstOrDefault(x => x.Name.LocalName.Equals("ELocationID", StringComparison.OrdinalIgnoreCase) && string.Equals((string?)x.Attribute("EIdType"), "doi", StringComparison.OrdinalIgnoreCase));
            var doi = NormalizeDoi(doiNode?.Value ?? Text("doi"));
            return Build(title, authors, ExtractYear(Text("PubDate")), doi, Text("Title"), Text("AbstractText"), "XML");
        }).Where(x => !string.IsNullOrWhiteSpace(x.Title)).ToList();
    }

    private static StudyMetadata Build(string title, List<string> authors, string? year, string? doi, string? journal, string? abstractText, string? type) => new()
    {
        Title = Clean(title),
        Authors = authors,
        Year = string.IsNullOrWhiteSpace(year) ? null : year.Trim(),
        Doi = NormalizeDoi(doi),
        Journal = CleanNullable(journal),
        Abstract = CleanNullable(abstractText),
        Type = CleanNullable(type),
        ImportFingerprint = Fingerprint(title, authors, year, doi)
    };

    private static string First(Dictionary<string, List<string>> fields, params string[] tags) => tags.SelectMany(tag => fields.TryGetValue(tag, out var values) ? values : Enumerable.Empty<string>()).FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)) ?? string.Empty;
    private static IEnumerable<string> Values(Dictionary<string, List<string>> fields, params string[] tags) => tags.SelectMany(tag => fields.TryGetValue(tag, out var values) ? values : Enumerable.Empty<string>());
    private static string PubmedValue(string block, string tag) => Regex.Match(block, $@"(?m)^{Regex.Escape(tag)}\s*-\s*(?<v>.*(?:\n(?![A-Z]{2,4}\s*-).*)*)$").Groups["v"].Value.Replace("\n", " ").Trim();
    private static IEnumerable<string> PubmedValues(string block, string tag) => Regex.Matches(block, $@"(?m)^{Regex.Escape(tag)}\s*-\s*(.*)$").Cast<Match>().Select(m => m.Groups[1].Value.Trim());
    private static string EndNoteValue(string block, string tag) => Regex.Match(block, $@"(?m)^{Regex.Escape(tag)}\s+(.*)$").Groups[1].Value.Trim();
    private static IEnumerable<string> EndNoteValues(string block, string tag) => Regex.Matches(block, $@"(?m)^{Regex.Escape(tag)}\s+(.*)$").Cast<Match>().Select(m => m.Groups[1].Value.Trim());
    private static string NormalizeAuthor(string value) => Regex.Replace(value.Replace("  ", " "), @"\s+", " ").Trim();
    private static string? NormalizeDoi(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var cleaned = value.Replace("[doi]", "", StringComparison.OrdinalIgnoreCase).Replace("doi:", "", StringComparison.OrdinalIgnoreCase).Trim();
        var match = Regex.Match(cleaned, @"10\.\d{4,9}/[-._;()/:A-Z0-9]+", RegexOptions.IgnoreCase);
        return match.Success ? match.Value.TrimEnd('.', ',', ';', ')', ']', '}', '"') : null;
    }
    private static string ExtractYear(string? value) => Regex.Match(value ?? string.Empty, @"\b(19|20)\d{2}\b").Value;
    private static string Clean(string value) => Regex.Replace(value.Replace("\n", " "), @"\s+", " ").Trim();
    private static string? CleanNullable(string? value) => string.IsNullOrWhiteSpace(value) ? null : Clean(value);
    private static string Fingerprint(string title, IEnumerable<string> authors, string? year, string? doi)
    {
        var doiPart = NormalizeDoi(doi) ?? string.Empty;
        var raw = $"{doiPart}|{Clean(title).ToLowerInvariant()}|{string.Join("|", authors.Select(NormalizeAuthor)).ToLowerInvariant()}|{ExtractYear(year)}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
    }
}
