using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Notifications.DTOs;
using LifeOs.Application.Settings.DTOs;
using LifeOs.Application.Tasks.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class Phase6NotificationsAndSettingsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public Phase6NotificationsAndSettingsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsPhase6Tests_{Guid.NewGuid()}";
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
    public async Task Reminders_Notifications_And_SettingsProductivityOverview_ShouldWorkEndToEnd()
    {
        var registerRes = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest("Gabriel Fase 6", $"fase6.{Guid.NewGuid():N}@lifeos.dev", "Password123!"));
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var areas = await _client.GetFromJsonAsync<List<AreaDto>>("/api/v1/areas");
        var workArea = areas!.First(a => a.Slug == "trabalho");

        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var createTaskRes = await _client.PostAsJsonAsync(
            "/api/v1/tasks",
            new SaveTaskRequest(
                "Apresentar arquitetura LIFEOS",
                "Slides e demonstração ao vivo",
                workArea.Id,
                null,
                "Urgent",
                "Done",
                today,
                today,
                "16:00"));
        var task = await createTaskRes.Content.ReadFromJsonAsync<TaskDetailDto>();

        var createReminderRes = await _client.PostAsJsonAsync(
            "/api/v1/notifications/reminders",
            new CreateReminderRequest(
                task!.Id,
                null,
                DateTimeOffset.UtcNow.AddMinutes(-5)));
        createReminderRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var processRes = await _client.PostAsync("/api/v1/notifications/process-due", null);
        processRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var feed = await _client.GetFromJsonAsync<NotificationCenterDto>("/api/v1/notifications");
        feed.Should().NotBeNull();
        feed!.UnreadCount.Should().BeGreaterThanOrEqualTo(1);
        feed.Notifications.Should().Contain(n => n.Title.Contains("Apresentar arquitetura LIFEOS"));

        var targetNotification = feed.Notifications.First();
        var readRes = await _client.PatchAsync($"/api/v1/notifications/{targetNotification.Id}/read", null);
        readRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updateProfileRes = await _client.PutAsJsonAsync(
            "/api/v1/settings/profile",
            new UpdateProfileSettingsRequest("Gabriel Miranda Sênior", "light"));
        updateProfileRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var overview = await _client.GetFromJsonAsync<SettingsOverviewDto>("/api/v1/settings/overview");
        overview.Should().NotBeNull();
        overview!.FullName.Should().Be("Gabriel Miranda Sênior");
        overview.ThemePreference.Should().Be("light");
        overview.Productivity.CompletedTasksCount.Should().BeGreaterThanOrEqualTo(1);
        overview.Productivity.AreaBreakdown.Should().NotBeEmpty();
    }
}
