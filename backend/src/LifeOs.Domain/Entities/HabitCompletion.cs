using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class HabitCompletion : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid HabitId { get; set; }
    public DateOnly CompletedOn { get; set; }
    public string? Notes { get; set; }

    public ApplicationUser? User { get; set; }
    public Habit? Habit { get; set; }
}
