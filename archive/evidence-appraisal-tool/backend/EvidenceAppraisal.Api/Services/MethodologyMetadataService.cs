using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class MethodologyMetadataService
{
    public IReadOnlyDictionary<string, string?> GetVersions(IEnumerable<string> instruments) =>
        instruments
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                instrument => instrument,
                MethodologyRegistry.GetVersion,
                StringComparer.OrdinalIgnoreCase);

    public IReadOnlyCollection<MethodologyDefinition> GetDefinitions(IEnumerable<string> instruments) =>
        instruments
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(MethodologyRegistry.Get)
            .Where(definition => definition is not null)
            .Cast<MethodologyDefinition>()
            .ToArray();
}
