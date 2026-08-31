using System.Text.Json;
using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class ResearchOperationsEndpoints
{
    private static readonly HashSet<string> AllowedInstruments = new(StringComparer.OrdinalIgnoreCase)
    {
        "amstar2", "casp", "casp-qualitative-2024", "jbi-qualitative-2017", "agree2", "grade", "rob2"
    };

    public static void MapResearchOperationsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/research/operations/projects/{projectId:guid}/configuration", async (Guid projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var project = await db.ResearchProjectControls.AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });
            return Results.Ok(ToConfigurationDto(project));
        });

        endpoints.MapPut("/api/research/operations/projects/{projectId:guid}/configuration", async (Guid projectId, ResearchProjectConfigurationRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (projectId == Guid.Empty || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "ProjectId and Reviewer are required." });

            var selected = (request.EnabledInstruments ?? Array.Empty<string>())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();

            var invalid = selected.Where(x => !AllowedInstruments.Contains(x)).ToList();
            if (invalid.Count > 0)
                return Results.BadRequest(new { error = "One or more instruments are not supported.", invalid, allowed = AllowedInstruments.OrderBy(x => x) });

            var project = await db.ResearchProjectControls.SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken);
            if (project is null)
            {
                project = new ResearchProjectControlEntity { Id = projectId };
                db.ResearchProjectControls.Add(project);
            }

            if (project.IsLocked)
                return Results.Conflict(new { error = "Project configuration is locked after finalization.", project.FinalHash, project.LockedBy, project.LockedAtUtc });

            if (selected.Count == 0 && request.RequireHumanVerification)
                return Results.BadRequest(new { error = "Select at least one appraisal instrument or disable human-verification appraisal for this project." });

            project.Name = string.IsNullOrWhiteSpace(request.Name) ? "Research project" : request.Name.Trim();
            project.EnabledInstrumentsJson = JsonSerializer.Serialize(selected);
            project.RequireHumanVerification = request.RequireHumanVerification;
            project.EnableDualReview = request.EnableDualReview;
            project.EnablePrismaTracking = request.EnablePrismaTracking;
            project.EnableAuditTrail = request.EnableAuditTrail;
            project.EnableDoiMetadataLookup = request.EnableDoiMetadataLookup;
            project.EnablePicoAssist = request.EnablePicoAssist;
            project.EnablePdfEvidenceMapping = request.EnablePdfEvidenceMapping;
            project.EnableOfflineMode = request.EnableOfflineMode;
            project.IncludePageTextInAnalysis = request.IncludePageTextInAnalysis;
            project.MethodologyVersion = request.MethodologyVersion?.Trim() ?? string.Empty;
            project.ConfiguredAtUtc = DateTime.UtcNow;
            project.ConfiguredBy = request.Reviewer.Trim();

            await db.SaveChangesAsync(cancellationToken);
            if (project.EnableAuditTrail)
                await AppendAuditAsync(db, "ResearchProject", project.Id.ToString(), "Configuration updated", project.ConfiguredBy, ToConfigurationDto(project), cancellationToken);

            return Results.Ok(ToConfigurationDto(project));
        });

        endpoints.MapPost("/api/research/operations/screening", async (ScreeningDecisionRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (request.ProjectId == Guid.Empty || request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "ProjectId, StudyId and Reviewer are required." });
            if (request.Status == ScreeningStatus.Excluded && string.IsNullOrWhiteSpace(request.ExclusionReason))
                return Results.BadRequest(new { error = "ExclusionReason is required when a study is excluded." });

            var project = await db.ResearchProjectControls.SingleOrDefaultAsync(x => x.Id == request.ProjectId, cancellationToken);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });
            if (project.IsLocked) return Results.Conflict(new { error = "Project is finalized and locked." });
            if (!project.EnablePrismaTracking) return Results.BadRequest(new { error = "PRISMA/screening tracking is disabled for this project." });

            if (!await db.Studies.AnyAsync(x => x.Id == request.StudyId, cancellationToken))
                return Results.NotFound(new { error = "Study not found." });

            if (project.EnableDualReview && request.Status == ScreeningStatus.Included)
            {
                var prior = await db.ScreeningRecords.AsNoTracking()
                    .Where(x => x.ProjectId == request.ProjectId && x.StudyId == request.StudyId && x.Reviewer != request.Reviewer.Trim() && x.Status != ScreeningStatus.Pending)
                    .OrderByDescending(x => x.CreatedAtUtc)
                    .FirstOrDefaultAsync(cancellationToken);
                if (prior is null)
                    return Results.Conflict(new { error = "Dual review is enabled. An independent reviewer decision is required before inclusion can be finalized." });
            }

            var entity = new ScreeningRecordEntity
            {
                ProjectId = request.ProjectId,
                StudyId = request.StudyId,
                Reviewer = request.Reviewer.Trim(),
                Status = request.Status,
                IsFullTextStage = request.IsFullTextStage,
                ExclusionReason = request.ExclusionReason?.Trim(),
                Notes = request.Notes?.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            db.ScreeningRecords.Add(entity);
            await db.SaveChangesAsync(cancellationToken);

            if (project.EnableAuditTrail)
                await AppendAuditAsync(db, "ScreeningRecord", entity.Id.ToString(), "Created", entity.Reviewer, entity, cancellationToken);

            return Results.Created($"/api/research/operations/screening/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/operations/screening/{studyId:guid}", async (Guid studyId, Guid? projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var query = db.ScreeningRecords.AsNoTracking().Where(x => x.StudyId == studyId);
            if (projectId.HasValue) query = query.Where(x => x.ProjectId == projectId.Value);
            return Results.Ok(await query.OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken));
        });

        endpoints.MapGet("/api/research/operations/screening/stats", async (Guid projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (projectId == Guid.Empty) return Results.BadRequest(new { error = "ProjectId is required." });
            var latest = await db.ScreeningRecords.AsNoTracking().Where(x => x.ProjectId == projectId).GroupBy(x => new { x.StudyId, x.IsFullTextStage }).Select(g => g.OrderByDescending(x => x.CreatedAtUtc).First()).ToListAsync(cancellationToken);
            var title = latest.Where(x => !x.IsFullTextStage).ToList();
            var fullText = latest.Where(x => x.IsFullTextStage).ToList();
            var breakdown = fullText.Where(x => x.Status == ScreeningStatus.Excluded).GroupBy(x => x.ExclusionReason ?? "Unspecified").ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
            return Results.Ok(new ScreeningStats(title.Count, title.Count(x => x.Status != ScreeningStatus.Pending), title.Count(x => x.Status == ScreeningStatus.Excluded), fullText.Count(x => x.Status != ScreeningStatus.Pending), fullText.Count(x => x.Status == ScreeningStatus.Excluded), fullText.Count(x => x.Status == ScreeningStatus.Included), breakdown));
        });

        endpoints.MapPost("/api/research/operations/extraction", async (ExtractionRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (request.ProjectId == Guid.Empty || request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Parameter) || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "ProjectId, StudyId, Parameter and Reviewer are required." });
            if (string.IsNullOrWhiteSpace(request.Value)) return Results.BadRequest(new { error = "Value is required." });

            var project = await db.ResearchProjectControls.SingleOrDefaultAsync(x => x.Id == request.ProjectId, cancellationToken);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });
            if (project.IsLocked) return Results.Conflict(new { error = "Project is finalized and locked." });
            if (!await db.Studies.AnyAsync(x => x.Id == request.StudyId, cancellationToken)) return Results.NotFound(new { error = "Study not found." });

            var entity = new DataExtractionEntity
            {
                ProjectId = request.ProjectId,
                StudyId = request.StudyId,
                Parameter = request.Parameter.Trim(),
                Value = request.Value.Trim(),
                Unit = request.Unit?.Trim(),
                SourceLocation = request.SourceLocation?.Trim(),
                Reviewer = request.Reviewer.Trim(),
                Notes = request.Notes?.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            db.DataExtractions.Add(entity);
            await db.SaveChangesAsync(cancellationToken);

            if (project.EnableAuditTrail)
                await AppendAuditAsync(db, "DataExtraction", entity.Id.ToString(), "Created", entity.Reviewer, entity, cancellationToken);

            return Results.Created($"/api/research/operations/extraction/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/operations/extraction/{studyId:guid}", async (Guid studyId, Guid? projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var query = db.DataExtractions.AsNoTracking().Where(x => x.StudyId == studyId);
            if (projectId.HasValue) query = query.Where(x => x.ProjectId == projectId.Value);
            return Results.Ok(await query.OrderBy(x => x.Parameter).ThenBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken));
        });

        endpoints.MapPost("/api/research/operations/outcomes", async (OutcomeRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (request.ProjectId is null || request.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { error = "ProjectId and outcome name are required." });

            var project = await db.ResearchProjectControls.SingleOrDefaultAsync(x => x.Id == request.ProjectId.Value, cancellationToken);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });
            if (project.IsLocked) return Results.Conflict(new { error = "Project is finalized and locked." });

            var entity = new ResearchOutcomeEntity
            {
                Name = request.Name.Trim(),
                Definition = request.Definition?.Trim(),
                Timepoint = request.Timepoint?.Trim(),
                Certainty = request.Certainty?.Trim(),
                Justification = request.Justification?.Trim(),
                RelativeEffect = request.RelativeEffect?.Trim(),
                AbsoluteEffect = request.AbsoluteEffect?.Trim(),
                ParticipantsAndStudies = request.ParticipantsAndStudies?.Trim(),
                ProjectId = request.ProjectId.Value,
                CreatedAtUtc = DateTime.UtcNow
            };
            db.ResearchOutcomes.Add(entity);
            await db.SaveChangesAsync(cancellationToken);
            if (project.EnableAuditTrail)
                await AppendAuditAsync(db, "ResearchOutcome", entity.Id.ToString(), "Created", "", entity, cancellationToken);
            return Results.Created($"/api/research/operations/outcomes/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/operations/outcomes", async (Guid projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (projectId == Guid.Empty) return Results.BadRequest(new { error = "ProjectId is required." });
            return Results.Ok(await db.ResearchOutcomes.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.Name).ToListAsync(cancellationToken));
        });

        endpoints.MapPost("/api/research/operations/projects/{projectId:guid}/finalize", async (Guid projectId, FinalizeProjectRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Reviewer)) return Results.BadRequest(new { error = "Reviewer is required." });
            var project = await db.ResearchProjectControls.SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });
            if (project.IsLocked) return Results.Conflict(new { error = "Project is already finalized and locked.", project.FinalHash, project.LockedBy, project.LockedAtUtc });

            var screening = await db.ScreeningRecords.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
            var extractions = await db.DataExtractions.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
            var outcomes = await db.ResearchOutcomes.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
            var payload = new { project.Id, project.Name, Configuration = ToConfigurationDto(project), Screening = screening, Extractions = extractions, Outcomes = outcomes };
            var canonical = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
            project.FinalHash = ResearchHash.Compute(canonical);
            project.IsLocked = true;
            project.LockedAtUtc = DateTime.UtcNow;
            project.LockedBy = request.Reviewer.Trim();
            await db.SaveChangesAsync(cancellationToken);
            if (project.EnableAuditTrail)
                await AppendAuditAsync(db, "ResearchProject", project.Id.ToString(), "Finalized", project.LockedBy, new { project.FinalHash, Configuration = ToConfigurationDto(project) }, cancellationToken);
            return Results.Ok(new { projectId, finalized = true, project.FinalHash, project.LockedAtUtc, project.LockedBy, configuration = ToConfigurationDto(project) });
        });

        endpoints.MapGet("/api/research/operations/projects/{projectId:guid}", async (Guid projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var project = await db.ResearchProjectControls.AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken);
            return project is null ? Results.NotFound(new { error = "Research project not found." }) : Results.Ok(new { project, configuration = ToConfigurationDto(project) });
        });

        endpoints.MapGet("/api/research/operations/audit", async (string? entityType, string? reviewer, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var query = db.ResearchAudits.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(x => x.EntityType == entityType);
            if (!string.IsNullOrWhiteSpace(reviewer)) query = query.Where(x => x.Reviewer == reviewer);
            return Results.Ok(await query.OrderByDescending(x => x.CreatedAtUtc).Take(500).ToListAsync(cancellationToken));
        });
    }

    private static ResearchProjectConfigurationDto ToConfigurationDto(ResearchProjectControlEntity project)
    {
        var instruments = JsonSerializer.Deserialize<string[]>(project.EnabledInstrumentsJson) ?? Array.Empty<string>();
        return new ResearchProjectConfigurationDto(project.Id, project.Name, instruments, project.RequireHumanVerification, project.EnableDualReview, project.EnablePrismaTracking, project.EnableAuditTrail, project.EnableDoiMetadataLookup, project.EnablePicoAssist, project.EnablePdfEvidenceMapping, project.EnableOfflineMode, project.IncludePageTextInAnalysis, project.MethodologyVersion, project.ResearchRulesVersion, project.IsLocked, project.ConfiguredAtUtc, project.ConfiguredBy);
    }

    private static async Task AppendAuditAsync(EvidenceDbContext db, string entityType, string entityId, string action, string reviewer, object data, CancellationToken cancellationToken)
    {
        var previous = await db.ResearchAudits.OrderByDescending(x => x.Id).Select(x => x.CurrentHash).FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
        var json = JsonSerializer.Serialize(data);
        var current = ResearchHash.Compute($"{previous}|{entityType}|{entityId}|{action}|{reviewer}|{json}");
        db.ResearchAudits.Add(new ResearchAuditEntity { EntityType = entityType, EntityId = entityId, Action = action, Reviewer = reviewer, Data = json, PreviousHash = previous, CurrentHash = current, CreatedAtUtc = DateTime.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
    }
}
