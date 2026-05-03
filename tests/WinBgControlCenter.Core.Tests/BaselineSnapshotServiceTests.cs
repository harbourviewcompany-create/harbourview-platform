using System.Text.Json;
using Xunit;
using WinBgControlCenter.Core.Baseline;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;
using WinBgControlCenter.Simulation;

namespace WinBgControlCenter.Core.Tests;

public sealed class BaselineSnapshotServiceTests
{
    [Fact]
    public async Task BaselineSnapshot_IsPrivacySafeAndMutationFree()
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var inventory = Batch1ProofGenerator.BuildInventory(clock);
        var service = new BaselineSnapshotService(clock, inventory, new DashboardDataService(clock, inventory));
        var snapshot = await service.CreateAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(snapshot);
        Assert.False(snapshot.MutationCapabilityPresent);
        Assert.DoesNotContain(Environment.MachineName, json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(Environment.UserName, json, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(IdentityMode.Redacted, snapshot.MachineAndUserIdentity.MachineIdentityMode);
        Assert.NotEmpty(snapshot.SnapshotId);
    }
}
