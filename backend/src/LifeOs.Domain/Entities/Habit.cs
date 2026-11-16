using LifeOs.Domain.Common;
using LifeOs.Domain.Enums;

namespace LifeOs.Domain.Entities;

public class Habit : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid AreaId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RecurrenceFrequency Frequency { get; set; } = RecurrenceFrequency.Daily;
    public string? DaysOfWeekMask { get; set; }
    public int TargetPerWeek { get; set; } = 7;
    public int CurrentStreak { get; set; }
    public int BestStreak { get; set; }
    public bool IsActive { get; set; } = true;

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
    public ICollection<HabitCompletion> Completions { get; set; } = new List<HabitCompletion>();
}
