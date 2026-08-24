using System.Text;
using EvidenceAppraisal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public static class EvidenceAuditExportEndpoints
{
    public static void MapEvidenceAuditExportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/evidence/manual/{id:guid}/history/export", async (Guid id, string? status, string? reviewer, EvidenceDbContext db, CancellationToken cancellationToken) =>
        {
            var query = db.EvidenceRecordHistory.AsNoTracking().Where(x => x.EvidenceRecordId == id);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(x => x.Status == status.Trim());

            if (!string.IsNullOrWhiteSpace(reviewer))
                query = query.Where(x => x.Reviewer == reviewer.Trim());

            var rows = await query.OrderBy(x => x.Version).ToListAsync(cancellationToken);
            if (rows.Count == 0)
                return Results.NotFound(new { error = "Ingen audit-historikk samsvarer med filteret." });

            var csv = new StringBuilder();
            csv.AppendLine("Version,Status,Reviewer,VerificationNote,VerifiedAtUtc,RecordedAtUtc,Action");
            foreach (var row in rows)
            {
                csv.AppendLine(string.Join(",", new[]
                {
                    row.Version.ToString(),
                    Csv(row.Status),
                    Csv(row.Reviewer),
                    Csv(row.VerificationNote),
                    Csv(row.VerifiedAtUtc?.ToString("O")),
                    Csv(row.RecordedAtUtc.ToString("O")),
                    Csv(row.Action)
                }));
            }

            return Results.File(
                Encoding.UTF8.GetBytes(csv.ToString()),
                "text/csv; charset=utf-8",
                $"evidence-audit-{id:N}.csv");
        });
    }

    private static string Csv(string? value)
    {
        var safe = value ?? string.Empty;
        return $"\"{safe.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }
}
