using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Notifications.DTOs;
using LifeOs.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Notifications.Services;

public interface INotificationService
{
    Task<NotificationCenterDto> GetCenterAsync(CancellationToken cancellationToken = default);
    Task<ReminderDto> CreateReminderAsync(CreateReminderRequest request, CancellationToken cancellationToken = default);
    Task<int> ProcessDueRemindersAsync(CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> MarkAllAsReadAsync(CancellationToken cancellationToken = default);
}

public sealed class NotificationService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService realtimeNotifications) : INotificationService
{
    public async Task<NotificationCenterDto> GetCenterAsync(CancellationToken cancellationToken = default)
    {
        await ProcessDueRemindersAsync(cancellationToken);

        var notifications = await dbContext.Notifications
            .OrderByDescending(n => n.CreatedAt)
            .Take(30)
            .Select(n => new NotificationDto(
                n.Id,
                n.Title,
                n.Message,
                n.NotificationType,
                n.ReferenceId,
                n.IsRead,
                n.CreatedAt))
            .ToListAsync(cancellationToken);

        var unreadCount = await dbContext.Notifications.CountAsync(n => !n.IsRead, cancellationToken);

        var reminders = await dbContext.Reminders
            .Include(r => r.Task)
            .Include(r => r.Event)
            .Where(r => !r.IsSent)
            .OrderBy(r => r.RemindAt)
            .Select(r => new ReminderDto(
                r.Id,
                r.TaskId,
                r.EventId,
                r.Task != null ? r.Task.Title : (r.Event != null ? r.Event.Title : "Lembrete agendado"),
                r.RemindAt,
                r.IsSent))
            .ToListAsync(cancellationToken);

        return new NotificationCenterDto(unreadCount, notifications, reminders);
    }

    public async Task<ReminderDto> CreateReminderAsync(
        CreateReminderRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var reminder = new Reminder
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TaskId = request.TaskId,
            EventId = request.EventId,
            RemindAt = request.RemindAt,
            IsSent = false
        };

        dbContext.Reminders.Add(reminder);
        await dbContext.SaveChangesAsync(cancellationToken);

        var targetTitle = "Lembrete agendado";
        if (request.TaskId.HasValue)
        {
            var task = await dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId.Value, cancellationToken);
            if (task is not null) targetTitle = task.Title;
        }
        else if (request.EventId.HasValue)
        {
            var ev = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == request.EventId.Value, cancellationToken);
            if (ev is not null) targetTitle = ev.Title;
        }

        return new ReminderDto(
            reminder.Id,
            reminder.TaskId,
            reminder.EventId,
            targetTitle,
            reminder.RemindAt,
            reminder.IsSent);
    }

    public async Task<int> ProcessDueRemindersAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var dueReminders = await dbContext.Reminders
            .IgnoreQueryFilters()
            .Include(r => r.Task)
            .Include(r => r.Event)
            .Where(r => !r.IsSent && r.RemindAt <= now)
            .ToListAsync(cancellationToken);

        if (dueReminders.Count == 0)
        {
            return 0;
        }

        foreach (var reminder in dueReminders)
        {
            var targetTitle = reminder.Task?.Title
                              ?? reminder.Event?.Title
                              ?? "Compromisso / Tarefa LIFEOS";

            dbContext.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = reminder.UserId,
                Title = $"Lembrete: {targetTitle}",
                Message = $"Horário agendado atingido ({reminder.RemindAt:dd/MM HH:mm}).",
                NotificationType = "reminder",
                ReferenceId = reminder.TaskId ?? reminder.EventId,
                IsRead = false
            });

            reminder.IsSent = true;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await realtimeNotifications.NotifyDashboardChangedAsync(cancellationToken);
        return dueReminders.Count;
    }

    public async Task<bool> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (notification is null)
        {
            return false;
        }

        notification.IsRead = true;
        notification.ReadAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(CancellationToken cancellationToken = default)
    {
        var unread = await dbContext.Notifications
            .Where(n => !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ReadAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return unread.Count;
    }
}
