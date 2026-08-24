using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class ResearchWorkflowExtendedService
{
    public IReadOnlyList<DeduplicationCandidate> FindDuplicates(IReadOnlyList<StudyMetadata> studies)
    {
        var candidates = new List<DeduplicationCandidate>();
        for (var i = 0; i < studies.Count; i++)
        {
            for (var j = i + 1; j < studies.Count; j++)
            {
                var a = studies[i];
                var b = studies[j];

                var normalizedDoiA = NormalizeDoi(a.Doi);
                var normalizedDoiB = NormalizeDoi(b.Doi);
                if (!string.IsNullOrWhiteSpace(normalizedDoiA) &&
                    !string.IsNullOrWhiteSpace(normalizedDoiB) &&
                    string.Equals(normalizedDoiA, normalizedDoiB, StringComparison.OrdinalIgnoreCase))
                {
                    candidates.Add(new(a.Id.ToString(), b.Id.ToString(), "Identical DOI", 1));
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(a.ImportFingerprint) &&
                    string.Equals(a.ImportFingerprint, b.ImportFingerprint, StringComparison.OrdinalIgnoreCase))
                {
                    candidates.Add(new(a.Id.ToString(), b.Id.ToString(), "Identical import fingerprint", 1));
                    continue;
                }

                var titleSimilarity = Similarity(Normalize(a.Title), Normalize(b.Title));
                var yearMatch = !string.IsNullOrWhiteSpace(a.Year) &&
                                !string.IsNullOrWhiteSpace(b.Year) &&
                                ExtractYear(a.Year) == ExtractYear(b.Year);
                var firstAuthorMatch = a.Authors.Count > 0 && b.Authors.Count > 0 &&
                    NormalizeAuthor(a.Authors[0]) == NormalizeAuthor(b.Authors[0]);

                if (titleSimilarity >= 0.92 && (yearMatch || firstAuthorMatch))
                    candidates.Add(new(a.Id.ToString(), b.Id.ToString(), "Title + year/first author", titleSimilarity));
            }
        }
        return candidates;
    }

    public IReadOnlyList<ReviewerConflict> FindConflicts(
        IReadOnlyList<ReviewerConflict> comparisons) => comparisons.Where(x => x.IsConflict).ToArray();

    public ResearchCompletionPackage CreateCompletionPackage(string projectId, object payload)
    {
        if (string.IsNullOrWhiteSpace(projectId))
            throw new ArgumentException("Project ID is required.", nameof(projectId));

        ArgumentNullException.ThrowIfNull(payload);

        var canonical = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
        return new(projectId.Trim(), "Finalized", DateTime.UtcNow, hash,
            "Finalization is an integrity marker for the submitted dataset. It does not certify methodological quality or replace researcher judgement.");
    }

    private static string? NormalizeDoi(string? doi)
    {
        if (string.IsNullOrWhiteSpace(doi)) return null;
        var value = doi.Trim();
        value = Regex.Replace(value, @"^https?://(dx\.)?doi\.org/", string.Empty, RegexOptions.IgnoreCase);
        value = Regex.Replace(value, @"^doi:\s*", string.Empty, RegexOptions.IgnoreCase);
        value = value.Trim().TrimEnd('.', ',', ';', ')', ']', '}');
        return value.Length == 0 ? null : value.ToLowerInvariant();
    }

    private static string Normalize(string value) => string.Concat(value.ToLowerInvariant().Where(char.IsLetterOrDigit));

    private static string NormalizeAuthor(string value) =>
        Normalize(value.Replace(",", " ", StringComparison.Ordinal));

    private static string ExtractYear(string? value) =>
        Regex.Match(value ?? string.Empty, @"\b(19|20)\d{2}\b").Value;

    private static double Similarity(string a, string b)
    {
        if (a == b) return 1;
        if (a.Length == 0 || b.Length == 0) return 0;
        var distance = Levenshtein(a, b);
        return 1d - distance / (double)Math.Max(a.Length, b.Length);
    }

    private static int Levenshtein(string a, string b)
    {
        var previous = Enumerable.Range(0, b.Length + 1).ToArray();
        for (var i = 1; i <= a.Length; i++)
        {
            var current = new int[b.Length + 1];
            current[0] = i;
            for (var j = 1; j <= b.Length; j++)
                current[j] = Math.Min(
                    Math.Min(current[j - 1] + 1, previous[j] + 1),
                    previous[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1));
            previous = current;
        }
        return previous[b.Length];
    }
}
