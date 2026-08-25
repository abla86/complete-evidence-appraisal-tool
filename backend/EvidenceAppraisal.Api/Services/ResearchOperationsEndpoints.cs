using System.Text.Json;
using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class ResearchOperationsEndpoints
{
    private static readonly HashSet<string> AllowedInstruments = new(StringComparer.OrdinalIgnoreCase)
    {
        "amstar2", "casp", "agree2", "grade", "rob2"
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
            await AppendAuditAsync(db, "ResearchProject", project.Id.ToString(), "Configuration updated", project.ConfiguredBy, ToConfigurationDto(project), cancellationToken);

            return Results.Ok(ToConfigurationDto(project));
        });

        endpoints.MapPost("/api/research/operations/screening", async (ScreeningDecisionRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Reviewer))
                return Results.BadRequest(new { error = "StudyId and Reviewer are required." });
            if (request.Status == ScreeningStatus.Excluded && string.IsNullOrWhiteSpace(request.ExclusionReason))
                return Results.BadRequest(new { error = "ExclusionReason is required when a study is excluded." });

            var studyExists = await db.Studies.AnyAsync(x => x.Id == request.StudyId, cancellationToken);
            if (!studyExists) return Results.NotFound(new { error = "Study not found." });

            var entity = new ScreeningRecordEntity
            {
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
            await AppendAuditAsync(db, "ScreeningRecord", entity.Id.ToString(), "Created", entity.Reviewer, entity, cancellationToken);
            return Results.Created($"/api/research/operations/screening/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/operations/screening/{studyId:guid}", async (Guid studyId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var rows = await db.ScreeningRecords.AsNoTracking().Where(x => x.StudyId == studyId).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
            return Results.Ok(rows);
        });

        endpoints.MapGet("/api/research/operations/screening/stats", async (EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var latest = await db.ScreeningRecords.AsNoTracking().GroupBy(x => new { x.StudyId, x.IsFullTextStage }).Select(g => g.OrderByDescending(x => x.CreatedAtUtc).First()).ToListAsync(cancellationToken);
            var title = latest.Where(x => !x.IsFullTextStage).ToList();
            var fullText = latest.Where(x => x.IsFullTextStage).ToList();
            var breakdown = fullText.Where(x => x.Status == ScreeningStatus.Excluded).GroupBy(x => x.ExclusionReason ?? "Unspecified").ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);
            return Results.Ok(new ScreeningStats(title.Count, title.Count(x => x.Status != ScreeningStatus.Pending), title.Count(x => x.Status == ScreeningStatus.Excluded), fullText.Count(x => x.Status != ScreeningStatus.Pending), fullText.Count(x => x.Status == ScreeningStatus.Excluded), fullText.Count(x => x.Status == ScreeningStatus.Included), breakdown));
        });

        endpoints.MapPost("/api/research/operations/extraction", async (ExtractionRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (request.StudyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Parameter) || string.IsNullOrWhiteSpace(request.Reviewer)) return Results.BadRequest(new { error = "StudyId, Parameter and Reviewer are required." });
            if (string.IsNullOrWhiteSpace(request.Value)) return Results.BadRequest(new { error = "Value is required." });
            if (!await db.Studies.AnyAsync(x => x.Id == request.StudyId, cancellationToken)) return Results.NotFound(new { error = "Study not found." });
            var entity = new DataExtractionEntity { StudyId = request.StudyId, Parameter = request.Parameter.Trim(), Value = request.Value.Trim(), Unit = request.Unit?.Trim(), SourceLocation = request.SourceLocation?.Trim(), Reviewer = request.Reviewer.Trim(), Notes = request.Notes?.Trim(), CreatedAtUtc = DateTime.UtcNow };
            db.DataExtractions.Add(entity);
            await db.SaveChangesAsync(cancellationToken);
            await AppendAuditAsync(db, "DataExtraction", entity.Id.ToString(), "Created", entity.Reviewer, entity, cancellationToken);
            return Results.Created($"/api/research/operations/extraction/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/operations/extraction/{studyId:guid}", async (Guid studyId, EvidenceDbContext db, CancellationToken cancellationToken) => Results.Ok(await db.DataExtractions.AsNoTracking().Where(x => x.StudyId == studyId).OrderBy(x => x.Parameter).ThenBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken)));

        endpoints.MapPost("/api/research/operations/outcomes", async (OutcomeRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return Results.BadRequest(new { error = "Outcome name is required." });
            var entity = new ResearchOutcomeEntity { Name = request.Name.Trim(), Definition = request.Definition?.Trim(), Timepoint = request.Timepoint?.Trim(), Certainty = request.Certainty?.Trim(), Justification = request.Justification?.Trim(), RelativeEffect = request.RelativeEffect?.Trim(), AbsoluteEffect = request.AbsoluteEffect?.Trim(), ParticipantsAndStudies = request.ParticipantsAndStudies?.Trim(), ProjectId = request.ProjectId, CreatedAtUtc = DateTime.UtcNow };
            db.ResearchOutcomes.Add(entity);
            await db.SaveChangesAsync(cancellationToken);
            await AppendAuditAsync(db, "ResearchOutcome", entity.Id.ToString(), "Created", "", entity, cancellationToken);
            return Results.Created($"/api/research/operations/outcomes/{entity.Id}", entity);
        });

        endpoints.MapGet("/api/research/operations/outcomes", async (Guid? projectId, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var query = db.ResearchOutcomes.AsNoTracking().AsQueryable();
            if (projectId.HasValue) query = query.Where(x => x.ProjectId == projectId.Value);
            return Results.Ok(await query.OrderBy(x => x.Name).ToListAsync(cancellationToken));
        });

        endpoints.MapPost("/api/research/operations/projects/{projectId:guid}/finalize", async (Guid projectId, FinalizeProjectRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Reviewer)) return Results.BadRequest(new { error = "Reviewer is required." });
            var project = await db.ResearchProjectControls.SingleOrDefaultAsync(x => x.Id == projectId, cancellationToken);
            if (project is null) { project = new ResearchProjectControlEntity { Id = projectId, Name = request.Name?.Trim() ?? "Research project" }; db.ResearchProjectControls.Add(project); }
            if (project.IsLocked) return Results.Conflict(new { error = "Project is already finalized and locked.", project.FinalHash, project.LockedBy, project.LockedAtUtc });

            var payload = new { project.Id, project.Name, Configuration = ToConfigurationDto(project), Screening = await db.ScreeningRecords.AsNoTracking().Where(x => x.StudyId != Guid.Empty).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken), Extractions = await db.DataExtractions.AsNoTracking().OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken), Outcomes = await db.ResearchOutcomes.AsNoTracking().Where(x => !x.ProjectId.HasValue || x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken) };
            var canonical = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
            project.FinalHash = ResearchHash.Compute(canonical);
            project.IsLocked = true;
            project.LockedAtUtc = DateTime.UtcNow;
            project.LockedBy = request.Reviewer.Trim();
            await db.SaveChangesAsync(cancellationToken);
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

