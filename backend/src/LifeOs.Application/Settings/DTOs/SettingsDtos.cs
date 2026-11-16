namespace LifeOs.Application.Settings.DTOs;

public record AreaProductivityItemDto(
    Guid AreaId,
    string AreaName,
    string AreaColor,
    int PendingTasksCount,
    int CompletedTasksCount,
    int UpcomingEventsCount,
    int CompletionRatePercent);

public record ProductivityReportDto(
    int TotalTasksCount,
    int CompletedTasksCount,
    int PendingTasksCount,
    int OverdueTasksCount,
    int OverallCompletionRatePercent,
    int ActiveProjectsCount,
    int ActiveHabitsCount,
    int BestHabitStreak,
    IReadOnlyList<AreaProductivityItemDto> AreaBreakdown);

public record SettingsOverviewDto(
    Guid UserId,
    string FullName,
    string Email,
    string ThemePreference,
    ProductivityReportDto Productivity);

public record UpdateProfileSettingsRequest(
    string FullName,
    string ThemePreference);
