using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ResearchWorkflowServiceTests
{
    [Fact]
    public void Prisma_ReconcilesValidFlow()
    {
        var input = new PrismaFlowInput(100, 10, 90, 60, 30, 5, 25, 15, 10, 10);
        var result = new ResearchWorkflowService().ValidatePrisma(input);
        Assert.True(result.InternallyConsistent);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public void Prisma_FlagsCountMismatch()
    {
        var input = new PrismaFlowInput(100, 10, 80, 60, 20, 0, 20, 5, 15, 15);
        var result = new ResearchWorkflowService().ValidatePrisma(input);
        Assert.False(result.InternallyConsistent);
        Assert.NotEmpty(result.Warnings);
    }

    [Fact]
    public void Kappa_UsesMarginalExpectedAgreement()
    {
        var input = new KappaInput(
            new[] { "Yes", "Yes", "No", "No" },
            new[] { "Yes", "No", "No", "No" });
        var result = new ResearchWorkflowService().CalculateKappa(input);
        Assert.Equal(4, result.N);
        Assert.Equal(3, result.Agreements);
        Assert.Equal(0.75, result.ObservedAgreement, 6);
        Assert.Equal(0.5, result.ExpectedAgreement, 6);
        Assert.Equal(0.5, result.Kappa, 6);
    }

    [Fact]
    public void Kappa_RejectsMissingRatings()
    {
        var input = new KappaInput(
            new[] { "Yes", "", "No" },
            new[] { "Yes", "No", "No" });

        var exception = Assert.Throws<ArgumentException>(() => new ResearchWorkflowService().CalculateKappa(input));
        Assert.Contains("missing", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Prisma_RejectsImpossibleRemovalCount()
    {
        var input = new PrismaFlowInput(10, 11, 0, 0, 0, 0, 0, 0, 0, 0);
        var result = new ResearchWorkflowService().ValidatePrisma(input);
        Assert.False(result.InternallyConsistent);
        Assert.Contains(result.Warnings, warning => warning.Contains("removed before screening", StringComparison.OrdinalIgnoreCase));
    }
}
