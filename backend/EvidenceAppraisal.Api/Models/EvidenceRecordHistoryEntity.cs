namespace EvidenceAppraisal.Api.Models;

public sealed class EvidenceRecordHistoryEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EvidenceRecordId { get; set; }
    public int Version { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
    public string? VerificationNote { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public DateTime RecordedAtUtc { get; set; } = DateTime.UtcNow;
    public string Action { get; set; } = string.Empty;
}
