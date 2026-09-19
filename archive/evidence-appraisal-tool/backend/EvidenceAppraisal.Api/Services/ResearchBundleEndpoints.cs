using System.IO.Compression;
using System.Text;
using System.Text.Json;
using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class ResearchBundleEndpoints
{
    public static void MapResearchBundleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/research/integrity/projects/{projectId:guid}/bundle", async (Guid projectId, EvidenceDbContext db, CancellationToken ct) =>
        {
            var project = await db.ResearchProjectControls.AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId, ct);
            if (project is null) return Results.NotFound(new { error = "Research project not found." });

            var protocols = await db.ResearchProtocols.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.Version).ToListAsync(ct);
            var reviewerDecisions = await db.ReviewerDecisions.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct);
            var consensus = await db.ConsensusDecisions.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct);
            var prisma = await db.PrismaFlowEvents.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct);
            var provenance = await db.EvidenceProvenance.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct);

            var latestProtocol = protocols.LastOrDefault();
            var manifest = new ResearchBundleManifest(
                project.Id,
                project.Name,
                latestProtocol?.Hash,
                project.MethodologyVersion,
                Environment.GetEnvironmentVariable("GIT_COMMIT_SHA") ?? "unknown",
                DateTime.UtcNow,
                protocols.Count,
                reviewerDecisions.Count,
                consensus.Count,
                prisma.Count,
                provenance.Count);

            await using var memory = new MemoryStream();
            using (var archive = new ZipArchive(memory, ZipArchiveMode.Create, leaveOpen: true))
            {
                AddJson(archive, "project.json", new { project, configuration = project.EnabledInstrumentsJson });
                AddJson(archive, "protocols.json", protocols);
                AddJson(archive, "reviewer-decisions.json", reviewerDecisions);
                AddJson(archive, "consensus.json", consensus);
                AddJson(archive, "prisma-events.json", prisma);
                AddJson(archive, "evidence-provenance.json", provenance);
                AddJson(archive, "manifest.json", manifest);

                var note = "This bundle contains the research-integrity records currently implemented by the application. It is not, by itself, proof of methodological validity, legal compliance, or complete research reproducibility.";
                AddText(archive, "SCOPE.md", note);
            }

            return Results.File(memory.ToArray(), "application/zip", $"research-bundle-{projectId:N}.zip");
        });
    }

    private static void AddJson<T>(ZipArchive archive, string path, T value)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var stream = entry.Open();
        using var writer = new StreamWriter(stream, new UTF8Encoding(false));
        writer.Write(JsonSerializer.Serialize(value, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void AddText(ZipArchive archive, string path, string value)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var stream = entry.Open();
        using var writer = new StreamWriter(stream, new UTF8Encoding(false));
        writer.Write(value);
    }
}
