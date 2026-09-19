using EvidenceAppraisal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EvidenceAppraisal.Api.Services;

public sealed record ResearchGateResult(bool Allowed, string? Error = null);

public sealed class ResearchSystemGate(EvidenceDbContext db)
{
    public async Task<ResearchGateResult> CheckAsync(Guid projectId, CancellationToken ct)
    {
        if (projectId == Guid.Empty)
            return new(false, "ProjectId is required.");

        var project = await db.ResearchProjectControls
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == projectId, ct);

        if (project is null)
            return new(false, "Research project not found.");

        if (project.IsLocked)
            return new(false, "Research project is finalized and locked.");

        var governance = await db.ResearchGovernance
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ProjectId == projectId, ct);

        if (governance is null)
            return new(false, "Research governance must be completed before research data can be changed.");

        if (governance.ContainsPersonalData && governance.ContainsHealthData && governance.PublicDeploymentAllowed)
            return new(false, "Public deployment is not allowed for a project declaring personal health data.");

        if (governance.RequiresInstitutionalApproval && string.IsNullOrWhiteSpace(governance.ApprovalReference))
            return new(false, "Institutional approval is required but no approval reference is recorded.");

        return new(true);
    }

    public async Task<ResearchGateResult> CheckWriteAccessAsync(Guid projectId, string reviewer, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(reviewer))
            return new(false, "Reviewer identity is required.");

        return await CheckAsync(projectId, ct);
    }
}
