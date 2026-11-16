using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Inbox.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Inbox.Services;

public interface IInboxService
{
    Task<IReadOnlyList<QuickNoteDto>> GetNotesAsync(bool includeProcessed = false, string? areaSlug = null, CancellationToken cancellationToken = default);
    Task<QuickNoteDto> CreateAsync(SaveQuickNoteRequest request, CancellationToken cancellationToken = default);
    Task<QuickNoteDto?> ConvertAsync(Guid id, ConvertQuickNoteRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class InboxService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : IInboxService
{
    public async Task<IReadOnlyList<QuickNoteDto>> GetNotesAsync(
        bool includeProcessed = false,
        string? areaSlug = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.QuickNotes
            .Include(n => n.Area)
            .AsQueryable();

        if (!includeProcessed)
        {
            query = query.Where(n => !n.IsProcessed);
        }

        if (!string.IsNullOrWhiteSpace(areaSlug) && areaSlug != "all")
        {
            var slug = areaSlug.Trim().ToLowerInvariant();
            query = query.Where(n => n.Area != null && n.Area.Slug == slug);
        }

        var notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);

        return notes.Select(MapToDto).ToList();
    }

    public async Task<QuickNoteDto> CreateAsync(SaveQuickNoteRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        Area? area = null;
        if (request.AreaId.HasValue && request.AreaId.Value != Guid.Empty)
        {
            area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId.Value, cancellationToken);
        }

        area ??= await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken);

        var noteType = Enum.TryParse<QuickNoteType>(request.NoteType, true, out var parsedType)
            ? parsedType
            : QuickNoteType.Note;

        var priority = !string.IsNullOrWhiteSpace(request.Priority) &&
                       Enum.TryParse<TaskPriority>(request.Priority, true, out var parsedPrio)
            ? parsedPrio
            : (TaskPriority?)null;

        var targetDate = DateOnly.TryParse(request.TargetDate, out var parsedDate)
            ? parsedDate
            : (DateOnly?)null;

        var note = new QuickNote
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = area?.Id,
            Content = request.Content.Trim(),
            NoteType = noteType,
            Priority = priority,
            TargetDate = targetDate,
            IsProcessed = false
        };

        dbContext.QuickNotes.Add(note);
        await dbContext.SaveChangesAsync(cancellationToken);

        note.Area = area;
        var dto = MapToDto(note);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<QuickNoteDto?> ConvertAsync(Guid id, ConvertQuickNoteRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var note = await dbContext.QuickNotes
            .Include(n => n.Area)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);

        if (note is null)
        {
            return null;
        }

        var targetAreaId = request.AreaId ?? note.AreaId;
        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == targetAreaId, cancellationToken)
                   ?? await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken)
                   ?? throw new InvalidOperationException("Área não encontrada.");

        var targetDate = DateOnly.TryParse(request.TargetDate, out var parsedDate)
            ? parsedDate
            : note.TargetDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var targetTime = TimeOnly.TryParse(request.TargetTime, out var parsedTime)
            ? parsedTime
            : new TimeOnly(9, 0);

        if (string.Equals(request.TargetType, "Event", StringComparison.OrdinalIgnoreCase))
        {
            var startAt = new DateTimeOffset(targetDate.ToDateTime(targetTime), TimeSpan.Zero);
            var ev = new CalendarEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = area.Id,
                Title = note.Content,
                StartAt = startAt,
                EndAt = startAt.AddHours(1),
                IsAllDay = string.IsNullOrWhiteSpace(request.TargetTime),
                IsHighlighted = false
            };

            dbContext.Events.Add(ev);
            note.ProcessedEntityId = ev.Id;
        }
        else
        {
            var prio = !string.IsNullOrWhiteSpace(request.Priority) &&
                       Enum.TryParse<TaskPriority>(request.Priority, true, out var parsedPrio)
                ? parsedPrio
                : note.Priority ?? TaskPriority.Medium;

            var task = new TaskItem
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = area.Id,
                Title = note.Content,
                Priority = prio,
                Status = TaskItemStatus.Todo,
                StartDate = targetDate,
                DueDate = targetDate,
                DueTime = string.IsNullOrWhiteSpace(request.TargetTime) ? null : targetTime,
                BoardPosition = 50
            };

            dbContext.Tasks.Add(task);
            note.ProcessedEntityId = task.Id;
        }

        note.AreaId = area.Id;
        note.Area = area;
        note.IsProcessed = true;

        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);

        return MapToDto(note);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var note = await dbContext.QuickNotes.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (note is null)
        {
            return false;
        }

        dbContext.QuickNotes.Remove(note);
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private static QuickNoteDto MapToDto(QuickNote note) =>
        new(
            note.Id,
            note.Content,
            note.AreaId,
            note.Area?.Name ?? "Caixa Geral",
            note.Area?.Slug ?? "geral",
            note.Area?.Color ?? "#8bd3c7",
            note.NoteType.ToString(),
            note.Priority?.ToString(),
            note.TargetDate?.ToString("yyyy-MM-dd"),
            note.IsProcessed,
            note.ProcessedEntityId,
            note.CreatedAt);
}
