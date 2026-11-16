using LifeOs.Domain.Common;
using LifeOs.Domain.Enums;

namespace LifeOs.Domain.Entities;

public class Project : BaseEntity, IUserOwnedEntity, ISoftDeletable
{
    public Guid UserId { get; set; }
    public Guid AreaId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTimeOffset? DeletedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Board> Boards { get; set; } = new List<Board>();
}
