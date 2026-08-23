namespace EvidenceAppraisal.Api.Models.DocumentAnalysis;

public sealed record DocumentEvidenceFinding(
    string InstrumentId,
    string Topic,
    int Page,
    string Excerpt,
    double Relevance,
    string VerificationStatus = "Needs researcher verification");

public sealed record DocumentAnalysisResult(
    string FileName,
    string MediaType,
    long FileSizeBytes,
    string Sha256,
    int PageCount,
    bool TextExtracted,
    bool RequiresOcr,
    IReadOnlyList<DocumentEvidenceFinding> Findings,
    IReadOnlyList<string> Warnings,
    DateTimeOffset AnalyzedAtUtc);
