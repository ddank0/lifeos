namespace LifeOs.Application.Auth.DTOs;

public record RegisterRequest(string FullName, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record UpdateThemeRequest(string ThemePreference);

public record UserProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string ThemePreference,
    bool IsDemo = false);

public record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    UserProfileDto User);
