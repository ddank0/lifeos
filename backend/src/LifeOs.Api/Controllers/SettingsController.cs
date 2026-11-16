using LifeOs.Application.Settings.DTOs;
using LifeOs.Application.Settings.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/settings")]
[Route("api/settings")]
public class SettingsController(ISettingsService settingsService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<ActionResult<SettingsOverviewDto>> GetOverview(CancellationToken cancellationToken)
    {
        var overview = await settingsService.GetOverviewAsync(cancellationToken);
        return Ok(overview);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<SettingsOverviewDto>> UpdateProfile(
        [FromBody] UpdateProfileSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await settingsService.UpdateProfileAsync(request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }
}
