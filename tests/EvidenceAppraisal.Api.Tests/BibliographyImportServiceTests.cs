using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class BibliographyImportServiceTests
{
    private readonly BibliographyImportService _service = new();

    [Fact]
    public void Ris_Parses_Common_Tags_Continuation_Abstract_And_Identifier()
    {
        const string ris = """
TY  - JOUR
ID  - RIS-123
TI  - A study of evidence appraisal
    and bibliographic workflows
AU  - Doe, Jane
AU  - Smith, John
JO  - Journal of Evidence
PY  - 2024
DO  - https://doi.org/10.1000/example.123
AB  - This abstract continues
    on another line.
ER  -
""";

        var result = _service.Parse(ris, ".ris");
        var study = Assert.Single(result);

        Assert.Equal("A study of evidence appraisal and bibliographic workflows", study.Title);
        Assert.Equal(2, study.Authors.Count);
        Assert.Equal("2024", study.Year);
        Assert.Equal("10.1000/example.123", study.Doi);
        Assert.Equal("Journal of Evidence", study.Journal);
        Assert.Equal("This abstract continues on another line.", study.Abstract);
        Assert.Equal("RIS-123", study.RecordIdentifier);
        Assert.False(string.IsNullOrWhiteSpace(study.ImportFingerprint));
    }

    [Fact]
    public void BibTeX_Parses_Nested_Title_Doi_And_Citation_Key()
    {
        const string bib = """
@article{example-key,
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
        Assert.Equal("example-key", study.RecordIdentifier);
    }

    [Fact]
    public void Nbib_Parses_Pmid_Doi_And_Abstract()
    {
        const string nbib = """
PMID- 12345678
TI  - A systematic review of evidence
AU  - Doe J
AU  - Smith J
DP  - 2024 Jan 15
JT  - Evidence Journal
LID - 10.1000/example [doi]
AB  - PubMed abstract text.
""";

        var study = Assert.Single(_service.Parse(nbib, ".nbib"));

        Assert.Equal("A systematic review of evidence", study.Title);
        Assert.Equal(2, study.Authors.Count);
        Assert.Equal("2024", study.Year);
        Assert.Equal("10.1000/example", study.Doi);
        Assert.Equal("Evidence Journal", study.Journal);
        Assert.Equal("PubMed abstract text.", study.Abstract);
        Assert.Equal("12345678", study.RecordIdentifier);
    }

    [Fact]
    public void Xml_Uses_Journal_Title_And_Article_Id()
    {
        const string xml = """
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <Article>
        <ArticleTitle>Article title</ArticleTitle>
        <Journal>
          <Title>Correct Journal</Title>
        </Journal>
        <Abstract>
          <AbstractText>XML abstract.</AbstractText>
        </Abstract>
        <AuthorList>
          <Author>
            <LastName>Doe</LastName>
            <ForeName>Jane</ForeName>
          </Author>
        </AuthorList>
      </Article>
      <PubmedData>
        <ArticleIdList>
          <ArticleId IdType="pubmed">98765432</ArticleId>
        </ArticleIdList>
      </PubmedData>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>
""";

        var study = Assert.Single(_service.Parse(xml, ".xml"));

        Assert.Equal("Article title", study.Title);
        Assert.Equal("Correct Journal", study.Journal);
        Assert.Equal("XML abstract.", study.Abstract);
        Assert.Equal("98765432", study.RecordIdentifier);
        Assert.Single(study.Authors);
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

    [Fact]
    public void Duplicate_Records_Have_Identical_Fingerprints()
    {
        const string ris = """
TY  - JOUR
ID  - first
TI  - Same study
AU  - Doe, Jane
PY  - 2024
DO  - 10.1000/same.123
ER  -

TY  - JOUR
ID  - second
TI  - Same study
AU  - Doe, Jane
PY  - 2024
DO  - 10.1000/same.123
ER  -
""";

        var result = _service.Parse(ris, ".ris");

        Assert.Equal(2, result.Count);
        Assert.Equal(result[0].ImportFingerprint, result[1].ImportFingerprint);
    }
}
