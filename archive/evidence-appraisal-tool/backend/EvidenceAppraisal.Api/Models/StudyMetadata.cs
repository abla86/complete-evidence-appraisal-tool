namespace EvidenceAppraisal.Api.Models;

public sealed class StudyMetadata
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string? Year { get; set; }
    public string? Doi { get; set; }
    public string? Journal { get; set; }
    public string? Abstract { get; set; }
    public string? SourceDatabase { get; set; }
    public string? RecordIdentifier { get; set; }
    public string ImportFingerprint { get; set; } = string.Empty;
    public DateTime ImportedAtUtc { get; set; } = DateTime.UtcNow;
}
