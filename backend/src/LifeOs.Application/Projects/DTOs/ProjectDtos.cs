using LifeOs.Application.Tasks.DTOs;

namespace LifeOs.Application.Projects.DTOs;

public record ProjectDetailDto(
    Guid Id,
    string Name,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    string? StartDate,
    string? DueDate,
    string Status,
    string Priority,
    int TotalTasksCount,
    int CompletedTasksCount,
    int ProgressPercent,
    IReadOnlyList<TaskDetailDto> Tasks);

public record SaveProjectRequest(
    string Name,
    string? Description,
    Guid AreaId,
    string? StartDate,
    string? DueDate,
    string Status = "Active",
    string Priority = "Medium");
