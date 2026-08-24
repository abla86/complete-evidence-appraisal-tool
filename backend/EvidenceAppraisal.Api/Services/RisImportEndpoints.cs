using EvidenceAppraisal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class RisImportEndpoints
{
    private const long MaxRisBytes = 10 * 1024 * 1024;

    public static IEndpointRouteBuilder MapRisImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/import/ris-preview", Preview);
        endpoints.MapPost("/api/import/ris", Import);
        endpoints.MapGet("/api/studies", ListStudies);
        return endpoints;
    }

    private static async Task<IResult> Preview(HttpRequest request, RisImportService parser, CancellationToken cancellationToken)
    {
        var file = await GetRisFile(request, cancellationToken);
        if (file.Error is not null) return file.Error;
        var studies = parser.ParseRisFile(file.Content!);
        if (studies.Count == 0) return Results.BadRequest(new { error = "No valid RIS records with a title were found." });
        return Results.Ok(new { fileName = file.FileName, count = studies.Count, studies, methodologicalNotice = "Preview only. Nothing is stored until the researcher confirms the import. Review the preview because RIS exports can differ between databases and reference managers." });
    }

    private static async Task<IResult> Import(HttpRequest request, RisImportService parser, EvidenceDbContext db, CancellationToken cancellationToken)
    {
        var file = await GetRisFile(request, cancellationToken);
        if (file.Error is not null) return file.Error;
        var parsed = parser.ParseRisFile(file.Content!);
        if (parsed.Count == 0) return Results.BadRequest(new { error = "No valid RIS records with a title were found." });

        await EnsureStudySchemaAsync(db, cancellationToken);

        var fingerprints = parsed.Select(x => x.ImportFingerprint).Distinct().ToArray();
        var existing = await db.Studies.AsNoTracking().Where(x => fingerprints.Contains(x.ImportFingerprint)).Select(x => x.ImportFingerprint).ToListAsync(cancellationToken);
        var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var toAdd = parsed.Where(x => !existingSet.Contains(x.ImportFingerprint)).ToList();
        foreach (var study in toAdd) { study.SourceDatabase = "RIS import"; study.ImportedAtUtc = DateTime.UtcNow; }
        if (toAdd.Count > 0) { db.Studies.AddRange(toAdd); await db.SaveChangesAsync(cancellationToken); }

        return Results.Ok(new { imported = toAdd.Count, skippedDuplicates = parsed.Count - toAdd.Count, totalInFile = parsed.Count, studies = toAdd, methodologicalNotice = "Imported data are bibliographic metadata only. They do not establish eligibility, quality, or evidence certainty." });
    }

    private static async Task<IResult> ListStudies(EvidenceDbContext db, CancellationToken cancellationToken)
    {
        await EnsureStudySchemaAsync(db, cancellationToken);
        return Results.Ok(await db.Studies.AsNoTracking().OrderByDescending(x => x.ImportedAtUtc).ToListAsync(cancellationToken));
    }

    private static async Task EnsureStudySchemaAsync(EvidenceDbContext db, CancellationToken cancellationToken)
    {
        var provider = db.Database.ProviderName ?? string.Empty;
        if (provider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS Studies (Id TEXT NOT NULL CONSTRAINT PK_Studies PRIMARY KEY, Type TEXT NULL, Title TEXT NOT NULL, Authors TEXT NOT NULL, Year TEXT NULL, Doi TEXT NULL, Journal TEXT NULL, Abstract TEXT NULL, SourceDatabase TEXT NULL, ImportFingerprint TEXT NOT NULL, ImportedAtUtc TEXT NOT NULL);", cancellationToken);
            await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_Studies_ImportFingerprint ON Studies (ImportFingerprint);", cancellationToken);
            await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Studies_Doi ON Studies (Doi);", cancellationToken);
        }
        else if (provider.Contains("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            await db.Database.ExecuteSqlRawAsync("IF OBJECT_ID(N'[Studies]', N'U') IS NULL BEGIN CREATE TABLE [Studies] ([Id] uniqueidentifier NOT NULL CONSTRAINT [PK_Studies] PRIMARY KEY, [Type] nvarchar(100) NULL, [Title] nvarchar(2000) NOT NULL, [Authors] nvarchar(max) NOT NULL, [Year] nvarchar(50) NULL, [Doi] nvarchar(500) NULL, [Journal] nvarchar(1000) NULL, [Abstract] nvarchar(12000) NULL, [SourceDatabase] nvarchar(100) NULL, [ImportFingerprint] nvarchar(64) NOT NULL, [ImportedAtUtc] datetime2 NOT NULL); CREATE UNIQUE INDEX [IX_Studies_ImportFingerprint] ON [Studies] ([ImportFingerprint]); CREATE INDEX [IX_Studies_Doi] ON [Studies] ([Doi]); END", cancellationToken);
        }
    }

    private static async Task<(string? Content, string? FileName, IResult? Error)> GetRisFile(HttpRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType) return (null, null, Results.BadRequest(new { error = "multipart/form-data is required." }));
        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return (null, null, Results.BadRequest(new { error = "Choose a .ris file." }));
        if (file.Length > MaxRisBytes) return (null, null, Results.BadRequest(new { error = "RIS file exceeds the 10 MB limit." }));
        var extension = Path.GetExtension(Path.GetFileName(file.FileName));
        if (!string.Equals(extension, ".ris", StringComparison.OrdinalIgnoreCase)) return (null, null, Results.BadRequest(new { error = "Only .ris files are accepted." }));
        using var reader = new StreamReader(file.OpenReadStream());
        return (await reader.ReadToEndAsync(cancellationToken), Path.GetFileName(file.FileName), null);
    }
}
