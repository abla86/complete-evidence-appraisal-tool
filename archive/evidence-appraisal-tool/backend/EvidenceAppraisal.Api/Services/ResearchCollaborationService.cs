using System.Collections.Concurrent;

namespace EvidenceAppraisal.Api.Services;

public sealed record CollaborationParticipant(string ReviewerId, string DisplayName, DateTime LastSeenUtc);
public sealed record FieldLock(string ProjectId, string FieldId, string ReviewerId, string DisplayName, DateTime ExpiresAtUtc);

public sealed class ResearchCollaborationService
{
    private sealed record ParticipantState(string DisplayName, DateTime LastSeenUtc);
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ParticipantState>> _participants = new();
    private readonly ConcurrentDictionary<string, FieldLock> _locks = new();
    private static readonly TimeSpan PresenceTtl = TimeSpan.FromSeconds(15);
    private static readonly TimeSpan LockTtl = TimeSpan.FromSeconds(30);

    public void Heartbeat(string projectId, string reviewerId, string displayName)
    {
        if (string.IsNullOrWhiteSpace(projectId) || string.IsNullOrWhiteSpace(reviewerId)) return;
        var room = _participants.GetOrAdd(projectId, _ => new ConcurrentDictionary<string, ParticipantState>());
        room[reviewerId] = new ParticipantState(string.IsNullOrWhiteSpace(displayName) ? reviewerId : displayName.Trim(), DateTime.UtcNow);
        Cleanup(projectId);
    }

    public IReadOnlyList<CollaborationParticipant> GetParticipants(string projectId)
    {
        Cleanup(projectId);
        return _participants.TryGetValue(projectId, out var room)
            ? room.Select(x => new CollaborationParticipant(x.Key, x.Value.DisplayName, x.Value.LastSeenUtc)).OrderBy(x => x.DisplayName).ToArray()
            : Array.Empty<CollaborationParticipant>();
    }

    public bool TryAcquire(string projectId, string fieldId, string reviewerId, string displayName, out FieldLock? fieldLock)
    {
        Cleanup(projectId);
        var key = $"{projectId}:{fieldId}";
        var now = DateTime.UtcNow;
        var requested = new FieldLock(projectId, fieldId, reviewerId, displayName, now.Add(LockTtl));
        while (true)
        {
            if (!_locks.TryGetValue(key, out var existing) || existing.ExpiresAtUtc <= now || existing.ReviewerId == reviewerId)
            {
                var acquired = existing is null
                    ? _locks.TryAdd(key, requested)
                    : _locks.TryUpdate(key, requested, existing);
                if (acquired)
                {
                    fieldLock = requested;
                    return true;
                }
                continue;
            }
            fieldLock = existing;
            return false;
        }
    }

    public void Release(string projectId, string fieldId, string reviewerId)
    {
        var key = $"{projectId}:{fieldId}";
        if (_locks.TryGetValue(key, out var existing) && existing.ReviewerId == reviewerId)
            _locks.TryRemove(key, out _);
    }

    public IReadOnlyList<FieldLock> GetLocks(string projectId)
    {
        Cleanup(projectId);
        return _locks.Values.Where(x => x.ProjectId == projectId).OrderBy(x => x.FieldId).ToArray();
    }

    private void Cleanup(string projectId)
    {
        var now = DateTime.UtcNow;
        if (_participants.TryGetValue(projectId, out var room))
            foreach (var item in room.Where(x => now - x.Value.LastSeenUtc > PresenceTtl).ToArray()) room.TryRemove(item.Key, out _);
        foreach (var item in _locks.Where(x => x.Value.ProjectId == projectId && x.Value.ExpiresAtUtc <= now).ToArray()) _locks.TryRemove(item.Key, out _);
    }
}
