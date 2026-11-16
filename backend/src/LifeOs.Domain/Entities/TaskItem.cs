using LifeOs.Domain.Common;
using LifeOs.Domain.Enums;

namespace LifeOs.Domain.Entities;

public class TaskItem : BaseEntity, IUserOwnedEntity, ISoftDeletable
{
    public Guid UserId { get; set; }
    public Guid AreaId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? BoardColumnId { get; set; }
    public Guid? RecurrenceRuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public TimeOnly? DueTime { get; set; }
    public int BoardPosition { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
    public Project? Project { get; set; }
    public BoardColumn? BoardColumn { get; set; }
    public RecurrenceRule? RecurrenceRule { get; set; }
    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
}
