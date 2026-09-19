using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class RisImportServiceTests
{
    [Fact]
    public void ParsesCommonRisFieldsAndNormalizesDoi()
    {
        const string ris = "TY  - JOUR\nAU  - Andersen, Anne Beth\nAU  - Hansen, Ola\nTI  - A study title\nPY  - 2026\nDO  - https://doi.org/10.1000/example.1\nJF  - Journal of Testing\nAB  - Abstract text\nER  -\n";

        var studies = new RisImportService().ParseRisFile(ris);

        var study = Assert.Single(studies);
        Assert.Equal("A study title", study.Title);
        Assert.Equal(2, study.Authors.Count);
        Assert.Equal("2026", study.Year);
        Assert.Equal("10.1000/example.1", study.Doi);
        Assert.Equal("Journal of Testing", study.Journal);
        Assert.Equal("Abstract text", study.Abstract);
        Assert.Equal(64, study.ImportFingerprint.Length);
    }

    [Fact]
    public void SupportsContinuationLinesAndDuplicateFingerprint()
    {
        const string first = "TY  - JOUR\nTI  - A long\n      title continued\nAU  - Author, A\nER  -\n";
        const string second = "TY  - JOUR\nTI  - A long title continued\nAU  - Author, A\nER  -\n";

        var parser = new RisImportService();
        var a = Assert.Single(parser.ParseRisFile(first));
        var b = Assert.Single(parser.ParseRisFile(second));

        Assert.Equal(a.Title, b.Title);
        Assert.Equal(a.ImportFingerprint, b.ImportFingerprint);
    }

    [Fact]
    public void IgnoresRecordsWithoutTitle()
    {
        const string ris = "TY  - JOUR\nAU  - Author, A\nER  -\n";
        Assert.Empty(new RisImportService().ParseRisFile(ris));
    }
}
