using LifeOs.Application.Inbox.DTOs;
using LifeOs.Application.Inbox.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/inbox")]
[Route("api/inbox")]
public class InboxController(IInboxService inboxService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QuickNoteDto>>> GetNotes(
        [FromQuery] bool includeProcessed = false,
        [FromQuery] string? areaSlug = null,
        CancellationToken cancellationToken = default)
    {
        var list = await inboxService.GetNotesAsync(includeProcessed, areaSlug, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<QuickNoteDto>> CreateNote(
        [FromBody] SaveQuickNoteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("O conteúdo da anotação é obrigatório.");
        }

        var created = await inboxService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/inbox/{created.Id}", created);
    }

    [HttpPost("{id:guid}/convert")]
    public async Task<ActionResult<QuickNoteDto>> ConvertNote(
        Guid id,
        [FromBody] ConvertQuickNoteRequest request,
        CancellationToken cancellationToken = default)
    {
        var converted = await inboxService.ConvertAsync(id, request, cancellationToken);
        return converted is null ? NotFound() : Ok(converted);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNote(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await inboxService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
