namespace LifeOs.Application.Habits.DTOs;

public record HabitDayCheckDto(
    string Date,
    string DayLabel,
    bool IsCompleted,
    bool IsToday);

public record HabitDetailDto(
    Guid Id,
    string Name,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    string Frequency,
    int TargetPerWeek,
    int CurrentStreak,
    int BestStreak,
    int WeeklyCompletionsCount,
    int ConsistencyRatePercent,
    bool CompletedToday,
    bool IsActive,
    IReadOnlyList<HabitDayCheckDto> LastSevenDays);

public record SaveHabitRequest(
    string Name,
    string? Description,
    Guid AreaId,
    string Frequency = "Daily",
    int TargetPerWeek = 7);

public record ToggleHabitCompletionRequest(
    string? Date = null,
    string? Notes = null);
