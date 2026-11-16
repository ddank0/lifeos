namespace LifeOs.Domain.Entities;

public class TaskLabel
{
    public Guid TaskId { get; set; }
    public TaskItem? Task { get; set; }

    public Guid LabelId { get; set; }
    public Label? Label { get; set; }
}
