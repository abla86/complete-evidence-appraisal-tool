using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ResearchSystemGateTests
{
    [Fact]
    public async Task Gate_blocks_project_without_governance()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<EvidenceDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new EvidenceDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var project = new ResearchProjectControlEntity { Id = Guid.NewGuid(), Name = "Test" };
        db.ResearchProjectControls.Add(project);
        await db.SaveChangesAsync();

        var gate = new ResearchSystemGate(db);
        var result = await gate.CheckWriteAccessAsync(project.Id, "Reviewer A", CancellationToken.None);

        Assert.False(result.Allowed);
        Assert.Contains("governance", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Gate_allows_research_write_when_governance_is_valid()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<EvidenceDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new EvidenceDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var project = new ResearchProjectControlEntity { Id = Guid.NewGuid(), Name = "Test" };
        db.ResearchProjectControls.Add(project);
        db.ResearchGovernance.Add(new ResearchGovernanceEntity
        {
            ProjectId = project.Id,
            DataClassification = "public-or-synthetic",
            ResponsibleOrganization = "Test organization",
            ResearchLead = "Reviewer A",
            StorageLocation = "Test environment",
            RetentionPolicy = "Project-defined",
            PublicDeploymentAllowed = true,
            UpdatedBy = "Reviewer A"
        });
        await db.SaveChangesAsync();

        var gate = new ResearchSystemGate(db);
        var result = await gate.CheckWriteAccessAsync(project.Id, "Reviewer A", CancellationToken.None);

        Assert.True(result.Allowed);
        Assert.Null(result.Error);
    }

    [Fact]
    public async Task Gate_blocks_locked_project()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<EvidenceDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new EvidenceDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var project = new ResearchProjectControlEntity { Id = Guid.NewGuid(), Name = "Locked", IsLocked = true };
        db.ResearchProjectControls.Add(project);
        db.ResearchGovernance.Add(new ResearchGovernanceEntity
        {
            ProjectId = project.Id,
            DataClassification = "public-or-synthetic",
            ResponsibleOrganization = "Test organization",
            ResearchLead = "Reviewer A",
            StorageLocation = "Test environment",
            RetentionPolicy = "Project-defined",
            PublicDeploymentAllowed = true,
            UpdatedBy = "Reviewer A"
        });
        await db.SaveChangesAsync();

        var gate = new ResearchSystemGate(db);
        var result = await gate.CheckWriteAccessAsync(project.Id, "Reviewer A", CancellationToken.None);

        Assert.False(result.Allowed);
        Assert.Contains("locked", result.Error, StringComparison.OrdinalIgnoreCase);
    }
}
