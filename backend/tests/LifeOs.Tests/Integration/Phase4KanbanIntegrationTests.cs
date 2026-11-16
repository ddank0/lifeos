using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Kanban.DTOs;
using LifeOs.Application.Tasks.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class Phase4KanbanIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public Phase4KanbanIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsPhase4Tests_{Guid.NewGuid()}";
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
    public async Task KanbanBoard_ShouldGroupFourColumns_IdentifyOverdue_Filter_AndPersistCardDragAndDrop()
    {
        var registerRes = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest("Gabriel Fase 4", $"fase4.{Guid.NewGuid():N}@lifeos.dev", "Password123!"));
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var areas = await _client.GetFromJsonAsync<List<AreaDto>>("/api/v1/areas");
        var workArea = areas!.First(a => a.Slug == "trabalho");

        var labelRes = await _client.PostAsJsonAsync(
            "/api/v1/labels",
            new SaveLabelRequest("Backend .NET", "#a9ccf0"));
        var label = await labelRes.Content.ReadFromJsonAsync<LabelDto>();

        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)).ToString("yyyy-MM-dd");
        var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)).ToString("yyyy-MM-dd");

        var card1Res = await _client.PostAsJsonAsync(
            "/api/v1/tasks",
            new SaveTaskRequest(
                "Refatorar endpoint de relatórios",
                "Extrair consultas complexas para serviço",
                workArea.Id,
                null,
                "Urgent",
                "Todo",
                yesterday,
                yesterday,
                "18:00",
                new List<Guid> { label!.Id }));
        var card1 = await card1Res.Content.ReadFromJsonAsync<TaskDetailDto>();

        var card2Res = await _client.PostAsJsonAsync(
            "/api/v1/tasks",
            new SaveTaskRequest(
                "Configurar pipeline GitHub Actions",
                "Build e testes automatizados",
                workArea.Id,
                null,
                "High",
                "OnHold",
                tomorrow,
                tomorrow,
                "12:00",
                null));
        var card2 = await card2Res.Content.ReadFromJsonAsync<TaskDetailDto>();

        var board = await _client.GetFromJsonAsync<KanbanBoardDto>("/api/v1/kanban?areaSlug=trabalho");
        board.Should().NotBeNull();
        board!.Columns.Should().HaveCount(4);
        board.Columns.Select(c => c.Status).Should().ContainInOrder("Todo", "InProgress", "OnHold", "Done");
        board.OverdueCount.Should().BeGreaterThanOrEqualTo(1);

        var todoCol = board.Columns.First(c => c.Status == "Todo");
        todoCol.Cards.Should().Contain(c => c.Id == card1!.Id && c.IsOverdue);

        var onHoldCol = board.Columns.First(c => c.Status == "OnHold");
        onHoldCol.Cards.Should().Contain(c => c.Id == card2!.Id && !c.IsOverdue);

        var moveRes = await _client.PatchAsJsonAsync(
            $"/api/v1/kanban/cards/{card1!.Id}/move",
            new MoveKanbanCardRequest("InProgress", 0));
        moveRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var moveDoneRes = await _client.PatchAsJsonAsync(
            $"/api/v1/kanban/cards/{card2!.Id}/move",
            new MoveKanbanCardRequest("Done", 0));
        moveDoneRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedBoard = await _client.GetFromJsonAsync<KanbanBoardDto>("/api/v1/kanban?areaSlug=trabalho");
        var inProgressCol = updatedBoard!.Columns.First(c => c.Status == "InProgress");
        inProgressCol.Cards.Should().ContainSingle(c => c.Id == card1.Id);

        var doneCol = updatedBoard.Columns.First(c => c.Status == "Done");
        doneCol.Cards.Should().Contain(c => c.Id == card2.Id && c.IsCompleted);
    }
}
