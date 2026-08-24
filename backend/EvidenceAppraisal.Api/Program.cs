using System.Text.Json.Serialization;
using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<Amstar2ValidationService>();
builder.Services.AddSingleton<AssessmentReportFactory>();
builder.Services.AddSingleton<AssessmentExportService>();
builder.Services.AddSingleton<Agree2ScoringService>();
builder.Services.AddSingleton<CaspValidationService>();
builder.Services.AddSingleton<GradeCertaintyService>();
builder.Services.AddSingleton<ImplementationValidationService>();
builder.Services.AddSingleton<ImplementationExportService>();
builder.Services.AddSingleton<PdfAnalysisService>();
builder.Services.AddSingleton<DocumentAnalysisService>();
builder.Services.AddSingleton<RisImportService>();

var implementationConnection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ImplementationDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(implementationConnection)) options.UseSqlServer(implementationConnection);
    else options.UseSqlite("Data Source=implementation.db");
});
builder.Services.AddDbContext<EvidenceDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(implementationConnection)) options.UseSqlServer(implementationConnection);
    else options.UseSqlite("Data Source=evidence.db");
});
builder.Services.AddScoped<ImplementationPersistenceService>();
builder.Services.AddScoped<ProjectOverviewService>();
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddPolicy("LocalReactFrontend", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var implementationDb = scope.ServiceProvider.GetRequiredService<ImplementationDbContext>();
    await implementationDb.Database.EnsureCreatedAsync();
    var evidenceDb = scope.ServiceProvider.GetRequiredService<EvidenceDbContext>();
    await evidenceDb.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment()) app.MapOpenApi();
else app.UseExceptionHandler();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    if (!app.Environment.IsDevelopment()) context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    await next();
});

app.UseCors("LocalReactFrontend");
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api", () => Results.Ok(new
{
    application = "Evidence Appraisal Tool API",
    status = "Research tool / prototype",
    modules = new[] { "AMSTAR 2", "CASP", "AGREE II", "GRADE", "CFIR 2.0", "KTA", "Research Document Analysis", "RIS Reference Import" },
    methodologicalNotice = "Document analysis locates candidate evidence passages but does not complete appraisals or replace methodological expertise.",
    safetyRule = "Not found is never equivalent to No. Uncertain findings require researcher verification.",
    securityNotice = "Do not store identifiable patient information or other confidential research data in this public deployment. Uploaded research documents are processed in memory by the analysis endpoint; only explicitly submitted manual evidence is persisted."
}));
app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }));

app.MapGet("/api/instruments", () => Results.Ok(new object[]
{
    new { id = "amstar2", name = "AMSTAR 2", purpose = "Critical appraisal of systematic reviews of healthcare interventions", status = "Available", itemCount = 16, scoring = "No numerical total score" },
    new { id = "casp", name = "CASP", purpose = "Design-specific critical appraisal using an authorised CASP checklist", status = "Available", itemCount = (int?)null, scoring = "No automatic quality total" },
    new { id = "agree2", name = "AGREE II", purpose = "Appraisal of clinical practice guidelines", status = "Available", itemCount = 23, scoring = "Six standardised domain scores; no single required aggregate score" },
    new { id = "grade", name = "GRADE", purpose = "Outcome-level certainty of a body of evidence", status = "Available", itemCount = 8, scoring = "Four certainty categories with explicit domain judgements" },
    new { id = "cfir2", name = "CFIR 2.0", purpose = "Implementation determinant assessment", status = "Available", itemCount = 48, scoring = "Researcher judgement; no automatic barrier/facilitator total" },
    new { id = "kta", name = "Knowledge-to-Action", purpose = "Documentation of the seven-step action cycle", status = "Available", itemCount = 7, scoring = "No validated implementation-progress percentage" }
}));

app.MapGet("/api/amstar2/metadata", () => Results.Ok(new
{
    instrumentName = "AMSTAR 2", instrumentVersion = "2017", totalItems = Amstar2ValidationService.TotalItems,
    proposedDefaultCriticalDomains = new[] { 2, 4, 7, 9, 11, 13, 15 },
    criticalDomainNotice = "The seven domains are proposed defaults from the original publication. Critical domains must be prespecified and justified for the appraisal context.",
    scoringNotice = "AMSTAR 2 item responses must not be combined into a numerical total score.",
    currentCapabilities = new[] { "Typed assessment submission", "Structural validation", "Required rationale validation", "Required evidence-location validation", "Critical-domain prespecification validation" },
    unavailableCapabilities = new[] { "Automatic professional judgement", "Multi-reviewer reconciliation", "Clinical or policy recommendation" }
}));
app.MapGet("/api/cfir2/metadata", (ImplementationValidationService service) => Results.Ok(new
{
    framework = "CFIR 2.0", frameworkVersion = "Updated 2022 framework", constructCount = 48, subconstructCount = 19,
    domains = Enum.GetNames<CfirDomain>(), constructs = service.GetCfirConstructs(), officialGuide = "https://cfirguide.org/constructs",
    methodologicalNotice = "CFIR 2.0 must be fully operationalized for the specific project. The application exposes the 48 constructs as a catalogue, while project-specific selection, subconstructs, coding and rating guidance remain researcher responsibilities."
}));
app.MapGet("/api/kta/metadata", (ImplementationValidationService service) => Results.Ok(new
{
    framework = "Knowledge-to-Action Framework", frameworkVersion = "Graham et al., 2006", phases = service.GetKtaPhases(),
    methodologicalNotice = "The KTA action cycle is iterative and bidirectional. Phase status and linked actions are documentation aids, not a validated implementation-effectiveness score."
}));

