using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ImplementationPersistenceTests
{
    [Fact]
    public async Task SaveAndLoad_PreservesCfirKtaLinks()
    {
        var options = new DbContextOptionsBuilder<ImplementationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new ImplementationDbContext(options);
        var service = new ImplementationPersistenceService(db);
        var cfirKey = "InnerSetting|Culture";
        var cfirId = Guid.NewGuid();
        var ktaId = Guid.NewGuid();

        var assessment = new ImplementationAssessment
        {
            Cfir = new CfirAssessment
            {
                Id = cfirId,
                InnovationName = "Test innovation",
                InnerSetting = "Test setting",
                OuterSetting = "Test context",
                ReviewerCode = "R1",
                CfirVersion = "CFIR 2.0",
                Items = [new CfirAssessmentItem
                {
                    Domain = CfirDomain.InnerSetting,
                    Construct = "Culture",
                    Influence = CfirInfluence.Barrier,
                    Rationale = "Documented rationale",
                    EvidenceLocation = "Interview 1"
                }]
            },
            Kta = new KtaAssessment
            {
                Id = ktaId,
                ProjectName = "Test project",
                ReviewerCode = "R1",
                KtaFrameworkVersion = "Graham et al., 2006",
                Phases = Enumerable.Range(1, 7).Select(i => new KtaPhase
                {
                    Number = i,
                    Name = i == 1 ? "Identify problem" : $"Phase {i}",
                    Status = KtaPhaseStatus.NotStarted,
                    Documentation = string.Empty
                }).ToArray(),
                Actions = [new ImplementationAction
                {
                    Id = Guid.NewGuid(),
                    Title = "Address culture barrier",
                    Description = "Test action",
                    KtaPhaseNumber = 3,
                    OwnerCode = "A1",
                    Status = ImplementationActionStatus.Planned,
                    LinkedCfirConstructKeys = [cfirKey]
                }]
            }
        };

        await service.SaveAsync(assessment);
        var actions = await service.GetActionsForCfirAsync(cfirKey);

        Assert.Single(actions);
        Assert.Equal("Address culture barrier", actions[0].Title);
        Assert.Contains(actions[0].CfirLinks, link => link.CfirConstructKey == cfirKey);
    }
}
