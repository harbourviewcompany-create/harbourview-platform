using Xunit;
using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;
using WinBgControlCenter.Simulation;

namespace WinBgControlCenter.Core.Tests;

public sealed class InventoryCollectionCoordinatorTests
{
    [Fact]
    public async Task AggregateInventory_PreservesUnsupportedPartialResults()
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var inventory = await Batch1ProofGenerator.BuildInventory(clock).CollectAsync(CollectionRequest.Default(clock.UtcNow), CancellationToken.None);
        Assert.False(inventory.MutationCapabilityPresent);
        Assert.Equal(CollectionStatus.Partial, inventory.AggregateStatus);
        Assert.Equal(CollectionStatus.Unsupported, inventory.ServiceResults.Status);
    }

    [Fact]
    public async Task CollectorFailure_DoesNotCorruptOtherResults()
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var coordinator = new InventoryCollectionCoordinator(clock, new ThrowingProcessCollector(), new SimulationSystemResourceCollector(clock), new SimulationStartupItemCollector(clock), new SimulationScheduledTaskCollector(clock), new SimulationServiceCollector(clock), new SimulationBrowserAuditCollector(clock), new SimulationAppxAuditCollector(clock));
        var inventory = await coordinator.CollectAsync(CollectionRequest.Default(clock.UtcNow), CancellationToken.None);
        Assert.Equal(CollectionStatus.Failed, inventory.ProcessResults.Status);
        Assert.Equal(CollectionStatus.Succeeded, inventory.ResourceResults.Status);
        Assert.False(inventory.ProcessResults.ActionsAllowed);
    }

    private sealed class ThrowingProcessCollector : IProcessCollector
    {
        public Task<CollectionResult<ProcessUsageSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken) => throw new InvalidOperationException("boom");
    }
}
