using Xunit;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Core.Tests;

public sealed class ClockTests
{
    [Fact]
    public void FixedClock_IsDeterministic()
    {
        var now = DateTimeOffset.Parse("2026-05-03T12:00:00Z");
        var clock = new FixedClock(now);
        Assert.Equal(now, clock.UtcNow);
        clock.Advance(TimeSpan.FromSeconds(5));
        Assert.Equal(now.AddSeconds(5), clock.UtcNow);
    }

    [Fact]
    public void SystemClock_ReturnsUtc()
    {
        Assert.Equal(TimeSpan.Zero, new SystemClock().UtcNow.Offset);
    }
}
