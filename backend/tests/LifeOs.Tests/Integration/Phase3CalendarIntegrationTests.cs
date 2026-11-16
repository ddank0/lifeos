using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Calendar.DTOs;
using LifeOs.Application.Events.DTOs;
using LifeOs.Application.Tasks.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeOs.Tests.Integration;

public class Phase3CalendarIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public Phase3CalendarIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var dbName = $"LifeOsPhase3Tests_{Guid.NewGuid()}";
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
    public async Task UnifiedCalendar_ShouldReturnEventsAndTasks_ExpandRecurrence_FilterByType_AndReschedule()
    {
        var registerRes = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest("Gabriel Fase 3", $"fase3.{Guid.NewGuid():N}@lifeos.dev", "Password123!"));
        registerRes.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var areas = await _client.GetFromJsonAsync<List<AreaDto>>("/api/v1/areas");
        areas.Should().NotBeNullOrEmpty();
        var workArea = areas!.First(a => a.Slug == "trabalho");
        var studyArea = areas!.First(a => a.Slug == "estudo");

        var baseDate = new DateTimeOffset(2026, 11, 10, 14, 0, 0, TimeSpan.Zero);
        var rangeStart = new DateTimeOffset(2026, 11, 9, 0, 0, 0, TimeSpan.Zero);
        var rangeEnd = new DateTimeOffset(2026, 11, 16, 23, 59, 59, TimeSpan.Zero);

        var createRecurringEvent = new SaveEventRequest(
            "Daily Standup Arquitetura",
            "Alinhamento diário com time",
            workArea.Id,
            "Google Meet",
            baseDate,
            baseDate.AddMinutes(30),
            false,
            true,
            new List<string> { "Status do Sprint" },
            "Daily");

        var evRes = await _client.PostAsJsonAsync("/api/v1/events", createRecurringEvent);
        evRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdEvent = await evRes.Content.ReadFromJsonAsync<EventDetailDto>();
        createdEvent.Should().NotBeNull();
        createdEvent!.RecurrenceFrequency.Should().Be("Daily");

        var createTaskWithDeadline = new SaveTaskRequest(
            "Entregar RFC do módulo de calendário",
            "Documentação técnica completa",
            studyArea.Id,
            null,
            "High",
            "Todo",
            "2026-11-10",
            "2026-11-12",
            "17:00",
            null,
            "None");

        var taskRes = await _client.PostAsJsonAsync("/api/v1/tasks", createTaskWithDeadline);
        taskRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdTask = await taskRes.Content.ReadFromJsonAsync<TaskDetailDto>();
        createdTask.Should().NotBeNull();

        var calendarUrl = $"/api/v1/calendar?from={Uri.EscapeDataString(rangeStart.ToString("O"))}&to={Uri.EscapeDataString(rangeEnd.ToString("O"))}";
        var allEntries = await _client.GetFromJsonAsync<List<CalendarEntryDto>>(calendarUrl);
        allEntries.Should().NotBeNull();

        var recurringEventOccurrences = allEntries!.Where(e => e.SourceId == createdEvent.Id && e.EntryType == "event").ToList();
        recurringEventOccurrences.Count.Should().BeGreaterThanOrEqualTo(5);
        recurringEventOccurrences.Should().OnlyContain(e => e.IsRecurring && e.AreaSlug == "trabalho");

        var taskEntries = allEntries!.Where(e => e.SourceId == createdTask!.Id && e.EntryType == "task").ToList();
        taskEntries.Should().ContainSingle();
        taskEntries[0].Title.Should().Be("Entregar RFC do módulo de calendário");
        taskEntries[0].Priority.Should().Be("High");

        var onlyTasksUrl = $"{calendarUrl}&entryType=task";
        var filteredTasksOnly = await _client.GetFromJsonAsync<List<CalendarEntryDto>>(onlyTasksUrl);
        filteredTasksOnly.Should().NotBeNull();
        filteredTasksOnly!.Should().OnlyContain(e => e.EntryType == "task");

        var newTaskDate = new DateTimeOffset(2026, 11, 14, 16, 30, 0, TimeSpan.Zero);
        var rescheduleTaskReq = new RescheduleCalendarEntryRequest(
            createdTask!.Id,
            "task",
            newTaskDate,
            newTaskDate.AddHours(1),
            false);

        var rescheduleRes = await _client.PatchAsJsonAsync("/api/v1/calendar/reschedule", rescheduleTaskReq);
        rescheduleRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedTask = await _client.GetFromJsonAsync<TaskDetailDto>($"/api/v1/tasks/{createdTask.Id}");
        updatedTask.Should().NotBeNull();
        updatedTask!.DueDate.Should().Be("2026-11-14");
        updatedTask.DueTime.Should().Be("16:30");
    }
}