app.MapPost("/api/amstar2/validate", (Amstar2Assessment assessment, Amstar2ValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/casp/validate", (CaspAssessment assessment, CaspValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/agree2/calculate", (Agree2Assessment assessment, Agree2ScoringService service) => Results.Ok(service.Calculate(assessment)));
app.MapPost("/api/grade/evaluate", (GradeOutcomeAssessment assessment, GradeCertaintyService service) => Results.Ok(service.Evaluate(assessment)));
app.MapPost("/api/cfir2/validate", (CfirAssessment assessment, ImplementationValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/kta/validate", (KtaAssessment assessment, ImplementationValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/implementation/validate", (ImplementationAssessment assessment, ImplementationValidationService service) => Results.Ok(service.ValidateImplementation(assessment.Cfir, assessment.Kta)));

async Task<IResult> AnalyzeResearchDocument(HttpRequest request, DocumentAnalysisService service, CancellationToken cancellationToken)
{
    if (!request.HasFormContentType) return Results.BadRequest(new { error = "multipart/form-data is required." });
    var form = await request.ReadFormAsync(cancellationToken);
    var file = form.Files.GetFile("file");
    if (file is null) return Results.BadRequest(new { error = "Upload a supported research document using the 'file' field." });
    var instruments = form["instruments"].SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)).ToArray();
    var includeSourceText = string.Equals(form["includePageText"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase);
    try { return Results.Ok(await service.AnalyzeAsync(file, instruments, includeSourceText, cancellationToken)); }
    catch (ArgumentException exception) { return Results.BadRequest(new { error = exception.Message }); }
}

app.MapPost("/api/evidence/analyze", AnalyzeResearchDocument);
app.MapPost("/api/evidence/pdf/analyze", AnalyzeResearchDocument);
app.MapRisImportEndpoints();

app.MapGet("/api/evidence/manual/{documentHash}", async (string documentHash, EvidenceDbContext db, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(documentHash)) return Results.BadRequest(new { error = "Document hash is required." });
    var records = await db.EvidenceRecords.AsNoTracking().Where(x => x.DocumentHashSha256 == documentHash).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    return Results.Ok(records.Select(ToEvidenceDto));
});

app.MapPost("/api/evidence/manual", async (ManualEvidenceRequest request, EvidenceDbContext db, CancellationToken cancellationToken) =>
{
    var errors = ValidateManualEvidence(request);
    if (errors.Count > 0) return Results.BadRequest(new { error = "Manual evidence is incomplete.", details = errors });
    if (!request.DocumentHashSha256.All(Uri.IsHexDigit) || request.DocumentHashSha256.Length != 64) return Results.BadRequest(new { error = "DocumentHashSha256 must be a 64-character SHA-256 hexadecimal hash." });
    var entity = new EvidenceRecordEntity
    {
        DocumentHashSha256 = request.DocumentHashSha256.ToLowerInvariant(), Instrument = request.Instrument.Trim(), ItemOrDomain = request.ItemOrDomain.Trim(),
        EvidenceText = request.EvidenceText.Trim(), SourceType = request.SourceType.Trim(), Page = request.Page?.Trim(), Section = request.Section?.Trim(),
        Table = request.Table?.Trim(), Figure = request.Figure?.Trim(), Url = request.Url?.Trim(), Doi = request.Doi?.Trim(), Reviewer = request.Reviewer.Trim(),
        Rationale = request.Rationale.Trim(), Status = "Manually added", CreatedAtUtc = DateTime.UtcNow
    };
    db.EvidenceRecords.Add(entity);
    await db.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/evidence/manual/{entity.DocumentHashSha256}", ToEvidenceDto(entity));
});

