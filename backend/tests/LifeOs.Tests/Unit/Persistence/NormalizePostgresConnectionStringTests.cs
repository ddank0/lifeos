using LifeOs.Api;
using Xunit;

namespace LifeOs.Tests.Unit.Persistence;

public class NormalizePostgresConnectionStringTests
{
    [Fact]
    public void NormalizePostgresConnectionString_ShouldReturnDefault_WhenNullOrEmpty()
    {
        var result = Program.NormalizePostgresConnectionString(null);
        Assert.Contains("Host=localhost", result);

        var emptyResult = Program.NormalizePostgresConnectionString("   ");
        Assert.Contains("Host=localhost", emptyResult);
    }

    [Fact]
    public void NormalizePostgresConnectionString_ShouldParsePostgresUriAndRemoveChannelBinding()
    {
        const string neonUri = "postgresql://user_test:pass_secret@ep-cool-fog-12345.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        var result = Program.NormalizePostgresConnectionString(neonUri);

        Assert.Contains("Host=ep-cool-fog-12345.us-east-2.aws.neon.tech", result);
        Assert.Contains("Database=neondb", result);
        Assert.Contains("Username=user_test", result);
        Assert.Contains("Password=pass_secret", result);
        Assert.Contains("SSL Mode=Require", result);
        Assert.DoesNotContain("channel_binding", result);
    }

    [Fact]
    public void NormalizePostgresConnectionString_ShouldCleanKeyValueStringWithChannelBinding()
    {
        const string raw = "Host=localhost;Port=5432;Database=testdb;Username=usr;Password=pwd;channel_binding=require;";
        var result = Program.NormalizePostgresConnectionString(raw);

        Assert.DoesNotContain("channel_binding", result);
        Assert.Contains("Host=localhost", result);
    }
}
