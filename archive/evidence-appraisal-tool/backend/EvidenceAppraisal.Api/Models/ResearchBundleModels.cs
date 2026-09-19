namespace EvidenceAppraisal.Api.Models;

public sealed record ResearchBundleManifest(
    Guid ProjectId,
    string ProjectName,
    string? ProtocolHash,
    string MethodologyVersion,
    string RepositoryCommit,
    DateTime GeneratedAtUtc,
    int ProtocolVersions,
    int ReviewerDecisions,
    int ConsensusDecisions,
    int PrismaEvents,
    int EvidenceProvenanceRecords);
