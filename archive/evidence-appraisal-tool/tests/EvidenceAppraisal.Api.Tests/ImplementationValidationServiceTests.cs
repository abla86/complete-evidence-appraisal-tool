using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ImplementationValidationServiceTests
{
    [Fact]
    public void Kta_requires_all_seven_phases()
    {
        var service = new ImplementationValidationService();
        var assessment = new KtaAssessment
        {
            ProjectName = "Test",
            ReviewerCode = "R1",
            KtaFrameworkVersion = "Graham et al., 2006",
            Phases = service.GetKtaPhases().Take(6).ToArray()
        };

        var result = service.Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("seven KTA action-cycle phases", StringComparison.Ordinal));
    }

    [Fact]
    public void Completed_kta_phase_requires_documentation()
    {
        var service = new ImplementationValidationService();
        var phases = service.GetKtaPhases().ToArray();
        phases[0] = phases[0] with { Status = KtaPhaseStatus.Completed, Documentation = string.Empty };
        var assessment = new KtaAssessment
        {
            ProjectName = "Test",
            ReviewerCode = "R1",
            KtaFrameworkVersion = "Graham et al., 2006",
            Phases = phases
        };

        var result = service.Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("phase 1", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Cfir_requires_rationale_and_evidence_location()
    {
        var service = new ImplementationValidationService();
        var assessment = new CfirAssessment
        {
            InnovationName = "Medication reconciliation",
            InnerSetting = "Municipal health service",
            OuterSetting = "Municipality",
            ReviewerCode = "R1",
            CfirVersion = "CFIR 2.0",
            Items =
            [
                new CfirAssessmentItem
                {
                    Domain = CfirDomain.Innovation,
                    Construct = "Innovation Evidence-Base",
                    Influence = CfirInfluence.Facilitator,
                    Rationale = string.Empty,
                    EvidenceLocation = string.Empty
                }
            ]
        };

        var result = service.Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("rationale", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Errors, error => error.Contains("evidence location", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Cfir_rejects_unknown_construct()
    {
        var service = new ImplementationValidationService();
        var assessment = new CfirAssessment
        {
            InnovationName = "Test innovation",
            InnerSetting = "Test setting",
            OuterSetting = "Test outer setting",
            ReviewerCode = "R1",
            CfirVersion = "CFIR 2.0",
            Items =
            [
                new CfirAssessmentItem
                {
                    Domain = CfirDomain.Innovation,
                    Construct = "Made Up Construct",
                    Influence = CfirInfluence.NeutralOrUnclear,
                    Rationale = "Test rationale",
                    EvidenceLocation = "p. 1"
                }
            ]
        };

        var result = service.Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("Unknown CFIR construct", StringComparison.Ordinal));
    }
}
