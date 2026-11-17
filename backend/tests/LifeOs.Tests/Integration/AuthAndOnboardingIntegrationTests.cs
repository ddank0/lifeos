using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Dashboard.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class AuthAndOnboardingIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthAndOnboardingIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsIntegrationTests_{Guid.NewGuid()}";
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
    public async Task Register_ShouldCreateUser_ProvisionFiveDefaultAreas_AndReturnDashboardSummary()
    {
        var registerReq = new RegisterRequest(
            "Gabriel Miranda",
            $"gabriel.{Guid.NewGuid():N}@lifeos.dev",
            "Password123!");

        var registerRes = await _client.PostAsJsonAsync("/api/v1/auth/register", registerReq);
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var authPayload = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        authPayload.Should().NotBeNull();
        authPayload!.AccessToken.Should().NotBeNullOrWhiteSpace();
        authPayload.User.FullName.Should().Be("Gabriel Miranda");

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authPayload.AccessToken);

        var areasRes = await _client.GetAsync("/api/v1/areas");
        areasRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var areas = await areasRes.Content.ReadFromJsonAsync<List<AreaDto>>();
        areas.Should().NotBeNull();
        var areaList = areas!;
        areaList.Should().HaveCount(5);
        areaList.Select(a => a.Name).Should().Contain(new[]
        {
            "Trabalho", "Estudo", "Rotina", "Doméstico", "Social"
        });

        var summaryRes = await _client.GetAsync("/api/v1/dashboard/summary");
        summaryRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var summary = await summaryRes.Content.ReadFromJsonAsync<DashboardSummaryDto>();
        summary.Should().NotBeNull();
        summary!.TodayTasks.Should().NotBeEmpty();
        summary.DailyHabitBars.Should().HaveCount(7);
    }

    [Fact]
    public async Task Me_WithoutToken_ShouldReturnUnauthorized()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DemoUser_ShouldBeSeeded_AndProtectedAgainstProfileChangesAndDefaultAreaDeletion()
    {
        var loginReq = new LoginRequest("demo@lifeos.dev", "LifeOs@2026");
        var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        loginRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var authPayload = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
        authPayload.Should().NotBeNull();
        authPayload!.User.FullName.Should().Be("Demo Account");
        authPayload.User.Email.Should().Be("demo@lifeos.dev");
        authPayload.User.IsDemo.Should().BeTrue();

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authPayload.AccessToken);

        // Verifica que o endpoint me também retorna IsDemo = true
        var meRes = await _client.GetAsync("/api/v1/auth/me");
        meRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var meProfile = await meRes.Content.ReadFromJsonAsync<UserProfileDto>();
        meProfile.Should().NotBeNull();
        meProfile!.IsDemo.Should().BeTrue();

        // Tentar alterar o nome para um nome malicioso / invasor
        var updateProfileReq = new LifeOs.Application.Settings.DTOs.UpdateProfileSettingsRequest("Hacked Name", "light");
        var updateRes = await _client.PutAsJsonAsync("/api/v1/settings/profile", updateProfileReq);
        updateRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // O nome deve permanecer protegido como "Demo Account"
        var meAfterUpdate = await (await _client.GetAsync("/api/v1/auth/me")).Content.ReadFromJsonAsync<UserProfileDto>();
        meAfterUpdate!.FullName.Should().Be("Demo Account");
        meAfterUpdate.ThemePreference.Should().Be("light");

        // Tentar excluir uma área default na conta demo deve ser bloqueado
        var areas = await (await _client.GetAsync("/api/v1/areas")).Content.ReadFromJsonAsync<List<AreaDto>>();
        areas.Should().NotBeNull();
        var defaultArea = areas!.First(a => a.IsDefault);

        var deleteRes = await _client.DeleteAsync($"/api/v1/areas/{defaultArea.Id}");
        deleteRes.StatusCode.Should().Be(HttpStatusCode.NotFound); // DeleteAsync retorna false -> NotFound
    }
}
