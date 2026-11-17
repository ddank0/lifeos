using LifeOs.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsDemoUser { get; }
}

public interface IJwtTokenGenerator
{
    (string Token, DateTimeOffset ExpiresAt) GenerateToken(ApplicationUser user);
}

public interface IRealtimeNotificationService
{
    Task NotifyDashboardChangedAsync(CancellationToken cancellationToken = default);
    Task NotifyTaskUpdatedAsync(object payload, CancellationToken cancellationToken = default);
}

public interface ILifeOsDbContext
{
    DbSet<Area> Areas { get; }
    DbSet<Project> Projects { get; }
    DbSet<Board> Boards { get; }
    DbSet<BoardColumn> BoardColumns { get; }
    DbSet<RecurrenceRule> RecurrenceRules { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<CalendarEvent> Events { get; }
    DbSet<Label> Labels { get; }
    DbSet<TaskLabel> TaskLabels { get; }
    DbSet<QuickNote> QuickNotes { get; }
    DbSet<Habit> Habits { get; }
    DbSet<HabitCompletion> HabitCompletions { get; }
    DbSet<Reminder> Reminders { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<LifeMetric> LifeMetrics { get; }
    DbSet<LifeMetricEntry> LifeMetricEntries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
