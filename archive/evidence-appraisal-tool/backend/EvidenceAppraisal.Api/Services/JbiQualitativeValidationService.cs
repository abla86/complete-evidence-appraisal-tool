using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class JbiQualitativeValidationService
{
    public const int TotalItems = 10;

    public JbiQualitativeValidationResult Validate(JbiQualitativeAssessment assessment)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        var errors = new List<string>();

        if (assessment.InstrumentId != "jbi-qualitative-2017")
            errors.Add("This endpoint only accepts the verified historical JBI qualitative 2017 instrument.");

        if (assessment.InstrumentVersion != "2017")
            errors.Add("JBI qualitative assessment version must be exactly 2017 for this instrument.");

        if (string.IsNullOrWhiteSpace(assessment.StudyTitle))
            errors.Add("Study title is required.");
        if (string.IsNullOrWhiteSpace(assessment.ReviewerCode))
            errors.Add("Reviewer code is required.");

        var items = assessment.Items ?? [];
        var numbers = items.Select(item => item.ItemNumber).ToArray();

        if (numbers.Length != TotalItems ||
            numbers.Distinct().Count() != TotalItems ||
            !Enumerable.Range(1, TotalItems).All(numbers.Contains))
            errors.Add("Exactly one assessment is required for each of the 10 JBI qualitative items.");

        foreach (var item in items)
        {
            if (item.ItemNumber is < 1 or > TotalItems)
                errors.Add($"Item {item.ItemNumber}: item number must be between 1 and 10.");
            if (item.Response is null)
                errors.Add($"Item {item.ItemNumber}: response is required.");
            if (string.IsNullOrWhiteSpace(item.Rationale))
                errors.Add($"Item {item.ItemNumber}: rationale is required.");
            if (string.IsNullOrWhiteSpace(item.EvidenceLocation))
                errors.Add($"Item {item.ItemNumber}: evidence location is required.");
        }

        if (assessment.OverallAppraisal is null)
            errors.Add("Overall appraisal is required.");
        if (string.IsNullOrWhiteSpace(assessment.OverallAppraisalRationale))
            errors.Add("Overall appraisal rationale is required.");

        return new JbiQualitativeValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors,
            CompletedItems = items.Count(i =>
                i.Response is not null &&
                !string.IsNullOrWhiteSpace(i.Rationale) &&
                !string.IsNullOrWhiteSpace(i.EvidenceLocation)),
            ExpectedItems = TotalItems
        };
    }
}
