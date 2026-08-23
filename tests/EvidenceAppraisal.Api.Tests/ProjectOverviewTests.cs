using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ProjectOverviewTests
{
    [Fact]
    public async Task Overview_ContainsReviewerKtaAndAuditInformation()
    {
        var options = new DbContextOptionsBuilder<ImplementationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new ImplementationDbContext(options);
        var persistence = new ImplementationPersistenceService(db);
        var projectId = Guid.NewGuid();

        var assessment = new ImplementationAssessment
        {
            Cfir = new CfirAssessment
            {
                Id = projectId, InnovationName = "Implementation project", InnerSetting = "Unit", OuterSetting = "Municipality",
                ReviewerCode = "R1", SecondReviewerCode = "R2", ConsensusStatus = "Disagreement", CfirVersion = "CFIR 2.0",
                Items = [new CfirAssessmentItem { Domain = CfirDomain.InnerSetting, Construct = "Culture", Influence = CfirInfluence.Barrier, Rationale = "Reason", EvidenceLocation = "p. 4" }]
            },
            Kta = new KtaAssessment
            {
                Id = Guid.NewGuid(), ProjectName = "Implementation project", ReviewerCode = "R1", KtaFrameworkVersion = "Graham et al., 2006",
                Phases = Enumerable.Range(1, 7).Select(i => new KtaPhase { Number = i, Name = $"Phase {i}", Status = KtaPhaseStatus.NotStarted, Documentation = string.Empty }).ToArray(),
                Actions = [new ImplementationAction { Id = Guid.NewGuid(), Title = "Action", Description = "Description", KtaPhaseNumber = 3, OwnerCode = "A1", Status = ImplementationActionStatus.Completed, LinkedCfirConstructKeys = ["InnerSetting|Culture"] }]
            }
        };

        await persistence.SaveAsync(assessment);
        var service = new ProjectOverviewService(db);
        var overview = await service.GetAsync();

        var project = Assert.Single(overview);
        Assert.Equal("R1", project.ReviewerA);
        Assert.Equal("R2", project.ReviewerB);
        Assert.Equal(1, project.Disagreements);
        Assert.Equal(1, project.KtaActions);
        Assert.Equal(1, project.LinkedKtaActions);
        Assert.Equal(1, project.CompletedKtaActions);
        Assert.NotEmpty(project.AuditTrail);
    }
}
