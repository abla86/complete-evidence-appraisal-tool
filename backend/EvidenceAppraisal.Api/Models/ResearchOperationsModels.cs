using System.Security.Cryptography;
using System.Text;

namespace EvidenceAppraisal.Api.Models;

public enum ScreeningStatus { Pending, Included, Excluded, Maybe }

public sealed class ScreeningRecordEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid ProjectId { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public ScreeningStatus Status { get; set; } = ScreeningStatus.Pending;
    public string? ExclusionReason { get; set; }
    public string? Notes { get; set; }
    public bool IsFullTextStage { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class DataExtractionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Parameter { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? SourceLocation { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class ResearchOutcomeEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Definition { get; set; }
    public string? Timepoint { get; set; }
    public string? Certainty { get; set; }
    public string? Justification { get; set; }
    public string? RelativeEffect { get; set; }
    public string? AbsoluteEffect { get; set; }
    public string? ParticipantsAndStudies { get; set; }
    public Guid? ProjectId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class ResearchAuditEntity
{
    public long Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public string PreviousHash { get; set; } = string.Empty;
    public string CurrentHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class ResearchProjectControlEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public bool IsLocked { get; set; }
    public DateTime? LockedAtUtc { get; set; }
    public string? FinalHash { get; set; }
    public string? LockedBy { get; set; }

    // Project-level configuration. These are explicit user choices, not hidden global rules.
    public string EnabledInstrumentsJson { get; set; } = "[\"amstar2\"]";
    public bool RequireHumanVerification { get; set; } = true;
    public bool EnableDualReview { get; set; }
    public bool EnablePrismaTracking { get; set; }
    public bool EnableAuditTrail { get; set; } = true;
    public bool EnableDoiMetadataLookup { get; set; } = true;
    public bool EnablePicoAssist { get; set; }
    public bool EnablePdfEvidenceMapping { get; set; } = true;
    public bool EnableOfflineMode { get; set; }
    public bool IncludePageTextInAnalysis { get; set; }
    public string MethodologyVersion { get; set; } = string.Empty;
    public string ResearchRulesVersion { get; set; } = "1.0";
    public DateTime ConfiguredAtUtc { get; set; } = DateTime.UtcNow;
    public string? ConfiguredBy { get; set; }
}

public sealed class ReviewerAccessEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string AccessCodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsReadOnly { get; set; } = true;
}

public sealed class AccessAuditEntity
{
    public long Id { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}

public sealed record ScreeningDecisionRequest(Guid ProjectId, Guid StudyId, string Reviewer, ScreeningStatus Status, bool IsFullTextStage, string? ExclusionReason, string? Notes);
public sealed record ScreeningStats(int TotalIdentified, int TitleScreened, int TitleExcluded, int FullTextAssessed, int FullTextExcluded, int Included, IReadOnlyDictionary<string, int> ExclusionBreakdown);
public sealed record ExtractionRequest(Guid StudyId, string Value, string Parameter, string? Unit, string? SourceLocation, string Reviewer, string? Notes, Guid? ProjectId = null);
public sealed record OutcomeRequest(string Name, string? Definition, string? Timepoint, string? Certainty, string? Justification, string? RelativeEffect, string? AbsoluteEffect, string? ParticipantsAndStudies, Guid? ProjectId);
public sealed record FinalizeProjectRequest(string Reviewer, string? Name);
public sealed record ReviewerAccessRequest(Guid ProjectId, int ValidDays = 30);

public sealed record ResearchProjectConfigurationRequest(
    string Name,
    IReadOnlyCollection<string>? EnabledInstruments,
    bool RequireHumanVerification,
    bool EnableDualReview,
    bool EnablePrismaTracking,
    bool EnableAuditTrail,
    bool EnableDoiMetadataLookup,
    bool EnablePicoAssist,
    bool EnablePdfEvidenceMapping,
    bool EnableOfflineMode,
    bool IncludePageTextInAnalysis,
    string? MethodologyVersion,
    string Reviewer);

public sealed record ResearchProjectConfigurationDto(
    Guid Id,
    string Name,
    IReadOnlyCollection<string> EnabledInstruments,
    bool RequireHumanVerification,
    bool EnableDualReview,
    bool EnablePrismaTracking,
    bool EnableAuditTrail,
    bool EnableDoiMetadataLookup,
    bool EnablePicoAssist,
    bool EnablePdfEvidenceMapping,
    bool EnableOfflineMode,
    bool IncludePageTextInAnalysis,
    string MethodologyVersion,
    string ResearchRulesVersion,
    bool IsLocked,
    DateTime ConfiguredAtUtc,
    string? ConfiguredBy);

public static class ResearchHash
{
    public static string Compute(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
