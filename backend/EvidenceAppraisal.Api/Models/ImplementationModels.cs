namespace EvidenceAppraisal.Api.Models;

public enum CfirDomain
{
    Innovation,
    OuterSetting,
    InnerSetting,
    Individuals,
    ImplementationProcess
}

public enum CfirInfluence
{
    StrongBarrier,
    Barrier,
    NeutralOrUnclear,
    Facilitator,
    StrongFacilitator
}

public sealed record CfirConstructDefinition
{
    public required CfirDomain Domain { get; init; }
    public required string Name { get; init; }
}

public sealed record CfirAssessmentItem
{
    public required CfirDomain Domain { get; init; }
    public required string Construct { get; init; }
    public required CfirInfluence Influence { get; init; }
    public string? EvidenceSummary { get; init; }
    public required string Rationale { get; init; }
    public required string EvidenceLocation { get; init; }
}

public sealed record CfirAssessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string InnovationName { get; init; }
    public required string InnerSetting { get; init; }
    public required string OuterSetting { get; init; }
    public required string ReviewerCode { get; init; }
    public string? SecondReviewerCode { get; init; }
    public string? ConsensusReviewerCode { get; init; }
    public string? ConsensusStatus { get; init; }
    public string? ConsensusRationale { get; init; }
    public required string CfirVersion { get; init; }
    public DateTime AssessmentDateUtc { get; init; } = DateTime.UtcNow;
    public string Status { get; init; } = "Draft";
    public required IReadOnlyCollection<CfirAssessmentItem> Items { get; init; }
}

public sealed record CfirAssessmentResult
{
    public required bool IsValid { get; init; }
    public required IReadOnlyCollection<string> Errors { get; init; }
    public required IReadOnlyCollection<string> Warnings { get; init; }
    public required string MethodologicalNotice { get; init; }
}

public enum KtaPhaseStatus
{
    NotStarted,
    InProgress,
    Completed
}

public enum ImplementationActionStatus
{
    Planned,
    InProgress,
    Completed,
    Deferred,
    Cancelled
}

public sealed record KtaPhase
{
    public required int Number { get; init; }
    public required string Name { get; init; }
    public required KtaPhaseStatus Status { get; init; }
    public required string Documentation { get; init; }
}

public sealed record ImplementationAction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required int KtaPhaseNumber { get; init; }
    public required string OwnerCode { get; init; }
    public DateTime? DueDateUtc { get; init; }
    public required ImplementationActionStatus Status { get; init; }
    public IReadOnlyCollection<string> LinkedCfirConstructKeys { get; init; } = [];
}

public sealed record KtaAssessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ProjectName { get; init; }
    public required string ReviewerCode { get; init; }
    public required string KtaFrameworkVersion { get; init; }
    public DateTime AssessmentDateUtc { get; init; } = DateTime.UtcNow;
    public string Status { get; init; } = "Draft";
    public required IReadOnlyCollection<KtaPhase> Phases { get; init; }
    public IReadOnlyCollection<ImplementationAction> Actions { get; init; } = [];
}

public sealed record KtaAssessmentResult
{
    public required bool IsValid { get; init; }
    public required IReadOnlyCollection<string> Errors { get; init; }
    public required IReadOnlyCollection<string> Warnings { get; init; }
    public required string MethodologicalNotice { get; init; }
}

public sealed record ImplementationAssessmentResult
{
    public required bool IsValid { get; init; }
    public required CfirAssessmentResult Cfir { get; init; }
    public required KtaAssessmentResult Kta { get; init; }
}
