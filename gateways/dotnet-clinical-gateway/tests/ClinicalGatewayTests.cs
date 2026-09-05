using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ClinicalGateway.Tests;

public sealed class ClinicalGatewayTests : IClassFixture<Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ClinicalGatewayTests(Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_endpoint_is_available()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Evidence_package_is_hashed()
    {
        var response = await _client.PostAsJsonAsync(
            "/evidence/sign",
            new { projectId = "demo", evidence = new { id = "e1" } });

        response.EnsureSuccessStatusCode();
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("SHA-256", body.RootElement.GetProperty("algorithm").GetString());
        Assert.Equal(64, body.RootElement.GetProperty("digest").GetString()?.Length);
    }
}
