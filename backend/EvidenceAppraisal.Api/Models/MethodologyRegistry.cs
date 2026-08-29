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
    string? RegistryReviewedDate,
    string? SourceReferenceStatus,
    MethodologyVerificationStatus VerificationStatus,
    string VerificationNote,
    IReadOnlyCollection<string>? CompatibleStudyDesigns = null,
    bool SupportsNumericalScoring = false,
    string? LicenceUrl = null
);

public static class MethodologyRegistry
{
    // Conservative registry: "Verified" means identity/version/source and the
    // methodological scope have been checked. It does NOT mean every feature
    // of the software implementation is complete.
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
                "2026-08-29", "official source reference recorded",
                MethodologyVerificationStatus.Verified,
                "16-item instrument. Overall confidence is based on weaknesses in critical/non-critical domains; no numerical total score.",
                ["systematic review", "systematic review of healthcare interventions"],
                false
            ),
            ["agree2"] = new(
                "agree2",
                "AGREE II",
                "guideline-appraisal",
                null,
                2010,
                "https://www.agreetrust.org/",
                "https://doi.org/10.1016/j.jclinepi.2010.07.001",
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Verified,
                "23-item instrument organised into six domains. Publication year is 2010; a 2017-hosted manual must not be misrepresented as a 2017 instrument version.",
                ["clinical practice guideline", "guideline"],
                true
            ),
            ["rob2"] = new(
                "rob2",
                "Cochrane RoB 2",
                "risk-of-bias",
                "22 August 2019",
                2019,
                "https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2",
                "https://doi.org/10.1136/bmj.l4898",
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Prototype,
                "The registry identity is verified, but this repository's implementation is explicitly incomplete because the signalling-question algorithm is not fully reproduced. Parallel-group, cluster and crossover variants must remain separate.",
                ["individually randomised parallel-group trial"],
                false,
                "https://creativecommons.org/licenses/by-nc-nd/4.0/"
            ),
            ["rob2-cluster-2021"] = new(
                "rob2-cluster-2021",
                "Cochrane RoB 2 – cluster-randomised trials",
                "risk-of-bias",
                "18 March 2021 revision",
                2021,
                "https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2",
                "https://doi.org/10.1136/bmj.l4898",
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Unverified,
                "Separate RoB 2 variant. Do not reuse the parallel-group item logic until this variant is independently implemented and tested.",
                ["cluster-randomised trial"],
                false,
                "https://creativecommons.org/licenses/by-nc-nd/4.0/"
            ),
            ["rob2-crossover-2021"] = new(
                "rob2-crossover-2021",
                "Cochrane RoB 2 – crossover trials",
                "risk-of-bias",
                "18 March 2021 revision",
                2021,
                "https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2",
                "https://doi.org/10.1136/bmj.l4898",
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Unverified,
                "Separate RoB 2 variant. Do not reuse the parallel-group item logic until this variant is independently implemented and tested.",
                ["crossover trial"],
                false,
                "https://creativecommons.org/licenses/by-nc-nd/4.0/"
            ),
            ["prisma2020"] = new(
                "prisma2020",
                "PRISMA 2020",
                "reporting-guideline",
                "2020",
                2021,
                "https://www.prisma-statement.org/prisma-2020",
                "https://doi.org/10.1136/bmj.n71",
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Verified,
                "PRISMA 2020 is the name of the 2020 update; the main statement was published in 2021. It is a reporting guideline, not a critical-appraisal score.",
                ["systematic review", "meta-analysis", "scoping review when the relevant PRISMA extension applies"],
                false
            ),
            ["grade"] = new(
                "grade",
                "GRADE",
                "certainty-of-evidence",
                null,
                null,
                "https://training.cochrane.org/handbook/current/chapter-14",
                "https://doi.org/10.1136/bmj328.7454.1490",
                "2026-08-29", "current handbook source reference recorded",
                MethodologyVerificationStatus.Verified,
                "GRADE assesses certainty of a body of evidence for a specific outcome. The five core downgrade domains are risk of bias, inconsistency, indirectness, imprecision and publication bias; upgrading criteria are conditional.",
                ["body of evidence", "systematic review", "guideline evidence"],
                false
            ),
            ["cfir2"] = new(
                "cfir2",
                "CFIR 2.0",
                "implementation-framework",
                "2022",
                2022,
                "https://cfirguide.org/",
                "https://doi.org/10.1186/s13012-022-01245-0",
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Verified,
                "Updated CFIR was published in 2022. CFIR is an implementation determinant framework and must not be represented as a generic validated quality score.",
                ["implementation research", "implementation project"],
                false
            ),
            ["kta"] = new(
                "kta",
                "Knowledge-to-Action Framework",
                "implementation-framework",
                null,
                2006,
                "https://rnao.ca/bpg/leading-change-toolkit/knowledge-to-action-framework",
                "https://doi.org/10.1002/chp.47",
                "2026-08-29", "source reference recorded",
                MethodologyVerificationStatus.Verified,
                "Graham et al. (2006) introduced the Knowledge-to-Action framework. It is a conceptual implementation/knowledge-translation framework, not a validated numerical appraisal scale.",
                ["implementation project", "knowledge translation"],
                false
            ),
            ["jbi-qualitative-2017"] = new(
                "jbi-qualitative-2017",
                "JBI Critical Appraisal Checklist for Qualitative Research",
                "critical-appraisal",
                "2017",
                2017,
                "https://jbi.global/sites/default/files/2019-05/JBI_Critical_Appraisal-Checklist_for_Qualitative_Research2017_0.pdf",
                null,
                "2026-08-29", "historical official source reference recorded",
                MethodologyVerificationStatus.Verified,
                "Historical 2017 qualitative checklist. JBI states that its critical appraisal tools have been revised; this historical instrument must not be silently replaced by a newer JBI tool.",
                ["qualitative research"],
                false
            ),
            ["casp-qualitative-2024"] = new(
                "casp-qualitative-2024",
                "CASP Qualitative Studies Checklist",
                "critical-appraisal",
                "2024",
                2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-qualitative-2024.pdf",
                null,
                "2026-08-29", "official source recorded",
                MethodologyVerificationStatus.Verified,
                "CASP's current referencing page identifies the qualitative checklist as a 2024 checklist. CASP checklists are educational appraisal tools and should not be converted into a numerical quality total.",
                ["qualitative research"],
                false,
                "https://creativecommons.org/licenses/by-nc-sa/3.0/"
            ),
            ["casp-systematic-review-2024"] = new(
                "casp-systematic-review-2024", "CASP Systematic Review Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-systematic-reviews-checklist-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist. CASP checklists are pedagogic appraisal tools and are not converted to a numerical quality total.",
                ["systematic review"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-systematic-review-rct-meta-2024"] = new(
                "casp-systematic-review-rct-meta-2024", "CASP Systematic Review with Meta-analysis of RCTs Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-systematic-reviews-meta-analysis-rct-checklist-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for systematic reviews with meta-analysis of randomised controlled trials.",
                ["systematic review", "meta-analysis of randomised controlled trials"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-systematic-review-observational-meta-2024"] = new(
                "casp-systematic-review-observational-meta-2024", "CASP Systematic Review with Meta-analysis of Observational Studies Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-systematic-reviews-observational-studies-checklist-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for systematic reviews with meta-analysis of observational studies.",
                ["systematic review", "meta-analysis of observational studies"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-rct-2024"] = new(
                "casp-rct-2024", "CASP Randomised Controlled Trial Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-randomised-controlled-trials-RCT-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for randomised controlled trials.",
                ["randomised controlled trial"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-cohort-2024"] = new(
                "casp-cohort-2024", "CASP Cohort Study Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-cohort-study-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for cohort studies.",
                ["cohort study"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-case-control-2024"] = new(
                "casp-case-control-2024", "CASP Case Control Study Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-case-control-study-2024x.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for case-control studies.",
                ["case-control study"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-economic-evaluation-2024"] = new(
                "casp-economic-evaluation-2024", "CASP Economic Evaluation Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-economic-evaluation-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for economic evaluations.",
                ["economic evaluation"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-diagnostic-2024"] = new(
                "casp-diagnostic-2024", "CASP Diagnostic Test Study Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-diagnostic-test-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for diagnostic test studies.",
                ["diagnostic test study"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-cross-sectional-2024"] = new(
                "casp-cross-sectional-2024", "CASP Descriptive/Cross-sectional Studies Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-cross-sectional-study-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for descriptive/cross-sectional studies.",
                ["cross-sectional study", "descriptive study"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["casp-clinical-prediction-rule-2024"] = new(
                "casp-clinical-prediction-rule-2024", "CASP Clinical Prediction Rule Checklist", "critical-appraisal", "2024", 2024,
                "https://casp-uk.net/casp-checklists/CASP-checklist-clinical-prediction-rule-2024.pdf", null,
                "2026-08-29", "official CASP referencing page and checklist recorded",
                MethodologyVerificationStatus.Verified,
                "Current 2024 CASP checklist for clinical prediction rules.",
                ["clinical prediction rule"], false, "https://creativecommons.org/licenses/by-nc-sa/4.0/"
            ),
            ["jbi-qualitative-2024"] = new(
                "jbi-qualitative-2024",
                "JBI Critical Appraisal Checklist for Qualitative Research",
                "critical-appraisal",
                "2024",
                2024,
                "https://jbi-global-wiki.refined.site/download/attachments/355599504/JBI%20Manual%20for%20Evidence%20Synthesis%20Nov%202024.pdf?download=true",
                null,
                "2026-08-29", "official 2024 manual source recorded",
                MethodologyVerificationStatus.Prototype,
                "Current JBI qualitative guidance is documented in the 2024 JBI Manual. The ten qualitative appraisal questions remain the same, while accompanying guidance has been revised/clarified. This repository currently implements the historical 2017 instrument only; a 2024 implementation must not be claimed until separately validated.",
                ["qualitative research"],
                false
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
