namespace LifeOs.Application.Tasks.DTOs;

public record LabelDto(
    Guid Id,
    string Name,
    string Color);

public record SaveLabelRequest(
    string Name,
    string Color);

public record TaskDetailDto(
    Guid Id,
    string Title,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    Guid? ProjectId,
    string Priority,
    string Status,
    bool IsCompleted,
    string? StartDate,
    string? DueDate,
    string? DueTime,
    DateTimeOffset? CompletedAt,
    IReadOnlyList<LabelDto> Labels,
    string RecurrenceFrequency = "None");

public record SaveTaskRequest(
    string Title,
    string? Description,
    Guid AreaId,
    Guid? ProjectId,
    string Priority,
    string Status,
    string? StartDate,
    string? DueDate,
    string? DueTime,
    IReadOnlyList<Guid>? LabelIds = null,
    string? RecurrenceFrequency = null);

public record UpdateTaskStatusRequest(
    string Status);
