using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class Amstar2RatingServiceTests
{
    private readonly Amstar2RatingService _service = new();

    [Fact]
    public void High_confidence_requires_no_critical_flaws_and_no_more_than_one_noncritical_weakness()
    {
        var result = _service.Calculate(CreateAssessment());

        Assert.Equal("High", result.Rating);
        Assert.Equal(0, result.CriticalFlawCount);
    }

    [Fact]
    public void One_critical_flaw_produces_low_confidence()
    {
        var result = _service.Calculate(CreateAssessment(criticalFlaws: new[] { 4 }));

        Assert.Equal("Low", result.Rating);
        Assert.Equal(1, result.CriticalFlawCount);
        Assert.Equal(new[] { 4 }, result.CriticalFlawItems);
    }

    [Fact]
    public void Two_critical_flaws_produce_critically_low_confidence()
    {
        var result = _service.Calculate(CreateAssessment(criticalFlaws: new[] { 4, 9 }));

        Assert.Equal("Critically Low", result.Rating);
        Assert.Equal(2, result.CriticalFlawCount);
        Assert.Equal(new[] { 4, 9 }, result.CriticalFlawItems);
    }

    private static Amstar2Assessment CreateAssessment(
        int[]? weakItems = null,
        int[]? criticalFlaws = null)
    {
        var weak = (weakItems ?? Array.Empty<int>()).ToHashSet();
        var flaws = (criticalFlaws ?? Array.Empty<int>()).ToHashSet();

        return new Amstar2Assessment
        {
            ReviewTitle = "Test systematic review",
            Reviewer = "Researcher 01",
            CriticalDomains = new[] { 2, 4, 7, 9, 11, 13, 15 }
                .Select(item => new CriticalDomainDefinition
                {
                    ItemNumber = item,
                    Rationale = "Prespecified for the appraisal context."
                }).ToArray(),
            Items = Enumerable.Range(1, 16)
                .Select(item => new Amstar2ItemAssessment
                {
                    ItemNumber = item,
                    Response = Amstar2Response.Yes,
                    Rationale = weak.Contains(item) ? "Identified weakness." : "No identified weakness.",
                    EvidenceLocation = "p. 4",
                    IsWeakness = weak.Contains(item),
                    IsCriticalFlaw = flaws.Contains(item)
                }).ToArray()
        };
    }
}
