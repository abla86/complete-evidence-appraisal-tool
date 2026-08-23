using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Data;

public sealed class EvidenceDbContext(DbContextOptions<EvidenceDbContext> options) : DbContext(options)
{
    public DbSet<EvidenceRecordEntity> EvidenceRecords => Set<EvidenceRecordEntity>();

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
            b.HasIndex(x => new { x.DocumentHashSha256, x.Instrument });
            b.HasIndex(x => new { x.DocumentHashSha256, x.Status });
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
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}