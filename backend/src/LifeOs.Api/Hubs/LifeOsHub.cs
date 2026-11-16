using LifeOs.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace LifeOs.Api.Hubs;

public class LifeOsHub : Hub
{
}

public sealed class SignalRNotificationService(IHubContext<LifeOsHub> hubContext) : IRealtimeNotificationService
{
    public Task NotifyDashboardChangedAsync(CancellationToken cancellationToken = default) =>
        hubContext.Clients.All.SendAsync("DashboardChanged", cancellationToken);

    public Task NotifyTaskUpdatedAsync(object payload, CancellationToken cancellationToken = default) =>
        hubContext.Clients.All.SendAsync("TaskUpdated", payload, cancellationToken);
}
