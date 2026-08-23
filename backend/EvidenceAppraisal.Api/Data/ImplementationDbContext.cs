using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Data;

public sealed class ImplementationDbContext(DbContextOptions<ImplementationDbContext> options) : DbContext(options)
{
    public DbSet<CfirAssessmentEntity> CfirAssessments => Set<CfirAssessmentEntity>();
    public DbSet<CfirAssessmentItemEntity> CfirAssessmentItems => Set<CfirAssessmentItemEntity>();
    public DbSet<KtaAssessmentEntity> KtaAssessments => Set<KtaAssessmentEntity>();
    public DbSet<KtaPhaseEntity> KtaPhases => Set<KtaPhaseEntity>();
    public DbSet<KtaActionEntity> KtaActions => Set<KtaActionEntity>();
    public DbSet<KtaActionCfirLinkEntity> KtaActionCfirLinks => Set<KtaActionCfirLinkEntity>();
    public DbSet<ImplementationAuditEntity> ImplementationAudits => Set<ImplementationAuditEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CfirAssessmentEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.InnovationName).HasMaxLength(500).IsRequired();
            b.Property(x => x.InnerSetting).HasMaxLength(500).IsRequired();
            b.Property(x => x.OuterSetting).HasMaxLength(1000).IsRequired();
            b.Property(x => x.ReviewerCode).HasMaxLength(100).IsRequired();
            b.Property(x => x.SecondReviewerCode).HasMaxLength(100);
            b.Property(x => x.ConsensusReviewerCode).HasMaxLength(100);
            b.Property(x => x.ConsensusStatus).HasMaxLength(50);
            b.Property(x => x.ConsensusRationale).HasMaxLength(4000);
            b.Property(x => x.CfirVersion).HasMaxLength(50).IsRequired();
            b.Property(x => x.Status).HasMaxLength(50).IsRequired();
            b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.CfirAssessmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CfirAssessmentItemEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Domain).HasMaxLength(100).IsRequired();
            b.Property(x => x.Construct).HasMaxLength(250).IsRequired();
            b.Property(x => x.Influence).HasMaxLength(50).IsRequired();
            b.Property(x => x.EvidenceSummary).HasMaxLength(4000);
            b.Property(x => x.Rationale).HasMaxLength(4000).IsRequired();
            b.Property(x => x.EvidenceLocation).HasMaxLength(1000).IsRequired();
            b.HasIndex(x => new { x.CfirAssessmentId, x.Domain, x.Construct }).IsUnique();
        });

        modelBuilder.Entity<KtaAssessmentEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ProjectId).IsRequired();
            b.HasIndex(x => x.ProjectId);
            b.Property(x => x.ProjectName).HasMaxLength(500).IsRequired();
            b.Property(x => x.ReviewerCode).HasMaxLength(100).IsRequired();
            b.Property(x => x.KtaFrameworkVersion).HasMaxLength(100).IsRequired();
            b.Property(x => x.Status).HasMaxLength(50).IsRequired();
            b.HasMany(x => x.Phases).WithOne().HasForeignKey(x => x.KtaAssessmentId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(x => x.Actions).WithOne().HasForeignKey(x => x.KtaAssessmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<KtaPhaseEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(250).IsRequired();
            b.Property(x => x.Status).HasMaxLength(50).IsRequired();
            b.Property(x => x.Documentation).HasMaxLength(4000).IsRequired();
            b.HasIndex(x => new { x.KtaAssessmentId, x.Number }).IsUnique();
        });

        modelBuilder.Entity<KtaActionEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(500).IsRequired();
            b.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            b.Property(x => x.OwnerCode).HasMaxLength(100).IsRequired();
            b.Property(x => x.Status).HasMaxLength(50).IsRequired();
            b.HasMany(x => x.CfirLinks).WithOne().HasForeignKey(x => x.KtaActionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<KtaActionCfirLinkEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.CfirConstructKey).HasMaxLength(400).IsRequired();
            b.HasIndex(x => new { x.KtaActionId, x.CfirConstructKey }).IsUnique();
        });

        modelBuilder.Entity<ImplementationAuditEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            b.Property(x => x.EntityKey).HasMaxLength(400).IsRequired();
            b.Property(x => x.Field).HasMaxLength(200).IsRequired();
            b.Property(x => x.OldValue).HasMaxLength(4000);
            b.Property(x => x.NewValue).HasMaxLength(4000);
            b.Property(x => x.ChangedBy).HasMaxLength(100).IsRequired();
            b.Property(x => x.Reason).HasMaxLength(1000).IsRequired();
            b.Property(x => x.EventType).HasMaxLength(50).IsRequired();
            b.HasIndex(x => new { x.CfirAssessmentId, x.TimestampUtc });
        });
    }
}

public sealed class CfirAssessmentEntity
{
    public Guid Id { get; set; }
    public string InnovationName { get; set; } = string.Empty;
    public string InnerSetting { get; set; } = string.Empty;
    public string OuterSetting { get; set; } = string.Empty;
    public string ReviewerCode { get; set; } = string.Empty;
    public string? SecondReviewerCode { get; set; }
    public string? ConsensusReviewerCode { get; set; }
    public string? ConsensusStatus { get; set; }
    public string? ConsensusRationale { get; set; }
    public string CfirVersion { get; set; } = string.Empty;
    public DateTime AssessmentDateUtc { get; set; }
    public string Status { get; set; } = "Draft";
    public List<CfirAssessmentItemEntity> Items { get; set; } = [];
}

public sealed class CfirAssessmentItemEntity
{
    public Guid Id { get; set; }
    public Guid CfirAssessmentId { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string Construct { get; set; } = string.Empty;
    public string Influence { get; set; } = string.Empty;
    public string? EvidenceSummary { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public string EvidenceLocation { get; set; } = string.Empty;
}

public sealed class KtaAssessmentEntity
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ReviewerCode { get; set; } = string.Empty;
    public string KtaFrameworkVersion { get; set; } = string.Empty;
    public DateTime AssessmentDateUtc { get; set; }
    public string Status { get; set; } = "Draft";
    public List<KtaPhaseEntity> Phases { get; set; } = [];
    public List<KtaActionEntity> Actions { get; set; } = [];
}

public sealed class KtaPhaseEntity
{
    public Guid Id { get; set; }
    public Guid KtaAssessmentId { get; set; }
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Documentation { get; set; } = string.Empty;
}

public sealed class KtaActionEntity
{
    public Guid Id { get; set; }
    public Guid KtaAssessmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int KtaPhaseNumber { get; set; }
    public string OwnerCode { get; set; } = string.Empty;
    public DateTime? DueDateUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<KtaActionCfirLinkEntity> CfirLinks { get; set; } = [];
}

public sealed class KtaActionCfirLinkEntity
{
    public Guid Id { get; set; }
    public Guid KtaActionId { get; set; }
    public string CfirConstructKey { get; set; } = string.Empty;
}
