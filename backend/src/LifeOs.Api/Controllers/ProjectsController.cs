using LifeOs.Application.Projects.DTOs;
using LifeOs.Application.Projects.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/projects")]
[Route("api/projects")]
public class ProjectsController(IProjectService projectService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectDetailDto>>> GetProjects(
        [FromQuery] string? areaSlug = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var list = await projectService.GetProjectsAsync(areaSlug, status, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDetailDto>> CreateProject(
        [FromBody] SaveProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("O nome do projeto é obrigatório.");
        }

        var created = await projectService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/projects/{created.Id}", created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProjectDetailDto>> UpdateProject(
        Guid id,
        [FromBody] SaveProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var updated = await projectService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await projectService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
