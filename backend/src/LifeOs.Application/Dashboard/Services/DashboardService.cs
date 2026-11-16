using System.Text.Json;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Dashboard.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Dashboard.Services;

public record DashboardFilterQuery(
    string? AreaSlug = null,
    string? Priority = null,
    string? Status = null,
    string? Search = null);

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(DashboardFilterQuery filter, CancellationToken cancellationToken = default);
    Task<DashboardTaskItemDto?> ToggleTaskStatusAsync(Guid taskId, CancellationToken cancellationToken = default);
    Task<DashboardEventItemDto?> ToggleEventStatusAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task QuickCaptureAsync(QuickCaptureRequest request, CancellationToken cancellationToken = default);
}

public sealed class DashboardService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : IDashboardService
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(DashboardFilterQuery filter, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var tomorrow = today.AddDays(1);

        var allTasks = await dbContext.Tasks
            .Include(t => t.Area)
            .Where(t => t.Status != TaskItemStatus.Cancelled)
            .ToListAsync(cancellationToken);

        var filteredTasks = ApplyFilters(allTasks, filter);

        var todayTasks = filteredTasks
            .Where(t => t.DueDate == null || t.DueDate == today)
            .OrderBy(t => t.BoardPosition)
            .Select(MapTask)
            .ToList();

        var tomorrowTasks = filteredTasks
            .Where(t => t.DueDate == tomorrow)
            .OrderBy(t => t.BoardPosition)
            .Select(MapTask)
            .ToList();

        var pendingTasksCount = allTasks.Count(t => t.Status != TaskItemStatus.Done);
        var completedTodayCount = allTasks.Count(t => t.Status == TaskItemStatus.Done && t.DueDate == today);
        var overdueTasksCount = allTasks.Count(t => t.Status != TaskItemStatus.Done && t.DueDate.HasValue && t.DueDate.Value < today);
        var inProgressCount = allTasks.Count(t => t.Status == TaskItemStatus.InProgress);
        var unprocessedNotesCount = await dbContext.QuickNotes.CountAsync(n => !n.IsProcessed, cancellationToken);

        var events = await dbContext.Events
            .Include(e => e.Area)
            .OrderBy(e => e.StartAt)
            .ToListAsync(cancellationToken);

        var tasksWithDueDate = allTasks
            .Where(t => t.DueDate != null)
            .OrderBy(t => t.DueDate)
            .ThenBy(t => t.DueTime)
            .ToList();

        var unifiedCalendarItems = new List<DashboardEventItemDto>();
        foreach (var ev in events)
        {
            unifiedCalendarItems.Add(MapEvent(ev));
        }
        foreach (var t in tasksWithDueDate)
        {
            unifiedCalendarItems.Add(MapTaskToCalendarItem(t));
        }

        var todayEvents = unifiedCalendarItems
            .OrderBy(i => i.Date)
            .ThenBy(i => i.TimeLabel)
            .ToList();
        var (weeklyHabitRate, bars) = await BuildWeeklyHabitBarsAsync(today, cancellationToken);

        return new DashboardSummaryDto(
            allTasks.Count,
            pendingTasksCount,
            completedTodayCount,
            overdueTasksCount,
            inProgressCount,
            unprocessedNotesCount,
            weeklyHabitRate,
            bars,
            todayTasks,
            tomorrowTasks,
            todayEvents);
    }

    public async Task<DashboardTaskItemDto?> ToggleTaskStatusAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await dbContext.Tasks
            .Include(t => t.Area)
            .FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);

        if (task is null)
        {
            return null;
        }

        if (task.Status == TaskItemStatus.Done)
        {
            task.Status = TaskItemStatus.Todo;
            task.CompletedAt = null;
        }
        else
        {
            task.Status = TaskItemStatus.Done;
            task.CompletedAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = MapTask(task);
        await notifications.NotifyTaskUpdatedAsync(dto, cancellationToken);
        return dto;
    }

    public async Task<DashboardEventItemDto?> ToggleEventStatusAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var ev = await dbContext.Events
            .Include(e => e.Area)
            .FirstOrDefaultAsync(e => e.Id == eventId, cancellationToken);

        if (ev is null)
        {
            return null;
        }

        ev.IsCompleted = !ev.IsCompleted;
        ev.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = MapEvent(ev);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task QuickCaptureAsync(QuickCaptureRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var defaultArea = await dbContext.Areas
            .OrderBy(a => a.SortOrder)
            .FirstOrDefaultAsync(cancellationToken);
        var areaId = request.AreaId ?? defaultArea?.Id;

        if (string.Equals(request.RecordType, "Task", StringComparison.OrdinalIgnoreCase) && areaId.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            dbContext.Tasks.Add(new TaskItem
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = areaId.Value,
                Title = request.Title.Trim(),
                Status = TaskItemStatus.Todo,
                Priority = TaskPriority.Medium,
                DueDate = today,
                BoardPosition = 99
            });
        }
        else
        {
            dbContext.QuickNotes.Add(new QuickNote
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = areaId,
                Content = request.Title.Trim(),
                NoteType = QuickNoteType.Note,
                IsProcessed = false
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
    }

    private static List<TaskItem> ApplyFilters(List<TaskItem> source, DashboardFilterQuery filter)
    {
        IEnumerable<TaskItem> result = source;

        if (!string.IsNullOrWhiteSpace(filter.AreaSlug) && filter.AreaSlug != "all")
        {
            result = result.Where(t => string.Equals(t.Area?.Slug, filter.AreaSlug, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority) &&
            filter.Priority != "all" &&
            Enum.TryParse<TaskPriority>(filter.Priority, true, out var prioFilter))
        {
            result = result.Where(t => t.Priority == prioFilter);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            filter.Status != "all" &&
            Enum.TryParse<TaskItemStatus>(filter.Status, true, out var statusFilter))
        {
            result = result.Where(t => t.Status == statusFilter);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLowerInvariant();
            result = result.Where(t =>
                t.Title.ToLower().Contains(term) ||
                (t.Description != null && t.Description.ToLower().Contains(term)));
        }

        return result.ToList();
    }

    private async Task<(int WeeklyRate, List<HabitDailyBarDto> Bars)> BuildWeeklyHabitBarsAsync(
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var dayAbbreviations = new[] { "D", "S", "T", "Q", "Q", "S", "S" };
        var activeHabits = await dbContext.Habits
            .Include(h => h.Completions)
            .Where(h => h.IsActive)
            .ToListAsync(cancellationToken);

        if (activeHabits.Count == 0)
        {
            var fallbackPercentages = new[] { 100, 100, 100, 82, 100, 64, 35 };
            var fallbackBars = new List<HabitDailyBarDto>(7);

            for (var i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var dow = dayAbbreviations[(int)date.DayOfWeek];
                var idx = 6 - i;
                fallbackBars.Add(new HabitDailyBarDto($"{date.Day} {dow}", fallbackPercentages[idx], i == 0));
            }

            return (80, fallbackBars);
        }

        var bars = new List<HabitDailyBarDto>(7);
        var totalDailyPercentages = 0;

        for (var i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var dow = dayAbbreviations[(int)date.DayOfWeek];
            var completedOnDay = activeHabits.Count(h => h.Completions.Any(c => c.CompletedOn == date));
            var percentage = (int)Math.Round(completedOnDay * 100.0 / activeHabits.Count);
            totalDailyPercentages += percentage;

            bars.Add(new HabitDailyBarDto($"{date.Day} {dow}", Math.Max(12, percentage), i == 0));
        }

        var weeklyRate = (int)Math.Round(totalDailyPercentages / 7.0);
        return (weeklyRate, bars);
    }

    private static DashboardTaskItemDto MapTask(TaskItem task) =>
        new(
            task.Id,
            task.Title,
            task.AreaId,
            task.Area?.Name ?? "Geral",
            task.Area?.Slug ?? "geral",
            task.Area?.Color ?? "#a9ccf0",
            task.Priority.ToString(),
            task.Status.ToString(),
            task.Status == TaskItemStatus.Done,
            task.DueDate?.ToString("yyyy-MM-dd"));

    private static DashboardEventItemDto MapEvent(CalendarEvent ev)
    {
        var hour = ev.StartAt.Hour;
        var period = hour < 12 ? "Manhã" : hour < 18 ? "Tarde" : "Noite";
        var subItems = string.IsNullOrWhiteSpace(ev.SubItemsJson)
            ? Array.Empty<string>()
            : JsonSerializer.Deserialize<string[]>(ev.SubItemsJson) ?? Array.Empty<string>();

        return new DashboardEventItemDto(
            ev.Id,
            ev.Title,
            ev.StartAt.ToString("HH:mm"),
            period,
            ev.Area?.Name ?? "Geral",
            ev.Area?.Color ?? "#a9ccf0",
            ev.IsCompleted,
            ev.IsHighlighted,
            subItems,
            ev.StartAt.ToString("yyyy-MM-dd"),
            "event");
    }

    private static DashboardEventItemDto MapTaskToCalendarItem(TaskItem task)
    {
        var hour = task.DueTime?.Hour ?? 9;
        var period = hour < 12 ? "Manhã" : hour < 18 ? "Tarde" : "Noite";
        var timeLabel = task.DueTime.HasValue ? task.DueTime.Value.ToString("HH:mm") : "Dia todo";

        return new DashboardEventItemDto(
            task.Id,
            task.Title,
            timeLabel,
            period,
            task.Area?.Name ?? "Geral",
            task.Area?.Color ?? "#a9ccf0",
            task.Status == TaskItemStatus.Done,
            false,
            Array.Empty<string>(),
            task.DueDate?.ToString("yyyy-MM-dd"),
            "task");
    }
}
