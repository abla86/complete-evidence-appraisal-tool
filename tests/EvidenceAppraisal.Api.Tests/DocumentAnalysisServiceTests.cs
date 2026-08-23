using EvidenceAppraisal.Api.Services;
using Microsoft.AspNetCore.Http;

namespace EvidenceAppraisal.Api.Tests;

public sealed class DocumentAnalysisServiceTests
{
    [Fact]
    public async Task ClassifiesSystematicReviewAndFlagsAgreeIiAsNotSuitable()
    {
        const string text = "Systematic review and meta-analysis. PRISMA. Search strategy MEDLINE. Risk of bias. Publication bias.";
        var file = CreateFile(text, "review.txt", "text/plain");
        var service = new DocumentAnalysisService();

        var result = await service.AnalyzeAsync(file, ["amstar2", "agree2"], false, CancellationToken.None);

        Assert.Equal("Systematic review / meta-analysis", result.DocumentType);
        Assert.Equal("High", result.Classification.Confidence);
        Assert.Equal("Suitable", result.InstrumentSuitability.Single(x => x.Instrument == "AMSTAR 2").Status);
        Assert.Equal("Not suitable", result.InstrumentSuitability.Single(x => x.Instrument == "AGREE II").Status);
        Assert.Contains(result.Findings, x => x.Instrument == "amstar2" && x.Topic == "Search strategy");
    }

    [Fact]
    public async Task ClassifiesGuidelineAndWarnsThatGradeNeedsBodyOfEvidence()
    {
        const string text = "Clinical practice guideline. Guideline development. Recommendations. Stakeholder involvement. External review.";
        var file = CreateFile(text, "guideline.txt", "text/plain");
        var service = new DocumentAnalysisService();

        var result = await service.AnalyzeAsync(file, ["agree2", "grade"], false, CancellationToken.None);

        Assert.Equal("Clinical practice guideline", result.DocumentType);
        Assert.Equal("Suitable", result.InstrumentSuitability.Single(x => x.Instrument == "AGREE II").Status);
        Assert.Equal("Caution", result.InstrumentSuitability.Single(x => x.Instrument == "GRADE").Status);
        Assert.Contains(result.Warnings, x => x.Contains("GRADE", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Missing_candidate_evidence_is_not_returned_as_a_negative_judgement()
    {
        const string text = "This document describes methods but contains no protocol registration statement.";
        var file = CreateFile(text, "article.txt", "text/plain");
        var service = new DocumentAnalysisService();

        var result = await service.AnalyzeAsync(file, ["amstar2"], false, CancellationToken.None);

        Assert.Empty(result.Findings.Where(x => x.Topic == "Protocol/registration"));
        Assert.Contains(result.Warnings, x => x.Contains("No candidate passage", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(result.Findings, x => x.Status == "No");
    }

    [Fact]
    public async Task Candidate_findings_are_explicitly_uncertain()
    {
        const string text = "Two reviewers independently extracted data. The search strategy used PubMed.";
        var file = CreateFile(text, "review.txt", "text/plain");
        var service = new DocumentAnalysisService();

        var result = await service.AnalyzeAsync(file, ["amstar2"], false, CancellationToken.None);

        Assert.NotEmpty(result.Findings);
        Assert.All(result.Findings, finding =>
        {
            Assert.Equal("Candidate", finding.Status);
            Assert.Equal("Uncertain", finding.Confidence);
            Assert.Contains("researcher", finding.Uncertainty, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public async Task Unsupported_file_type_is_rejected()
    {
        var file = CreateFile("not a supported document", "article.exe", "application/octet-stream");
        var service = new DocumentAnalysisService();

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.AnalyzeAsync(file, ["amstar2"], false, CancellationToken.None));

        Assert.Contains("Supported formats", exception.Message);
    }

    private static FormFile CreateFile(string content, string fileName, string contentType)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName) { Headers = new HeaderDictionary(), ContentType = contentType };
    }
}
