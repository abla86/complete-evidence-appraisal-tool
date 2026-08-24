using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class GradeCertaintyService
{
    private static readonly IReadOnlyDictionary<string, (int Minimum, int Maximum)> DowngradeDomains =
        new Dictionary<string, (int, int)>(StringComparer.OrdinalIgnoreCase)
        {
            ["Risk of bias"] = (-2, 0),
            ["Inconsistency"] = (-2, 0),
            ["Indirectness"] = (-2, 0),
            ["Imprecision"] = (-2, 0),
            ["Publication bias"] = (-1, 0)
        };

    private static readonly IReadOnlyDictionary<string, (int Minimum, int Maximum)> UpgradeDomains =
        new Dictionary<string, (int, int)>(StringComparer.OrdinalIgnoreCase)
        {
            ["Large effect"] = (0, 2),
            ["Dose-response gradient"] = (0, 1),
            ["Plausible residual confounding"] = (0, 1)
        };

    private static readonly IReadOnlyDictionary<string, (int Minimum, int Maximum)> AllDomains =
        DowngradeDomains.Concat(UpgradeDomains)
            .ToDictionary(x => x.Key, x => x.Value, StringComparer.OrdinalIgnoreCase);

    public GradeOutcomeResult Evaluate(GradeOutcomeAssessment assessment)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        var errors = Validate(assessment);
        var change = assessment.DomainJudgements?.Sum(d => d.LevelChange) ?? 0;
        var provisionalValue = Math.Clamp((int)assessment.InitialCertainty + change, 1, 4);
        var provisional = (GradeCertainty)provisionalValue;

        if (assessment.ReviewerConfirmedCertainty is not null &&
            assessment.ReviewerConfirmedCertainty != provisional &&
            string.IsNullOrWhiteSpace(assessment.FinalCertaintyRationale))
        {
            errors.Add("A departure from the provisional certainty requires an explicit rationale.");
        }

        return new GradeOutcomeResult
        {
            IsValid = errors.Count == 0,
            Errors = errors,
            ProvisionalCertainty = provisional,
            NetLevelChange = change,
            RequiresReviewerConfirmation = assessment.ReviewerConfirmedCertainty is null
        };
    }

    private static List<string> Validate(GradeOutcomeAssessment assessment)
    {
        var errors = new List<string>();
        Required(assessment.OutcomeName, "Outcome name", errors);
        Required(assessment.Population, "Population", errors);
        Required(assessment.Intervention, "Intervention", errors);
        Required(assessment.Comparator, "Comparator", errors);
        Required(assessment.EffectMeasure, "Effect measure", errors);
        Required(assessment.RelativeEffect, "Relative effect", errors);
        Required(assessment.AbsoluteEffect, "Absolute effect", errors);
        Required(assessment.InitialCertaintyRationale, "Initial certainty rationale", errors);
        Required(assessment.FinalCertaintyRationale, "Final certainty rationale", errors);

        if (assessment.Participants < 0) errors.Add("Participants cannot be negative.");
        if (assessment.Studies < 1) errors.Add("At least one study is required.");

        var judgements = assessment.DomainJudgements ?? [];
        var normalized = judgements
            .GroupBy(d => d.Domain?.Trim() ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.ToArray(), StringComparer.OrdinalIgnoreCase);

        // GRADE requires explicit consideration of the five downgrade domains.
        // Upgrade criteria are conditional and therefore remain optional rather than
        // being forced into every assessment. This avoids implying that every body of
        // evidence must receive an upgrading judgement.
        foreach (var requiredDomain in DowngradeDomains.Keys)
        {
            if (!normalized.TryGetValue(requiredDomain, out var matches) || matches.Length != 1)
                errors.Add($"Exactly one judgement is required for downgrade domain: {requiredDomain}.");
        }

        foreach (var judgement in judgements)
        {
            var domain = judgement.Domain?.Trim() ?? string.Empty;
            if (!AllDomains.TryGetValue(domain, out var range))
            {
                errors.Add($"Unknown GRADE domain: {judgement.Domain}.");
                continue;
            }

            if (judgement.LevelChange < range.Minimum || judgement.LevelChange > range.Maximum)
                errors.Add($"{domain}: level change must be {range.Minimum} to {range.Maximum}.");
            Required(judgement.Rationale, $"{domain}: rationale", errors);
            Required(judgement.EvidenceLocation, $"{domain}: evidence location", errors);
        }

        // Duplicate domain entries make the resulting level change ambiguous.
        foreach (var duplicate in normalized.Where(x => x.Value.Length > 1).Select(x => x.Key).Where(x => x.Length > 0))
            errors.Add($"GRADE domain may only be recorded once: {duplicate}.");

        return errors;
    }

    private static void Required(string? value, string label, ICollection<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value)) errors.Add($"{label} is required.");
    }
}
