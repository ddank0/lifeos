using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class LifeMetricEntry : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid MetricId { get; set; }
    public DateOnly EntryDate { get; set; }
    public decimal Value { get; set; }
    public string? Notes { get; set; }

    public ApplicationUser? User { get; set; }
    public LifeMetric? Metric { get; set; }
}
