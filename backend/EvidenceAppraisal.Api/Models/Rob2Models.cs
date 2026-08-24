namespace EvidenceAppraisal.Api.Models;

public enum Rob2Risk
{
    Low,
    SomeConcerns,
    High
}

public sealed record Rob2DomainAssessment
{
    public required string DomainId { get; init; }
    public Rob2Risk? Rating { get; init; }
    public required string Rationale { get; init; }
    public required string EvidenceLocation { get; init; }
}

public sealed record Rob2Assessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string InstrumentName { get; init; } = "Cochrane Risk of Bias 2 (RoB 2)";
    public string InstrumentVersion { get; init; } = "2019";
    public required string ReviewTitle { get; init; }
    public required string Reviewer { get; init; }
    public DateTimeOffset AssessmentDateUtc { get; init; } = DateTimeOffset.UtcNow;
    public required IReadOnlyCollection<Rob2DomainAssessment> Domains { get; init; }
    public Rob2Risk? OverallRiskOfBias { get; init; }
    public string? OverallRationale { get; init; }
    public bool? OverallJudgementOverridden { get; init; }
}
