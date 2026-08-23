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
