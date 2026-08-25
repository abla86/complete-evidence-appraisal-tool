using System.Text.Json;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EvidenceAppraisal.Api.Data;

public sealed class EvidenceDbContext(DbContextOptions<EvidenceDbContext> options) : DbContext(options)
{
    public DbSet<EvidenceRecordEntity> EvidenceRecords => Set<EvidenceRecordEntity>();
    public DbSet<EvidenceRecordHistoryEntity> EvidenceRecordHistory => Set<EvidenceRecordHistoryEntity>();
    public DbSet<StudyMetadata> Studies => Set<StudyMetadata>();
    public DbSet<ScreeningRecordEntity> ScreeningRecords => Set<ScreeningRecordEntity>();
    public DbSet<DataExtractionEntity> DataExtractions => Set<DataExtractionEntity>();
    public DbSet<ResearchOutcomeEntity> ResearchOutcomes => Set<ResearchOutcomeEntity>();
    public DbSet<ResearchAuditEntity> ResearchAudits => Set<ResearchAuditEntity>();
    public DbSet<ResearchProjectControlEntity> ResearchProjectControls => Set<ResearchProjectControlEntity>();
    public DbSet<ReviewerAccessEntity> ReviewerAccess => Set<ReviewerAccessEntity>();
    public DbSet<AccessAuditEntity> AccessAudits => Set<AccessAuditEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EvidenceRecordEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.DocumentHashSha256).HasMaxLength(64).IsRequired();
            b.Property(x => x.Instrument).HasMaxLength(50).IsRequired();
            b.Property(x => x.ItemOrDomain).HasMaxLength(250).IsRequired();
            b.Property(x => x.EvidenceText).HasMaxLength(8000).IsRequired();
            b.Property(x => x.SourceType).HasMaxLength(100).IsRequired();
            b.Property(x => x.Page).HasMaxLength(100);
            b.Property(x => x.Section).HasMaxLength(500);
            b.Property(x => x.Table).HasMaxLength(200);
            b.Property(x => x.Figure).HasMaxLength(200);
            b.Property(x => x.Url).HasMaxLength(2000);
            b.Property(x => x.Doi).HasMaxLength(500);
            b.Property(x => x.Reviewer).HasMaxLength(100).IsRequired();
            b.Property(x => x.Rationale).HasMaxLength(4000).IsRequired();
            b.Property(x => x.Status).HasMaxLength(50).IsRequired();
            b.Property(x => x.VerificationNote).HasMaxLength(4000);
            b.Property(x => x.VerifiedBy).HasMaxLength(100);
            b.Property(x => x.MethodologyVersion).HasMaxLength(200);
            b.Property(x => x.EvidenceQuote).HasMaxLength(8000);
            b.HasIndex(x => new { x.DocumentHashSha256, x.Instrument });
            b.HasIndex(x => new { x.DocumentHashSha256, x.Status });
            b.HasIndex(x => new { x.DocumentHashSha256, x.MethodologyVersion });
        });

        modelBuilder.Entity<EvidenceRecordHistoryEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(50).IsRequired();
            b.Property(x => x.Reviewer).HasMaxLength(100).IsRequired();
            b.Property(x => x.VerificationNote).HasMaxLength(4000);
            b.Property(x => x.Action).HasMaxLength(100).IsRequired();
            b.HasIndex(x => new { x.EvidenceRecordId, x.Version }).IsUnique();
        });

        var authorsConverter = new ValueConverter<List<string>, string>(
            value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
            value => JsonSerializer.Deserialize<List<string>>(value, (JsonSerializerOptions?)null) ?? new());

        var authorsComparer = new ValueComparer<List<string>>(
            (left, right) => left.SequenceEqual(right),
            value => value.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            value => value.ToList());

        modelBuilder.Entity<StudyMetadata>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(2000).IsRequired();
            b.Property(x => x.Type).HasMaxLength(100);
            b.Property(x => x.Year).HasMaxLength(50);
            b.Property(x => x.Doi).HasMaxLength(500);
            b.Property(x => x.Journal).HasMaxLength(1000);
            b.Property(x => x.Abstract).HasMaxLength(12000);
            b.Property(x => x.SourceDatabase).HasMaxLength(100);
            b.Property(x => x.ImportFingerprint).HasMaxLength(64).IsRequired();
            b.Property(x => x.Authors).HasConversion(authorsConverter).Metadata.SetValueComparer(authorsComparer);
            b.HasIndex(x => x.ImportFingerprint).IsUnique();
            b.HasIndex(x => x.Doi);
        });

        modelBuilder.Entity<ScreeningRecordEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Reviewer).HasMaxLength(100).IsRequired();
            b.Property(x => x.ExclusionReason).HasMaxLength(1000);
            b.Property(x => x.Notes).HasMaxLength(4000);
            b.HasIndex(x => new { x.StudyId, x.IsFullTextStage, x.CreatedAtUtc });
        });

        modelBuilder.Entity<DataExtractionEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Parameter).HasMaxLength(250).IsRequired();
            b.Property(x => x.Value).HasMaxLength(4000).IsRequired();
            b.Property(x => x.Unit).HasMaxLength(100);
            b.Property(x => x.SourceLocation).HasMaxLength(500);
            b.Property(x => x.Reviewer).HasMaxLength(100).IsRequired();
            b.Property(x => x.Notes).HasMaxLength(4000);
            b.HasIndex(x => new { x.StudyId, x.Parameter, x.CreatedAtUtc });
        });

        modelBuilder.Entity<ResearchOutcomeEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(500).IsRequired();
            b.Property(x => x.Definition).HasMaxLength(4000);
            b.Property(x => x.Timepoint).HasMaxLength(250);
            b.Property(x => x.Certainty).HasMaxLength(100);
            b.Property(x => x.Justification).HasMaxLength(4000);
            b.Property(x => x.RelativeEffect).HasMaxLength(1000);
            b.Property(x => x.AbsoluteEffect).HasMaxLength(1000);
            b.Property(x => x.ParticipantsAndStudies).HasMaxLength(1000);
            b.HasIndex(x => x.ProjectId);
        });

        modelBuilder.Entity<ResearchAuditEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            b.Property(x => x.EntityId).HasMaxLength(100).IsRequired();
            b.Property(x => x.Action).HasMaxLength(100).IsRequired();
            b.Property(x => x.Reviewer).HasMaxLength(100).IsRequired();
            b.Property(x => x.Data).HasMaxLength(16000).IsRequired();
            b.Property(x => x.PreviousHash).HasMaxLength(64).IsRequired();
            b.Property(x => x.CurrentHash).HasMaxLength(64).IsRequired();
            b.HasIndex(x => x.CreatedAtUtc);
            b.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        modelBuilder.Entity<ResearchProjectControlEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(500).IsRequired();
            b.Property(x => x.FinalHash).HasMaxLength(64);
            b.Property(x => x.LockedBy).HasMaxLength(100);
        });

        modelBuilder.Entity<ReviewerAccessEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.AccessCodeHash).HasMaxLength(64).IsRequired();
            b.HasIndex(x => new { x.ProjectId, x.ExpiresAtUtc });
        });

        modelBuilder.Entity<AccessAuditEntity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Reviewer).HasMaxLength(100).IsRequired();
            b.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            b.Property(x => x.EntityId).HasMaxLength(100).IsRequired();
            b.Property(x => x.Action).HasMaxLength(100).IsRequired();
            b.Property(x => x.IpAddress).HasMaxLength(64);
            b.HasIndex(x => x.TimestampUtc);
        });
    }
}

public sealed class EvidenceRecordEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DocumentHashSha256 { get; set; } = string.Empty;
    public string Instrument { get; set; } = string.Empty;
    public string ItemOrDomain { get; set; } = string.Empty;
    public string EvidenceText { get; set; } = string.Empty;
    public string SourceType { get; set; } = "Manual note";
    public string? Page { get; set; }
    public string? Section { get; set; }
    public string? Table { get; set; }
    public string? Figure { get; set; }
    public string? Url { get; set; }
    public string? Doi { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string Status { get; set; } = "Manually added";
    public string? VerificationNote { get; set; }
    public string? VerifiedBy { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public bool IsHumanVerified { get; set; }
    public string? MethodologyVersion { get; set; }
    public string? EvidenceQuote { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
