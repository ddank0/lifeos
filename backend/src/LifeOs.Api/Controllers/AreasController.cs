using LifeOs.Application.Areas.DTOs;
using LifeOs.Application.Areas.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/areas")]
public class AreasController(IAreaService areaService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AreaDto>>> GetAreas(CancellationToken cancellationToken)
    {
        var areas = await areaService.GetAllAsync(cancellationToken);
        return Ok(areas);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<AreaDto>> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var area = await areaService.GetBySlugAsync(slug, cancellationToken);
        return area is null ? NotFound() : Ok(area);
    }

    [HttpPost]
    public async Task<ActionResult<AreaDto>> CreateArea([FromBody] SaveAreaRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "O nome da área é obrigatório." });
        }

        var created = await areaService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/areas/{created.Slug}", created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AreaDto>> UpdateArea(Guid id, [FromBody] SaveAreaRequest request, CancellationToken cancellationToken)
    {
        var updated = await areaService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteArea(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await areaService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
