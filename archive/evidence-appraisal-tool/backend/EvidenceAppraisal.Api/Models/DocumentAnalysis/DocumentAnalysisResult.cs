// Document-analysis result contracts are defined in Models/PdfAnalysisModels.cs.
// This file is intentionally retained as a marker so the historical path is not
// silently reused for a second DocumentAnalysisResult type.
namespace EvidenceAppraisal.Api.Models.DocumentAnalysis;

public static class DocumentAnalysisContracts
{
    public const string CandidateFindingPolicy = "Automated document analysis produces candidate evidence only; researcher verification is required.";
}
