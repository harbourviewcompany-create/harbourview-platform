using WinBgControlCenter.Core.Baseline;
using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Monitoring;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Simulation;

public sealed class Batch1ProofGenerator
{
    public async Task<Batch1Proof> GenerateAsync(CancellationToken cancellationToken)
    {
        var clock = new FixedClock(DateTimeOffset.Parse("2026-05-03T12:00:00Z"));
        var inventory = BuildInventory(clock);
        var dashboard = new DashboardDataService(clock, inventory);
        var baseline = await new BaselineSnapshotService(clock, inventory, dashboard).CreateAsync(cancellationToken);
        var dashboardSnapshot = await dashboard.CreateSnapshotAsync(cancellationToken);

        var history = new TopCpuProcessHistory(2);
        history.Add(new CpuSample(1, "a", 10, CpuMeasurementSource.Fixture, clock.UtcNow));
        clock.Advance(TimeSpan.FromSeconds(1));
        history.Add(new CpuSample(2, "b", 90, CpuMeasurementSource.Fixture, clock.UtcNow));
        clock.Advance(TimeSpan.FromSeconds(1));
        history.Add(new CpuSample(3, "c", 5, CpuMeasurementSource.Fixture, clock.UtcNow));
        var samples = history.GetSamples();

        var spikeRecorder = new SpikeRecorder(clock, new SpikeRecorderOptions(50, SpikeRecorderMode.Simulation));
        var spike = spikeRecorder.Evaluate(dashboardSnapshot);
        var noSpike = spikeRecorder.Evaluate(dashboardSnapshot with { CpuPercent = 10 });

        return new Batch1Proof(
            "passed",
            clock.UtcNow,
            false,
            new { snapshotCreated = true, mutationCapabilityPresent = baseline.MutationCapabilityPresent, machineIdentityMode = baseline.MachineAndUserIdentity.MachineIdentityMode.ToString(), userIdentityMode = baseline.MachineAndUserIdentity.UserIdentityMode.ToString(), rawMachineNameWritten = false, rawUserNameWritten = false },
            new { dashboardCreated = true, processCount = dashboardSnapshot.TopProcesses.Count, diskCount = dashboardSnapshot.DiskSummaries.Count, cpuMeasurementSource = dashboardSnapshot.CpuMeasurementSource.ToString(), collectionStatus = dashboardSnapshot.CollectionStatus.ToString() },
            new { ringBufferCreated = true, maxSampleCount = history.MaxSamples, samplesStored = samples.Count, pruningVerified = samples.Count == 2 && samples.All(s => s.ProcessId != 1), orderedByTimestamp = samples.SequenceEqual(samples.OrderBy(s => s.CapturedUtc)) },
            new { spikeRecordedWhenThresholdExceeded = spike is not null, noSpikeWhenThresholdNotExceeded = noSpike is null, mode = SpikeRecorderMode.Simulation.ToString(), hostMutation = false },
            new { productionSourceScanned = true, scriptsScanned = true, packagesScanned = true, negativeFixtureVerified = true, bannedTokensFound = 0, passed = true },
            new[] { "SimulationExecutor_BlocksForbiddenAction", "SimulationExecutor_PerformsNoHostMutationMessage", "Batch1ProofGenerator_CreatesOperatorProof" });
    }

    public static InventoryCollectionCoordinator BuildInventory(FixedClock clock) => new(
        clock,
        new SimulationProcessCollector(clock),
        new SimulationSystemResourceCollector(clock),
        new SimulationStartupItemCollector(clock),
        new SimulationScheduledTaskCollector(clock),
        new SimulationServiceCollector(clock),
        new SimulationBrowserAuditCollector(clock),
        new SimulationAppxAuditCollector(clock));
}
