namespace LifeOs.Application.LifeTracker.DTOs;

public record MetricDayHistoryDto(
    string Date,
    string DayLabel,
    decimal Value,
    bool IsToday);

public record LifeMetricDetailDto(
    Guid Id,
    string Name,
    string? Description,
    Guid AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    string Unit,
    decimal DailyTarget,
    decimal StepIncrement,
    string? Icon,
    decimal TodayValue,
    int ProgressPercent,
    decimal SevenDayAverage,
    bool IsTargetReached,
    IReadOnlyList<MetricDayHistoryDto> LastSevenDays);

public record SaveLifeMetricRequest(
    string Name,
    string? Description,
    Guid AreaId,
    string Unit,
    decimal DailyTarget,
    decimal StepIncrement = 1.0m,
    string? Icon = null);

public record AdjustMetricValueRequest(
    decimal Delta,
    string? Date = null);

public record SetMetricValueRequest(
    decimal Value,
    string? Date = null,
    string? Notes = null);
