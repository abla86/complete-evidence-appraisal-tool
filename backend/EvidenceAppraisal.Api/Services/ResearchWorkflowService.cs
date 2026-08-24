using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class ResearchWorkflowService
{
    public PrismaFlowResult ValidatePrisma(PrismaFlowInput input)
    {
        var warnings = new List<string>();
        var values = new[]
        {
            input.RecordsIdentified, input.RecordsRemovedBeforeScreening, input.RecordsScreened,
            input.RecordsExcluded, input.ReportsSought, input.ReportsNotRetrieved, input.ReportsAssessed,
            input.ReportsExcludedWithReasons, input.StudiesIncluded, input.ReportsIncluded
        };
        if (values.Any(x => x < 0)) warnings.Add("PRISMA counts cannot be negative.");

        var screeningExpected = input.RecordsIdentified - input.RecordsRemovedBeforeScreening;
        var screeningDifference = screeningExpected - input.RecordsScreened;
        var eligibilityExpected = input.RecordsScreened - input.RecordsExcluded;
        var eligibilityDifference = eligibilityExpected - input.ReportsSought;
        var includedExpected = input.ReportsAssessed - input.ReportsExcludedWithReasons;
        var includedDifference = includedExpected - input.ReportsIncluded;

        if (screeningDifference != 0) warnings.Add("Identification → screening counts do not reconcile.");
        if (eligibilityDifference != 0) warnings.Add("Screening → reports sought counts do not reconcile.");
        if (includedDifference != 0) warnings.Add("Eligibility → included reports counts do not reconcile.");
        if (input.ReportsNotRetrieved > input.ReportsSought) warnings.Add("Reports not retrieved cannot exceed reports sought.");
        if (input.ReportsAssessed > input.ReportsSought - input.ReportsNotRetrieved) warnings.Add("Reports assessed cannot exceed retrievable reports.");
        if (input.StudiesIncluded < 0 || input.ReportsIncluded < 0) warnings.Add("Included counts are invalid.");

        return new(input, screeningExpected, screeningDifference, eligibilityExpected, eligibilityDifference,
            includedExpected, includedDifference, warnings.Count == 0, warnings);
    }

    public KappaResult CalculateKappa(KappaInput input)
    {
        if (input.Reviewer1 is null || input.Reviewer2 is null || input.Reviewer1.Count != input.Reviewer2.Count)
            throw new ArgumentException("Both reviewers must provide equally sized answer lists.");
        if (input.Reviewer1.Count == 0) throw new ArgumentException("At least one paired rating is required.");

        var categories = input.Reviewer1.Concat(input.Reviewer2)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (categories.Length < 2) throw new ArgumentException("At least two response categories are required for Cohen's kappa.");

        var r1 = categories.ToDictionary(c => c, c => input.Reviewer1.Count(x => string.Equals(x?.Trim(), c, StringComparison.OrdinalIgnoreCase)), StringComparer.OrdinalIgnoreCase);
        var r2 = categories.ToDictionary(c => c, c => input.Reviewer2.Count(x => string.Equals(x?.Trim(), c, StringComparison.OrdinalIgnoreCase)), StringComparer.OrdinalIgnoreCase);
        var n = input.Reviewer1.Count;
        var agreements = input.Reviewer1.Zip(input.Reviewer2).Count(p => string.Equals(p.First?.Trim(), p.Second?.Trim(), StringComparison.OrdinalIgnoreCase));
        var po = agreements / (double)n;
        var pe = categories.Sum(c => (r1[c] / (double)n) * (r2[c] / (double)n));
        var kappa = Math.Abs(1 - pe) < 1e-12 ? 1d : (po - pe) / (1 - pe);

        return new(n, agreements, po, pe, kappa, r1, r2, categories, Interpret(kappa));
    }

    private static string Interpret(double kappa) => kappa switch
    {
        < 0 => "Agreement less than expected by chance; interpret with caution.",
        < 0.21 => "Slight agreement.",
        < 0.41 => "Fair agreement.",
        < 0.61 => "Moderate agreement.",
        < 0.81 => "Substantial agreement.",
        _ => "Almost perfect agreement."
    };
}
