using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Events.DTOs;
using LifeOs.Application.Tasks.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class Phase2CoreOrganizationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public Phase2CoreOrganizationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsPhase2Tests_{Guid.NewGuid()}";
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
    public async Task FullCrudFlow_Areas_Labels_Tasks_And_Events_ShouldPersistAndFilterCorrectly()
    {
        var registerRes = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest("Gabriel Fase 2", $"fase2.{Guid.NewGuid():N}@lifeos.dev", "Password123!"));
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var createAreaReq = new SaveAreaRequest(
            "Finanças",
            "Controle de investimentos, orçamento e metas",
            "#8bd3c7",
            "wallet");
        var createAreaRes = await _client.PostAsJsonAsync("/api/v1/areas", createAreaReq);
        createAreaRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdArea = await createAreaRes.Content.ReadFromJsonAsync<AreaDto>();
        createdArea.Should().NotBeNull();
        createdArea!.Name.Should().Be("Finanças");
        createdArea.Slug.Should().Be("financas");

        var updateAreaRes = await _client.PutAsJsonAsync(
            $"/api/v1/areas/{createdArea.Id}",
            new SaveAreaRequest("Finanças & Patrimônio", "Gestão patrimonial", "#e59882", "trending-up"));
        updateAreaRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedArea = await updateAreaRes.Content.ReadFromJsonAsync<AreaDto>();
        updatedArea!.Name.Should().Be("Finanças & Patrimônio");

        var createLabelRes = await _client.PostAsJsonAsync(
            "/api/v1/labels",
            new SaveLabelRequest("Alta Relevância", "#e59882"));
        createLabelRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdLabel = await createLabelRes.Content.ReadFromJsonAsync<LabelDto>();
        createdLabel.Should().NotBeNull();

        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var createTaskReq = new SaveTaskRequest(
            "Rebalancear carteira de FIIs e ETFs",
            "Conferir alocação alvo do mês",
            createdArea.Id,
            null,
            "Urgent",
            "InProgress",
            today,
            today,
            "15:30",
            new List<Guid> { createdLabel!.Id });

        var createTaskRes = await _client.PostAsJsonAsync("/api/v1/tasks", createTaskReq);
        createTaskRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdTask = await createTaskRes.Content.ReadFromJsonAsync<TaskDetailDto>();
        createdTask.Should().NotBeNull();
        createdTask!.Title.Should().Be("Rebalancear carteira de FIIs e ETFs");
        createdTask.Priority.Should().Be("Urgent");
        createdTask.Status.Should().Be("InProgress");
        createdTask.Labels.Should().ContainSingle(l => l.Name == "Alta Relevância");

        var filteredTasksRes = await _client.GetAsync(
            $"/api/v1/tasks?areaId={createdArea.Id}&priority=Urgent&status=InProgress&search=carteira");
        filteredTasksRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var filteredTasks = await filteredTasksRes.Content.ReadFromJsonAsync<List<TaskDetailDto>>();
        filteredTasks.Should().NotBeNull();
        filteredTasks!.Should().ContainSingle(t => t.Id == createdTask.Id);

        var updateTaskRes = await _client.PutAsJsonAsync(
            $"/api/v1/tasks/{createdTask.Id}",
            createTaskReq with { Title = "Rebalancear carteira concluído", Status = "Done" });
        updateTaskRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedTask = await updateTaskRes.Content.ReadFromJsonAsync<TaskDetailDto>();
        updatedTask!.IsCompleted.Should().BeTrue();

        var startAt = DateTimeOffset.UtcNow.AddHours(2);
        var endAt = startAt.AddHours(1);
        var createEventReq = new SaveEventRequest(
            "Reunião com assessor financeiro",
            "Revisão semestral",
            createdArea.Id,
            "Google Meet",
            startAt,
            endAt,
            false,
            true,
            new List<string> { "Conferir taxas", "Analisar Tesouro IPCA+" });

        var createEventRes = await _client.PostAsJsonAsync("/api/v1/events", createEventReq);
        createEventRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdEvent = await createEventRes.Content.ReadFromJsonAsync<EventDetailDto>();
        createdEvent.Should().NotBeNull();
        createdEvent!.SubItems.Should().HaveCount(2);

        var eventsByAreaRes = await _client.GetAsync($"/api/v1/events?areaId={createdArea.Id}");
        eventsByAreaRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var eventsByArea = await eventsByAreaRes.Content.ReadFromJsonAsync<List<EventDetailDto>>();
        eventsByArea!.Should().ContainSingle(e => e.Id == createdEvent.Id);

        var delTaskRes = await _client.DeleteAsync($"/api/v1/tasks/{createdTask.Id}");
        delTaskRes.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var delEventRes = await _client.DeleteAsync($"/api/v1/events/{createdEvent.Id}");
        delEventRes.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
