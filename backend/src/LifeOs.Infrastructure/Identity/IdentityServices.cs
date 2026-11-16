using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LifeOs.Infrastructure.Identity;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var raw = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? httpContextAccessor.HttpContext?.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}

public class JwtTokenGenerator(IConfiguration configuration) : IJwtTokenGenerator
{
    public (string Token, DateTimeOffset ExpiresAt) GenerateToken(ApplicationUser user)
    {
        var secret = configuration["Jwt:Secret"]
                     ?? "LifeOsSuperSecretJwtSigningKey2026WithAtLeast32Bytes!";
        var issuer = configuration["Jwt:Issuer"] ?? "LifeOs.Api";
        var audience = configuration["Jwt:Audience"] ?? "LifeOs.Client";
        var expiresAt = DateTimeOffset.UtcNow.AddDays(7);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("fullName", user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
