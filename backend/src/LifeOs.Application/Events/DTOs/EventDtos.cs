namespace LifeOs.Application.Events.DTOs;

public record EventDetailDto(
    Guid Id,
    string Title,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    string? Location,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    string TimeLabel,
    string Period,
    bool IsAllDay,
    bool IsHighlighted,
    IReadOnlyList<string> SubItems,
    string RecurrenceFrequency = "None");

public record SaveEventRequest(
    string Title,
    string? Description,
    Guid AreaId,
    string? Location,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    bool IsAllDay,
    bool IsHighlighted,
    IReadOnlyList<string>? SubItems = null,
    string? RecurrenceFrequency = null);
