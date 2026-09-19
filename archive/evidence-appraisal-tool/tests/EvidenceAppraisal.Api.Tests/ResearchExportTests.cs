using System.Text;
using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;

namespace EvidenceAppraisal.Api.Tests;

public sealed class ResearchExportTests
{
    [Fact]
    public void ValidPrismaFlowProducesExportableSvg()
    {
        var input = new PrismaFlowInput(
            RecordsIdentified: 100,
            RecordsRemovedBeforeScreening: 10,
            RecordsScreened: 90,
            RecordsExcluded: 60,
            ReportsSought: 30,
            ReportsNotRetrieved: 5,
            ReportsAssessed: 25,
            ReportsExcludedWithReasons: 15,
            StudiesIncluded: 10,
            ReportsIncluded: 10);

        var validation = new ResearchWorkflowService().ValidatePrisma(input);
        Assert.True(validation.InternallyConsistent);

        var export = ResearchExportTestAccess.BuildSvg(validation);
        var svg = Encoding.UTF8.GetString(export);

        Assert.StartsWith("<svg", svg);
        Assert.Contains("Records identified: 100", svg);
        Assert.Contains("Reports included: 10", svg);
    }

    [Fact]
    public void InvalidPrismaFlowMustNotBeExported()
    {
        var input = new PrismaFlowInput(100, 10, 80, 60, 30, 5, 25, 15, 10, 10);
        var validation = new ResearchWorkflowService().ValidatePrisma(input);

        Assert.False(validation.InternallyConsistent);
        Assert.NotEmpty(validation.Warnings);
    }
}

internal static class ResearchExportTestAccess
{
    public static byte[] BuildSvg(PrismaFlowResult result)
    {
        var method = typeof(ResearchExportEndpoints).GetMethod("BuildSvg", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(method);
        return Assert.IsType<byte[]>(method!.Invoke(null, new object[] { result }));
    }
}
