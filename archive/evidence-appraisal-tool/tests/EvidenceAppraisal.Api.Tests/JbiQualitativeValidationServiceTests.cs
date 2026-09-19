using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public class JbiQualitativeValidationServiceTests
{
    [Fact]
    public void Valid_assessment_requires_all_ten_items()
    {
        var assessment = new JbiQualitativeAssessment
        {
            StudyTitle = "Example qualitative study",
            ReviewerCode = "R1",
            Items = Enumerable.Range(1, 10)
                .Select(i => new JbiQualitativeItemAssessment
                {
                    ItemNumber = i,
                    Response = JbiQualitativeResponse.Yes,
                    Rationale = "Documented rationale",
                    EvidenceLocation = $"p. {i}"
                }).ToArray(),
            OverallAppraisal = JbiOverallAppraisal.Include,
            OverallAppraisalRationale = "Documented overall judgement."
        };

        var result = new JbiQualitativeValidationService().Validate(assessment);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Missing_evidence_is_not_treated_as_a_negative_response()
    {
        var assessment = new JbiQualitativeAssessment
        {
            StudyTitle = "Example qualitative study",
            ReviewerCode = "R1",
            Items = Enumerable.Range(1, 10)
                .Select(i => new JbiQualitativeItemAssessment
                {
                    ItemNumber = i,
                    Response = i == 1 ? null : JbiQualitativeResponse.Yes,
                    Rationale = "Rationale",
                    EvidenceLocation = "Not reported in the study"
                }).ToArray(),
            OverallAppraisal = JbiOverallAppraisal.SeekFurtherInformation,
            OverallAppraisalRationale = "The missing information requires verification."
        };

        var result = new JbiQualitativeValidationService().Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("Item 1"));
        Assert.DoesNotContain(result.Errors, error => error.Contains("No"));
    }

    [Fact]
    public void Wrong_version_is_rejected()
    {
        var assessment = new JbiQualitativeAssessment
        {
            InstrumentVersion = "latest",
            StudyTitle = "Example",
            ReviewerCode = "R1",
            Items = [],
            OverallAppraisal = JbiOverallAppraisal.Include,
            OverallAppraisalRationale = "Rationale"
        };

        var result = new JbiQualitativeValidationService().Validate(assessment);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("exactly 2017"));
    }
}
