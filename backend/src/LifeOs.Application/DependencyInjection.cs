using LifeOs.Application.Areas.Services;
using LifeOs.Application.Calendar.Services;
using LifeOs.Application.Dashboard.Services;
using LifeOs.Application.Events.Services;
using LifeOs.Application.Habits.Services;
using LifeOs.Application.Inbox.Services;
using LifeOs.Application.Kanban.Services;
using LifeOs.Application.LifeTracker.Services;
using LifeOs.Application.Notifications.Services;
using LifeOs.Application.Projects.Services;
using LifeOs.Application.Settings.Services;
using LifeOs.Application.Tasks.Services;
using Microsoft.Extensions.DependencyInjection;

namespace LifeOs.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAreaService, AreaService>();
        services.AddScoped<ILabelService, LabelService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<IKanbanService, KanbanService>();
        services.AddScoped<IInboxService, InboxService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IHabitService, HabitService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<ILifeTrackerService, LifeTrackerService>();
        services.AddScoped<IDashboardService, DashboardService>();
        return services;
    }
}
