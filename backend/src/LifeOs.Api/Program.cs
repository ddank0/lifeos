using System.Text;
using Hangfire;
using Hangfire.PostgreSql;
using LifeOs.Api.Hubs;
using LifeOs.Application;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Application.Notifications.Services;
using LifeOs.Domain.Entities;
using LifeOs.Infrastructure.Identity;
using LifeOs.Infrastructure.Persistence;
using LifeOs.Infrastructure.Persistence.Seeders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IRealtimeNotificationService, SignalRNotificationService>();
builder.Services.AddScoped<UserOnboardingService>();
builder.Services.AddApplicationServices();

var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");
var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                          ?? builder.Configuration["DATABASE_URL"]
                          ?? "Host=localhost;Port=5433;Database=lifeos_db;Username=lifeos_user;Password=lifeos_secret_pwd_2026";
var connectionString = NormalizePostgresConnectionString(rawConnectionString);

builder.Services.AddDbContext<LifeOsDbContext>(options =>
{
    if (useInMemory)
    {
        var dbName = builder.Configuration["InMemoryDatabaseName"] ?? "LifeOsInMemoryDb";
        options.UseInMemoryDatabase(dbName);
    }
    else
    {
        options.UseNpgsql(connectionString);
    }
});

builder.Services.AddScoped<ILifeOsDbContext>(sp => sp.GetRequiredService<LifeOsDbContext>());

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<LifeOsDbContext>()
    .AddDefaultTokenProviders();

var jwtSecret = builder.Configuration["Jwt:Secret"]
                ?? "LifeOsSuperSecretJwtSigningKey2026WithAtLeast32Bytes!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LifeOs.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LifeOs.Client";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

if (!useInMemory)
{
    builder.Services.AddHangfire(cfg =>
        cfg.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));
    builder.Services.AddHangfireServer();
}

builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var configuredOrigins = builder.Configuration["Cors:AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];

var allOrigins = new[] { "http://localhost:4200", "http://127.0.0.1:4200" }
    .Concat(configuredOrigins)
    .Distinct()
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("LifeOsCors", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                try
                {
                    var uri = new Uri(origin);
                    if (uri.Host == "localhost" || uri.Host == "127.0.0.1") return true;
                    if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)) return true;
                }
                catch
                {
                    // ignored
                }
                return allOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("LifeOsCors");
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.MapHub<LifeOsHub>("/hubs/lifeos");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LifeOsDbContext>();
    await db.Database.EnsureCreatedAsync();

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var onboarding = scope.ServiceProvider.GetRequiredService<UserOnboardingService>();
    const string demoEmail = "gabriel@lifeos.dev";
    var demoUser = await userManager.FindByEmailAsync(demoEmail);
    if (demoUser is null)
    {
        demoUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = demoEmail,
            Email = demoEmail,
            FullName = "Gabriel Miranda",
            ThemePreference = "dark"
        };
        var created = await userManager.CreateAsync(demoUser, "LifeOs@2026");
        if (created.Succeeded)
        {
            await onboarding.ProvisionInitialWorkspaceAsync(demoUser.Id);
        }
    }

    if (!useInMemory)
    {
        try
        {
            var recurringJobs = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
            recurringJobs.AddOrUpdate<INotificationService>(
                "process-due-reminders",
                service => service.ProcessDueRemindersAsync(CancellationToken.None),
                Cron.Minutely);
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogWarning(ex, "Nao foi possivel registrar o recurring job do Hangfire na inicializacao");
        }
    }
}

app.Run();

public partial class Program
{
    public static string NormalizePostgresConnectionString(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "Host=localhost;Port=5433;Database=lifeos_db;Username=lifeos_user;Password=lifeos_secret_pwd_2026";
        }

        if (raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(raw);
                var userInfo = uri.UserInfo.Split(':', 2);
                var username = Uri.UnescapeDataString(userInfo[0]);
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');

                var builder = new Npgsql.NpgsqlConnectionStringBuilder
                {
                    Host = host,
                    Port = port,
                    Database = string.IsNullOrEmpty(database) ? "neondb" : database,
                    Username = username,
                    Password = password,
                    SslMode = Npgsql.SslMode.Require,
                    Pooling = true
                };

                return builder.ConnectionString;
            }
            catch
            {
                var clean = System.Text.RegularExpressions.Regex.Replace(raw, @"[?&]channel_binding=[^&]+", "");
                clean = System.Text.RegularExpressions.Regex.Replace(clean, @"\?&", "?");
                if (clean.EndsWith("?"))
                {
                    clean = clean[..^1];
                }
                return clean;
            }
        }

        return System.Text.RegularExpressions.Regex.Replace(raw, @"channel_binding=[^;]+;?", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
    }
}
