using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed record Amstar2RatingResult(
    string SuggestedConfidence,
    int CriticalFlawCount,
    int NonCriticalWeaknessCount,
    IReadOnlyCollection<int> CriticalFlawItems,
    IReadOnlyCollection<int> NonCriticalWeaknessItems,
    string MethodologicalNotice
);

/// <summary>
/// Applies the AMSTAR 2 overall-confidence scheme to the explicit
/// researcher judgements already recorded in an assessment.
/// This is an advisory consistency check, not a numerical score and
/// not a substitute for the researcher's final methodological judgement.
/// </summary>
public sealed class Amstar2RatingService
{
    public const string MethodologicalNotice =
        "Advisory AMSTAR 2 confidence category derived from the recorded " +
        "critical-flaw and non-critical-weakness judgements. It is not a " +
        "numerical total score and does not replace researcher judgement.";

    public Amstar2RatingResult Calculate(Amstar2Assessment assessment)
    {
        if (assessment is null)
            throw new ArgumentNullException(nameof(assessment));

        var criticalNumbers = assessment.CriticalDomains
            .Select(domain => domain.ItemNumber)
            .ToHashSet();

        var criticalFlaws = assessment.Items
            .Where(item => item.IsCriticalFlaw == true)
            .Select(item => item.ItemNumber)
            .Where(criticalNumbers.Contains)
            .Distinct()
            .Order()
            .ToArray();

        var nonCriticalWeaknesses = assessment.Items
            .Where(item => item.IsWeakness == true &&
                           !criticalNumbers.Contains(item.ItemNumber))
            .Select(item => item.ItemNumber)
            .Distinct()
            .Order()
            .ToArray();

        var suggestedConfidence = criticalFlaws.Length switch
        {
            >= 2 => "CriticallyLow",
            1 => "Low",
            _ when nonCriticalWeaknesses.Length > 1 => "Moderate",
            _ => "High"
        };

        return new Amstar2RatingResult(
            suggestedConfidence,
            criticalFlaws.Length,
            nonCriticalWeaknesses.Length,
            criticalFlaws,
            nonCriticalWeaknesses,
            MethodologicalNotice
        );
    }
}
