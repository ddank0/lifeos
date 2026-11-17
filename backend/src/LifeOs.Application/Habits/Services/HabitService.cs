using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Habits.DTOs;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Habits.Services;

public interface IHabitService
{
    Task<IReadOnlyList<HabitDetailDto>> GetHabitsAsync(string? areaSlug = null, CancellationToken cancellationToken = default);
    Task<HabitDetailDto> CreateAsync(SaveHabitRequest request, CancellationToken cancellationToken = default);
    Task<HabitDetailDto?> UpdateAsync(Guid id, SaveHabitRequest request, CancellationToken cancellationToken = default);
    Task<HabitDetailDto?> ToggleCompletionAsync(Guid id, ToggleHabitCompletionRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class HabitService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : IHabitService
{
    public async Task<IReadOnlyList<HabitDetailDto>> GetHabitsAsync(
        string? areaSlug = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Habits
            .Include(h => h.Area)
            .Include(h => h.Completions)
            .Where(h => h.IsActive);

        if (!string.IsNullOrWhiteSpace(areaSlug) && areaSlug != "all")
        {
            var slug = areaSlug.Trim().ToLowerInvariant();
            query = query.Where(h => h.Area != null && h.Area.Slug == slug);
        }

        var list = await query
            .OrderByDescending(h => h.CurrentStreak)
            .ThenBy(h => h.Name)
            .ToListAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return list.Select(h => MapToDto(h, today)).ToList();
    }

    public async Task<HabitDetailDto> CreateAsync(SaveHabitRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        if (currentUserService.IsDemoUser)
        {
            var activeCount = await dbContext.Habits.CountAsync(h => h.IsActive, cancellationToken);
            if (activeCount >= 25)
            {
                throw new InvalidOperationException("Limite de 25 hábitos atingido para a conta de demonstração.");
            }
        }

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId, cancellationToken)
                   ?? await dbContext.Areas.OrderBy(a => a.SortOrder).FirstOrDefaultAsync(cancellationToken)
                   ?? throw new InvalidOperationException("Área não encontrada.");

        var frequency = Enum.TryParse<RecurrenceFrequency>(request.Frequency, true, out var parsedFreq)
            ? parsedFreq
            : RecurrenceFrequency.Daily;

        var habit = new Habit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = area.Id,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Frequency = frequency,
            TargetPerWeek = Math.Clamp(request.TargetPerWeek, 1, 7),
            CurrentStreak = 0,
            BestStreak = 0,
            IsActive = true
        };

        dbContext.Habits.Add(habit);
        await dbContext.SaveChangesAsync(cancellationToken);

        habit.Area = area;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dto = MapToDto(habit, today);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<HabitDetailDto?> UpdateAsync(Guid id, SaveHabitRequest request, CancellationToken cancellationToken = default)
    {
        var habit = await dbContext.Habits
            .Include(h => h.Area)
            .Include(h => h.Completions)
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);

        if (habit is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            habit.Name = request.Name.Trim();
        }

        habit.Description = request.Description?.Trim();

        if (request.AreaId != Guid.Empty)
        {
            habit.AreaId = request.AreaId;
        }

        if (Enum.TryParse<RecurrenceFrequency>(request.Frequency, true, out var parsedFreq))
        {
            habit.Frequency = parsedFreq;
        }

        habit.TargetPerWeek = Math.Clamp(request.TargetPerWeek, 1, 7);

        await dbContext.SaveChangesAsync(cancellationToken);

        var reloaded = await dbContext.Habits
            .Include(h => h.Area)
            .Include(h => h.Completions)
            .FirstAsync(h => h.Id == habit.Id, cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dto = MapToDto(reloaded, today);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return dto;
    }

    public async Task<HabitDetailDto?> ToggleCompletionAsync(
        Guid id,
        ToggleHabitCompletionRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var habit = await dbContext.Habits
            .Include(h => h.Area)
            .Include(h => h.Completions)
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);

        if (habit is null)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var targetDate = DateOnly.TryParse(request.Date, out var parsedDate) ? parsedDate : today;

        var existing = habit.Completions.FirstOrDefault(c => c.CompletedOn == targetDate);
        if (existing is not null)
        {
            dbContext.HabitCompletions.Remove(existing);
            habit.Completions.Remove(existing);
        }
        else
        {
            var completion = new HabitCompletion
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                HabitId = habit.Id,
                CompletedOn = targetDate,
                Notes = request.Notes?.Trim()
            };
            dbContext.HabitCompletions.Add(completion);
            habit.Completions.Add(completion);
        }

        RecalculateStreaks(habit, today);

        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);

        return MapToDto(habit, today);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var habit = await dbContext.Habits.FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
        if (habit is null)
        {
            return false;
        }

        habit.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private static void RecalculateStreaks(Habit habit, DateOnly today)
    {
        var dates = habit.Completions
            .Select(c => c.CompletedOn)
            .Distinct()
            .OrderByDescending(d => d)
            .ToList();

        if (dates.Count == 0)
        {
            habit.CurrentStreak = 0;
            return;
        }

        var currentStreak = 0;
        var cursor = dates.Contains(today) ? today : today.AddDays(-1);

        while (dates.Contains(cursor))
        {
            currentStreak++;
            cursor = cursor.AddDays(-1);
        }

        var ascending = dates.OrderBy(d => d).ToList();
        var bestRun = 1;
        var currentRun = 1;

        for (var i = 1; i < ascending.Count; i++)
        {
            if (ascending[i] == ascending[i - 1].AddDays(1))
            {
                currentRun++;
                if (currentRun > bestRun)
                {
                    bestRun = currentRun;
                }
            }
            else
            {
                currentRun = 1;
            }
        }

        habit.CurrentStreak = currentStreak;
        habit.BestStreak = Math.Max(habit.BestStreak, Math.Max(currentStreak, bestRun));
    }

    private static HabitDetailDto MapToDto(Habit habit, DateOnly today)
    {
        var dayAbbreviations = new[] { "D", "S", "T", "Q", "Q", "S", "S" };
        var completedDates = habit.Completions.Select(c => c.CompletedOn).ToHashSet();
        var lastSevenDays = new List<HabitDayCheckDto>(7);
        var weeklyCount = 0;

        for (var i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var isDone = completedDates.Contains(date);
            if (isDone)
            {
                weeklyCount++;
            }

            var dow = dayAbbreviations[(int)date.DayOfWeek];
            lastSevenDays.Add(new HabitDayCheckDto(
                date.ToString("yyyy-MM-dd"),
                $"{date.Day} {dow}",
                isDone,
                i == 0));
        }

        var target = Math.Max(1, habit.TargetPerWeek);
        var consistency = (int)Math.Min(100, Math.Round(weeklyCount * 100.0 / target));

        return new HabitDetailDto(
            habit.Id,
            habit.Name,
            habit.Description,
            habit.AreaId,
            habit.Area?.Name ?? "Rotina",
            habit.Area?.Slug ?? "rotina",
            habit.Area?.Color ?? "#c3b1e1",
            habit.Frequency.ToString(),
            habit.TargetPerWeek,
            habit.CurrentStreak,
            habit.BestStreak,
            weeklyCount,
            consistency,
            completedDates.Contains(today),
            habit.IsActive,
            lastSevenDays);
    }
}
