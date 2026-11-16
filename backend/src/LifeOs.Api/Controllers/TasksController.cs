using LifeOs.Application.Tasks.DTOs;
using LifeOs.Application.Tasks.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/tasks")]
public class TasksController(ITaskService taskService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskDetailDto>>> GetTasks(
        [FromQuery] Guid? areaId,
        [FromQuery] string? areaSlug,
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] bool? overdueOnly,
        CancellationToken cancellationToken)
    {
        var filter = new TaskQueryFilter(areaId, areaSlug, priority, status, search, overdueOnly);
        var items = await taskService.GetTasksAsync(filter, cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var task = await taskService.GetByIdAsync(id, cancellationToken);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDetailDto>> CreateTask([FromBody] SaveTaskRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "O título da tarefa é obrigatório." });
        }

        var created = await taskService.CreateAsync(request, cancellationToken);
        return Created($"/api/v1/tasks/{created.Id}", created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskDetailDto>> UpdateTask(Guid id, [FromBody] SaveTaskRequest request, CancellationToken cancellationToken)
    {
        var updated = await taskService.UpdateAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await taskService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
