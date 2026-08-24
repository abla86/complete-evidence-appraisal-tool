using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class BibliographyImportServiceTests
{
    private readonly BibliographyImportService _service = new();

    [Fact]
    public void Ris_Parses_Common_Tags_And_Continuation_Lines()
    {
        const string ris = """
TY  - JOUR
TI  - A study of evidence appraisal
    and bibliographic workflows
AU  - Doe, Jane
AU  - Smith, John
JO  - Journal of Evidence
PY  - 2024
DO  - https://doi.org/10.1000/example.123
ER  -
""";

        var result = _service.Parse(ris, ".ris");

        var study = Assert.Single(result);
        Assert.Equal("A study of evidence appraisal and bibliographic workflows", study.Title);
        Assert.Equal(2, study.Authors.Count);
        Assert.Equal("2024", study.Year);
        Assert.Equal("10.1000/example.123", study.Doi);
        Assert.Equal("Journal of Evidence", study.Journal);
        Assert.False(string.IsNullOrWhiteSpace(study.ImportFingerprint));
    }

    [Fact]
    public void BibTeX_Parses_Nested_Title_And_Doi()
    {
        const string bib = """
@article{example,
  title = {A {randomized} evidence appraisal study},
  author = {Doe, Jane and Smith, John},
  year = {2023},
  journal = {Evidence Journal},
  doi = {doi:10.1000/test.456},
  abstract = {A short abstract.}
}
""";

        var study = Assert.Single(_service.Parse(bib, ".bib"));

        Assert.Equal("A {randomized} evidence appraisal study", study.Title);
        Assert.Equal(2, study.Authors.Count);
        Assert.Equal("2023", study.Year);
        Assert.Equal("10.1000/test.456", study.Doi);
        Assert.Equal("Evidence Journal", study.Journal);
        Assert.Equal("A short abstract.", study.Abstract);
    }

    [Fact]
    public void Unsupported_Format_Is_Rejected()
    {
        var exception = Assert.Throws<ArgumentException>(() => _service.Parse("title", ".pdf"));
        Assert.Contains("Unsupported bibliography format", exception.Message);
    }

    [Fact]
    public void Empty_Input_Returns_No_Records()
    {
        Assert.Empty(_service.Parse("   ", ".ris"));
    }
}
