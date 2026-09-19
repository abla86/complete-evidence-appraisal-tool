namespace EvidenceAppraisal.Api.Models;

public enum ResearchMethodology
{
    SystematicReview,
    MetaAnalysis,
    QualitativeSynthesis,
    ScopingReview,
    GuidelineDevelopment
}

public sealed record PrismaFlowInput(
    int RecordsIdentified,
    int RecordsRemovedBeforeScreening,
    int RecordsScreened,
    int RecordsExcluded,
    int ReportsSought,
    int ReportsNotRetrieved,
    int ReportsAssessed,
    int ReportsExcludedWithReasons,
    int StudiesIncluded,
    int ReportsIncluded);

public sealed record PrismaFlowResult(
    PrismaFlowInput Input,
    int ScreeningExpected,
    int ScreeningDifference,
    int EligibilityExpected,
    int EligibilityDifference,
    int IncludedExpected,
    int IncludedDifference,
    bool InternallyConsistent,
    IReadOnlyList<string> Warnings);

public sealed record KappaInput(IReadOnlyList<string> Reviewer1, IReadOnlyList<string> Reviewer2);

public sealed record KappaResult(
    int N,
    int Agreements,
    double ObservedAgreement,
    double ExpectedAgreement,
    double Kappa,
    IReadOnlyDictionary<string, int> Reviewer1Marginals,
    IReadOnlyDictionary<string, int> Reviewer2Marginals,
    IReadOnlyList<string> Categories,
    string Interpretation);

public sealed record GradeSoFRow(
    string Outcome,
    string RelativeEffect,
    string ParticipantsAndStudies,
    string Certainty,
    string Justification,
    string AbsoluteEffect);

public sealed record GradeSoFTable(
    string Title,
    IReadOnlyList<GradeSoFRow> Rows,
    string MethodologicalNotice);
