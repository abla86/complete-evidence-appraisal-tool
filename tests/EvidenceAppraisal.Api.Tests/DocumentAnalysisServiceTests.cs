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

    private static FormFile CreateFile(string content, string fileName, string contentType)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName) { Headers = new HeaderDictionary(), ContentType = contentType };
    }
}
