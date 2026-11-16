using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.LifeTracker.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class LifeTrackerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public LifeTrackerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsTrackerTests_{Guid.NewGuid()}";
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("UseInMemoryDatabase", "true");
            builder.UseSetting("InMemoryDatabaseName", dbName);
            builder.UseSetting("Jwt:Secret", "LifeOsSuperSecretJwtSigningKey2026WithAtLeast32Bytes!");
            builder.UseSetting("Jwt:Issuer", "LifeOs.Api");
            builder.UseSetting("Jwt:Audience", "LifeOs.Client");
        }).CreateClient();
    }

    [Fact]
    public async Task LifeTracker_ShouldCreateMetric_AdjustValue_CalculateSevenDayAverage_AndFilterByArea()
    {
        var registerRes = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest("Gabriel Tracker", $"tracker.{Guid.NewGuid():N}@lifeos.dev", "Password123!"));
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var areas = await _client.GetFromJsonAsync<List<AreaDto>>("/api/v1/areas");
        var studyArea = areas!.First(a => a.Slug == "estudo");

        var createRes = await _client.PostAsJsonAsync(
            "/api/v1/life-tracker",
            new SaveLifeMetricRequest(
                "Horas de Código",
                "Desenvolvimento e projetos pessoais",
                studyArea.Id,
                "h",
                4.0m,
                0.5m,
                "code"));
        createRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var metric = await createRes.Content.ReadFromJsonAsync<LifeMetricDetailDto>();
        metric.Should().NotBeNull();
        metric!.DailyTarget.Should().Be(4.0m);
        metric.TodayValue.Should().Be(0m);
        metric.ProgressPercent.Should().Be(0);

        var adjustRes = await _client.PostAsJsonAsync(
            $"/api/v1/life-tracker/{metric.Id}/adjust",
            new AdjustMetricValueRequest(2.5m));
        adjustRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await adjustRes.Content.ReadFromJsonAsync<LifeMetricDetailDto>();
        updated.Should().NotBeNull();
        updated!.TodayValue.Should().Be(2.5m);
        updated.ProgressPercent.Should().Be(62);

        var adjustAgainRes = await _client.PostAsJsonAsync(
            $"/api/v1/life-tracker/{metric.Id}/adjust",
            new AdjustMetricValueRequest(1.5m));
        adjustAgainRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var finalMetric = await adjustAgainRes.Content.ReadFromJsonAsync<LifeMetricDetailDto>();
        finalMetric!.TodayValue.Should().Be(4.0m);
        finalMetric.ProgressPercent.Should().Be(100);
        finalMetric.IsTargetReached.Should().BeTrue();
        finalMetric.SevenDayAverage.Should().BeGreaterThan(0m);

        var filteredList = await _client.GetFromJsonAsync<List<LifeMetricDetailDto>>("/api/v1/life-tracker?areaSlug=estudo");
        filteredList!.Should().ContainSingle(m => m.Id == metric.Id);
    }
}
