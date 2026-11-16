using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class CalendarEvent : BaseEntity, IUserOwnedEntity, ISoftDeletable
{
    public Guid UserId { get; set; }
    public Guid AreaId { get; set; }
    public Guid? RecurrenceRuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? SubItemsJson { get; set; }
    public string? Location { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public DateTimeOffset EndAt { get; set; }
    public bool IsAllDay { get; set; }
    public bool IsHighlighted { get; set; }
    public bool IsCompleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
    public RecurrenceRule? RecurrenceRule { get; set; }
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
}
