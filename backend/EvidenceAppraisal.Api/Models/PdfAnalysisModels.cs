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
    string Status = "Candidate evidence - researcher verification required");

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
