using EvidenceAppraisal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class EvidenceAuditEndpoints
{
    public static void MapEvidenceAuditEndpoints(this WebApplication app)
    {
        app.MapGet("/api/evidence/manual/{id:guid}/history", async (Guid id, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var exists = await db.EvidenceRecords.AsNoTracking().AnyAsync(x => x.Id == id, cancellationToken);
            if (!exists) return Results.NotFound(new { error = "Evidence record not found." });

            var history = await db.EvidenceRecordHistory.AsNoTracking()
                .Where(x => x.EvidenceRecordId == id)
                .OrderByDescending(x => x.Version)
                .ToListAsync(cancellationToken);

            return Results.Ok(history.Select(x => new
            {
                x.Id, x.EvidenceRecordId, x.Version, x.Status, x.Reviewer,
                x.VerificationNote, x.VerifiedAtUtc, x.RecordedAtUtc, x.Action
            }));
        });
    }
}

public sealed class EvidenceRecordHistoryEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EvidenceRecordId { get; set; }
    public int Version { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
    public string? VerificationNote { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public DateTime RecordedAtUtc { get; set; } = DateTime.UtcNow;
    public string Action { get; set; } = "Verification update";
}
