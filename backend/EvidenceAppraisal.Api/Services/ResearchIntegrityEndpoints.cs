using System.Text.Json;
using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class ResearchIntegrityEndpoints
{
    public static void MapResearchIntegrityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/research/integrity/protocol", async (ResearchProtocolRequest request, EvidenceDbContext db, ResearchSystemGate gate, CancellationToken ct) =>
        {
            if (request.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(request.ResearchQuestion) || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "ProjectId, ResearchQuestion and Reviewer are required." });

            var access = await gate.CheckWriteAccessAsync(request.ProjectId, request.Reviewer, ct);
            if (!access.Allowed) return Results.Conflict(new { error = access.Error });

            var lastVersion = await db.ResearchProtocols.Where(x => x.ProjectId == request.ProjectId).Select(x => (int?)x.Version).MaxAsync(ct) ?? 0;
            var entity = new ResearchProtocolEntity
            {
                ProjectId = request.ProjectId,
                Version = lastVersion + 1,
                ResearchQuestion = request.ResearchQuestion.Trim(),
                P = request.P?.Trim(),
                I = request.I?.Trim(),
                C = request.C?.Trim(),
                O = request.O?.Trim(),
                InclusionCriteria = request.InclusionCriteria?.Trim(),
                ExclusionCriteria = request.ExclusionCriteria?.Trim(),
                SearchStrategy = request.SearchStrategy?.Trim(),
                Databases = request.Databases?.Trim(),
                MethodologyId = request.MethodologyId.Trim(),
                MethodologyVersion = request.MethodologyVersion.Trim(),
                CreatedBy = request.Reviewer.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };

            var canonical = JsonSerializer.Serialize(new
            {
                entity.ProjectId, entity.Version, entity.ResearchQuestion, entity.P, entity.I, entity.C, entity.O,
                entity.InclusionCriteria, entity.ExclusionCriteria, entity.SearchStrategy, entity.Databases,
                entity.MethodologyId, entity.MethodologyVersion, entity.CreatedBy
            });
            entity.Hash = ResearchIntegrityHash.Compute(canonical);
            db.ResearchProtocols.Add(entity);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/research/integrity/protocol/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/integrity/protocol/{projectId:guid}", async (Guid projectId, EvidenceDbContext db, CancellationToken ct) =>
            Results.Ok(await db.ResearchProtocols.AsNoTracking().Where(x => x.ProjectId == projectId).OrderByDescending(x => x.Version).ToListAsync(ct)));

        endpoints.MapPost("/api/research/integrity/reviewer-decision", async (ReviewerDecisionRequest request, EvidenceDbContext db, ResearchSystemGate gate, CancellationToken ct) =>
        {
            if (request.ProjectId == Guid.Empty || request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Stage) || string.IsNullOrWhiteSpace(request.Reviewer) || string.IsNullOrWhiteSpace(request.Decision))
                return Results.BadRequest(new { error = "ProjectId, StudyId, Stage, Reviewer and Decision are required." });

            var access = await gate.CheckWriteAccessAsync(request.ProjectId, request.Reviewer, ct);
            if (!access.Allowed) return Results.Conflict(new { error = access.Error });

            var decision = new ReviewerDecisionEntity
            {
                ProjectId = request.ProjectId,
                StudyId = request.StudyId,
                Stage = request.Stage.Trim(),
                Reviewer = request.Reviewer.Trim(),
                Decision = request.Decision.Trim(),
                Rationale = request.Rationale?.Trim(),
                EvidenceReference = request.EvidenceReference?.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            db.ReviewerDecisions.Add(decision);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/research/integrity/reviewer-decision/{decision.Id}", decision);
        });

        endpoints.MapGet("/api/research/integrity/reviewer-decisions/{projectId:guid}/{studyId:guid}", async (Guid projectId, Guid studyId, string stage, EvidenceDbContext db, CancellationToken ct) =>
            Results.Ok(await db.ReviewerDecisions.AsNoTracking().Where(x => x.ProjectId == projectId && x.StudyId == studyId && x.Stage == stage).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct)));

        endpoints.MapPost("/api/research/integrity/consensus", async (ConsensusRequest request, EvidenceDbContext db, ResearchSystemGate gate, CancellationToken ct) =>
        {
            if (request.ProjectId == Guid.Empty || request.StudyId == Guid.Empty || request.ReviewerADecisionId == Guid.Empty || request.ReviewerBDecisionId == Guid.Empty || string.IsNullOrWhiteSpace(request.Decision) || string.IsNullOrWhiteSpace(request.Rationale) || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "All consensus fields are required." });

            var access = await gate.CheckWriteAccessAsync(request.ProjectId, request.Reviewer, ct);
            if (!access.Allowed) return Results.Conflict(new { error = access.Error });

            var a = await db.ReviewerDecisions.SingleOrDefaultAsync(x => x.Id == request.ReviewerADecisionId && x.ProjectId == request.ProjectId && x.StudyId == request.StudyId && x.Stage == request.Stage, ct);
            var b = await db.ReviewerDecisions.SingleOrDefaultAsync(x => x.Id == request.ReviewerBDecisionId && x.ProjectId == request.ProjectId && x.StudyId == request.StudyId && x.Stage == request.Stage, ct);
            if (a is null || b is null || a.Id == b.Id || string.Equals(a.Reviewer, b.Reviewer, StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { error = "Consensus requires two independent reviewer decisions from different reviewers." });

            var entity = new ConsensusDecisionEntity
            {
                ProjectId = request.ProjectId,
                StudyId = request.StudyId,
                Stage = request.Stage.Trim(),
                ReviewerADecisionId = a.Id,
                ReviewerBDecisionId = b.Id,
                Decision = request.Decision.Trim(),
                Rationale = request.Rationale.Trim(),
                Reviewer = request.Reviewer.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            entity.Hash = ResearchIntegrityHash.Compute($"{entity.ProjectId}|{entity.StudyId}|{entity.Stage}|{entity.ReviewerADecisionId}|{entity.ReviewerBDecisionId}|{entity.Decision}|{entity.Rationale}|{entity.Reviewer}|{entity.CreatedAtUtc:O}");
            db.ConsensusDecisions.Add(entity);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/research/integrity/consensus/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/integrity/consensus/{projectId:guid}", async (Guid projectId, EvidenceDbContext db, CancellationToken ct) =>
            Results.Ok(await db.ConsensusDecisions.AsNoTracking().Where(x => x.ProjectId == projectId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct)));

        endpoints.MapPost("/api/research/integrity/prisma-event", async (PrismaFlowRequest request, EvidenceDbContext db, ResearchSystemGate gate, CancellationToken ct) =>
        {
            if (request.ProjectId == Guid.Empty || request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.PreviousStatus) || string.IsNullOrWhiteSpace(request.NewStatus) || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "PRISMA event fields are required." });

            var access = await gate.CheckWriteAccessAsync(request.ProjectId, request.Reviewer, ct);
            if (!access.Allowed) return Results.Conflict(new { error = access.Error });

            var project = await db.ResearchProjectControls.AsNoTracking().SingleOrDefaultAsync(x => x.Id == request.ProjectId, ct);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });
            if (!project.EnablePrismaTracking) return Results.BadRequest(new { error = "PRISMA tracking is disabled for this project." });

            var lastHash = await db.PrismaFlowEvents.Where(x => x.ProjectId == request.ProjectId).OrderByDescending(x => x.CreatedAtUtc).Select(x => x.AuditHash).FirstOrDefaultAsync(ct) ?? string.Empty;
            var entity = new PrismaFlowEventEntity
            {
                ProjectId = request.ProjectId,
                StudyId = request.StudyId,
                PreviousStatus = request.PreviousStatus.Trim(),
                NewStatus = request.NewStatus.Trim(),
                Reason = request.Reason?.Trim(),
                Reviewer = request.Reviewer.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            entity.AuditHash = ResearchIntegrityHash.Compute($"{lastHash}|{entity.ProjectId}|{entity.StudyId}|{entity.PreviousStatus}|{entity.NewStatus}|{entity.Reason}|{entity.Reviewer}|{entity.CreatedAtUtc:O}");
            db.PrismaFlowEvents.Add(entity);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/research/integrity/prisma-event/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/integrity/prisma/{projectId:guid}", async (Guid projectId, EvidenceDbContext db, CancellationToken ct) =>
            Results.Ok(await db.PrismaFlowEvents.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct)));

        endpoints.MapPost("/api/research/integrity/provenance", async (EvidenceProvenanceRequest request, EvidenceDbContext db, ResearchSystemGate gate, CancellationToken ct) =>
        {
            if (request.ProjectId == Guid.Empty || request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.DocumentHashSha256) || request.DocumentHashSha256.Length != 64 || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "ProjectId, StudyId, SHA-256 document hash and Reviewer are required." });
            if (!request.DocumentHashSha256.All(Uri.IsHexDigit)) return Results.BadRequest(new { error = "DocumentHashSha256 must be hexadecimal." });

            var access = await gate.CheckWriteAccessAsync(request.ProjectId, request.Reviewer, ct);
            if (!access.Allowed) return Results.Conflict(new { error = access.Error });

            var entity = new EvidenceProvenanceEntity
            {
                ProjectId = request.ProjectId,
                StudyId = request.StudyId,
                EvidenceRecordId = request.EvidenceRecordId,
                DocumentHashSha256 = request.DocumentHashSha256.ToLowerInvariant(),
                Page = request.Page?.Trim(),
                Excerpt = request.Excerpt?.Trim(),
                Locator = request.Locator?.Trim(),
                SourceType = request.SourceType.Trim(),
                CreatedBy = request.Reviewer.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            db.EvidenceProvenance.Add(entity);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/research/integrity/provenance/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/integrity/provenance/{projectId:guid}/{studyId:guid}", async (Guid projectId, Guid studyId, EvidenceDbContext db, CancellationToken ct) =>
            Results.Ok(await db.EvidenceProvenance.AsNoTracking().Where(x => x.ProjectId == projectId && x.StudyId == studyId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct)));
    }
}
