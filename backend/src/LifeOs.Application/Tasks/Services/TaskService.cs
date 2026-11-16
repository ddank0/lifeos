using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Tasks.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Tasks.Services;

public record TaskQueryFilter(
    Guid? AreaId = null,
    string? AreaSlug = null,
    string? Priority = null,
    string? Status = null,
    string? Search = null,
    bool? OverdueOnly = null);

public interface ITaskService
{
    Task<IReadOnlyList<TaskDetailDto>> GetTasksAsync(TaskQueryFilter filter, CancellationToken cancellationToken = default);
    Task<TaskDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TaskDetailDto> CreateAsync(SaveTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskDetailDto?> UpdateAsync(Guid id, SaveTaskRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class TaskService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : ITaskService
{
    public async Task<IReadOnlyList<TaskDetailDto>> GetTasksAsync(TaskQueryFilter filter, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .AsQueryable();

        if (filter.AreaId.HasValue)
        {
            query = query.Where(t => t.AreaId == filter.AreaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AreaSlug) && filter.AreaSlug != "all")
        {
            var slug = filter.AreaSlug.Trim().ToLowerInvariant();
            query = query.Where(t => t.Area != null && t.Area.Slug == slug);
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority) &&
            Enum.TryParse<TaskPriority>(filter.Priority, true, out var parsedPriority))
        {
            query = query.Where(t => t.Priority == parsedPriority);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<TaskItemStatus>(filter.Status, true, out var parsedStatus))
        {
            query = query.Where(t => t.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLowerInvariant();
            query = query.Where(t =>
                t.Title.ToLower().Contains(term) ||
                (t.Description != null && t.Description.ToLower().Contains(term)));
        }

        if (filter.OverdueOnly == true)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            query = query.Where(t => t.Status != TaskItemStatus.Done && t.DueDate < today);
        }

        var items = await query
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority)
            .ThenBy(t => t.BoardPosition)
            .ToListAsync(cancellationToken);

        return items.Select(MapToDetailDto).ToList();
    }

    public async Task<TaskDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        return task is null ? null : MapToDetailDto(task);
    }

