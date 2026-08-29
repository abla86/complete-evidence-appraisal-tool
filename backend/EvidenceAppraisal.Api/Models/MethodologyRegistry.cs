namespace EvidenceAppraisal.Api.Models;

public enum MethodologyVerificationStatus
{
    Verified,
    PartiallyVerified,
    Unverified,
    Deprecated,
    Prototype
}

public sealed record MethodologyDefinition(
    string Id,
    string Name,
    string Category,
    string? Version,
    int? PublicationYear,
    string OfficialSourceUrl,
    string? PrimaryPublicationUrl,
    MethodologyVerificationStatus VerificationStatus,
    string VerificationNote
);

public static class MethodologyRegistry
{
    // This registry is deliberately conservative. A methodology is not marked
    // Verified unless its identity/version/source has been checked against an
    // authoritative source. Do not substitute "latest" for a documented version.
    public static IReadOnlyDictionary<string, MethodologyDefinition> Definitions { get; } =
        new Dictionary<string, MethodologyDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["amstar2"] = new(
                "amstar2",
                "AMSTAR 2",
                "critical-appraisal",
                "2017",
                2017,
                "https://amstar.ca/Amstar-2.php",
                "https://doi.org/10.1136/bmj.j4008",
                MethodologyVerificationStatus.Verified,
                "16-item AMSTAR 2; overall confidence is based on weaknesses in critical/non-critical domains, not a numerical total score."
            ),
            ["agree2"] = new(
                "agree2",
                "AGREE II",
                "guideline-appraisal",
                null,
                2010,
                "https://www.agreetrust.org/",
                "https://doi.org/10.1016/j.jclinepi.2010.07.001",
                MethodologyVerificationStatus.Verified,
                "AGREE II is a 23-item instrument organised into six domains. The registry does not label it as a 2017 version."
            ),
            ["rob2"] = new(
                "rob2",
                "Cochrane RoB 2",
                "risk-of-bias",
                "22 August 2019",
                2019,
                "https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2",
                "https://doi.org/10.1136/bmj.l4898",
                MethodologyVerificationStatus.Verified,
                "Current parallel-group individually-randomised version is dated 22 August 2019; cluster and crossover variants have separate versions."
            ),
            ["prisma2020"] = new(
                "prisma2020",
                "PRISMA 2020",
                "reporting-guideline",
                "2020",
                2021,
                "https://www.prisma-statement.org/prisma-2020",
                "https://doi.org/10.1136/bmj.n71",
                MethodologyVerificationStatus.Verified,
                "PRISMA 2020 statement was published in 2021; the name identifies the 2020 update, not a 2020 publication year."
            ),
            ["cfir2"] = new(
                "cfir2",
                "CFIR 2.0",
                "implementation-framework",
                "2022",
                2022,
                "https://cfirguide.org/",
                "https://doi.org/10.1186/s13012-022-01245-0",
                MethodologyVerificationStatus.Verified,
                "Updated CFIR was published in 2022. CFIR 2.0 requires project-level operationalisation and should not be treated as a generic scoring instrument."
            ),
            ["kta"] = new(
                "kta",
                "Knowledge-to-Action Framework",
                "implementation-framework",
                null,
                2006,
                "https://rnao.ca/bpg/leading-change-toolkit/knowledge-to-action-framework",
                "https://doi.org/10.1002/chp.47",
                MethodologyVerificationStatus.Verified,
                "Original framework publication is Graham et al. (2006). KTA is a conceptual framework, not a validated numerical scoring instrument."
            ),
            ["jbi-qualitative-2017"] = new(
                "jbi-qualitative-2017",
                "JBI Critical Appraisal Checklist for Qualitative Research",
                "critical-appraisal",
                "2017",
                2017,
                "https://jbi.global/sites/default/files/2019-05/JBI_Critical_Appraisal-Checklist_for_Qualitative_Research2017_0.pdf",
                null,
                MethodologyVerificationStatus.Verified,
                "The 2017 qualitative checklist is retained as an explicit historical instrument. JBI now also publishes revised tools, so this version must not be silently replaced by a newer tool."
            ),
            ["casp-qualitative-2022"] = new(
                "casp-qualitative-2022",
                "CASP Qualitative Studies Checklist",
                "critical-appraisal",
                "2022",
                2022,
                "https://casp-uk.net/casp-tools-checklists/checklist-archive/",
                null,
                MethodologyVerificationStatus.Verified,
                "CASP publishes study-design-specific checklists. This registry entry is the qualitative checklist and must not be treated as a generic CASP instrument."
            )
        };

    // Backward-compatible lookup for existing code.
    public static IReadOnlyDictionary<string, string> Versions { get; } =
        Definitions.ToDictionary(
            x => x.Key,
            x => x.Value.Version ?? x.Value.Name,
            StringComparer.OrdinalIgnoreCase);

    public static string? GetVersion(string? instrument) =>
        string.IsNullOrWhiteSpace(instrument)
            ? null
            : Definitions.TryGetValue(instrument.Trim(), out var definition)
                ? definition.Version ?? definition.Name
                : null;

    public static MethodologyDefinition? Get(string? instrument) =>
        string.IsNullOrWhiteSpace(instrument)
            ? null
            : Definitions.TryGetValue(instrument.Trim(), out var definition)
                ? definition
                : null;
}
