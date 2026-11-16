using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Tasks.DTOs;
using LifeOs.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LifeOs.Application.Tasks.Services;

public interface ILabelService
{
    Task<IReadOnlyList<LabelDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LabelDto> CreateAsync(SaveLabelRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class LabelService(
    ILifeOsDbContext dbContext,
    ICurrentUserService currentUserService) : ILabelService
{
    public async Task<IReadOnlyList<LabelDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Labels
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto(l.Id, l.Name, l.Color))
            .ToListAsync(cancellationToken);
    }

    public async Task<LabelDto> CreateAsync(SaveLabelRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.UserId
                     ?? throw new InvalidOperationException("Usuário não autenticado.");

        var label = new Label
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#e59882" : request.Color.Trim()
        };

        dbContext.Labels.Add(label);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new LabelDto(label.Id, label.Name, label.Color);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var label = await dbContext.Labels.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (label is null)
        {
            return false;
        }

        dbContext.Labels.Remove(label);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
