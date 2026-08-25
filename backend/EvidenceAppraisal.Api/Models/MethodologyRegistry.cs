namespace EvidenceAppraisal.Api.Models;

public static class MethodologyRegistry
{
    public static IReadOnlyDictionary<string, string> Versions { get; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["amstar2"] = "AMSTAR 2 (2017)",
        ["agree2"] = "AGREE II (2017)",
        ["rob2"] = "RoB 2 (2019)",
        ["prisma2020"] = "PRISMA 2020 (2021)",
        ["cfir2"] = "CFIR 2.0 (2022)",
        ["kta"] = "Knowledge-to-Action Framework (2006)"
    };

    public static string? GetVersion(string? instrument) =>
        string.IsNullOrWhiteSpace(instrument) ? null : Versions.TryGetValue(instrument.Trim(), out var version) ? version : null;
}
