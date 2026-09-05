using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
var builder=WebApplication.CreateBuilder(args);
var app=builder.Build();
app.MapGet("/health",()=>Results.Ok(new{status="ok",service="dotnet-clinical-gateway"}));
app.MapPost("/evidence/sign",(EvidencePackage package)=>{var canonical=JsonSerializer.Serialize(package);var hash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();return Results.Ok(new{algorithm="SHA-256",digest=hash,signedAt=DateTimeOffset.UtcNow,package});});
app.MapPost("/fhir/process",(JsonElement resource)=>Results.Ok(new{resourceType=resource.TryGetProperty("resourceType",out var t)?t.GetString():null,processedAt=DateTimeOffset.UtcNow}));
app.Run();
public record EvidencePackage(string ProjectId,object Evidence);
public partial class Program { }
