using LifeOs.Application.Tasks.DTOs;
using LifeOs.Application.Tasks.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/labels")]
public class LabelsController(ILabelService labelService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LabelDto>>> GetLabels(CancellationToken cancellationToken)
    {
        var labels = await labelService.GetAllAsync(cancellationToken);
        return Ok(labels);
    }

    [HttpPost]
    public async Task<ActionResult<LabelDto>> CreateLabel([FromBody] SaveLabelRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "O nome da etiqueta é obrigatório." });
        }

        var created = await labelService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/labels/{created.Id}", created);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteLabel(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await labelService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
