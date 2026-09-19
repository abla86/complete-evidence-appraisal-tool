using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed record Rob2ValidationResult(
    bool IsValid,
    IReadOnlyCollection<string> Errors,
    Rob2Risk? ProposedOverallRisk,
    bool RequiresResearcherReview
);

public sealed class Rob2ValidationService
{
    private static readonly string[] DomainIds = ["D1", "D2", "D3", "D4", "D5"];

    public Rob2ValidationResult Validate(Rob2Assessment assessment)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(assessment.ReviewTitle)) errors.Add("Review title is required.");
        if (string.IsNullOrWhiteSpace(assessment.Reviewer)) errors.Add("Reviewer is required.");
        if (assessment.Domains is null)
        {
            errors.Add("All five RoB 2 domains are required.");
            return new(false, errors, null, true);
        }

        var domains = assessment.Domains.ToArray();
        var duplicates = domains.GroupBy(x => x.DomainId).Where(x => x.Count() > 1).Select(x => x.Key).ToArray();
        if (duplicates.Length > 0) errors.Add($"Each RoB 2 domain may only be assessed once: {string.Join(", ", duplicates)}.");

        var invalid = domains.Select(x => x.DomainId).Except(DomainIds).ToArray();
        if (invalid.Length > 0) errors.Add($"Unknown RoB 2 domain(s): {string.Join(", ", invalid)}.");

        var missing = DomainIds.Except(domains.Select(x => x.DomainId)).ToArray();
        if (missing.Length > 0) errors.Add($"All five RoB 2 domains must be assessed. Missing: {string.Join(", ", missing)}.");

        foreach (var domain in domains)
        {
            if (domain.Rating is null) errors.Add($"Domain {domain.DomainId} requires a risk-of-bias judgement.");
            if (string.IsNullOrWhiteSpace(domain.Rationale)) errors.Add($"Domain {domain.DomainId} requires a justification.");
            if (string.IsNullOrWhiteSpace(domain.EvidenceLocation)) errors.Add($"Domain {domain.DomainId} requires an evidence location or an explicit statement that information was not reported.");
        }

        var proposed = CalculateProposedOverall(domains);
        var hasMultipleConcerns = domains.Count(x => x.Rating == Rob2Risk.SomeConcerns) > 1;

        if (assessment.OverallRiskOfBias is not null && assessment.OverallRiskOfBias != proposed && assessment.OverallJudgementOverridden != true)
            errors.Add("A different overall judgement requires explicit researcher override and justification.");

        if (assessment.OverallJudgementOverridden == true && string.IsNullOrWhiteSpace(assessment.OverallRationale))
            errors.Add("An overridden overall judgement requires a documented rationale.");

        return new(errors.Count == 0, errors, proposed, hasMultipleConcerns);
    }

    public static Rob2Risk? CalculateProposedOverall(IEnumerable<Rob2DomainAssessment> domains)
    {
        var ratings = domains.Select(x => x.Rating).ToArray();
        if (ratings.Length != 5 || ratings.Any(x => x is null)) return null;
        if (ratings.Any(x => x == Rob2Risk.High)) return Rob2Risk.High;
        return ratings.Any(x => x == Rob2Risk.SomeConcerns)
            ? Rob2Risk.SomeConcerns
            : Rob2Risk.Low;
    }
}
