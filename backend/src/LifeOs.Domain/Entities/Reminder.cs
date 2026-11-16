using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class Reminder : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? EventId { get; set; }
    public DateTimeOffset RemindAt { get; set; }
    public bool IsSent { get; set; }
    public string? HangfireJobId { get; set; }

    public ApplicationUser? User { get; set; }
    public TaskItem? Task { get; set; }
    public CalendarEvent? Event { get; set; }
}
