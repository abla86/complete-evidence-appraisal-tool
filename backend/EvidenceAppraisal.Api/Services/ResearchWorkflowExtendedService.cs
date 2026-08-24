using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
                if (!string.IsNullOrWhiteSpace(a.Doi) && !string.IsNullOrWhiteSpace(b.Doi) &&
                    NormalizeDoi(a.Doi) == NormalizeDoi(b.Doi))
                {
                    candidates.Add(new(a.Id.ToString(), b.Id.ToString(), "Identical DOI", 1));
                    continue;
                }

                var titleSimilarity = Similarity(Normalize(a.Title), Normalize(b.Title));
                var yearMatch = !string.IsNullOrWhiteSpace(a.Year) && a.Year == b.Year;
                var firstAuthorMatch = a.Authors.Count > 0 && b.Authors.Count > 0 &&
                    Normalize(a.Authors[0]) == Normalize(b.Authors[0]);
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
        var canonical = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
        return new(projectId, "Finalized", DateTime.UtcNow, hash,
            "Finalization is an integrity marker for the submitted dataset. It does not certify methodological quality or replace researcher judgement.");
    }

    private static string NormalizeDoi(string doi) => Normalize(doi.Replace("https://doi.org/", "", StringComparison.OrdinalIgnoreCase));
    private static string Normalize(string value) => string.Join(' ', value.ToLowerInvariant().Where(char.IsLetterOrDigit).Select(c => c.ToString()));

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
                current[j] = Math.Min(Math.Min(current[j - 1] + 1, previous[j] + 1), previous[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1));
            previous = current;
        }
        return previous[b.Length];
    }
}
