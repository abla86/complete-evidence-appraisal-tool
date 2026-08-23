using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EvidenceAppraisal.Api.Services;

public sealed class ImplementationPersistenceService(ImplementationDbContext db)
{
    public async Task<Guid> SaveAsync(ImplementationAssessment assessment, CancellationToken cancellationToken = default)
    {
        await using IDbContextTransaction? transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(cancellationToken)
            : null;
        var now = DateTime.UtcNow;
        var existingCfir = await db.CfirAssessments.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == assessment.Cfir.Id, cancellationToken);
        var isNew = existingCfir is null;
        if (existingCfir is null) { existingCfir = new CfirAssessmentEntity { Id = assessment.Cfir.Id }; db.CfirAssessments.Add(existingCfir); }

        TrackChange(existingCfir.Id, null, "CFIR", "assessment", "status", existingCfir.Status, assessment.Cfir.Status, assessment.Cfir.ReviewerCode, isNew ? "Create" : "Update", "Researcher saved implementation assessment.", now);
        TrackChange(existingCfir.Id, null, "CFIR", "assessment", "reviewerCode", existingCfir.ReviewerCode, assessment.Cfir.ReviewerCode, assessment.Cfir.ReviewerCode, "Update", "Reviewer metadata updated.", now);
        TrackChange(existingCfir.Id, null, "CFIR", "assessment", "consensusStatus", existingCfir.ConsensusStatus, assessment.Cfir.ConsensusStatus, assessment.Cfir.ReviewerCode, "Update", "Consensus metadata updated.", now);
        TrackChange(existingCfir.Id, null, "CFIR", "assessment", "constructCount", existingCfir.Items.Count.ToString(), assessment.Cfir.Items.Count.ToString(), assessment.Cfir.ReviewerCode, "Update", "CFIR construct set saved.", now);

        existingCfir.InnovationName = assessment.Cfir.InnovationName;
        existingCfir.InnerSetting = assessment.Cfir.InnerSetting;
        existingCfir.OuterSetting = assessment.Cfir.OuterSetting;
        existingCfir.ReviewerCode = assessment.Cfir.ReviewerCode;
        existingCfir.SecondReviewerCode = assessment.Cfir.SecondReviewerCode;
        existingCfir.ConsensusReviewerCode = assessment.Cfir.ConsensusReviewerCode;
        existingCfir.ConsensusStatus = assessment.Cfir.ConsensusStatus;
        existingCfir.ConsensusRationale = assessment.Cfir.ConsensusRationale;
        existingCfir.CfirVersion = assessment.Cfir.CfirVersion;
        existingCfir.AssessmentDateUtc = assessment.Cfir.AssessmentDateUtc;
        existingCfir.Status = assessment.Cfir.Status;

        if (existingCfir.Items.Count > 0) db.CfirAssessmentItems.RemoveRange(existingCfir.Items);
        existingCfir.Items = assessment.Cfir.Items.Select(x => new CfirAssessmentItemEntity
        {
            Id = Guid.NewGuid(), CfirAssessmentId = existingCfir.Id, Domain = x.Domain.ToString(), Construct = x.Construct,
            Influence = x.Influence.ToString(), EvidenceSummary = x.EvidenceSummary, Rationale = x.Rationale, EvidenceLocation = x.EvidenceLocation
        }).ToList();

        var existingKta = await db.KtaAssessments.Include(x => x.Phases).Include(x => x.Actions).ThenInclude(x => x.CfirLinks)
            .SingleOrDefaultAsync(x => x.Id == assessment.Kta.Id, cancellationToken);
        if (existingKta is null) { existingKta = new KtaAssessmentEntity { Id = assessment.Kta.Id, ProjectId = assessment.Cfir.Id }; db.KtaAssessments.Add(existingKta); }
        existingKta.ProjectId = assessment.Cfir.Id;
        TrackChange(existingCfir.Id, existingKta.Id, "KTA", "assessment", "reviewerCode", existingKta.ReviewerCode, assessment.Kta.ReviewerCode, assessment.Kta.ReviewerCode, "Update", "KTA reviewer metadata updated.", now);
        TrackChange(existingCfir.Id, existingKta.Id, "KTA", "assessment", "actionCount", existingKta.Actions.Count.ToString(), assessment.Kta.Actions.Count.ToString(), assessment.Kta.ReviewerCode, "Update", "KTA action set saved.", now);
        existingKta.ProjectName = assessment.Kta.ProjectName;
        existingKta.ReviewerCode = assessment.Kta.ReviewerCode;
        existingKta.KtaFrameworkVersion = assessment.Kta.KtaFrameworkVersion;
        existingKta.AssessmentDateUtc = assessment.Kta.AssessmentDateUtc;
        existingKta.Status = assessment.Kta.Status;

