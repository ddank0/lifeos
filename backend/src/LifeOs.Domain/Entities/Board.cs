using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class Board : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid? AreaId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDefault { get; set; }

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
    public Project? Project { get; set; }
    public ICollection<BoardColumn> Columns { get; set; } = new List<BoardColumn>();
}
