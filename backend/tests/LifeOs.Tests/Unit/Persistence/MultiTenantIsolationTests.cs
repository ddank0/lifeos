using FluentAssertions;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Entities;
using LifeOs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LifeOs.Tests.Unit.Persistence;

public class MultiTenantIsolationTests
{
    private sealed class FakeCurrentUserService(Guid? userId, string? email = null, bool isDemo = false) : ICurrentUserService
    {
        public Guid? UserId => userId;
        public string? Email => email;
        public bool IsDemoUser => isDemo;
    }

    [Fact]
    public async Task QueryFilter_ShouldReturnOnlyCurrentUsersAreasAndTasks()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();

        var options = new DbContextOptionsBuilder<LifeOsDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        await using (var seedCtx = new LifeOsDbContext(options, new FakeCurrentUserService(null)))
        {
            var areaA = new Area
            {
                Id = Guid.NewGuid(),
                UserId = userA,
                Name = "Trabalho",
                Slug = "trabalho",
                Color = "#a9ccf0",
                Icon = "briefcase"
            };
            var areaB = new Area
            {
                Id = Guid.NewGuid(),
                UserId = userB,
                Name = "Estudo",
                Slug = "estudo",
                Color = "#8bd3c7",
                Icon = "book-open"
            };

            seedCtx.Areas.AddRange(areaA, areaB);
            seedCtx.Tasks.AddRange(
                new TaskItem { Id = Guid.NewGuid(), UserId = userA, AreaId = areaA.Id, Title = "Tarefa A" },
                new TaskItem { Id = Guid.NewGuid(), UserId = userB, AreaId = areaB.Id, Title = "Tarefa B" }
            );
            await seedCtx.SaveChangesAsync();
        }

        await using var userACtx = new LifeOsDbContext(options, new FakeCurrentUserService(userA));
        var visibleAreas = await userACtx.Areas.ToListAsync();
        var visibleTasks = await userACtx.Tasks.ToListAsync();

        visibleAreas.Should().HaveCount(1);
        visibleAreas[0].Name.Should().Be("Trabalho");
        visibleTasks.Should().HaveCount(1);
        visibleTasks[0].Title.Should().Be("Tarefa A");
    }
}
