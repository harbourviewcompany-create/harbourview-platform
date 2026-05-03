using Xunit;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Monitoring;
using WinBgControlCenter.Core.Time;
using WinBgControlCenter.Simulation;

namespace WinBgControlCenter.Core.Tests;

public sealed class SpikeRecorderTests
{
    [Fact]
    public async Task SpikeRecorder_RecordsReviewOnlySimulationSpike()
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var dashboard = await new DashboardDataService(clock, Batch1ProofGenerator.BuildInventory(clock)).CreateSnapshotAsync(CancellationToken.None);
        var recorder = new SpikeRecorder(clock, new SpikeRecorderOptions(50, SpikeRecorderMode.Simulation));
        var spike = recorder.Evaluate(dashboard);
        Assert.NotNull(spike);
        Assert.Equal("Review", spike!.Recommendation);
        Assert.Equal(SpikeRecorderMode.Simulation, spike.Mode);
        Assert.Null(recorder.Evaluate(dashboard with { CpuPercent = 1 }));
    }
}
