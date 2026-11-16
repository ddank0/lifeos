using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class Label : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#e59882";

    public ApplicationUser? User { get; set; }
    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
}
