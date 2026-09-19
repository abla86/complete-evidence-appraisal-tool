using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class Rob2ValidationServiceTests
{
    private static Rob2Assessment Build(params Rob2Risk[] ratings)
    {
        var domains = new[] { "D1", "D2", "D3", "D4", "D5" }
            .Select((id, index) => new Rob2DomainAssessment
            {
                DomainId = id,
                Rating = ratings[index],
                Rationale = "Documented justification.",
                EvidenceLocation = "p. 4"
            })
            .ToArray();

        return new Rob2Assessment
        {
            ReviewTitle = "Test study result",
            Reviewer = "Reviewer A",
            Domains = domains
        };
    }

    [Fact]
    public void AllLow_ProposesLow()
    {
        var result = new Rob2ValidationService().Validate(
            Build(Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low));

        Assert.True(result.IsValid);
        Assert.Equal(Rob2Risk.Low, result.ProposedOverallRisk);
        Assert.False(result.RequiresResearcherReview);
    }

    [Fact]
    public void SomeConcerns_ProposesSomeConcerns()
    {
        var result = new Rob2ValidationService().Validate(
            Build(Rob2Risk.SomeConcerns, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low));

        Assert.True(result.IsValid);
        Assert.Equal(Rob2Risk.SomeConcerns, result.ProposedOverallRisk);
        Assert.False(result.RequiresResearcherReview);
    }

    [Fact]
    public void HighDomain_ProposesHigh()
    {
        var result = new Rob2ValidationService().Validate(
            Build(Rob2Risk.High, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low));

        Assert.True(result.IsValid);
        Assert.Equal(Rob2Risk.High, result.ProposedOverallRisk);
    }

    [Fact]
    public void MultipleSomeConcerns_RequiresResearcherReview()
    {
        var result = new Rob2ValidationService().Validate(
            Build(Rob2Risk.SomeConcerns, Rob2Risk.SomeConcerns, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low));

        Assert.True(result.IsValid);
        Assert.Equal(Rob2Risk.SomeConcerns, result.ProposedOverallRisk);
        Assert.True(result.RequiresResearcherReview);
    }

    [Fact]
    public void MissingDomain_BlocksValidation()
    {
        var assessment = Build(Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low, Rob2Risk.Low);
        assessment = assessment with
        {
            Domains = assessment.Domains.Where(domain => domain.DomainId != "D5").ToArray()
        };

        var result = new Rob2ValidationService().Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("D5"));
    }
}
