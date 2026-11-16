using LifeOs.Application.Tasks.DTOs;

namespace LifeOs.Application.Kanban.DTOs;

public record KanbanProjectSummaryDto(
    Guid Id,
    string Name,
    Guid AreaId,
    string AreaName,
    string AreaColor);

public record KanbanCardDto(
    Guid Id,
    string Title,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    Guid? ProjectId,
    string? ProjectName,
    string Priority,
    string Status,
    int BoardPosition,
    bool IsCompleted,
    bool IsOverdue,
    string? StartDate,
    string? DueDate,
    string? DueTime,
    IReadOnlyList<LabelDto> Labels,
    string RecurrenceFrequency);

public record KanbanColumnDto(
    string Status,
    string Title,
    int Position,
    IReadOnlyList<KanbanCardDto> Cards);

public record KanbanBoardDto(
    Guid BoardId,
    string BoardName,
    int TotalCardsCount,
    int OverdueCount,
    IReadOnlyList<KanbanColumnDto> Columns,
    IReadOnlyList<KanbanProjectSummaryDto> Projects);

public record MoveKanbanCardRequest(
    string TargetStatus,
    int TargetPosition);

public record KanbanQueryFilter(
    Guid? AreaId = null,
    string? AreaSlug = null,
    Guid? ProjectId = null,
    string? Priority = null,
    string? Search = null,
    bool? OverdueOnly = null);
