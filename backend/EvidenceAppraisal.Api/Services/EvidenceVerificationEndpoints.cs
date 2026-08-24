using System.Data;
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

    private static readonly ResearchCollaborationService Collaboration = new();

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

            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            var entity = await db.EvidenceRecords.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (entity is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Results.NotFound(new { error = "Evidence record not found." });
            }

            entity.Status = request.Status.Trim();
            entity.VerifiedBy = request.Reviewer.Trim();
            entity.VerificationNote = request.VerificationNote?.Trim();
            entity.VerifiedAtUtc = DateTime.UtcNow;

            var lastVersion = await db.EvidenceRecordHistory
                .Where(x => x.EvidenceRecordId == id)
                .Select(x => (int?)x.Version)
                .MaxAsync(cancellationToken) ?? 0;

            db.EvidenceRecordHistory.Add(new EvidenceRecordHistoryEntity
            {
                EvidenceRecordId = entity.Id,
                Version = checked(lastVersion + 1),
                Status = entity.Status,
                Reviewer = entity.VerifiedBy,
                VerificationNote = entity.VerificationNote,
                VerifiedAtUtc = entity.VerifiedAtUtc,
                RecordedAtUtc = DateTime.UtcNow,
                Action = "Verification update"
            });

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Results.Ok(ToDto(entity));
        });

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

        app.MapGet("/api/evidence/manual/{documentHash}/summary", async (string documentHash, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(documentHash) || documentHash.Length != 64 || !documentHash.All(Uri.IsHexDigit))
                return Results.BadRequest(new { error = "documentHash must be a 64-character SHA-256 hexadecimal hash." });

            var normalizedHash = documentHash.ToLowerInvariant();
            var records = await db.EvidenceRecords.AsNoTracking()
                .Where(x => x.DocumentHashSha256 == normalizedHash)
                .ToListAsync(cancellationToken);

            var byStatus = records.GroupBy(x => x.Status).ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
            return Results.Ok(new
            {
                documentHashSha256 = normalizedHash,
                total = records.Count,
                byStatus,
                methodologicalNotice = "Evidence status records researcher verification state; it does not constitute an appraisal judgement or quality score."
            });
        });

        app.MapGet("/api/research/collaboration/{projectId}", (string projectId) => Results.Ok(new
        {
            projectId,
            participants = Collaboration.GetParticipants(projectId),
            locks = Collaboration.GetLocks(projectId),
            mode = "polling",
            notice = "Presence and field locks are convenience controls. They do not replace audit history or database concurrency protection."
        }));

        app.MapPost("/api/research/collaboration/{projectId}/heartbeat", (string projectId, CollaborationHeartbeat request) =>
        {
            if (string.IsNullOrWhiteSpace(projectId) || string.IsNullOrWhiteSpace(request.ReviewerId))
                return Results.BadRequest(new { error = "ProjectId and ReviewerId are required." });
            Collaboration.Heartbeat(projectId, request.ReviewerId.Trim(), request.DisplayName?.Trim() ?? string.Empty);
            return Results.Ok(new { saved = true });
        });

        app.MapPost("/api/research/collaboration/{projectId}/lock", (string projectId, CollaborationLockRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(projectId) || string.IsNullOrWhiteSpace(request.FieldId) || string.IsNullOrWhiteSpace(request.ReviewerId))
                return Results.BadRequest(new { error = "ProjectId, FieldId and ReviewerId are required." });
            var acquired = Collaboration.TryAcquire(projectId, request.FieldId.Trim(), request.ReviewerId.Trim(), request.DisplayName?.Trim() ?? string.Empty, out var fieldLock);
            return acquired
                ? Results.Ok(new { acquired = true, fieldLock })
                : Results.Conflict(new { acquired = false, fieldLock, error = "Feltet redigeres av en annen reviewer akkurat nå." });
        });

        app.MapPost("/api/research/collaboration/{projectId}/unlock", (string projectId, CollaborationLockRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(projectId) || string.IsNullOrWhiteSpace(request.FieldId) || string.IsNullOrWhiteSpace(request.ReviewerId))
                return Results.BadRequest(new { error = "ProjectId, FieldId and ReviewerId are required." });
            Collaboration.Release(projectId, request.FieldId.Trim(), request.ReviewerId.Trim());
            return Results.Ok(new { released = true });
        });
    }

    private static EvidenceRecordDto ToDto(EvidenceRecordEntity entity) => new(
        entity.Id, entity.DocumentHashSha256, entity.Instrument, entity.ItemOrDomain, entity.EvidenceText,
        entity.SourceType, entity.Page, entity.Section, entity.Table, entity.Figure, entity.Url, entity.Doi,
        entity.Reviewer, entity.Rationale, entity.Status, entity.VerificationNote, entity.VerifiedBy,
        entity.VerifiedAtUtc, entity.CreatedAtUtc);
}

public sealed record CollaborationHeartbeat(string ReviewerId, string DisplayName);
public sealed record CollaborationLockRequest(string FieldId, string ReviewerId, string DisplayName);
