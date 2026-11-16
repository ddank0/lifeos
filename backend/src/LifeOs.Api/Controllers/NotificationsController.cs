using LifeOs.Application.Notifications.DTOs;
using LifeOs.Application.Notifications.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
[Route("api/notifications")]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<NotificationCenterDto>> GetCenter(CancellationToken cancellationToken)
    {
        var center = await notificationService.GetCenterAsync(cancellationToken);
        return Ok(center);
    }

    [HttpPost("reminders")]
    public async Task<ActionResult<ReminderDto>> CreateReminder(
        [FromBody] CreateReminderRequest request,
        CancellationToken cancellationToken)
    {
        var created = await notificationService.CreateReminderAsync(request, cancellationToken);
        return Created($"/api/v1/notifications/reminders/{created.Id}", created);
    }

    [HttpPost("process-due")]
    public async Task<ActionResult> ProcessDueReminders(CancellationToken cancellationToken)
    {
        var processed = await notificationService.ProcessDueRemindersAsync(cancellationToken);
        return Ok(new { processedCount = processed });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var ok = await notificationService.MarkAsReadAsync(id, cancellationToken);
        return ok ? Ok(new { read = true }) : NotFound();
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var count = await notificationService.MarkAllAsReadAsync(cancellationToken);
        return Ok(new { markedCount = count });
    }
}
