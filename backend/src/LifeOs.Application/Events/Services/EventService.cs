using System.Text.Json;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Events.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Events.Services;

public record EventQueryFilter(
    Guid? AreaId = null,
    string? AreaSlug = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null);

public interface IEventService
{
    Task<IReadOnlyList<EventDetailDto>> GetEventsAsync(EventQueryFilter filter, CancellationToken cancellationToken = default);
    Task<EventDetailDto> CreateAsync(SaveEventRequest request, CancellationToken cancellationToken = default);
    Task<EventDetailDto?> UpdateAsync(Guid id, SaveEventRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class EventService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : IEventService
{
    public async Task<IReadOnlyList<EventDetailDto>> GetEventsAsync(EventQueryFilter filter, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Events
            .Include(e => e.Area)
            .Include(e => e.RecurrenceRule)
            .AsQueryable();

        if (filter.AreaId.HasValue)
        {
            query = query.Where(e => e.AreaId == filter.AreaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AreaSlug) && filter.AreaSlug != "all")
        {
            var slug = filter.AreaSlug.Trim().ToLowerInvariant();
            query = query.Where(e => e.Area != null && e.Area.Slug == slug);
        }

        if (filter.From.HasValue)
        {
            query = query.Where(e => e.EndAt >= filter.From.Value || e.RecurrenceRuleId != null);
        }

        if (filter.To.HasValue)
        {
            query = query.Where(e => e.StartAt <= filter.To.Value);
        }

        var list = await query
            .OrderBy(e => e.StartAt)
            .ToListAsync(cancellationToken);

        return list.Select(MapToEventDto).ToList();
    }

    public async Task<EventDetailDto> CreateAsync(SaveEventRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId, cancellationToken)
                   ?? await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken)
                   ?? throw new InvalidOperationException("Área não encontrada.");

        var recurrenceRule = CreateRecurrenceRule(userId, request.RecurrenceFrequency, DateOnly.FromDateTime(request.StartAt.UtcDateTime));
        if (recurrenceRule is not null)
        {
            dbContext.RecurrenceRules.Add(recurrenceRule);
        }

        var ev = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = area.Id,
            RecurrenceRuleId = recurrenceRule?.Id,
            RecurrenceRule = recurrenceRule,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Location = request.Location?.Trim(),
            StartAt = request.StartAt,
            EndAt = request.EndAt >= request.StartAt ? request.EndAt : request.StartAt.AddHours(1),
            IsAllDay = request.IsAllDay,
            IsHighlighted = request.IsHighlighted,
            SubItemsJson = SerializeSubItems(request.SubItems)
        };

        dbContext.Events.Add(ev);
        await dbContext.SaveChangesAsync(cancellationToken);

        ev.Area = area;
        var dto = MapToEventDto(ev);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<EventDetailDto?> UpdateAsync(Guid id, SaveEventRequest request, CancellationToken cancellationToken = default)
    {
        var ev = await dbContext.Events
            .Include(e => e.Area)
            .Include(e => e.RecurrenceRule)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (ev is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            ev.Title = request.Title.Trim();
        }

        ev.Description = request.Description?.Trim();
        ev.Location = request.Location?.Trim();

        if (request.AreaId != Guid.Empty)
        {
            ev.AreaId = request.AreaId;
        }

        ev.StartAt = request.StartAt;
        ev.EndAt = request.EndAt >= request.StartAt ? request.EndAt : request.StartAt.AddHours(1);
        ev.IsAllDay = request.IsAllDay;
        ev.IsHighlighted = request.IsHighlighted;
        ev.SubItemsJson = SerializeSubItems(request.SubItems);

        ApplyRecurrenceRuleUpdate(ev, request.RecurrenceFrequency);

        await dbContext.SaveChangesAsync(cancellationToken);

        var reloaded = await dbContext.Events
            .Include(e => e.Area)
            .Include(e => e.RecurrenceRule)
            .FirstAsync(e => e.Id == ev.Id, cancellationToken);

        var dto = MapToEventDto(reloaded);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ev = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (ev is null)
        {
            return false;
        }

        ev.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private void ApplyRecurrenceRuleUpdate(CalendarEvent ev, string? recurrenceFrequency)
    {
        if (string.IsNullOrWhiteSpace(recurrenceFrequency))
        {
            return;
        }

        if (recurrenceFrequency.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            if (ev.RecurrenceRule is not null)
            {
                dbContext.RecurrenceRules.Remove(ev.RecurrenceRule);
            }

            ev.RecurrenceRuleId = null;
            ev.RecurrenceRule = null;
            return;
        }

        if (!Enum.TryParse<RecurrenceFrequency>(recurrenceFrequency, true, out var parsedFreq))
        {
            return;
        }

        if (ev.RecurrenceRule is not null)
        {
            ev.RecurrenceRule.Frequency = parsedFreq;
            ev.RecurrenceRule.StartsOn = DateOnly.FromDateTime(ev.StartAt.UtcDateTime);
        }
        else
        {
            var newRule = new RecurrenceRule
            {
                Id = Guid.NewGuid(),
                UserId = ev.UserId,
                Frequency = parsedFreq,
                Interval = 1,
                StartsOn = DateOnly.FromDateTime(ev.StartAt.UtcDateTime)
            };
            dbContext.RecurrenceRules.Add(newRule);
            ev.RecurrenceRuleId = newRule.Id;
            ev.RecurrenceRule = newRule;
        }
    }

    private static RecurrenceRule? CreateRecurrenceRule(Guid userId, string? recurrenceFrequency, DateOnly startsOn)
    {
        if (string.IsNullOrWhiteSpace(recurrenceFrequency) ||
            recurrenceFrequency.Equals("None", StringComparison.OrdinalIgnoreCase) ||
            !Enum.TryParse<RecurrenceFrequency>(recurrenceFrequency, true, out var parsedFreq))
        {
            return null;
        }

        return new RecurrenceRule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Frequency = parsedFreq,
            Interval = 1,
            StartsOn = startsOn
        };
    }

    private static string? SerializeSubItems(IReadOnlyList<string>? subItems)
    {
        if (subItems is not { Count: > 0 })
        {
            return null;
        }

        var valid = subItems.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToArray();
        return valid.Length == 0 ? null : JsonSerializer.Serialize(valid);
    }

    private static EventDetailDto MapToEventDto(CalendarEvent ev)
    {
        var hour = ev.StartAt.Hour;
        var period = hour < 12 ? "Manhã" : hour < 18 ? "Tarde" : "Noite";
        var subItems = string.IsNullOrWhiteSpace(ev.SubItemsJson)
            ? Array.Empty<string>()
            : JsonSerializer.Deserialize<string[]>(ev.SubItemsJson) ?? Array.Empty<string>();

        return new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.AreaId,
            ev.Area?.Name ?? "Geral",
            ev.Area?.Slug ?? "geral",
            ev.Area?.Color ?? "#a9ccf0",
            ev.Location,
            ev.StartAt,
            ev.EndAt,
            ev.StartAt.ToString("HH:mm"),
            period,
            ev.IsAllDay,
            ev.IsHighlighted,
            subItems,
            ev.RecurrenceRule?.Frequency.ToString() ?? "None");
    }
}
