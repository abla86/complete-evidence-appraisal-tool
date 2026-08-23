using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class EvidenceVerificationEndpoints
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Needs review", "Verified", "Rejected", "Uncertain", "Not found", "Manually added"
    };

    public static void MapEvidenceVerificationEndpoints(this WebApplication app)
    {
        app.MapPatch("/api/evidence/manual/{id:guid}/verification", async (Guid id, EvidenceVerificationRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (!AllowedStatuses.Contains(request.Status))
                return Results.BadRequest(new { error = "Invalid evidence status.", allowed = AllowedStatuses.OrderBy(x => x) });
            if (string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "Reviewer is required for verification." });
            if (request.Status.Equals("Verified", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(request.VerificationNote))
                return Results.BadRequest(new { error = "A verification note is required when evidence is marked Verified." });

            var entity = await db.EvidenceRecords.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (entity is null) return Results.NotFound(new { error = "Evidence record not found." });

            entity.Status = request.Status.Trim();
            entity.VerifiedBy = request.Reviewer.Trim();
            entity.VerificationNote = request.VerificationNote?.Trim();
            entity.VerifiedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToDto(entity));
        });

        app.MapGet("/api/evidence/manual/{documentHash}/summary", async (string documentHash, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var records = await db.EvidenceRecords.AsNoTracking()
                .Where(x => x.DocumentHashSha256 == documentHash)
                .ToListAsync(cancellationToken);

            var byStatus = records.GroupBy(x => x.Status).ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
            return Results.Ok(new
            {
                documentHashSha256 = documentHash,
                total = records.Count,
                byStatus,
                methodologicalNotice = "Evidence status records researcher verification state; it does not constitute an appraisal judgement or quality score."
            });
        });
    }

    private static EvidenceRecordDto ToDto(EvidenceRecordEntity entity) => new(
        entity.Id, entity.DocumentHashSha256, entity.Instrument, entity.ItemOrDomain, entity.EvidenceText,
        entity.SourceType, entity.Page, entity.Section, entity.Table, entity.Figure, entity.Url, entity.Doi,
        entity.Reviewer, entity.Rationale, entity.Status, entity.VerificationNote, entity.VerifiedBy,
        entity.VerifiedAtUtc, entity.CreatedAtUtc);
}
