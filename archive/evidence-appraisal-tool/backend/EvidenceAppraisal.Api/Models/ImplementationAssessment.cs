namespace EvidenceAppraisal.Api.Models;

/// <summary>
/// Aggregate request model containing the CFIR assessment and its linked KTA assessment.
/// This type is deliberately a transport/workflow model; it does not represent a methodological score.
/// </summary>
public sealed record ImplementationAssessment
{
    public required CfirAssessment Cfir { get; init; }
    public required KtaAssessment Kta { get; init; }
}
