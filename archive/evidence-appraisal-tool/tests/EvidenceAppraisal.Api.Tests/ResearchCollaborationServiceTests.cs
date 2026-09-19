using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public class ResearchCollaborationServiceTests
{
    [Fact]
    public void SameReviewerCanRefreshOwnLock()
    {
        var service = new ResearchCollaborationService();
        Assert.True(service.TryAcquire("p1", "q1", "r1", "Reviewer 1", out var first));
        Assert.True(service.TryAcquire("p1", "q1", "r1", "Reviewer 1", out var refreshed));
        Assert.NotNull(first);
        Assert.NotNull(refreshed);
        Assert.Equal("r1", refreshed!.ReviewerId);
    }

    [Fact]
    public void DifferentReviewerCannotAcquireLockedField()
    {
        var service = new ResearchCollaborationService();
        Assert.True(service.TryAcquire("p1", "q1", "r1", "Reviewer 1", out _));
        Assert.False(service.TryAcquire("p1", "q1", "r2", "Reviewer 2", out var existing));
        Assert.Equal("r1", existing!.ReviewerId);
    }

    [Fact]
    public void ReviewerCanReleaseOwnLockButNotAnotherReviewersLock()
    {
        var service = new ResearchCollaborationService();
        Assert.True(service.TryAcquire("p1", "q1", "r1", "Reviewer 1", out _));
        service.Release("p1", "q1", "r2");
        Assert.Single(service.GetLocks("p1"));
        service.Release("p1", "q1", "r1");
        Assert.Empty(service.GetLocks("p1"));
    }
}