    public async Task<TaskDetailDto> CreateAsync(SaveTaskRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId, cancellationToken)
                   ?? await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken)
                   ?? throw new InvalidOperationException("Área não encontrada.");

        var parsedPriority = Enum.TryParse<TaskPriority>(request.Priority, true, out var prio)
            ? prio
            : TaskPriority.Medium;
        var parsedStatus = Enum.TryParse<TaskItemStatus>(request.Status, true, out var st)
            ? st
            : TaskItemStatus.Todo;

        var startDate = DateOnly.TryParse(request.StartDate, out var sd) ? sd : (DateOnly?)null;
        var dueDate = DateOnly.TryParse(request.DueDate, out var dd) ? dd : DateOnly.FromDateTime(DateTime.UtcNow);
        var dueTime = TimeOnly.TryParse(request.DueTime, out var dt) ? dt : (TimeOnly?)null;

        var recurrenceRule = CreateRecurrenceRule(userId, request.RecurrenceFrequency, dueDate);
        if (recurrenceRule is not null)
        {
            dbContext.RecurrenceRules.Add(recurrenceRule);
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = area.Id,
            ProjectId = request.ProjectId,
            RecurrenceRuleId = recurrenceRule?.Id,
            RecurrenceRule = recurrenceRule,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = parsedPriority,
            Status = parsedStatus,
            StartDate = startDate,
            DueDate = dueDate,
            DueTime = dueTime,
            CompletedAt = parsedStatus == TaskItemStatus.Done ? DateTimeOffset.UtcNow : null,
            BoardPosition = 50
        };

        await SyncTaskLabelsAsync(task, request.LabelIds, cancellationToken);

        dbContext.Tasks.Add(task);
        await dbContext.SaveChangesAsync(cancellationToken);

        var loaded = await dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstAsync(t => t.Id == task.Id, cancellationToken);

        var dto = MapToDetailDto(loaded);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<TaskDetailDto?> UpdateAsync(Guid id, SaveTaskRequest request, CancellationToken cancellationToken = default)
    {
        var task = await dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (task is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            task.Title = request.Title.Trim();
        }

        task.Description = request.Description?.Trim();

        if (request.AreaId != Guid.Empty)
        {
            task.AreaId = request.AreaId;
        }

        task.ProjectId = request.ProjectId;

        if (Enum.TryParse<TaskPriority>(request.Priority, true, out var prio))
        {
            task.Priority = prio;
        }

        if (Enum.TryParse<TaskItemStatus>(request.Status, true, out var st))
        {
            task.Status = st;
            task.CompletedAt = st == TaskItemStatus.Done ? DateTimeOffset.UtcNow : null;
        }

        task.StartDate = DateOnly.TryParse(request.StartDate, out var sd) ? sd : task.StartDate;
        task.DueDate = DateOnly.TryParse(request.DueDate, out var dd) ? dd : task.DueDate;
        task.DueTime = TimeOnly.TryParse(request.DueTime, out var dt) ? dt : task.DueTime;

        ApplyRecurrenceRuleUpdate(task, request.RecurrenceFrequency);

        if (request.LabelIds is not null)
        {
            dbContext.TaskLabels.RemoveRange(task.TaskLabels);
            task.TaskLabels.Clear();
            await SyncTaskLabelsAsync(task, request.LabelIds, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var reloaded = await dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstAsync(t => t.Id == task.Id, cancellationToken);

        var dto = MapToDetailDto(reloaded);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (task is null)
        {
            return false;
        }

        task.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private void ApplyRecurrenceRuleUpdate(TaskItem task, string? recurrenceFrequency)
    {
        if (string.IsNullOrWhiteSpace(recurrenceFrequency))
        {
            return;
        }

        if (recurrenceFrequency.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            if (task.RecurrenceRule is not null)
            {
                dbContext.RecurrenceRules.Remove(task.RecurrenceRule);
            }

            task.RecurrenceRuleId = null;
            task.RecurrenceRule = null;
            return;
        }

        if (!Enum.TryParse<RecurrenceFrequency>(recurrenceFrequency, true, out var parsedFreq))
        {
            return;
        }

        var startsOn = task.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        if (task.RecurrenceRule is not null)
        {
            task.RecurrenceRule.Frequency = parsedFreq;
            task.RecurrenceRule.StartsOn = startsOn;
        }
        else
        {
            var newRule = new RecurrenceRule
            {
                Id = Guid.NewGuid(),
                UserId = task.UserId,
                Frequency = parsedFreq,
                Interval = 1,
                StartsOn = startsOn
            };
            dbContext.RecurrenceRules.Add(newRule);
            task.RecurrenceRuleId = newRule.Id;
            task.RecurrenceRule = newRule;
        }
    }

    private static RecurrenceRule? CreateRecurrenceRule(Guid userId, string? recurrenceFrequency, DateOnly startsOn)
    {
        if (string.IsNullOrWhiteSpace(recurrenceFrequency) ||
            recurrenceFrequency.Equals("None", StringComparison.OrdinalIgnoreCase) ||
            !Enum.TryParse<RecurrenceFrequency>(recurrenceFrequency, true, out var parsedFreq))
        {
            return null;
        }

        return new RecurrenceRule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Frequency = parsedFreq,
            Interval = 1,
            StartsOn = startsOn
        };
    }

    private async Task SyncTaskLabelsAsync(TaskItem task, IReadOnlyList<Guid>? labelIds, CancellationToken cancellationToken)
    {
        if (labelIds is not { Count: > 0 })
        {
            return;
        }

        var validLabelIds = await dbContext.Labels
            .Where(l => labelIds.Contains(l.Id))
            .Select(l => l.Id)
            .ToListAsync(cancellationToken);

        foreach (var labelId in validLabelIds)
        {
            task.TaskLabels.Add(new TaskLabel { TaskId = task.Id, LabelId = labelId });
        }
    }

    private static TaskDetailDto MapToDetailDto(TaskItem task) =>
        new(
            task.Id,
            task.Title,
            task.Description,
            task.AreaId,
            task.Area?.Name ?? "Geral",
            task.Area?.Slug ?? "geral",
            task.Area?.Color ?? "#a9ccf0",
            task.ProjectId,
            task.Priority.ToString(),
            task.Status.ToString(),
            task.Status == TaskItemStatus.Done,
            task.StartDate?.ToString("yyyy-MM-dd"),
            task.DueDate?.ToString("yyyy-MM-dd"),
            task.DueTime?.ToString("HH:mm"),
            task.CompletedAt,
            task.TaskLabels
                .Where(tl => tl.Label is not null)
                .Select(tl => new LabelDto(tl.Label!.Id, tl.Label.Name, tl.Label.Color))
                .ToList(),
            task.RecurrenceRule?.Frequency.ToString() ?? "None");
}
