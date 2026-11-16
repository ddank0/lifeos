using LifeOs.Application.Calendar.DTOs;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Calendar.Services;

public interface ICalendarService
{
    Task<IReadOnlyList<CalendarEntryDto>> GetEntriesAsync(CalendarQueryFilter filter, CancellationToken cancellationToken = default);
    Task<bool> RescheduleAsync(RescheduleCalendarEntryRequest request, CancellationToken cancellationToken = default);
}

public sealed class CalendarService(
    ILifeOsDbContext dbContext,
    IRealtimeNotificationService notifications) : ICalendarService
{
    public async Task<IReadOnlyList<CalendarEntryDto>> GetEntriesAsync(CalendarQueryFilter filter, CancellationToken cancellationToken = default)
    {
        var results = new List<CalendarEntryDto>();
        var normalizedType = string.IsNullOrWhiteSpace(filter.EntryType)
            ? "all"
            : filter.EntryType.Trim().ToLowerInvariant();

        if (normalizedType is "all" or "event")
        {
            var eventEntries = await LoadEventEntriesAsync(filter, cancellationToken);
            results.AddRange(eventEntries);
        }

        if (normalizedType is "all" or "task")
        {
            var taskEntries = await LoadTaskEntriesAsync(filter, cancellationToken);
            results.AddRange(taskEntries);
        }

        return results
            .OrderBy(e => e.StartAt)
            .ThenBy(e => e.EntryType)
            .ToList();
    }

    public async Task<bool> RescheduleAsync(RescheduleCalendarEntryRequest request, CancellationToken cancellationToken = default)
    {
        var entryType = request.EntryType.Trim().ToLowerInvariant();

        if (entryType == "event")
        {
            var ev = await dbContext.Events
                .Include(e => e.RecurrenceRule)
                .FirstOrDefaultAsync(e => e.Id == request.SourceId, cancellationToken);

            if (ev is null)
            {
                return false;
            }

            var duration = ev.EndAt > ev.StartAt ? ev.EndAt - ev.StartAt : TimeSpan.FromHours(1);
            ev.StartAt = request.StartAt;
            ev.EndAt = request.EndAt.HasValue && request.EndAt.Value > request.StartAt
                ? request.EndAt.Value
                : request.StartAt.Add(duration);
            ev.IsAllDay = request.IsAllDay;

            if (ev.RecurrenceRule is not null)
            {
                ev.RecurrenceRule.StartsOn = DateOnly.FromDateTime(request.StartAt.UtcDateTime);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await notifications.NotifyDashboardChangedAsync(cancellationToken);
            return true;
        }

        if (entryType == "task")
        {
            var task = await dbContext.Tasks
                .Include(t => t.RecurrenceRule)
                .FirstOrDefaultAsync(t => t.Id == request.SourceId, cancellationToken);

            if (task is null)
            {
                return false;
            }

            task.DueDate = DateOnly.FromDateTime(request.StartAt.UtcDateTime);
            task.DueTime = request.IsAllDay ? null : TimeOnly.FromDateTime(request.StartAt.UtcDateTime);

            if (task.RecurrenceRule is not null && task.DueDate.HasValue)
            {
                task.RecurrenceRule.StartsOn = task.DueDate.Value;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await notifications.NotifyDashboardChangedAsync(cancellationToken);
            return true;
        }

        return false;
    }

    private async Task<List<CalendarEntryDto>> LoadEventEntriesAsync(CalendarQueryFilter filter, CancellationToken cancellationToken)
    {
        var query = dbContext.Events
            .Include(e => e.Area)
            .Include(e => e.RecurrenceRule)
            .Where(e => (e.EndAt >= filter.From && e.StartAt <= filter.To) || e.RecurrenceRuleId != null);

        if (filter.AreaId.HasValue)
        {
            query = query.Where(e => e.AreaId == filter.AreaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AreaSlug) && filter.AreaSlug != "all")
        {
            var slug = filter.AreaSlug.Trim().ToLowerInvariant();
            query = query.Where(e => e.Area != null && e.Area.Slug == slug);
        }

        var events = await query.ToListAsync(cancellationToken);
        var entries = new List<CalendarEntryDto>();

        foreach (var ev in events)
        {
            var duration = ev.EndAt > ev.StartAt ? ev.EndAt - ev.StartAt : TimeSpan.FromHours(1);
            var occurrences = ExpandOccurrences(ev.StartAt, ev.RecurrenceRule, filter.From, filter.To);

            foreach (var occStart in occurrences)
            {
                var occEnd = occStart.Add(duration);
                if (occEnd < filter.From || occStart > filter.To)
                {
                    continue;
                }

                entries.Add(new CalendarEntryDto(
                    $"event:{ev.Id}:{occStart:yyyyMMddHHmm}",
                    ev.Id,
                    "event",
                    ev.Title,
                    ev.Description,
                    ev.AreaId,
                    ev.Area?.Name ?? "Geral",
                    ev.Area?.Slug ?? "geral",
                    ev.Area?.Color ?? "#a9ccf0",
                    occStart,
                    occEnd,
                    ev.IsAllDay,
                    false,
                    ev.RecurrenceRule is not null,
                    ev.RecurrenceRule?.Frequency.ToString() ?? "None",
                    null,
                    null,
                    ev.Location));
            }
        }

        return entries;
    }

    private async Task<List<CalendarEntryDto>> LoadTaskEntriesAsync(CalendarQueryFilter filter, CancellationToken cancellationToken)
    {
        var query = dbContext.Tasks
            .Include(t => t.Area)
            .Include(t => t.RecurrenceRule)
            .Where(t => t.DueDate != null);

        if (filter.AreaId.HasValue)
        {
            query = query.Where(t => t.AreaId == filter.AreaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AreaSlug) && filter.AreaSlug != "all")
        {
            var slug = filter.AreaSlug.Trim().ToLowerInvariant();
            query = query.Where(t => t.Area != null && t.Area.Slug == slug);
        }

        var tasks = await query.ToListAsync(cancellationToken);
        var entries = new List<CalendarEntryDto>();

        foreach (var task in tasks)
        {
            if (!task.DueDate.HasValue)
            {
                continue;
            }

            var isAllDay = !task.DueTime.HasValue;
            var timePart = task.DueTime ?? TimeOnly.MinValue;
            var baseStart = new DateTimeOffset(task.DueDate.Value.ToDateTime(timePart), TimeSpan.Zero);
            var duration = isAllDay ? TimeSpan.FromHours(23).Add(TimeSpan.FromMinutes(59)) : TimeSpan.FromMinutes(45);

            var occurrences = ExpandOccurrences(baseStart, task.RecurrenceRule, filter.From, filter.To);

            foreach (var occStart in occurrences)
            {
                var occEnd = occStart.Add(duration);
                if (occEnd < filter.From || occStart > filter.To)
                {
                    continue;
                }

                entries.Add(new CalendarEntryDto(
                    $"task:{task.Id}:{occStart:yyyyMMddHHmm}",
                    task.Id,
                    "task",
                    task.Title,
                    task.Description,
                    task.AreaId,
                    task.Area?.Name ?? "Geral",
                    task.Area?.Slug ?? "geral",
                    task.Area?.Color ?? "#a9ccf0",
                    occStart,
                    occEnd,
                    isAllDay,
                    task.Status == TaskItemStatus.Done,
                    task.RecurrenceRule is not null,
                    task.RecurrenceRule?.Frequency.ToString() ?? "None",
                    task.Priority.ToString(),
                    task.Status.ToString(),
                    null));
            }
        }

        return entries;
    }

    private static List<DateTimeOffset> ExpandOccurrences(
        DateTimeOffset baseStart,
        RecurrenceRule? rule,
        DateTimeOffset rangeFrom,
        DateTimeOffset rangeTo)
    {
        if (rule is null)
        {
            return new List<DateTimeOffset> { baseStart };
        }

        var occurrences = new List<DateTimeOffset>();
        var current = baseStart;
        var interval = Math.Max(1, rule.Interval);
        var maxIterations = 400;
        var iteration = 0;

        while (current <= rangeTo && iteration < maxIterations)
        {
            iteration++;

            if (rule.EndsOn.HasValue && DateOnly.FromDateTime(current.UtcDateTime) > rule.EndsOn.Value)
            {
                break;
            }

            if (current >= rangeFrom.AddDays(-2))
            {
                occurrences.Add(current);
            }

            current = rule.Frequency switch
            {
                RecurrenceFrequency.Daily => current.AddDays(interval),
                RecurrenceFrequency.Weekly => current.AddDays(7 * interval),
                RecurrenceFrequency.Monthly => current.AddMonths(interval),
                _ => current.AddDays(interval)
            };
        }

        return occurrences;
    }
}
