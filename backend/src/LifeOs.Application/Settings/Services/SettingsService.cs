using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Settings.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Settings.Services;

public interface ISettingsService
{
    Task<SettingsOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<SettingsOverviewDto?> UpdateProfileAsync(UpdateProfileSettingsRequest request, CancellationToken cancellationToken = default);
}

public sealed class SettingsService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    UserManager<ApplicationUser> userManager) : ISettingsService
{
    public async Task<SettingsOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var user = await userManager.FindByIdAsync(userId.ToString())
                   ?? throw new InvalidOperationException("Usuário não encontrado.");

        var productivity = await BuildProductivityReportAsync(cancellationToken);

        return new SettingsOverviewDto(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            user.ThemePreference,
            productivity);
    }

    public async Task<SettingsOverviewDto?> UpdateProfileAsync(
        UpdateProfileSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId;
        if (!userId.HasValue)
        {
            return null;
        }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.FullName = request.FullName.Trim();
        }

        if (request.ThemePreference is "dark" or "light")
        {
            user.ThemePreference = request.ThemePreference;
        }

        await userManager.UpdateAsync(user);
        return await GetOverviewAsync(cancellationToken);
    }

    private async Task<ProductivityReportDto> BuildProductivityReportAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTimeOffset.UtcNow;

        var areas = await dbContext.Areas
            .OrderBy(a => a.SortOrder)
            .ToListAsync(cancellationToken);

        var tasks = await dbContext.Tasks
            .Where(t => t.Status != TaskItemStatus.Cancelled)
            .ToListAsync(cancellationToken);

        var events = await dbContext.Events
            .Where(e => e.EndAt >= now)
            .ToListAsync(cancellationToken);

        var activeProjectsCount = await dbContext.Projects
            .CountAsync(p => p.Status == ProjectStatus.Active || p.Status == ProjectStatus.Planning, cancellationToken);

        var activeHabits = await dbContext.Habits
            .Where(h => h.IsActive)
            .ToListAsync(cancellationToken);

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Status == TaskItemStatus.Done);
        var pendingTasks = tasks.Count(t => t.Status != TaskItemStatus.Done);
        var overdueTasks = tasks.Count(t => t.Status != TaskItemStatus.Done && t.DueDate.HasValue && t.DueDate.Value < today);
        var overallRate = totalTasks == 0 ? 0 : (int)Math.Round(completedTasks * 100.0 / totalTasks);
        var bestStreak = activeHabits.Count == 0 ? 0 : activeHabits.Max(h => h.BestStreak);

        var breakdown = areas
            .Select(a =>
            {
                var areaTasks = tasks.Where(t => t.AreaId == a.Id).ToList();
                var areaDone = areaTasks.Count(t => t.Status == TaskItemStatus.Done);
                var areaPending = areaTasks.Count(t => t.Status != TaskItemStatus.Done);
                var areaEvents = events.Count(e => e.AreaId == a.Id);
                var rate = areaTasks.Count == 0 ? 0 : (int)Math.Round(areaDone * 100.0 / areaTasks.Count);

                return new AreaProductivityItemDto(
                    a.Id,
                    a.Name,
                    a.Color,
                    areaPending,
                    areaDone,
                    areaEvents,
                    rate);
            })
            .ToList();

        return new ProductivityReportDto(
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            overallRate,
            activeProjectsCount,
            activeHabits.Count,
            bestStreak,
            breakdown);
    }
}