        if (existingKta.Phases.Count > 0) db.KtaPhases.RemoveRange(existingKta.Phases);
        if (existingKta.Actions.Count > 0)
        {
            foreach (var action in existingKta.Actions)
                if (action.CfirLinks.Count > 0) db.KtaActionCfirLinks.RemoveRange(action.CfirLinks);
            db.KtaActions.RemoveRange(existingKta.Actions);
        }

        existingKta.Phases = assessment.Kta.Phases.Select(x => new KtaPhaseEntity
        {
            Id = Guid.NewGuid(), KtaAssessmentId = existingKta.Id, Number = x.Number, Name = x.Name,
            Status = x.Status.ToString(), Documentation = x.Documentation
        }).ToList();
        existingKta.Actions = assessment.Kta.Actions.Select(x =>
        {
            var action = new KtaActionEntity { Id = x.Id, KtaAssessmentId = existingKta!.Id, Title = x.Title, Description = x.Description,
                KtaPhaseNumber = x.KtaPhaseNumber, OwnerCode = x.OwnerCode, DueDateUtc = x.DueDateUtc, Status = x.Status.ToString() };
            action.CfirLinks = x.LinkedCfirConstructKeys.Select(key => new KtaActionCfirLinkEntity
            { Id = Guid.NewGuid(), KtaActionId = action.Id, CfirConstructKey = key }).ToList();
            return action;
        }).ToList();

        await db.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return existingCfir.Id;
    }

    public Task<KtaActionEntity[]> GetActionsForCfirAsync(string constructKey, CancellationToken cancellationToken = default) =>
        db.KtaActions.AsNoTracking().Include(x => x.CfirLinks).Where(x => x.CfirLinks.Any(link => link.CfirConstructKey == constructKey)).ToArrayAsync(cancellationToken);

    public Task<ImplementationAssessmentSnapshot?> GetAsync(Guid cfirId, Guid ktaId, CancellationToken cancellationToken = default) => LoadSnapshotAsync(cfirId, ktaId, cancellationToken);

    public async Task<IReadOnlyCollection<ProjectAuditDto>> GetAuditAsync(Guid cfirId, int limit = 200, CancellationToken cancellationToken = default) =>
        await db.ImplementationAudits.AsNoTracking().Where(x => x.CfirAssessmentId == cfirId).OrderByDescending(x => x.TimestampUtc).Take(Math.Clamp(limit, 1, 1000))
            .Select(x => new ProjectAuditDto { Id = x.Id, EntityType = x.EntityType, EntityKey = x.EntityKey, Field = x.Field, OldValue = x.OldValue, NewValue = x.NewValue,
                ChangedBy = x.ChangedBy, Reason = x.Reason, EventType = x.EventType, TimestampUtc = x.TimestampUtc }).ToArrayAsync(cancellationToken);

    private void TrackChange(Guid cfirId, Guid? ktaId, string entityType, string entityKey, string field, string? oldValue, string? newValue,
        string changedBy, string eventType, string reason, DateTime timestampUtc)
    {
        if (oldValue == newValue && eventType == "Update") return;
        db.ImplementationAudits.Add(new ImplementationAuditEntity { Id = Guid.NewGuid(), CfirAssessmentId = cfirId, KtaAssessmentId = ktaId,
            EntityType = entityType, EntityKey = entityKey, Field = field, OldValue = oldValue, NewValue = newValue,
            ChangedBy = string.IsNullOrWhiteSpace(changedBy) ? "unknown" : changedBy, Reason = reason, EventType = eventType, TimestampUtc = timestampUtc });
    }

    private async Task<ImplementationAssessmentSnapshot?> LoadSnapshotAsync(Guid cfirId, Guid ktaId, CancellationToken cancellationToken)
    {
        var cfir = await db.CfirAssessments.AsNoTracking().Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == cfirId, cancellationToken);
        var kta = await db.KtaAssessments.AsNoTracking().Include(x => x.Phases).Include(x => x.Actions).ThenInclude(x => x.CfirLinks).SingleOrDefaultAsync(x => x.Id == ktaId, cancellationToken);
        return cfir is null || kta is null ? null : new ImplementationAssessmentSnapshot(cfir, kta);
    }
}

public sealed record ImplementationAssessmentSnapshot(CfirAssessmentEntity Cfir, KtaAssessmentEntity Kta);
