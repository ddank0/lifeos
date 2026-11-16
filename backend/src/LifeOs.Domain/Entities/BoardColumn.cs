using LifeOs.Domain.Common;
using LifeOs.Domain.Enums;

namespace LifeOs.Domain.Entities;

public class BoardColumn : BaseEntity
{
    public Guid BoardId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TaskItemStatus StatusMapping { get; set; }
    public int Position { get; set; }

    public Board? Board { get; set; }
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
