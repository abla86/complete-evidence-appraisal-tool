using EvidenceAppraisal.Api.Models;
using Xunit;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ResearchIntegrityModelsTests
{
    [Fact]
    public void ResearchIntegrityHash_IsDeterministic()
    {
        const string input = "project|study|screening|included";
        var first = ResearchIntegrityHash.Compute(input);
        var second = ResearchIntegrityHash.Compute(input);

        Assert.Equal(64, first.Length);
        Assert.Equal(first, second);
        Assert.DoesNotContain('-', first);
    }

    [Fact]
    public void ResearchIntegrityHash_ChangesWhenInputChanges()
    {
        var first = ResearchIntegrityHash.Compute("A");
        var second = ResearchIntegrityHash.Compute("B");

        Assert.NotEqual(first, second);
    }

    [Fact]
    public void ReviewerDecisionsCanRepresentIndependentReviewers()
    {
        var a = new ReviewerDecisionEntity { ProjectId = Guid.NewGuid(), StudyId = Guid.NewGuid(), Reviewer = "A", Decision = "Included" };
        var b = new ReviewerDecisionEntity { ProjectId = a.ProjectId, StudyId = a.StudyId, Reviewer = "B", Decision = "Excluded" };

        Assert.Equal(a.ProjectId, b.ProjectId);
        Assert.Equal(a.StudyId, b.StudyId);
        Assert.NotEqual(a.Reviewer, b.Reviewer);
        Assert.NotEqual(a.Decision, b.Decision);
    }

    [Fact]
    public void ConsensusReferencesBothIndependentDecisions()
    {
        var consensus = new ConsensusDecisionEntity
        {
            ProjectId = Guid.NewGuid(),
            StudyId = Guid.NewGuid(),
            ReviewerADecisionId = Guid.NewGuid(),
            ReviewerBDecisionId = Guid.NewGuid(),
            Decision = "Included",
            Rationale = "Both reviewers confirmed eligibility",
            Reviewer = "ConsensusLead"
        };

        Assert.NotEqual(Guid.Empty, consensus.ReviewerADecisionId);
        Assert.NotEqual(Guid.Empty, consensus.ReviewerBDecisionId);
        Assert.NotEqual(consensus.ReviewerADecisionId, consensus.ReviewerBDecisionId);
        Assert.False(string.IsNullOrWhiteSpace(consensus.Rationale));
    }

    [Fact]
    public void ProtocolAndEvidenceProvenanceCarryProjectIdentity()
    {
        var projectId = Guid.NewGuid();
        var protocol = new ResearchProtocolEntity { ProjectId = projectId, ResearchQuestion = "Question", MethodologyVersion = "1" };
        var provenance = new EvidenceProvenanceEntity { ProjectId = projectId, StudyId = Guid.NewGuid(), DocumentHashSha256 = new string('a', 64), CreatedBy = "Reviewer" };

        Assert.Equal(projectId, protocol.ProjectId);
        Assert.Equal(projectId, provenance.ProjectId);
        Assert.Equal(64, provenance.DocumentHashSha256.Length);
    }
}
