namespace LifeOs.Application.Calendar.DTOs;

public record CalendarEntryDto(
    string CompositeId,
    Guid SourceId,
    string EntryType,
    string Title,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    bool IsAllDay,
    bool IsCompleted,
    bool IsRecurring,
    string RecurrenceFrequency,
    string? Priority,
    string? Status,
    string? Location);

public record RescheduleCalendarEntryRequest(
    Guid SourceId,
    string EntryType,
    DateTimeOffset StartAt,
    DateTimeOffset? EndAt,
    bool IsAllDay);

public record CalendarQueryFilter(
    DateTimeOffset From,
    DateTimeOffset To,
    Guid? AreaId = null,
    string? AreaSlug = null,
    string? EntryType = null);
