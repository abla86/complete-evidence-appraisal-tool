using System.Text.Json.Serialization;
using EvidenceAppraisal.Api.Data;
using EvidenceAppraisal.Api.Models;
using EvidenceAppraisal.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<Amstar2ValidationService>();
builder.Services.AddSingleton<Amstar2RatingService>();
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
builder.Services.AddSingleton<BibliographyImportService>();
builder.Services.AddSingleton<ResearchWorkflowService>();
builder.Services.AddSingleton<ResearchWorkflowExtendedService>();
builder.Services.AddSingleton<Rob2ValidationService>();

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

app.MapGet("/api", () => Results.Ok(new { application = "Evidence Appraisal Tool API", status = "Research tool / prototype", modules = new[] { "AMSTAR 2", "CASP", "AGREE II", "GRADE", "RoB 2 prototype", "CFIR 2.0", "KTA", "Research Document Analysis", "Multi-format Bibliography Import", "PRISMA workflow", "Inter-rater reliability", "Deduplication", "Conflict resolution" }, methodologicalNotice = "Document analysis locates candidate evidence passages but does not complete appraisals or replace methodological expertise.", safetyRule = "Not found is never equivalent to No. Uncertain findings require researcher verification.", securityNotice = "Do not store identifiable patient information or other confidential research data in this public deployment. Uploaded research documents are processed in memory by the analysis endpoint; only explicitly submitted manual evidence is persisted." }));
app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }));

app.MapGet("/api/instruments", () => Results.Ok(new object[]
{
    new { id = "amstar2", name = "AMSTAR 2", purpose = "Critical appraisal of systematic reviews of healthcare interventions", status = "Available", itemCount = 16, scoring = "No numerical total score" },
    new { id = "casp", name = "CASP", purpose = "Design-specific critical appraisal using an authorised CASP checklist", status = "Available", itemCount = (int?)null, scoring = "No automatic quality total" },
    new { id = "agree2", name = "AGREE II", purpose = "Appraisal of clinical practice guidelines", status = "Available", itemCount = 23, scoring = "Six standardised domain scores; no single required aggregate score" },
    new { id = "grade", name = "GRADE", purpose = "Outcome-level certainty of a body of evidence", status = "Available", itemCount = 5, scoring = "Four certainty categories with explicit domain judgements; upgrading criteria are conditional" },
    new { id = "cfir2", name = "CFIR 2.0", purpose = "Implementation determinant assessment", status = "Available", itemCount = 48, scoring = "Researcher judgement; no automatic barrier/facilitator total" },
    new { id = "kta", name = "Knowledge-to-Action", purpose = "Documentation of the seven-step action cycle", status = "Available", itemCount = 7, scoring = "No validated implementation-progress percentage" },
    new { id = "rob2", name = "Cochrane RoB 2", purpose = "Risk-of-bias assessment for randomised trials", status = "Prototype", itemCount = 5, scoring = "Researcher judgement required; signalling-question algorithm not reproduced" }
}));

app.MapGet("/api/research/methodologies", () => Results.Ok(new object[]
{
    new { id = "SystematicReview", name = "Systematic review", recommendedModules = new[] { "Bibliography import", "Deduplication", "Screening", "PRISMA", "Critical appraisal", "Extraction", "GRADE" } },
    new { id = "MetaAnalysis", name = "Meta-analysis", recommendedModules = new[] { "Bibliography import", "Deduplication", "Screening", "Extraction", "Inter-rater", "GRADE", "Effect data export" } },
    new { id = "QualitativeSynthesis", name = "Qualitative synthesis", recommendedModules = new[] { "Bibliography import", "Screening", "Extraction", "Critical appraisal", "Synthesis" } },
    new { id = "ScopingReview", name = "Scoping review", recommendedModules = new[] { "Bibliography import", "Deduplication", "Screening", "Extraction", "PRISMA" } },
    new { id = "GuidelineDevelopment", name = "Guideline development", recommendedModules = new[] { "Evidence appraisal", "AGREE II", "GRADE", "Consensus" } }
}));

