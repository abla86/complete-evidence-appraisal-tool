namespace EvidenceAppraisal.Api.Models;

public sealed record ScreeningRecord(
    string StudyId,
    string Title,
    string Decision,
    string Reviewer,
    string? ExclusionReason,
    string? Notes);

public sealed record ExtractionField(
    string StudyId,
    string Field,
    string Value,
    string? Unit,
    string? SourceLocation,
    string Reviewer);

public sealed record PicoPeCoDefinition(
    string Framework,
    string Population,
    string InterventionOrExposure,
    string Comparison,
    string Outcome,
    string? Timeframe,
    string? StudyDesign,
    string? ResearchQuestion);

public sealed record ReviewerConflict(
    string QuestionId,
    string Reviewer1,
    string Reviewer2,
    string Reviewer1Value,
    string Reviewer2Value,
    bool IsConflict,
    string? FinalDecision,
    string? ConsensusNote);

public sealed record DeduplicationCandidate(
    string FirstStudyId,
    string SecondStudyId,
    string Reason,
    double Similarity);

public sealed record ResearchCompletionPackage(
    string ProjectId,
    string Status,
    DateTime FinalizedAtUtc,
    string Sha256,
    string MethodologicalNotice);
