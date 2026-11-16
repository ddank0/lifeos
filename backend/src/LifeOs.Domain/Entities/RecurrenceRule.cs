using LifeOs.Domain.Common;
using LifeOs.Domain.Enums;

namespace LifeOs.Domain.Entities;

public class RecurrenceRule : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public RecurrenceFrequency Frequency { get; set; } = RecurrenceFrequency.Daily;
    public int Interval { get; set; } = 1;
    public string? DaysOfWeekMask { get; set; }
    public DateOnly StartsOn { get; set; }
    public DateOnly? EndsOn { get; set; }

    public ApplicationUser? User { get; set; }
}
