using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public static class ResearchExportEndpoints
{
    public static void MapResearchExportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/research/prisma/export/{format}", (string format, PrismaFlowInput input, ResearchWorkflowService service) =>
        {
            var validation = service.ValidatePrisma(input);
            if (!validation.InternallyConsistent)
            {
                return Results.BadRequest(new
                {
                    error = "PRISMA-tallene må være internt konsistente før eksport.",
                    validation
                });
            }

            return format.Trim().ToLowerInvariant() switch
            {
                "svg" => Results.File(
                    BuildSvg(validation),
                    "image/svg+xml",
                    "prisma-flow-diagram.svg"),
                "json" => Results.File(
                    Encoding.UTF8.GetBytes(JsonSerializer.Serialize(validation, new JsonSerializerOptions { WriteIndented = true })),
                    "application/json",
                    "prisma-flow-data.json"),
                _ => Results.BadRequest(new { error = "Støttede PRISMA-eksporter er svg og json." })
            };
        });
    }

    private static byte[] BuildSvg(PrismaFlowResult result)
    {
        const int width = 1100;
        const int height = 980;
        const int boxWidth = 460;
        const int boxHeight = 92;
        const int left = 40;
        const int right = 600;

        var input = result.Input;
        var elements = new List<XElement>
        {
            Box(left, 60, boxWidth, boxHeight, "Identification", $"Records identified: {input.RecordsIdentified}", $"Removed before screening: {input.RecordsRemovedBeforeScreening}"),
            Box(left, 210, boxWidth, boxHeight, "Screening", $"Records screened: {input.RecordsScreened}", $"Records excluded: {input.RecordsExcluded}"),
            Box(left, 360, boxWidth, boxHeight, "Eligibility", $"Reports sought: {input.ReportsSought}", $"Reports not retrieved: {input.ReportsNotRetrieved}"),
            Box(left, 510, boxWidth, boxHeight, "Eligibility assessment", $"Reports assessed: {input.ReportsAssessed}", $"Reports excluded with reasons: {input.ReportsExcludedWithReasons}"),
            Box(left, 660, boxWidth, boxHeight, "Included", $"Reports included: {input.ReportsIncluded}", $"Studies included: {input.StudiesIncluded}"),
            Box(right, 210, 430, 92, "Screening exclusion", $"Excluded records: {input.RecordsExcluded}", "Document exclusion criteria separately."),
            Box(right, 360, 430, 92, "Retrieval", $"Not retrieved: {input.ReportsNotRetrieved}", "Record retrieval failures explicitly."),
            Box(right, 510, 430, 92, "Exclusion reasons", $"Excluded reports: {input.ReportsExcludedWithReasons}", "Retain documented reasons."),
        };

        var arrows = new[]
        {
            Arrow(left + boxWidth / 2, 152, left + boxWidth / 2, 210),
            Arrow(left + boxWidth / 2, 302, left + boxWidth / 2, 360),
            Arrow(left + boxWidth / 2, 452, left + boxWidth / 2, 510),
            Arrow(left + boxWidth / 2, 602, left + boxWidth / 2, 660),
            Arrow(left + boxWidth, 256, right, 256),
            Arrow(left + boxWidth, 406, right, 406),
            Arrow(left + boxWidth, 556, right, 556)
        };

        var svg = new XElement(XName.Get("svg", "http://www.w3.org/2000/svg"),
            new XAttribute("viewBox", $"0 0 {width} {height}"),
            new XAttribute("role", "img"),
            new XAttribute("aria-labelledby", "title description"),
            new XElement(XName.Get("title", "http://www.w3.org/2000/svg"), "PRISMA-style flow diagram"),
            new XElement(XName.Get("desc", "http://www.w3.org/2000/svg"), "Flow counts exported from the Evidence Appraisal Tool after internal consistency validation."),
            new XElement(XName.Get("style", "http://www.w3.org/2000/svg"), "text{font-family:Arial,sans-serif;fill:#111} .box{fill:#fff;stroke:#555;stroke-width:2}.title{font-size:20px;font-weight:700}.value{font-size:16px}.note{font-size:14px;fill:#555}.arrow{stroke:#555;stroke-width:2;fill:none}"),
            new XElement(XName.Get("text", "http://www.w3.org/2000/svg"), new XAttribute("x", 40), new XAttribute("y", 32), new XAttribute("class", "title"), "PRISMA-style flow diagram"),
            arrows,
            elements);

        return Encoding.UTF8.GetBytes(svg.ToString(SaveOptions.DisableFormatting));
    }

    private static XElement Box(int x, int y, int width, int height, string title, string value, string note) =>
        new(XName.Get("g", "http://www.w3.org/2000/svg"),
            new XElement(XName.Get("rect", "http://www.w3.org/2000/svg"), new XAttribute("x", x), new XAttribute("y", y), new XAttribute("width", width), new XAttribute("height", height), new XAttribute("rx", 8), new XAttribute("class", "box")),
            new XElement(XName.Get("text", "http://www.w3.org/2000/svg"), new XAttribute("x", x + 16), new XAttribute("y", y + 27), new XAttribute("class", "title"), title),
            new XElement(XName.Get("text", "http://www.w3.org/2000/svg"), new XAttribute("x", x + 16), new XAttribute("y", y + 55), new XAttribute("class", "value"), value),
            new XElement(XName.Get("text", "http://www.w3.org/2000/svg"), new XAttribute("x", x + 16), new XAttribute("y", y + 78), new XAttribute("class", "note"), note));

    private static XElement Arrow(int x1, int y1, int x2, int y2) =>
        new(XName.Get("line", "http://www.w3.org/2000/svg"), new XAttribute("x1", x1), new XAttribute("y1", y1), new XAttribute("x2", x2), new XAttribute("y2", y2), new XAttribute("class", "arrow"));
}
