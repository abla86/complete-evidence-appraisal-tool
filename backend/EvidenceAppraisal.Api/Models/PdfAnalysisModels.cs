namespace EvidenceAppraisal.Api.Models;

public sealed record PdfAnalysisRequest(
    IReadOnlyCollection<string> Instruments,
    bool IncludePageText = false);

public sealed record EvidenceFinding(
    string Instrument,
    string Topic,
    int Page,
    string MatchedTerm,
    string Excerpt,
    string Status = "Candidate",
    string Confidence = "Uncertain",
    string Uncertainty = "Text matching identifies a potentially relevant passage; the researcher must verify the criterion and surrounding context.");

public sealed record DocumentClassification(
    string DocumentType,
    string Confidence,
    IReadOnlyCollection<string> Signals,
    string MethodologicalNotice);

public sealed record InstrumentSuitability(
    string Instrument,
    string Status,
    string Reason);

public sealed record PdfAnalysisResult(
    string FileName,
    int PageCount,
    long FileSizeBytes,
    string DocumentHashSha256,
    string ExtractionStatus,
    IReadOnlyCollection<string> SelectedInstruments,
    IReadOnlyCollection<EvidenceFinding> Findings,
    IReadOnlyCollection<PdfPageText> Pages,
    IReadOnlyCollection<string> Warnings,
    string MethodologicalNotice);

public sealed record PdfPageText(int Page, string Text);

public sealed record DocumentAnalysisResult(
    string FileName,
    string DocumentType,
    int SourceUnitCount,
    long FileSizeBytes,
    string DocumentHashSha256,
    string ExtractionStatus,
    IReadOnlyCollection<string> SelectedInstruments,
    IReadOnlyCollection<EvidenceFinding> Findings,
    IReadOnlyCollection<DocumentSourceUnit> SourceUnits,
    IReadOnlyCollection<string> Warnings,
    DocumentClassification Classification,
    IReadOnlyCollection<InstrumentSuitability> InstrumentSuitability,
    string MethodologicalNotice);

public sealed record DocumentSourceUnit(int Page, string Text);

public sealed record ManualEvidenceRequest(
    string DocumentHashSha256,
    string Instrument,
    string ItemOrDomain,
    string EvidenceText,
    string SourceType,
    string? Page,
    string? Section,
    string? Table,
    string? Figure,
    string? Url,
    string? Doi,
    string Reviewer,
    string Rationale,
    string? MethodologyVersion = null,
    string? EvidenceQuote = null);

public sealed record EvidenceRecordDto(
    Guid Id,
    string DocumentHashSha256,
    string Instrument,
    string ItemOrDomain,
    string EvidenceText,
    string SourceType,
    string? Page,
    string? Section,
    string? Table,
    string? Figure,
    string? Url,
    string? Doi,
    string Reviewer,
    string Rationale,
    string Status,
    string? VerificationNote,
    string? VerifiedBy,
    DateTime? VerifiedAtUtc,
    bool IsHumanVerified,
    string? MethodologyVersion,
    string? EvidenceQuote,
    DateTime CreatedAtUtc);

public sealed record EvidenceVerificationRequest(
    string Status,
    string Reviewer,
    string? VerificationNote);
