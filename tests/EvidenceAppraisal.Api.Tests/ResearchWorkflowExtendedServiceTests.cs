using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ResearchWorkflowExtendedServiceTests
{
    [Fact]
    public void Duplicate_doi_is_flagged_without_auto_merging_records()
    {
        var service = new ResearchWorkflowExtendedService();
        var first = new StudyMetadata { Title = "Study A", Doi = "https://doi.org/10.1000/ABC" };
        var second = new StudyMetadata { Title = "Study B", Doi = "10.1000/abc" };

        var result = service.FindDuplicates(new[] { first, second });

        var candidate = Assert.Single(result);
        Assert.Equal("Identical DOI", candidate.Reason);
        Assert.Equal(1d, candidate.Similarity);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public void Similar_title_requires_year_or_first_author_match()
    {
        var service = new ResearchWorkflowExtendedService();
        var first = new StudyMetadata { Title = "A randomized controlled trial of care", Year = "2025", Authors = new() { "Smith" } };
        var second = new StudyMetadata { Title = "A randomized controlled trial of care", Year = "2024", Authors = new() { "Jones" } };

        var result = service.FindDuplicates(new[] { first, second });

        Assert.Empty(result);
    }
}

public sealed class ResearchWorkflowAdditionalServiceTests
{
    [Fact]
    public void Kappa_for_perfect_agreement_is_one()
    {
        var service = new ResearchWorkflowService();
        var result = service.CalculateKappa(new KappaInput
        {
            Reviewer1 = new[] { "Yes", "No", "Yes", "No" },
            Reviewer2 = new[] { "Yes", "No", "Yes", "No" }
        });

        Assert.Equal(1d, result.Kappa, 10);
        Assert.Equal(1d, result.ObservedAgreement, 10);
    }

    [Fact]
    public void Kappa_requires_equal_paired_ratings()
    {
        var service = new ResearchWorkflowService();

        Assert.Throws<ArgumentException>(() => service.CalculateKappa(new KappaInput
        {
            Reviewer1 = new[] { "Yes", "No" },
            Reviewer2 = new[] { "Yes" }
        }));
    }

    [Fact]
    public void Prisma_validation_flags_reconciliation_error()
    {
        var service = new ResearchWorkflowService();
        var result = service.ValidatePrisma(new PrismaFlowInput
        {
            RecordsIdentified = 10,
            RecordsRemovedBeforeScreening = 2,
            RecordsScreened = 7,
            RecordsExcluded = 3,
            ReportsSought = 4,
            ReportsNotRetrieved = 0,
            ReportsAssessed = 4,
            ReportsExcludedWithReasons = 1,
            StudiesIncluded = 3,
            ReportsIncluded = 3
        });

        Assert.False(result.IsValid);
        Assert.Contains(result.Warnings, warning => warning.Contains("Identification", StringComparison.Ordinal));
    }
}
