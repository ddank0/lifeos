using Microsoft.AspNetCore.Identity;

namespace LifeOs.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public string ThemePreference { get; set; } = "dark";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Area> Areas { get; set; } = new List<Area>();
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<CalendarEvent> Events { get; set; } = new List<CalendarEvent>();
    public ICollection<Board> Boards { get; set; } = new List<Board>();
    public ICollection<Label> Labels { get; set; } = new List<Label>();
    public ICollection<QuickNote> QuickNotes { get; set; } = new List<QuickNote>();
    public ICollection<Habit> Habits { get; set; } = new List<Habit>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
