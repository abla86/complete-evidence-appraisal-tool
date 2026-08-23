namespace EvidenceAppraisal.Api.Data;

public sealed class ImplementationAuditEntity
{
    public Guid Id { get; set; }
    public Guid CfirAssessmentId { get; set; }
    public Guid? KtaAssessmentId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityKey { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string EventType { get; set; } = "Update";
    public DateTime TimestampUtc { get; set; }
}
