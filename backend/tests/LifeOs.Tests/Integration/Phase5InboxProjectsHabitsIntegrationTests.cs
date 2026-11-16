using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Habits.DTOs;
using LifeOs.Application.Inbox.DTOs;
using LifeOs.Application.Projects.DTOs;
using LifeOs.Application.Tasks.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class Phase5InboxProjectsHabitsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public Phase5InboxProjectsHabitsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsPhase5Tests_{Guid.NewGuid()}";
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
    public async Task Inbox_Projects_And_Habits_ShouldSupportConversion_ProgressCalculation_AndStreakTracking()
    {
        var registerRes = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest("Gabriel Fase 5", $"fase5.{Guid.NewGuid():N}@lifeos.dev", "Password123!"));
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var areas = await _client.GetFromJsonAsync<List<AreaDto>>("/api/v1/areas");
        var studyArea = areas!.First(a => a.Slug == "estudo");
        var routineArea = areas!.First(a => a.Slug == "rotina");

        var createNoteRes = await _client.PostAsJsonAsync(
            "/api/v1/inbox",
            new SaveQuickNoteRequest(
                "Revisar capítulo de Clean Architecture para o TCC",
                studyArea.Id,
                "Task",
                "High",
                DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd")));
        createNoteRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdNote = await createNoteRes.Content.ReadFromJsonAsync<QuickNoteDto>();
        createdNote.Should().NotBeNull();
        createdNote!.IsProcessed.Should().BeFalse();

        var inboxBefore = await _client.GetFromJsonAsync<List<QuickNoteDto>>("/api/v1/inbox");
        inboxBefore!.Should().ContainSingle(n => n.Id == createdNote.Id);

        var convertRes = await _client.PostAsJsonAsync(
            $"/api/v1/inbox/{createdNote.Id}/convert",
            new ConvertQuickNoteRequest(
                "Task",
                studyArea.Id,
                "High",
                DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
                "19:00"));
        convertRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var inboxAfter = await _client.GetFromJsonAsync<List<QuickNoteDto>>("/api/v1/inbox");
        inboxAfter!.Should().NotContain(n => n.Id == createdNote.Id);

        var createProjectRes = await _client.PostAsJsonAsync(
            "/api/v1/projects",
            new SaveProjectRequest(
                "Desenvolvimento do Sistema LIFEOS",
                "Arquitetura em camadas com .NET 8 e Angular 19",
                studyArea.Id,
                "2026-11-01",
                "2026-12-15",
                "Active",
                "Urgent"));
        createProjectRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var project = await createProjectRes.Content.ReadFromJsonAsync<ProjectDetailDto>();
        project.Should().NotBeNull();

        await _client.PostAsJsonAsync(
            "/api/v1/tasks",
            new SaveTaskRequest(
                "Modelar banco PostgreSQL",
                null,
                studyArea.Id,
                project!.Id,
                "High",
                "Done",
                "2026-11-02",
                "2026-11-05",
                null));

        await _client.PostAsJsonAsync(
            "/api/v1/tasks",
            new SaveTaskRequest(
                "Implementar tela de Projetos",
                null,
                studyArea.Id,
                project.Id,
                "High",
                "InProgress",
                "2026-11-05",
                "2026-11-10",
                null));

        var projectsList = await _client.GetFromJsonAsync<List<ProjectDetailDto>>("/api/v1/projects");
        var loadedProject = projectsList!.First(p => p.Id == project.Id);
        loadedProject.TotalTasksCount.Should().Be(2);
        loadedProject.CompletedTasksCount.Should().Be(1);
        loadedProject.ProgressPercent.Should().Be(50);

        var createHabitRes = await _client.PostAsJsonAsync(
            "/api/v1/habits",
            new SaveHabitRequest(
                "Leitura Técnica (30 min)",
                "Livros de arquitetura e engenharia de software",
                routineArea.Id,
                "Daily",
                7));
        createHabitRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var habit = await createHabitRes.Content.ReadFromJsonAsync<HabitDetailDto>();
        habit.Should().NotBeNull();

        var yesterdayStr = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)).ToString("yyyy-MM-dd");
        var todayStr = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");

        await _client.PostAsJsonAsync(
            $"/api/v1/habits/{habit!.Id}/toggle",
            new ToggleHabitCompletionRequest(yesterdayStr));

        var toggleTodayRes = await _client.PostAsJsonAsync(
            $"/api/v1/habits/{habit.Id}/toggle",
            new ToggleHabitCompletionRequest(todayStr));
        toggleTodayRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedHabit = await toggleTodayRes.Content.ReadFromJsonAsync<HabitDetailDto>();
        updatedHabit.Should().NotBeNull();
        updatedHabit!.CurrentStreak.Should().Be(2);
        updatedHabit.BestStreak.Should().Be(2);
        updatedHabit.CompletedToday.Should().BeTrue();
    }
}
