using LifeOs.Domain.Common;
using LifeOs.Domain.Enums;

namespace LifeOs.Domain.Entities;

public class QuickNote : BaseEntity, IUserOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid? AreaId { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuickNoteType NoteType { get; set; } = QuickNoteType.Note;
    public TaskPriority? Priority { get; set; }
    public DateOnly? TargetDate { get; set; }
    public bool IsProcessed { get; set; }
    public Guid? ProcessedEntityId { get; set; }

    public ApplicationUser? User { get; set; }
    public Area? Area { get; set; }
}
