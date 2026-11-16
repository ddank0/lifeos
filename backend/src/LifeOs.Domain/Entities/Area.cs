using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class Area : BaseEntity, IUserOwnedEntity, ISoftDeletable
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "#a9ccf0";
    public string Icon { get; set; } = "folder";
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<CalendarEvent> Events { get; set; } = new List<CalendarEvent>();
    public ICollection<Habit> Habits { get; set; } = new List<Habit>();
    public ICollection<QuickNote> QuickNotes { get; set; } = new List<QuickNote>();
}
