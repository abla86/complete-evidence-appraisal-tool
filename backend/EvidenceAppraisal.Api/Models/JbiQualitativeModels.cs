namespace EvidenceAppraisal.Api.Models;

public enum JbiQualitativeResponse
{
    Yes,
    No,
    Unclear,
    NotApplicable
}

public enum JbiOverallAppraisal
{
    Include,
    Exclude,
    SeekFurtherInformation
}

public sealed record JbiQualitativeItemAssessment
{
    public required int ItemNumber { get; init; }
    public JbiQualitativeResponse? Response { get; init; }
    public required string Rationale { get; init; }
    public required string EvidenceLocation { get; init; }
}

public sealed record JbiQualitativeAssessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string InstrumentId { get; init; } = "jbi-qualitative-2017";
    public string InstrumentVersion { get; init; } = "2017";
    public required string StudyTitle { get; init; }
    public required string ReviewerCode { get; init; }
    public DateTimeOffset AssessmentDateUtc { get; init; } = DateTimeOffset.UtcNow;
    public required IReadOnlyCollection<JbiQualitativeItemAssessment> Items { get; init; }
    public JbiOverallAppraisal? OverallAppraisal { get; init; }
    public string? OverallAppraisalRationale { get; init; }
}

public sealed record JbiQualitativeValidationResult
{
    public required bool IsValid { get; init; }
    public required IReadOnlyCollection<string> Errors { get; init; }
    public required int CompletedItems { get; init; }
    public required int ExpectedItems { get; init; }
}
