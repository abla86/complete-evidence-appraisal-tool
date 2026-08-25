namespace EvidenceAppraisal.Api.Models;

public sealed class ResearchGovernanceEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string DataClassification { get; set; } = "public-or-synthetic";
    public bool ContainsPersonalData { get; set; }
    public bool ContainsHealthData { get; set; }
    public bool RequiresInstitutionalApproval { get; set; }
    public string? ApprovalReference { get; set; }
    public string ResponsibleOrganization { get; set; } = string.Empty;
    public string ResearchLead { get; set; } = string.Empty;
    public string StorageLocation { get; set; } = string.Empty;
    public string RetentionPolicy { get; set; } = string.Empty;
    public bool PublicDeploymentAllowed { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed record ResearchGovernanceRequest(
    Guid ProjectId,
    string DataClassification,
    bool ContainsPersonalData,
    bool ContainsHealthData,
    bool RequiresInstitutionalApproval,
    string? ApprovalReference,
    string ResponsibleOrganization,
    string ResearchLead,
    string StorageLocation,
    string RetentionPolicy,
    bool PublicDeploymentAllowed,
    string Reviewer);

public sealed record IntegrityAuditResult(
    Guid ProjectId,
    bool IsHealthy,
    IReadOnlyList<string> Findings,
    DateTime CheckedAtUtc);
