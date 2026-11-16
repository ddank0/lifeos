using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Common;
using LifeOs.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Infrastructure.Persistence;

public class LifeOsDbContext(
    DbContextOptions<LifeOsDbContext> options,
    ICurrentUserService currentUserService)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), ILifeOsDbContext
{
    public Guid? CurrentUserId => currentUserService.UserId;

    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<BoardColumn> BoardColumns => Set<BoardColumn>();
    public DbSet<RecurrenceRule> RecurrenceRules => Set<RecurrenceRule>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<CalendarEvent> Events => Set<CalendarEvent>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<TaskLabel> TaskLabels => Set<TaskLabel>();
    public DbSet<QuickNote> QuickNotes => Set<QuickNote>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitCompletion> HabitCompletions => Set<HabitCompletion>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<LifeMetric> LifeMetrics => Set<LifeMetric>();
    public DbSet<LifeMetricEntry> LifeMetricEntries => Set<LifeMetricEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(b =>
        {
            b.ToTable("users");
            b.Property(u => u.FullName).HasMaxLength(120).IsRequired();
            b.Property(u => u.ThemePreference).HasMaxLength(16).HasDefaultValue("dark");
        });

        builder.Entity<Area>(b =>
        {
            b.ToTable("areas");
            b.Property(x => x.Name).HasMaxLength(80).IsRequired();
            b.Property(x => x.Slug).HasMaxLength(80).IsRequired();
            b.Property(x => x.Color).HasMaxLength(16).IsRequired();
            b.Property(x => x.Icon).HasMaxLength(50).IsRequired();
            b.HasIndex(x => new { x.UserId, x.Slug });
            b.HasQueryFilter(x => (CurrentUserId == null || x.UserId == CurrentUserId) && x.DeletedAt == null);
        });

        builder.Entity<Project>(b =>
        {
            b.ToTable("projects");
            b.Property(x => x.Name).HasMaxLength(150).IsRequired();
            b.HasOne(x => x.Area).WithMany(a => a.Projects).HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(x => new { x.UserId, x.AreaId });
            b.HasQueryFilter(x => (CurrentUserId == null || x.UserId == CurrentUserId) && x.DeletedAt == null);
        });

        builder.Entity<Board>(b =>
        {
            b.ToTable("boards");
            b.Property(x => x.Name).HasMaxLength(120).IsRequired();
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<BoardColumn>(b =>
        {
            b.ToTable("board_columns");
            b.Property(x => x.Name).HasMaxLength(80).IsRequired();
            b.HasOne(x => x.Board).WithMany(bd => bd.Columns).HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(x => CurrentUserId == null || (x.Board != null && x.Board.UserId == CurrentUserId));
        });

        builder.Entity<RecurrenceRule>(b =>
        {
            b.ToTable("recurrence_rules");
            b.Property(x => x.DaysOfWeekMask).HasMaxLength(32);
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<TaskItem>(b =>
        {
            b.ToTable("tasks");
            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.HasOne(x => x.Area).WithMany(a => a.Tasks).HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Project).WithMany(p => p.Tasks).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.BoardColumn).WithMany(c => c.Tasks).HasForeignKey(x => x.BoardColumnId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.RecurrenceRule).WithMany().HasForeignKey(x => x.RecurrenceRuleId).OnDelete(DeleteBehavior.SetNull);
            b.HasIndex(x => new { x.UserId, x.Status, x.DueDate });
            b.HasIndex(x => new { x.UserId, x.AreaId });
            b.HasQueryFilter(x => (CurrentUserId == null || x.UserId == CurrentUserId) && x.DeletedAt == null);
        });

        builder.Entity<CalendarEvent>(b =>
        {
            b.ToTable("events");
            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.Location).HasMaxLength(200);
            b.HasOne(x => x.Area).WithMany(a => a.Events).HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.RecurrenceRule).WithMany().HasForeignKey(x => x.RecurrenceRuleId).OnDelete(DeleteBehavior.SetNull);
            b.HasIndex(x => new { x.UserId, x.StartAt, x.EndAt });
            b.HasQueryFilter(x => (CurrentUserId == null || x.UserId == CurrentUserId) && x.DeletedAt == null);
        });

        builder.Entity<Label>(b =>
        {
            b.ToTable("labels");
            b.Property(x => x.Name).HasMaxLength(60).IsRequired();
            b.Property(x => x.Color).HasMaxLength(16).IsRequired();
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<TaskLabel>(b =>
        {
            b.ToTable("task_labels");
            b.HasKey(x => new { x.TaskId, x.LabelId });
            b.HasOne(x => x.Task).WithMany(t => t.TaskLabels).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Label).WithMany(l => l.TaskLabels).HasForeignKey(x => x.LabelId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(x => CurrentUserId == null || (x.Label != null && x.Label.UserId == CurrentUserId));
        });

        builder.Entity<QuickNote>(b =>
        {
            b.ToTable("quick_notes");
            b.Property(x => x.Content).IsRequired();
            b.HasOne(x => x.Area).WithMany(a => a.QuickNotes).HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.SetNull);
            b.HasIndex(x => new { x.UserId, x.IsProcessed });
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<Habit>(b =>
        {
            b.ToTable("habits");
            b.Property(x => x.Name).HasMaxLength(120).IsRequired();
            b.HasOne(x => x.Area).WithMany(a => a.Habits).HasForeignKey(x => x.AreaId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<HabitCompletion>(b =>
        {
            b.ToTable("habit_completions");
            b.HasOne(x => x.Habit).WithMany(h => h.Completions).HasForeignKey(x => x.HabitId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.HabitId, x.CompletedOn }).IsUnique();
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<Reminder>(b =>
        {
            b.ToTable("reminders");
            b.HasOne(x => x.Task).WithMany(t => t.Reminders).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Event).WithMany(e => e.Reminders).HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.UserId, x.RemindAt, x.IsSent });
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<Notification>(b =>
        {
            b.ToTable("notifications");
            b.Property(x => x.Title).HasMaxLength(160).IsRequired();
            b.Property(x => x.Message).HasMaxLength(500).IsRequired();
            b.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });

        builder.Entity<LifeMetric>(b =>
        {
            b.ToTable("life_metrics");
            b.Property(x => x.Name).HasMaxLength(100).IsRequired();
            b.Property(x => x.Unit).HasMaxLength(20).IsRequired();
            b.Property(x => x.DailyTarget).HasPrecision(12, 2);
            b.Property(x => x.StepIncrement).HasPrecision(12, 2);
            b.HasIndex(x => new { x.UserId, x.AreaId, x.DeletedAt });
            b.HasQueryFilter(x => (CurrentUserId == null || x.UserId == CurrentUserId) && x.DeletedAt == null);
        });

        builder.Entity<LifeMetricEntry>(b =>
        {
            b.ToTable("life_metric_entries");
            b.Property(x => x.Value).HasPrecision(12, 2);
            b.HasIndex(x => new { x.UserId, x.MetricId, x.EntryDate });
            b.HasQueryFilter(x => CurrentUserId == null || x.UserId == CurrentUserId);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
