namespace LifeOs.Domain.Enums;

public enum TaskItemStatus
{
    Todo = 0,
    InProgress = 1,
    OnHold = 2,
    Done = 3,
    Cancelled = 4
}

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public enum QuickNoteType
{
    Task = 0,
    Event = 1,
    Reminder = 2,
    Note = 3
}

public enum RecurrenceFrequency
{
    Daily = 0,
    Weekly = 1,
    Monthly = 2,
    SpecificWeekdays = 3,
    CustomInterval = 4
}

public enum ProjectStatus
{
    Planning = 0,
    Active = 1,
    OnHold = 2,
    Completed = 3,
    Archived = 4
}
