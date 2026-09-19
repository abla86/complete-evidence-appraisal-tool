using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class Amstar2RatingServiceTests
{
    private readonly Amstar2RatingService _service = new();

    [Fact]
    public void No_weaknesses_returns_high()
    {
        var result = _service.Calculate(CreateAssessment());

        Assert.Equal("High", result.SuggestedConfidence);
        Assert.Equal(0, result.CriticalFlawCount);
        Assert.Equal(0, result.NonCriticalWeaknessCount);
    }

    [Fact]
    public void One_noncritical_weakness_returns_high()
    {
        var result = _service.Calculate(CreateAssessment(
            weakItems: new[] { 3 }
        ));

        Assert.Equal("High", result.SuggestedConfidence);
        Assert.Equal(1, result.NonCriticalWeaknessCount);
    }

    [Fact]
    public void Unsupported_critical_domain_is_rejected()
    {
        var assessment = CreateAssessment() with
        {
            CriticalDomains =
            [
                new CriticalDomainDefinition
                {
                    ItemNumber = 1,
                    Rationale = "Invalid test configuration."
                }
            ]
        };

        var exception = Assert.Throws<InvalidOperationException>(() => _service.Calculate(assessment));

        Assert.Contains("unsupported", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Two_noncritical_weaknesses_return_moderate()
    {
        var result = _service.Calculate(CreateAssessment(
            weakItems: new[] { 3, 10 }
        ));

        Assert.Equal("Moderate", result.SuggestedConfidence);
        Assert.Equal(0, result.CriticalFlawCount);
        Assert.Equal(2, result.NonCriticalWeaknessCount);
        Assert.Equal(new[] { 3, 10 }, result.NonCriticalWeaknessItems);
    }

    [Fact]
    public void One_critical_flaw_returns_low()
    {
        var result = _service.Calculate(CreateAssessment(
            weakItems: new[] { 4 },
            criticalFlaws: new[] { 4 }
        ));

        Assert.Equal("Low", result.SuggestedConfidence);
        Assert.Equal(1, result.CriticalFlawCount);
        Assert.Equal(new[] { 4 }, result.CriticalFlawItems);
    }

    [Fact]
    public void Two_critical_flaws_return_critically_low()
    {
        var result = _service.Calculate(CreateAssessment(
            weakItems: new[] { 4, 9 },
            criticalFlaws: new[] { 4, 9 }
        ));

        Assert.Equal("CriticallyLow", result.SuggestedConfidence);
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
                    Response = item is 11 or 12 or 15
                        ? Amstar2Response.NoMetaAnalysisConducted
                        : Amstar2Response.Yes,
                    Rationale = "Documented researcher judgement.",
                    EvidenceLocation = "Methods section, page reference",
                    IsWeakness = weak.Contains(item),
                    IsCriticalFlaw = flaws.Contains(item)
                })
                .ToArray(),
            FinalConfidence = null,
            FinalConfidenceRationale = null
        };
    }
}
