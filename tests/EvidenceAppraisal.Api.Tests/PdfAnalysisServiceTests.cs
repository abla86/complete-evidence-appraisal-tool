using System.Text;
using EvidenceAppraisal.Api.Services;
using Microsoft.AspNetCore.Http;

namespace EvidenceAppraisal.Api.Tests;

public sealed class PdfAnalysisServiceTests
{
    [Fact]
    public async Task Jats_is_accepted_and_parsed_as_xml()
    {
        const string jats = "<?xml version=\"1.0\"?><article><body><sec><title>Methods</title><p>Search strategy used MEDLINE and PubMed.</p></sec></body></article>";
        var file = CreateFile(jats, "review.jats", "application/xml");
        var service = new PdfAnalysisService();

        var result = await service.AnalyzeAsync(file, ["amstar2"], false, CancellationToken.None);

        Assert.Equal("review.jats", result.FileName);
        Assert.Equal("Text extracted", result.ExtractionStatus);
        Assert.Contains(result.Warnings, warning => warning.Contains("XML/JATS", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Findings, finding => finding.Topic == "Search strategy" && finding.MatchedTerm == "MEDLINE");
    }

    [Fact]
    public async Task Jats_and_xml_use_the_same_extraction_path()
    {
        const string xml = "<?xml version=\"1.0\"?><article><body><p>Search strategy used Embase.</p></body></article>";
        var xmlFile = CreateFile(xml, "review.xml", "application/xml");
        var jatsFile = CreateFile(xml, "review.jats", "application/xml");
        var service = new PdfAnalysisService();

        var xmlResult = await service.AnalyzeAsync(xmlFile, ["amstar2"], false, CancellationToken.None);
        var jatsResult = await service.AnalyzeAsync(jatsFile, ["amstar2"], false, CancellationToken.None);

        Assert.Contains(xmlResult.Findings, finding => finding.Topic == "Search strategy" && finding.MatchedTerm == "Embase");
        Assert.Contains(jatsResult.Findings, finding => finding.Topic == "Search strategy" && finding.MatchedTerm == "Embase");
        Assert.Equal(xmlResult.Findings.Count, jatsResult.Findings.Count);
    }

    [Fact]
    public async Task Unsupported_extension_is_rejected()
    {
        var file = CreateFile("not supported", "article.exe", "application/octet-stream");
        var service = new PdfAnalysisService();

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AnalyzeAsync(file, ["amstar2"], false, CancellationToken.None));

        Assert.Contains("Supported document formats", exception.Message);
    }

    private static FormFile CreateFile(string content, string fileName, string contentType)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }
}