app.MapEvidenceVerificationEndpoints();
app.MapPost("/api/implementation/save", async (ImplementationAssessment assessment, ImplementationValidationService validationService, ImplementationPersistenceService persistenceService, CancellationToken cancellationToken) =>
{
    var validation = validationService.ValidateImplementation(assessment.Cfir, assessment.Kta);
    if (!validation.IsValid) return Results.BadRequest(validation);
    var id = await persistenceService.SaveAsync(assessment, cancellationToken);
    return Results.Ok(new { id, saved = true, methodologicalNotice = "Stored records remain researcher-entered implementation documentation; persistence does not imply methodological validity." });
});
app.MapGet("/api/project-overview", async (ProjectOverviewService service, CancellationToken cancellationToken) => Results.Ok(await service.GetAsync(cancellationToken)));
app.MapGet("/api/project-overview/{cfirId:guid}/audit", async (Guid cfirId, ImplementationPersistenceService service, CancellationToken cancellationToken) => Results.Ok(await service.GetAuditAsync(cfirId, cancellationToken: cancellationToken)));
app.MapGet("/api/implementation/cfir/{constructKey}/actions", async (string constructKey, ImplementationPersistenceService persistenceService, CancellationToken cancellationToken) => Results.Ok(await persistenceService.GetActionsForCfirAsync(Uri.UnescapeDataString(constructKey), cancellationToken)));
app.MapGet("/api/implementation/{cfirId:guid}/{ktaId:guid}", async (Guid cfirId, Guid ktaId, ImplementationPersistenceService persistenceService, CancellationToken cancellationToken) =>
{
    var snapshot = await persistenceService.GetAsync(cfirId, ktaId, cancellationToken);
    return snapshot is null ? Results.NotFound() : Results.Ok(snapshot);
});

app.MapPost("/api/implementation/export/{format}", (string format, ImplementationAssessment assessment, ImplementationValidationService validationService, ImplementationExportService exportService) =>
{
    var validation = validationService.ValidateImplementation(assessment.Cfir, assessment.Kta);
    if (!validation.IsValid) return Results.BadRequest(validation);
    return CreateExportResult(exportService.ExportJson(assessment), assessment.Cfir.Id, format);
});
app.MapPost("/api/amstar2/export/{format}", (string format, Amstar2Assessment assessment, Amstar2ValidationService validationService, AssessmentReportFactory reportFactory, AssessmentExportService exportService) =>
{
    var validation = validationService.Validate(assessment);
    if (!validation.IsValid) return Results.BadRequest(validation);
    try
    {
        var report = reportFactory.Create(assessment);
        var file = exportService.Create(report, format);
        return Results.File(file.Content, file.ContentType, $"amstar2-{assessment.Id}.{file.Extension}");
    }
    catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
    { return Results.BadRequest(new { error = exception.Message }); }
});
app.MapPost("/api/implementation/export/{format}/file", (string format, ImplementationAssessment assessment, ImplementationValidationService validationService, ImplementationExportService exportService) =>
{
    var validation = validationService.ValidateImplementation(assessment.Cfir, assessment.Kta);
    if (!validation.IsValid) return Results.BadRequest(validation);
    var file = format.ToLowerInvariant() switch
    {
        "json" => exportService.ExportJson(assessment), "csv" => exportService.ExportCsv(assessment), "xlsx" => exportService.ExportXlsx(assessment),
        "docx" => exportService.ExportDocx(assessment), "pdf" => exportService.ExportPdf(assessment),
        _ => throw new ArgumentException("Supported implementation export formats: json, csv, xlsx, docx, pdf.")
    };
    return Results.File(file.Content, file.ContentType, $"cfir-kta-{assessment.Cfir.Id}.{file.Extension}");
});

app.MapFallbackToFile("index.html");
app.Run();

static List<string> ValidateManualEvidence(ManualEvidenceRequest request)
{
    var errors = new List<string>();
    if (string.IsNullOrWhiteSpace(request.DocumentHashSha256)) errors.Add("Document hash is required.");
    if (string.IsNullOrWhiteSpace(request.Instrument)) errors.Add("Instrument is required.");
    if (string.IsNullOrWhiteSpace(request.ItemOrDomain)) errors.Add("Item/domain is required.");
    if (string.IsNullOrWhiteSpace(request.EvidenceText)) errors.Add("Evidence text is required.");
    if (string.IsNullOrWhiteSpace(request.SourceType)) errors.Add("Source type is required.");
    if (string.IsNullOrWhiteSpace(request.Reviewer)) errors.Add("Reviewer is required.");
    if (string.IsNullOrWhiteSpace(request.Rationale)) errors.Add("Rationale is required.");
    return errors;
}

static EvidenceRecordDto ToEvidenceDto(EvidenceRecordEntity entity) => new(
    entity.Id, entity.DocumentHashSha256, entity.Instrument, entity.ItemOrDomain, entity.EvidenceText, entity.SourceType,
    entity.Page, entity.Section, entity.Table, entity.Figure, entity.Url, entity.Doi, entity.Reviewer, entity.Rationale,
    entity.Status, entity.VerificationNote, entity.VerifiedBy, entity.VerifiedAtUtc, entity.CreatedAtUtc);

static IResult CreateExportResult(ExportFile jsonFile, Guid id, string format)
{
    if (!string.Equals(format, "json", StringComparison.OrdinalIgnoreCase)) return Results.BadRequest(new { error = "Use /api/implementation/export/{format}/file for json, csv, xlsx, docx or pdf file downloads." });
    return Results.File(jsonFile.Content, jsonFile.ContentType, $"cfir-kta-{id}.json");
}

public partial class Program { }
