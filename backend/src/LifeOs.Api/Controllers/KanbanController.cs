using LifeOs.Application.Kanban.DTOs;
using LifeOs.Application.Kanban.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/kanban")]
[Route("api/kanban")]
public class KanbanController(IKanbanService kanbanService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<KanbanBoardDto>> GetBoard(
        [FromQuery] Guid? areaId,
        [FromQuery] string? areaSlug,
        [FromQuery] Guid? projectId,
        [FromQuery] string? priority,
        [FromQuery] string? search,
        [FromQuery] bool? overdueOnly,
        CancellationToken cancellationToken)
    {
        var filter = new KanbanQueryFilter(areaId, areaSlug, projectId, priority, search, overdueOnly);
        var board = await kanbanService.GetBoardAsync(filter, cancellationToken);
        return Ok(board);
    }

    [HttpPatch("cards/{taskId:guid}/move")]
    public async Task<ActionResult<KanbanCardDto>> MoveCard(
        Guid taskId,
        [FromBody] MoveKanbanCardRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TargetStatus))
        {
            return BadRequest("Coluna de destino inválida.");
        }

        var updated = await kanbanService.MoveCardAsync(taskId, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }
}
