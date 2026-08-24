using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class BibliographyImportEndpoints
{
    private const long MaxFileBytes = 10 * 1024 * 1024;

    public static void MapBibliographyImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/import/bibliography-preview", Preview);
        endpoints.MapPost("/api/import/bibliography", Import);
        endpoints.MapGet("/api/import/bibliography-formats", () => Results.Ok(BibliographyImportService.SupportedFormats.Select(x => new { extension = x.Key, name = x.Value })));
    }

    private static async Task<IResult> Preview(HttpRequest request, BibliographyImportService importer, CancellationToken cancellationToken)
    {
        var input = await ReadFile(request, cancellationToken);
        if (input.Error is not null) return input.Error;
        try
        {
            var studies = importer.Parse(input.Content!, input.Extension!);
            if (studies.Count == 0) return Results.BadRequest(new { error = "Ingen bibliografiske poster med lesbar tittel ble funnet. Kontroller at filen er en komplett eksport i et støttet format." });
            return Results.Ok(new { fileName = input.FileName, format = input.Format, count = studies.Count, studies, methodologicalNotice = "Forhåndsvisning. Ingenting lagres før importen bekreftes. Metadata er ikke en faglig vurdering." });
        }
        catch (Exception ex) when (ex is ArgumentException or FormatException or InvalidOperationException)
        { return Results.BadRequest(new { error = ex.Message }); }
    }

    private static async Task<IResult> Import(HttpRequest request, BibliographyImportService importer, EvidenceDbContext db, CancellationToken cancellationToken)
    {
        var input = await ReadFile(request, cancellationToken);
        if (input.Error is not null) return input.Error;
        try
        {
            var parsed = importer.Parse(input.Content!, input.Extension!);
            if (parsed.Count == 0) return Results.BadRequest(new { error = "Ingen bibliografiske poster med lesbar tittel ble funnet." });
            var fingerprints = parsed.Select(x => x.ImportFingerprint).Distinct().ToArray();
            var existing = await db.Studies.AsNoTracking().Where(x => fingerprints.Contains(x.ImportFingerprint)).Select(x => x.ImportFingerprint).ToListAsync(cancellationToken);
            var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var toAdd = parsed.Where(x => !existingSet.Contains(x.ImportFingerprint)).ToList();
            foreach (var study in toAdd) { study.SourceDatabase = input.Format; study.ImportedAtUtc = DateTime.UtcNow; }
            if (toAdd.Count > 0) { db.Studies.AddRange(toAdd); await db.SaveChangesAsync(cancellationToken); }
            return Results.Ok(new { imported = toAdd.Count, skippedDuplicates = parsed.Count - toAdd.Count, totalInFile = parsed.Count, format = input.Format, studies = toAdd, methodologicalNotice = "Importerte poster er bibliografiske metadata. Inklusjon, kritisk vurdering og evidenssikkerhet må vurderes separat." });
        }
        catch (Exception ex) when (ex is ArgumentException or FormatException or InvalidOperationException)
        { return Results.BadRequest(new { error = ex.Message }); }
    }

    private static async Task<(string? Content, string? Extension, string? FileName, string? Format, IResult? Error)> ReadFile(HttpRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType) return (null, null, null, null, Results.BadRequest(new { error = "multipart/form-data er påkrevd." }));
        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return (null, null, null, null, Results.BadRequest(new { error = "Velg en bibliografifil." }));
        if (file.Length > MaxFileBytes) return (null, null, null, null, Results.BadRequest(new { error = "Bibliografifilen er større enn grensen på 10 MB." }));
        var extension = Path.GetExtension(Path.GetFileName(file.FileName)).ToLowerInvariant();
        if (!BibliographyImportService.SupportedFormats.TryGetValue(extension, out var format)) return (null, null, null, null, Results.BadRequest(new { error = $"Formatet '{extension}' støttes ikke. Støttede formater: {string.Join(", ", BibliographyImportService.SupportedFormats.Keys)}" }));
        using var reader = new StreamReader(file.OpenReadStream());
        var content = await reader.ReadToEndAsync(cancellationToken);
        return (content, extension, Path.GetFileName(file.FileName), format, null);
    }
}