app.MapGet("/api/amstar2/metadata", () => Results.Ok(new { instrumentName = "AMSTAR 2", instrumentVersion = "2017", totalItems = Amstar2ValidationService.TotalItems, proposedDefaultCriticalDomains = new[] { 2, 4, 7, 9, 11, 13, 15 }, criticalDomainNotice = "The seven domains are proposed defaults from the original publication. Critical domains must be prespecified and justified for the appraisal context.", scoringNotice = "AMSTAR 2 item responses must not be combined into a numerical total score.", currentCapabilities = new[] { "Typed assessment submission", "Structural validation", "Required rationale validation", "Required evidence-location validation", "Critical-domain prespecification validation", "Advisory confidence consistency check", "DOCX/XLSX/PDF export" }, unavailableCapabilities = new[] { "Automatic professional judgement", "Clinical or policy recommendation" }));
app.MapGet("/api/cfir2/metadata", (ImplementationValidationService service) => Results.Ok(new { framework = "CFIR 2.0", frameworkVersion = "Updated 2022 framework", constructCount = 48, subconstructCount = 19, domains = Enum.GetNames<CfirDomain>(), constructs = service.GetCfirConstructs(), officialGuide = "https://cfirguide.org/constructs", methodologicalNotice = "CFIR 2.0 must be fully operationalized for the specific project." }));
app.MapGet("/api/kta/metadata", (ImplementationValidationService service) => Results.Ok(new { framework = "Knowledge-to-Action Framework", frameworkVersion = "Graham et al., 2006", phases = service.GetKtaPhases(), methodologicalNotice = "The KTA action cycle is iterative and bidirectional." }));

app.MapPost("/api/amstar2/validate", (Amstar2Assessment assessment, Amstar2ValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/amstar2/rating", (Amstar2Assessment assessment, Amstar2ValidationService validationService, Amstar2RatingService ratingService) =>
{
    var validation = validationService.Validate(assessment);
    if (!validation.IsValid) return Results.BadRequest(validation);
    return Results.Ok(ratingService.Calculate(assessment));
});
app.MapPost("/api/amstar2/export/{format}", (string format, Amstar2Assessment assessment, Amstar2ValidationService validationService, AssessmentReportFactory reportFactory, AssessmentExportService exportService) =>
{
    var validation = validationService.Validate(assessment);
    if (!validation.IsValid) return Results.BadRequest(validation);

    try
    {
        var report = reportFactory.Create(assessment);
        var exported = exportService.Create(report, format);
        return Results.File(exported.Content, exported.ContentType, $"amstar2-assessment.{exported.Extension}");
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});
app.MapPost("/api/casp/validate", (CaspAssessment assessment, CaspValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/agree2/calculate", (Agree2Assessment assessment, Agree2ScoringService service) => Results.Ok(service.Calculate(assessment)));
app.MapPost("/api/grade/evaluate", (GradeOutcomeAssessment assessment, GradeCertaintyService service) => Results.Ok(service.Evaluate(assessment)));
app.MapPost("/api/cfir2/validate", (CfirAssessment assessment, ImplementationValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/kta/validate", (KtaAssessment assessment, ImplementationValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/implementation/validate", (ImplementationAssessment assessment, ImplementationValidationService service) => Results.Ok(service.ValidateImplementation(assessment.Cfir, assessment.Kta)));
app.MapPost("/api/rob2/validate", (Rob2Assessment assessment, Rob2ValidationService service) => Results.Ok(service.Validate(assessment)));
app.MapPost("/api/research/prisma/validate", (PrismaFlowInput input, ResearchWorkflowService service) => Results.Ok(service.ValidatePrisma(input)));
app.MapPost("/api/research/kappa", (KappaInput input, ResearchWorkflowService service) => Results.Ok(service.CalculateKappa(input)));
app.MapPost("/api/research/deduplicate", (IReadOnlyList<StudyMetadata> studies, ResearchWorkflowExtendedService service) => Results.Ok(new { candidates = service.FindDuplicates(studies) }));
app.MapPost("/api/research/conflicts", (IReadOnlyList<ReviewerConflict> comparisons, ResearchWorkflowExtendedService service) => Results.Ok(new { conflicts = service.FindConflicts(comparisons), total = comparisons.Count }));
app.MapPost("/api/research/finalize", (System.Text.Json.JsonElement payload, ResearchWorkflowExtendedService service) => { var projectId = payload.TryGetProperty("projectId", out var id) ? id.GetString() : null; if (string.IsNullOrWhiteSpace(projectId)) return Results.BadRequest(new { error = "projectId is required." }); return Results.Ok(service.CreateCompletionPackage(projectId, payload)); });

app.MapPost("/api/evidence/analyze", async (HttpRequest request, DocumentAnalysisService service, CancellationToken cancellationToken) => { if (!request.HasFormContentType) return Results.BadRequest(new { error = "multipart/form-data is required." }); var form = await request.ReadFormAsync(cancellationToken); var file = form.Files.GetFile("file"); if (file is null) return Results.BadRequest(new { error = "Upload a supported research document using the 'file' field." }); var instruments = form["instruments"].SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)).ToArray(); var includeSourceText = string.Equals(form["includePageText"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase); try { return Results.Ok(await service.AnalyzeAsync(file, instruments, includeSourceText, cancellationToken)); } catch (ArgumentException exception) { return Results.BadRequest(new { error = exception.Message }); } });
app.MapPost("/api/evidence/pdf/analyze", async (HttpRequest request, DocumentAnalysisService service, CancellationToken cancellationToken) => { if (!request.HasFormContentType) return Results.BadRequest(new { error = "multipart/form-data is required." }); var form = await request.ReadFormAsync(cancellationToken); var file = form.Files.GetFile("file"); if (file is null) return Results.BadRequest(new { error = "Upload a supported research document using the 'file' field." }); var instruments = form["instruments"].SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)).ToArray(); var includeSourceText = string.Equals(form["includePageText"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase); try { return Results.Ok(await service.AnalyzeAsync(file, instruments, includeSourceText, cancellationToken)); } catch (ArgumentException exception) { return Results.BadRequest(new { error = exception.Message }); } });
app.MapRisImportEndpoints();
app.MapBibliographyImportEndpoints();

app.MapGet("/api/evidence/manual/{documentHash}", async (string documentHash, EvidenceDbContext db, CancellationToken cancellationToken) => { if (string.IsNullOrWhiteSpace(documentHash)) return Results.BadRequest(new { error = "Document hash is required." }); var records = await db.EvidenceRecords.AsNoTracking().Where(x => x.DocumentHashSha256 == documentHash.ToLowerInvariant()).OrderBy(x => x.CreatedAtUtc).ToListAsync(cancellationToken); return Results.Ok(records.Select(ToEvidenceDto)); });
app.MapPost("/api/evidence/manual", async (ManualEvidenceRequest request, EvidenceDbContext db, CancellationToken cancellationToken) => { var errors = ValidateManualEvidence(request); if (errors.Count > 0) return Results.BadRequest(new { error = "Manual evidence is incomplete.", details = errors }); if (!request.DocumentHashSha256.All(Uri.IsHexDigit) || request.DocumentHashSha256.Length != 64) return Results.BadRequest(new { error = "DocumentHashSha256 must be a 64-character SHA-256 hexadecimal hash." }); var entity = new EvidenceRecordEntity { DocumentHashSha256 = request.DocumentHashSha256.ToLowerInvariant(), Instrument = request.Instrument.Trim(), ItemOrDomain = request.ItemOrDomain.Trim(), EvidenceText = request.EvidenceText.Trim(), SourceType = request.SourceType.Trim(), Page = request.Page?.Trim(), Section = request.Section?.Trim(), Table = request.Table?.Trim(), Figure = request.Figure?.Trim(), Url = request.Url?.Trim(), Doi = request.Doi?.Trim(), Reviewer = request.Reviewer.Trim(), Rationale = request.Rationale.Trim(), Status = "Manually added", CreatedAtUtc = DateTime.UtcNow }; db.EvidenceRecords.Add(entity); await db.SaveChangesAsync(cancellationToken); return Results.Created($"/api/evidence/manual/{entity.DocumentHashSha256}", ToEvidenceDto(entity)); });

app.MapEvidenceVerificationEndpoints();

app.Run();

static object ToEvidenceDto(EvidenceRecordEntity entity) => new { entity.Id, entity.DocumentHashSha256, entity.Instrument, entity.ItemOrDomain, entity.EvidenceText, entity.SourceType, entity.Page, entity.Section, entity.Table, entity.Figure, entity.Url, entity.Doi, entity.Reviewer, entity.Rationale, entity.Status, entity.VerificationNote, entity.VerifiedBy, entity.VerifiedAtUtc, entity.CreatedAtUtc };

static List<string> ValidateManualEvidence(ManualEvidenceRequest request)
{
    var errors = new List<string>();
    if (string.IsNullOrWhiteSpace(request.DocumentHashSha256)) errors.Add("DocumentHashSha256 is required.");
    if (string.IsNullOrWhiteSpace(request.Instrument)) errors.Add("Instrument is required.");
    if (string.IsNullOrWhiteSpace(request.ItemOrDomain)) errors.Add("ItemOrDomain is required.");
    if (string.IsNullOrWhiteSpace(request.EvidenceText)) errors.Add("EvidenceText is required.");
    if (string.IsNullOrWhiteSpace(request.SourceType)) errors.Add("SourceType is required.");
    if (string.IsNullOrWhiteSpace(request.Reviewer)) errors.Add("Reviewer is required.");
    if (string.IsNullOrWhiteSpace(request.Rationale)) errors.Add("Rationale is required.");
    return errors;
}

public sealed record ManualEvidenceRequest(string DocumentHashSha256, string Instrument, string ItemOrDomain, string EvidenceText, string SourceType, string? Page, string? Section, string? Table, string? Figure, string? Url, string? Doi, string Reviewer, string Rationale);