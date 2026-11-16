using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.LifeTracker.DTOs;
using LifeOs.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.LifeTracker.Services;

public interface ILifeTrackerService
{
    Task<IReadOnlyList<LifeMetricDetailDto>> GetMetricsAsync(string? areaSlug = null, CancellationToken cancellationToken = default);
    Task<LifeMetricDetailDto> CreateAsync(SaveLifeMetricRequest request, CancellationToken cancellationToken = default);
    Task<LifeMetricDetailDto?> UpdateAsync(Guid id, SaveLifeMetricRequest request, CancellationToken cancellationToken = default);
    Task<LifeMetricDetailDto?> AdjustValueAsync(Guid id, AdjustMetricValueRequest request, CancellationToken cancellationToken = default);
    Task<LifeMetricDetailDto?> SetValueAsync(Guid id, SetMetricValueRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class LifeTrackerService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : ILifeTrackerService
{
    public async Task<IReadOnlyList<LifeMetricDetailDto>> GetMetricsAsync(
        string? areaSlug = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.LifeMetrics
            .Include(m => m.Area)
            .Include(m => m.Entries)
            .Where(m => m.IsActive);

        if (!string.IsNullOrWhiteSpace(areaSlug) && areaSlug != "all")
        {
            var slug = areaSlug.Trim().ToLowerInvariant();
            query = query.Where(m => m.Area != null && m.Area.Slug == slug);
        }

        var metrics = await query
            .OrderBy(m => m.Area != null ? m.Area.SortOrder : 0)
            .ThenBy(m => m.Name)
            .ToListAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return metrics.Select(m => MapToDetailDto(m, today)).ToList();
    }

    public async Task<LifeMetricDetailDto> CreateAsync(
        SaveLifeMetricRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId, cancellationToken)
                   ?? await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken)
                   ?? throw new InvalidOperationException("Área não encontrada.");

        var metric = new LifeMetric
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = area.Id,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Unit = request.Unit.Trim(),
            DailyTarget = Math.Max(0.01m, request.DailyTarget),
            StepIncrement = request.StepIncrement > 0 ? request.StepIncrement : 1.0m,
            Icon = request.Icon?.Trim(),
            IsActive = true
        };

        dbContext.LifeMetrics.Add(metric);
        await dbContext.SaveChangesAsync(cancellationToken);

        metric.Area = area;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dto = MapToDetailDto(metric, today);

        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<LifeMetricDetailDto?> UpdateAsync(
        Guid id,
        SaveLifeMetricRequest request,
        CancellationToken cancellationToken = default)
    {
        var metric = await dbContext.LifeMetrics
            .Include(m => m.Area)
            .Include(m => m.Entries)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (metric is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            metric.Name = request.Name.Trim();
        }

        metric.Description = request.Description?.Trim();

        if (request.AreaId != Guid.Empty)
        {
            metric.AreaId = request.AreaId;
        }

        if (!string.IsNullOrWhiteSpace(request.Unit))
        {
            metric.Unit = request.Unit.Trim();
        }

        if (request.DailyTarget > 0)
        {
            metric.DailyTarget = request.DailyTarget;
        }

        if (request.StepIncrement > 0)
        {
            metric.StepIncrement = request.StepIncrement;
        }

        metric.Icon = request.Icon?.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dto = MapToDetailDto(metric, today);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<LifeMetricDetailDto?> AdjustValueAsync(
        Guid id,
        AdjustMetricValueRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var metric = await dbContext.LifeMetrics
            .Include(m => m.Area)
            .Include(m => m.Entries)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (metric is null)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var date = DateOnly.TryParse(request.Date, out var parsedDate) ? parsedDate : today;

        var entry = metric.Entries.FirstOrDefault(e => e.EntryDate == date);
        if (entry is null)
        {
            var initialValue = Math.Max(0m, request.Delta);
            entry = new LifeMetricEntry
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MetricId = metric.Id,
                EntryDate = date,
                Value = initialValue
            };
            dbContext.LifeMetricEntries.Add(entry);
        }
        else
        {
            entry.Value = Math.Max(0m, entry.Value + request.Delta);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = MapToDetailDto(metric, today);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<LifeMetricDetailDto?> SetValueAsync(
        Guid id,
        SetMetricValueRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var metric = await dbContext.LifeMetrics
            .Include(m => m.Area)
            .Include(m => m.Entries)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (metric is null)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var date = DateOnly.TryParse(request.Date, out var parsedDate) ? parsedDate : today;

        var entry = metric.Entries.FirstOrDefault(e => e.EntryDate == date);
        if (entry is null)
        {
            entry = new LifeMetricEntry
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MetricId = metric.Id,
                EntryDate = date,
                Value = Math.Max(0m, request.Value),
                Notes = request.Notes?.Trim()
            };
            dbContext.LifeMetricEntries.Add(entry);
        }
        else
        {
            entry.Value = Math.Max(0m, request.Value);
            entry.Notes = request.Notes?.Trim() ?? entry.Notes;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = MapToDetailDto(metric, today);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var metric = await dbContext.LifeMetrics.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (metric is null)
        {
            return false;
        }

        metric.DeletedAt = DateTimeOffset.UtcNow;
        metric.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private static LifeMetricDetailDto MapToDetailDto(LifeMetric metric, DateOnly today)
    {
        var dayAbbreviations = new[] { "D", "S", "T", "Q", "Q", "S", "S" };
        var entriesMap = metric.Entries
            .GroupBy(e => e.EntryDate)
            .ToDictionary(g => g.Key, g => g.Last().Value);
        var lastSevenDays = new List<MetricDayHistoryDto>(7);
        decimal sumSevenDays = 0;

        for (var i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var val = entriesMap.TryGetValue(date, out var found) ? found : 0m;
            sumSevenDays += val;

            var dow = dayAbbreviations[(int)date.DayOfWeek];
            lastSevenDays.Add(new MetricDayHistoryDto(
                date.ToString("yyyy-MM-dd"),
                $"{date.Day} {dow}",
                val,
                i == 0));
        }

        var todayValue = entriesMap.TryGetValue(today, out var tv) ? tv : 0m;
        var progressPercent = metric.DailyTarget > 0
            ? (int)Math.Min(100, Math.Round((todayValue / metric.DailyTarget) * 100))
            : 0;
        var average = Math.Round(sumSevenDays / 7.0m, 2);

        return new LifeMetricDetailDto(
            metric.Id,
            metric.Name,
            metric.Description,
            metric.AreaId,
            metric.Area?.Name ?? "Geral",
            metric.Area?.Slug ?? "geral",
            metric.Area?.Color ?? "#8bd3c7",
            metric.Unit,
            metric.DailyTarget,
            metric.StepIncrement,
            metric.Icon,
            todayValue,
            progressPercent,
            average,
            todayValue >= metric.DailyTarget,
            lastSevenDays);
    }
}
