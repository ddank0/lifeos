using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Projects.DTOs;
using LifeOs.Application.Tasks.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Projects.Services;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDetailDto>> GetProjectsAsync(string? areaSlug = null, string? status = null, CancellationToken cancellationToken = default);
    Task<ProjectDetailDto> CreateAsync(SaveProjectRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDetailDto?> UpdateAsync(Guid id, SaveProjectRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class ProjectService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : IProjectService
{
    public async Task<IReadOnlyList<ProjectDetailDto>> GetProjectsAsync(
        string? areaSlug = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Projects
            .Include(p => p.Area)
            .Include(p => p.Tasks)
            .ThenInclude(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(areaSlug) && areaSlug != "all")
        {
            var slug = areaSlug.Trim().ToLowerInvariant();
            query = query.Where(p => p.Area != null && p.Area.Slug == slug);
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            status != "all" &&
            Enum.TryParse<ProjectStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(p => p.Status == parsedStatus);
        }

        var list = await query
            .OrderByDescending(p => p.Priority)
            .ThenBy(p => p.DueDate)
            .ToListAsync(cancellationToken);

        return list.Select(MapToDto).ToList();
    }

    public async Task<ProjectDetailDto> CreateAsync(SaveProjectRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId, cancellationToken)
                   ?? await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken)
                   ?? throw new InvalidOperationException("Área não encontrada.");

        var status = Enum.TryParse<ProjectStatus>(request.Status, true, out var parsedStatus)
            ? parsedStatus
            : ProjectStatus.Active;

        var priority = Enum.TryParse<TaskPriority>(request.Priority, true, out var parsedPrio)
            ? parsedPrio
            : TaskPriority.Medium;

        var project = new Project
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = area.Id,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            StartDate = DateOnly.TryParse(request.StartDate, out var sd) ? sd : null,
            DueDate = DateOnly.TryParse(request.DueDate, out var dd) ? dd : null,
            Status = status,
            Priority = priority
        };

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);

        project.Area = area;
        var dto = MapToDto(project);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<ProjectDetailDto?> UpdateAsync(Guid id, SaveProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await dbContext.Projects
            .Include(p => p.Area)
            .Include(p => p.Tasks)
            .ThenInclude(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (project is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            project.Name = request.Name.Trim();
        }

        project.Description = request.Description?.Trim();

        if (request.AreaId != Guid.Empty)
        {
            project.AreaId = request.AreaId;
        }

        project.StartDate = DateOnly.TryParse(request.StartDate, out var sd) ? sd : project.StartDate;
        project.DueDate = DateOnly.TryParse(request.DueDate, out var dd) ? dd : project.DueDate;

        if (Enum.TryParse<ProjectStatus>(request.Status, true, out var parsedStatus))
        {
            project.Status = parsedStatus;
        }

        if (Enum.TryParse<TaskPriority>(request.Priority, true, out var parsedPrio))
        {
            project.Priority = parsedPrio;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var reloaded = await dbContext.Projects
            .Include(p => p.Area)
            .Include(p => p.Tasks)
            .ThenInclude(t => t.TaskLabels)
            .ThenInclude(tl => tl.Label)
            .FirstAsync(p => p.Id == project.Id, cancellationToken);

        var dto = MapToDto(reloaded);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await dbContext.Projects.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (project is null)
        {
            return false;
        }

        project.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private static ProjectDetailDto MapToDto(Project project)
    {
        var activeTasks = project.Tasks
            .Where(t => t.DeletedAt == null && t.Status != TaskItemStatus.Cancelled)
            .OrderBy(t => t.Status == TaskItemStatus.Done)
            .ThenBy(t => t.DueDate)
            .ToList();

        var totalCount = activeTasks.Count;
        var completedCount = activeTasks.Count(t => t.Status == TaskItemStatus.Done);
        var progressPercent = totalCount == 0
            ? (project.Status == ProjectStatus.Completed ? 100 : 0)
            : (int)Math.Round(completedCount * 100.0 / totalCount);

        var mappedTasks = activeTasks
            .Select(t => new TaskDetailDto(
                t.Id,
                t.Title,
                t.Description,
                t.AreaId,
                project.Area?.Name ?? "Geral",
                project.Area?.Slug ?? "geral",
                project.Area?.Color ?? "#a9ccf0",
                t.ProjectId,
                t.Priority.ToString(),
                t.Status.ToString(),
                t.Status == TaskItemStatus.Done,
                t.StartDate?.ToString("yyyy-MM-dd"),
                t.DueDate?.ToString("yyyy-MM-dd"),
                t.DueTime?.ToString("HH:mm"),
                t.CompletedAt,
                t.TaskLabels
                    .Where(tl => tl.Label is not null)
                    .Select(tl => new LabelDto(tl.Label!.Id, tl.Label.Name, tl.Label.Color))
                    .ToList()))
            .ToList();

        return new ProjectDetailDto(
            project.Id,
            project.Name,
            project.Description,
            project.AreaId,
            project.Area?.Name ?? "Geral",
            project.Area?.Slug ?? "geral",
            project.Area?.Color ?? "#a9ccf0",
            project.StartDate?.ToString("yyyy-MM-dd"),
            project.DueDate?.ToString("yyyy-MM-dd"),
            project.Status.ToString(),
            project.Priority.ToString(),
            totalCount,
            completedCount,
            progressPercent,
            mappedTasks);
    }
}
