namespace LifeOs.Application.Dashboard.DTOs;

public record DashboardTaskItemDto(
    Guid Id,
    string Title,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    string Priority,
    string Status,
    bool IsCompleted,
    string? DueDate);

public record DashboardEventItemDto(
    Guid Id,
    string Title,
    string TimeLabel,
    string Period,
    string AreaName,
    string AreaColor,
    bool IsCompleted,
    bool IsHighlighted,
    IReadOnlyList<string> SubItems,
    string? Date = null,
    string EntryType = "event");

public record HabitDailyBarDto(
    string DayLabel,
    int Percentage,
    bool IsToday);

public record DashboardSummaryDto(
    int TotalActiveTasksCount,
    int PendingTasksCount,
    int CompletedTodayCount,
    int OverdueTasksCount,
    int InProgressCount,
    int UnprocessedNotesCount,
    int WeeklyHabitSuccessRate,
    IReadOnlyList<HabitDailyBarDto> DailyHabitBars,
    IReadOnlyList<DashboardTaskItemDto> TodayTasks,
    IReadOnlyList<DashboardTaskItemDto> TomorrowTasks,
    IReadOnlyList<DashboardEventItemDto> TodayEvents);

public record QuickCaptureRequest(
    string Title,
    string RecordType,
    Guid? AreaId,
    string? Priority);
