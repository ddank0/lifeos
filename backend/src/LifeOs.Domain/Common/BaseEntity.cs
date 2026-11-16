namespace LifeOs.Domain.Common;

public interface IUserOwnedEntity
{
    Guid UserId { get; set; }
}

public interface ISoftDeletable
{
    DateTimeOffset? DeletedAt { get; set; }
}

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
