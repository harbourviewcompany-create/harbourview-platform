using Xunit;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Monitoring;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Core.Tests;

public sealed class TopCpuProcessHistoryTests
{
    [Fact]
    public void RingBuffer_CapsPrunesOrdersAndRanksSamples()
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var history = new TopCpuProcessHistory(2);
        history.Add(new CpuSample(1, "a", 10, CpuMeasurementSource.Fixture, clock.UtcNow));
        clock.Advance(TimeSpan.FromSeconds(1));
        history.Add(new CpuSample(1, "a", 20, CpuMeasurementSource.Fixture, clock.UtcNow));
        clock.Advance(TimeSpan.FromSeconds(1));
        history.Add(new CpuSample(2, "b", 90, CpuMeasurementSource.Fixture, clock.UtcNow));
        var samples = history.GetSamples();
        Assert.Equal(2, samples.Count);
        Assert.DoesNotContain(samples, s => s.CpuPercent == 10);
        Assert.Equal("b", history.GetTop(1).Single().ProcessName);
        Assert.True(samples.SequenceEqual(samples.OrderBy(s => s.CapturedUtc)));
    }
}
