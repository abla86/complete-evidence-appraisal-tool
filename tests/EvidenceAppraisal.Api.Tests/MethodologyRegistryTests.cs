using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Tests;

public class MethodologyRegistryTests
{
    [Fact]
    public void Registry_contains_core_methodology_definitions()
    {
        var required = new[]
        {
            "amstar2",
            "agree2",
            "rob2",
            "prisma2020",
            "cfir2",
            "kta",
            "jbi-qualitative-2017",
            "casp-qualitative-2024"
        };

        foreach (var id in required)
        {
            Assert.True(MethodologyRegistry.Definitions.ContainsKey(id), $"Missing methodology: {id}");
            Assert.False(string.IsNullOrWhiteSpace(MethodologyRegistry.Definitions[id].OfficialSourceUrl));
        }

        Assert.Equal(MethodologyVerificationStatus.Verified,
            MethodologyRegistry.Definitions["amstar2"].VerificationStatus);
        Assert.Equal(MethodologyVerificationStatus.Verified,
            MethodologyRegistry.Definitions["jbi-qualitative-2017"].VerificationStatus);
        Assert.Equal(MethodologyVerificationStatus.Verified,
            MethodologyRegistry.Definitions["casp-qualitative-2024"].VerificationStatus);
    }

    [Fact]
    public void Agree_II_is_not_mislabelled_as_2017()
    {
        var definition = MethodologyRegistry.Definitions["agree2"];

        Assert.Null(definition.Version);
        Assert.Equal(2010, definition.PublicationYear);
    }

    [Fact]
    public void JBI_qualitative_2017_is_a_separate_historical_instrument()
    {
        var definition = MethodologyRegistry.Definitions["jbi-qualitative-2017"];

        Assert.Equal("2017", definition.Version);
        Assert.Equal(2017, definition.PublicationYear);
        Assert.Contains("jbi.global", definition.OfficialSourceUrl);
    }

    [Fact]
    public void CASP_qualitative_uses_current_2024_registry_entry()
    {
        var definition = MethodologyRegistry.Definitions["casp-qualitative-2024"];

        Assert.Equal("2024", definition.Version);
        Assert.Equal(2024, definition.PublicationYear);
        Assert.Contains("casp-uk.net/casp-checklists/CASP-checklist-qualitative-2024.pdf", definition.OfficialSourceUrl);
    }

    [Fact]
    public void CASP_is_study_design_specific()
    {
        Assert.DoesNotContain("casp", MethodologyRegistry.Definitions.Keys, StringComparer.OrdinalIgnoreCase);
        Assert.Contains("casp-qualitative-2024", MethodologyRegistry.Definitions.Keys, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void Incomplete_RoB2_implementation_is_not_marked_verified()
    {
        Assert.Equal(
            MethodologyVerificationStatus.Prototype,
            MethodologyRegistry.Definitions["rob2"].VerificationStatus);
    }
}
