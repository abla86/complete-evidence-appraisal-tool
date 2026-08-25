using System.Security.Cryptography;
using System.Text;

namespace EvidenceAppraisal.Api.Models;

public sealed class ResearchProtocolEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public int Version { get; set; } = 1;
    public string ResearchQuestion { get; set; } = string.Empty;
    public string? P { get; set; }
    public string? I { get; set; }
    public string? C { get; set; }
    public string? O { get; set; }
    public string? InclusionCriteria { get; set; }
    public string? ExclusionCriteria { get; set; }
    public string? SearchStrategy { get; set; }
    public string? Databases { get; set; }
    public string MethodologyVersion { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsLocked { get; set; }
    public string Hash { get; set; } = string.Empty;
}

public sealed class ReviewerDecisionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid StudyId { get; set; }
    public string Stage { get; set; } = "screening";
    public string Reviewer { get; set; } = string.Empty;
    public string Decision { get; set; } = string.Empty;
    public string? Rationale { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? EvidenceReference { get; set; }
    public bool IsLocked { get; set; }
}

public sealed class ConsensusDecisionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid StudyId { get; set; }
    public string Stage { get; set; } = "screening";
    public Guid ReviewerADecisionId { get; set; }
    public Guid ReviewerBDecisionId { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string Hash { get; set; } = string.Empty;
}

public sealed class PrismaFlowEventEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid StudyId { get; set; }
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? AuditHash { get; set; }
}

public sealed class EvidenceProvenanceEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid StudyId { get; set; }
    public Guid? EvidenceRecordId { get; set; }
    public string DocumentHashSha256 { get; set; } = string.Empty;
    public string? Page { get; set; }
    public string? Excerpt { get; set; }
    public string? Locator { get; set; }
    public string SourceType { get; set; } = "document";
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed record ResearchProtocolRequest(
    Guid ProjectId,
    string ResearchQuestion,
    string? P,
    string? I,
    string? C,
    string? O,
    string? InclusionCriteria,
    string? ExclusionCriteria,
    string? SearchStrategy,
    string? Databases,
    string MethodologyVersion,
    string Reviewer);

public sealed record ReviewerDecisionRequest(
    Guid ProjectId,
    Guid StudyId,
    string Stage,
    string Reviewer,
    string Decision,
    string? Rationale,
    string? EvidenceReference);

public sealed record ConsensusRequest(
    Guid ProjectId,
    Guid StudyId,
    string Stage,
    Guid ReviewerADecisionId,
    Guid ReviewerBDecisionId,
    string Decision,
    string Rationale,
    string Reviewer);

public sealed record PrismaFlowRequest(
    Guid ProjectId,
    Guid StudyId,
    string PreviousStatus,
    string NewStatus,
    string? Reason,
    string Reviewer);

public sealed record EvidenceProvenanceRequest(
    Guid ProjectId,
    Guid StudyId,
    Guid? EvidenceRecordId,
    string DocumentHashSha256,
    string? Page,
    string? Excerpt,
    string? Locator,
    string SourceType,
    string Reviewer);

public static class ResearchIntegrityHash
{
    public static string Compute(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
