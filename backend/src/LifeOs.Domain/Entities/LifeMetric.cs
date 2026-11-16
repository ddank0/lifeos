using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class LifeMetric : BaseEntity, IUserOwnedEntity, ISoftDeletable
{
    public Guid UserId { get; set; }
    public Guid AreaId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal DailyTarget { get; set; }
    public decimal StepIncrement { get; set; } = 1.0m;
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? DeletedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
    public ICollection<LifeMetricEntry> Entries { get; set; } = new List<LifeMetricEntry>();
}
