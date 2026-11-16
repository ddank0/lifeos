namespace LifeOs.Application.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    string NotificationType,
    Guid? ReferenceId,
    bool IsRead,
    DateTimeOffset CreatedAt);

public record ReminderDto(
    Guid Id,
    Guid? TaskId,
    Guid? EventId,
    string TargetTitle,
    DateTimeOffset RemindAt,
    bool IsSent);

public record NotificationCenterDto(
    int UnreadCount,
    IReadOnlyList<NotificationDto> Notifications,
    IReadOnlyList<ReminderDto> UpcomingReminders);

public record CreateReminderRequest(
    Guid? TaskId,
    Guid? EventId,
    DateTimeOffset RemindAt);
