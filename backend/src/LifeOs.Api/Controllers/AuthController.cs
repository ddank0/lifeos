using LifeOs.Application.Auth.DTOs;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Entities;
using LifeOs.Infrastructure.Persistence.Seeders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace LifeOs.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    IJwtTokenGenerator jwtTokenGenerator,
    ICurrentUserService currentUserService,
    UserOnboardingService onboardingService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "E-mail e senha são obrigatórios." });
        }

        var existing = await userManager.FindByEmailAsync(request.Email.Trim());
        if (existing is not null)
        {
            return Conflict(new { message = "E-mail já cadastrado." });
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email.Trim().ToLowerInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? "Usuário LIFEOS" : request.FullName.Trim(),
            ThemePreference = "dark"
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Não foi possível registrar o usuário.",
                errors = result.Errors.Select(e => e.Description)
            });
        }

        await onboardingService.ProvisionInitialWorkspaceAsync(user.Id, cancellationToken);

        var (token, expiresAt) = jwtTokenGenerator.GenerateToken(user);
        var profile = new UserProfileDto(user.Id, user.FullName, user.Email!, user.ThemePreference);
        return CreatedAtAction(nameof(Me), new AuthResponse(token, expiresAt, profile));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Credenciais inválidas." });
        }

        var (token, expiresAt) = jwtTokenGenerator.GenerateToken(user);
        var profile = new UserProfileDto(user.Id, user.FullName, user.Email!, user.ThemePreference);
        return Ok(new AuthResponse(token, expiresAt, profile));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> Me()
    {
        if (currentUserService.UserId is null)
        {
            return Unauthorized();
        }

        var user = await userManager.FindByIdAsync(currentUserService.UserId.Value.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new UserProfileDto(user.Id, user.FullName, user.Email ?? string.Empty, user.ThemePreference));
    }

    [Authorize]
    [HttpPatch("theme")]
    public async Task<ActionResult> UpdateTheme([FromBody] UpdateThemeRequest request)
    {
        if (currentUserService.UserId is null)
        {
            return Unauthorized();
        }

        var user = await userManager.FindByIdAsync(currentUserService.UserId.Value.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        user.ThemePreference = request.ThemePreference == "light" ? "light" : "dark";
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        return Ok(new { themePreference = user.ThemePreference });
    }
}
