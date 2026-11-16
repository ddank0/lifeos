using LifeOs.Domain.Common;

namespace LifeOs.Domain.Entities;

public class Notification : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string NotificationType { get; set; } = "reminder";
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }

    public ApplicationUser? User { get; set; }
}
