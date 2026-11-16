using LifeOs.Application.Events.DTOs;
using LifeOs.Application.Tasks.DTOs;

namespace LifeOs.Application.Areas.DTOs;

public record AreaDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string Color,
    string Icon,
    int SortOrder,
    bool IsDefault,
    int PendingTasksCount,
    int CompletedTasksCount = 0,
    int UpcomingEventsCount = 0);

public record SaveAreaRequest(
    string Name,
    string? Description,
    string Color,
    string Icon);

public record AreaOverviewDto(
    AreaDto Area,
    IReadOnlyList<TaskDetailDto> Tasks,
    IReadOnlyList<EventDetailDto> Events);
