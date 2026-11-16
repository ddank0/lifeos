using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Kanban.DTOs;
using LifeOs.Application.Tasks.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Kanban.Services;

public interface IKanbanService
{
    Task<KanbanBoardDto> GetBoardAsync(KanbanQueryFilter filter, CancellationToken cancellationToken = default);
    Task<KanbanCardDto?> MoveCardAsync(Guid taskId, MoveKanbanCardRequest request, CancellationToken cancellationToken = default);
}

public sealed class KanbanService(
    ILifeOsDbContext dbContext,
    IRealtimeNotificationService notifications) : IKanbanService
{
    private static readonly (TaskItemStatus Status, string Title, int Position)[] StandardColumns =
    [
        (TaskItemStatus.Todo, "A fazer", 0),
        (TaskItemStatus.InProgress, "Em andamento", 1),
        (TaskItemStatus.OnHold, "Em espera", 2),
        (TaskItemStatus.Done, "Concluído", 3)
    ];

    public async Task<KanbanBoardDto> GetBoardAsync(KanbanQueryFilter filter, CancellationToken cancellationToken = default)
    {
        var board = await dbContext.Boards
            .Include(b => b.Columns)
            .OrderByDescending(b => b.IsDefault)
            .FirstOrDefaultAsync(cancellationToken);

        var projects = await dbContext.Projects
            .Include(p => p.Area)
            .OrderBy(p => p.Name)
            .Select(p => new KanbanProjectSummaryDto(
                p.Id,
                p.Name,
                p.AreaId,
                p.Area != null ? p.Area.Name : "Geral",
                p.Area != null ? p.Area.Color : "#a9ccf0"))
            .ToListAsync(cancellationToken);

        var query = dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.Project)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .Where(t => t.Status != TaskItemStatus.Cancelled);

        if (filter.AreaId.HasValue)
        {
            query = query.Where(t => t.AreaId == filter.AreaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AreaSlug) && filter.AreaSlug != "all")
        {
            var slug = filter.AreaSlug.Trim().ToLowerInvariant();
            query = query.Where(t => t.Area != null && t.Area.Slug == slug);
        }

        if (filter.ProjectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == filter.ProjectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority) &&
            filter.Priority != "all" &&
            Enum.TryParse<TaskPriority>(filter.Priority, true, out var parsedPriority))
        {
            query = query.Where(t => t.Priority == parsedPriority);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLowerInvariant();
            query = query.Where(t =>
                t.Title.ToLower().Contains(term) ||
                (t.Description != null && t.Description.ToLower().Contains(term)));
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (filter.OverdueOnly == true)
        {
            query = query.Where(t => t.Status != TaskItemStatus.Done && t.DueDate != null && t.DueDate < today);
        }

        var tasks = await query
            .OrderBy(t => t.BoardPosition)
            .ThenBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority)
            .ToListAsync(cancellationToken);

        var cards = tasks.Select(t => MapToCardDto(t, today)).ToList();
        var overdueCount = cards.Count(c => c.IsOverdue);

        var columns = StandardColumns
            .Select(col => new KanbanColumnDto(
                col.Status.ToString(),
                col.Title,
                col.Position,
                cards.Where(c => c.Status == col.Status.ToString()).ToList()))
            .ToList();

        return new KanbanBoardDto(
            board?.Id ?? Guid.Empty,
            board?.Name ?? "Quadro Principal",
            cards.Count,
            overdueCount,
            columns,
            projects);
    }

    public async Task<KanbanCardDto?> MoveCardAsync(Guid taskId, MoveKanbanCardRequest request, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<TaskItemStatus>(request.TargetStatus, true, out var targetStatus))
        {
            return null;
        }

        var task = await dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.Project)
            .Include(t => t.RecurrenceRule)
            .Include(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);

        if (task is null)
        {
            return null;
        }

        var targetColumn = await dbContext.BoardColumns
            .FirstOrDefaultAsync(c => c.StatusMapping == targetStatus, cancellationToken);

        task.Status = targetStatus;
        task.BoardColumnId = targetColumn?.Id;
        task.CompletedAt = targetStatus == TaskItemStatus.Done ? DateTimeOffset.UtcNow : null;

        var siblingsInColumn = await dbContext.Tasks
            .Where(t => t.Status == targetStatus && t.Id != task.Id)
            .OrderBy(t => t.BoardPosition)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var boundedIndex = Math.Clamp(request.TargetPosition, 0, siblingsInColumn.Count);
        siblingsInColumn.Insert(boundedIndex, task);

        for (var i = 0; i < siblingsInColumn.Count; i++)
        {
            siblingsInColumn[i].BoardPosition = (i + 1) * 10;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dto = MapToCardDto(task, today);

        await notifications.NotifyTaskUpdatedAsync(
            new { taskId = task.Id, status = task.Status.ToString(), isCompleted = task.Status == TaskItemStatus.Done },
            cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);

        return dto;
    }

    private static KanbanCardDto MapToCardDto(TaskItem task, DateOnly today)
    {
        var isCompleted = task.Status == TaskItemStatus.Done;
        var isOverdue = !isCompleted && task.DueDate.HasValue && task.DueDate.Value < today;

        return new KanbanCardDto(
            task.Id,
            task.Title,
            task.Description,
            task.AreaId,
            task.Area?.Name ?? "Geral",
            task.Area?.Slug ?? "geral",
            task.Area?.Color ?? "#a9ccf0",
            task.ProjectId,
            task.Project?.Name,
            task.Priority.ToString(),
            task.Status.ToString(),
            task.BoardPosition,
            isCompleted,
            isOverdue,
            task.StartDate?.ToString("yyyy-MM-dd"),
            task.DueDate?.ToString("yyyy-MM-dd"),
            task.DueTime?.ToString("HH:mm"),
            task.TaskLabels
                .Where(tl => tl.Label is not null)
                .Select(tl => new LabelDto(tl.Label!.Id, tl.Label.Name, tl.Label.Color))
                .ToList(),
            task.RecurrenceRule?.Frequency.ToString() ?? "None");
    }
}
