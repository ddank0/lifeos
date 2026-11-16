using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Areas.Services;

public interface IAreaService
{
    Task<IReadOnlyList<AreaDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AreaDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<AreaDto> CreateAsync(SaveAreaRequest request, CancellationToken cancellationToken = default);
    Task<AreaDto?> UpdateAsync(Guid id, SaveAreaRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class AreaService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService,
    IRealtimeNotificationService notifications) : IAreaService
{
    public async Task<IReadOnlyList<AreaDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-1);
        return await dbContext.Areas
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .Select(a => new AreaDto(
                a.Id,
                a.Name,
                a.Slug,
                a.Description,
                a.Color,
                a.Icon,
                a.SortOrder,
                a.IsDefault,
                a.Tasks.Count(t => t.DeletedAt == null && t.Status != TaskItemStatus.Done && t.Status != TaskItemStatus.Cancelled),
                a.Tasks.Count(t => t.DeletedAt == null && t.Status == TaskItemStatus.Done),
                a.Events.Count(e => e.DeletedAt == null && e.EndAt >= cutoff)))
            .ToListAsync(cancellationToken);
    }

    public async Task<AreaDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var normalized = slug.Trim().ToLowerInvariant();
        var cutoff = DateTimeOffset.UtcNow.AddDays(-1);
        return await dbContext.Areas
            .Where(a => a.Slug == normalized)
            .Select(a => new AreaDto(
                a.Id,
                a.Name,
                a.Slug,
                a.Description,
                a.Color,
                a.Icon,
                a.SortOrder,
                a.IsDefault,
                a.Tasks.Count(t => t.DeletedAt == null && t.Status != TaskItemStatus.Done && t.Status != TaskItemStatus.Cancelled),
                a.Tasks.Count(t => t.DeletedAt == null && t.Status == TaskItemStatus.Done),
                a.Events.Count(e => e.DeletedAt == null && e.EndAt >= cutoff)))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<AreaDto> CreateAsync(SaveAreaRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var maxOrder = await dbContext.Areas.Select(a => (int?)a.SortOrder).MaxAsync(cancellationToken) ?? 0;

        var area = new Area
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Slug = Slugify(request.Name),
            Description = request.Description?.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#a9ccf0" : request.Color.Trim(),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "folder" : request.Icon.Trim(),
            SortOrder = maxOrder + 1,
            IsDefault = false
        };

        dbContext.Areas.Add(area);
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);

        return new AreaDto(
            area.Id,
            area.Name,
            area.Slug,
            area.Description,
            area.Color,
            area.Icon,
            area.SortOrder,
            area.IsDefault,
            0,
            0,
            0);
    }

    public async Task<AreaDto?> UpdateAsync(Guid id, SaveAreaRequest request, CancellationToken cancellationToken = default)
    {
        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (area is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            area.Name = request.Name.Trim();
            area.Slug = Slugify(request.Name);
        }

        area.Description = request.Description?.Trim();

        if (!string.IsNullOrWhiteSpace(request.Color))
        {
            area.Color = request.Color.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Icon))
        {
            area.Icon = request.Icon.Trim();
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);

        var pendingCount = await dbContext.Tasks.CountAsync(
            t => t.AreaId == area.Id && t.Status != TaskItemStatus.Done && t.Status != TaskItemStatus.Cancelled,
            cancellationToken);
        var doneCount = await dbContext.Tasks.CountAsync(
            t => t.AreaId == area.Id && t.Status == TaskItemStatus.Done,
            cancellationToken);
        var eventsCount = await dbContext.Events.CountAsync(e => e.AreaId == area.Id, cancellationToken);

        return new AreaDto(
            area.Id,
            area.Name,
            area.Slug,
            area.Description,
            area.Color,
            area.Icon,
            area.SortOrder,
            area.IsDefault,
            pendingCount,
            doneCount,
            eventsCount);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (area is null)
        {
            return false;
        }

        area.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await notifications.NotifyDashboardChangedAsync(cancellationToken);
        return true;
    }

    private static string Slugify(string text)
    {
        var normalized = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        var clean = Regex.Replace(builder.ToString().Normalize(NormalizationForm.FormC), @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(clean) ? "area" : clean;
    }
}
