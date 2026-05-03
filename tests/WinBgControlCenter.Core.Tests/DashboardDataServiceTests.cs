using Xunit;
using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;
using WinBgControlCenter.Simulation;

namespace WinBgControlCenter.Core.Tests;

public sealed class DashboardDataServiceTests
{
    [Fact]
    public async Task DashboardSnapshot_IsReadOnlyAndFixtureCpuSourced()
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var snapshot = await new DashboardDataService(clock, Batch1ProofGenerator.BuildInventory(clock)).CreateSnapshotAsync(CancellationToken.None);
        Assert.Equal(CpuMeasurementSource.Fixture, snapshot.CpuMeasurementSource);
        Assert.Equal(CollectionStatus.Partial, snapshot.CollectionStatus);
        Assert.NotEmpty(snapshot.TopProcesses);
        Assert.All(snapshot.TopProcesses, p => Assert.NotEqual(RiskClass.NeverTouch, p.RiskClass));
    }
}
