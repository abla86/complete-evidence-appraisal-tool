using EvidenceAppraisal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public sealed class ProjectOverviewService(ImplementationDbContext db)
{
    public async Task<IReadOnlyCollection<ProjectOverviewDto>> GetAsync(CancellationToken cancellationToken = default)
    {
        var cfir = await db.CfirAssessments.AsNoTracking().Include(x => x.Items).ToListAsync(cancellationToken);
        var kta = await db.KtaAssessments.AsNoTracking().Include(x => x.Actions).ThenInclude(x => x.CfirLinks).ToListAsync(cancellationToken);
        var audits = await db.ImplementationAudits.AsNoTracking().OrderByDescending(x => x.TimestampUtc).ToListAsync(cancellationToken);

        return cfir.Select(project =>
        {
            var linkedKta = kta.Where(x => x.ProjectId == project.Id).ToList();
            var actions = linkedKta.SelectMany(x => x.Actions).ToList();
            var itemKeys = project.Items.Select(x => $"{x.Domain}|{x.Construct}").ToHashSet(StringComparer.OrdinalIgnoreCase);
            var linkedActions = actions.Count(action => action.CfirLinks.Any(link => itemKeys.Contains(link.CfirConstructKey)));
            var projectAudits = audits.Where(x => x.CfirAssessmentId == project.Id).ToArray();

            return new ProjectOverviewDto
            {
                AssessmentId = project.Id,
                Title = project.InnovationName,
                CfirStatus = project.Status,
                KtaStatus = linkedKta.FirstOrDefault()?.Status,
                TotalCFIRConstructs = project.Items.Count,
                Barriers = project.Items.Count(x => x.Influence is "Barrier" or "StrongBarrier"),
                Facilitators = project.Items.Count(x => x.Influence is "Facilitator" or "StrongFacilitator"),
                Disagreements = string.Equals(project.ConsensusStatus, "Disagreement", StringComparison.OrdinalIgnoreCase) ? 1 : 0,
                ReviewerA = project.ReviewerCode,
                ReviewerB = project.SecondReviewerCode,
                ConsensusReviewer = project.ConsensusReviewerCode,
                ConsensusStatus = project.ConsensusStatus,
                KtaActions = actions.Count,
                LinkedKtaActions = linkedActions,
                CompletedKtaActions = actions.Count(x => x.Status == "Completed"),
                AuditTrail = projectAudits.Take(100).Select(ToAudit).ToArray(),
                LastChangedUtc = projectAudits.Select(x => (DateTime?)x.TimestampUtc).FirstOrDefault() ?? project.AssessmentDateUtc
            };
        }).OrderByDescending(x => x.LastChangedUtc).ToArray();
    }

    private static ProjectAuditDto ToAudit(ImplementationAuditEntity x) => new()
    {
        Id = x.Id, EntityType = x.EntityType, EntityKey = x.EntityKey, Field = x.Field,
        OldValue = x.OldValue, NewValue = x.NewValue, ChangedBy = x.ChangedBy, Reason = x.Reason,
        EventType = x.EventType, TimestampUtc = x.TimestampUtc
    };
}

public sealed class ProjectOverviewDto
{
    public Guid AssessmentId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string CfirStatus { get; init; } = string.Empty;
    public string? KtaStatus { get; init; }
    public int TotalCFIRConstructs { get; init; }
    public int Barriers { get; init; }
    public int Facilitators { get; init; }
    public int Disagreements { get; init; }
    public string ReviewerA { get; init; } = string.Empty;
    public string? ReviewerB { get; init; }
    public string? ConsensusReviewer { get; init; }
    public string? ConsensusStatus { get; init; }
    public int KtaActions { get; init; }
    public int LinkedKtaActions { get; init; }
    public int CompletedKtaActions { get; init; }
    public DateTime LastChangedUtc { get; init; }
    public IReadOnlyCollection<ProjectAuditDto> AuditTrail { get; init; } = [];
}

public sealed class ProjectAuditDto
{
    public Guid Id { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string EntityKey { get; init; } = string.Empty;
    public string Field { get; init; } = string.Empty;
    public string? OldValue { get; init; }
    public string? NewValue { get; init; }
    public string ChangedBy { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string EventType { get; init; } = string.Empty;
    public DateTime TimestampUtc { get; init; }
}
