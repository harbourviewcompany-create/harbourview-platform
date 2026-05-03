using WinBgControlCenter.Core;
using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Simulation;

public sealed class SimulationProcessCollector : IProcessCollector
{
    private readonly IClock _clock;
    public SimulationProcessCollector(IClock clock) => _clock = clock;
    public Task<CollectionResult<ProcessUsageSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken)
    {
        var evidence = new CollectionEvidence("Fixture", "SimulationProcessCollector", true, false, EvidenceConfidence.High, "Fixture CPU values only.");
        var items = new[]
        {
            new ProcessUsageSnapshot(100, "browser.exe", "C:\\Program Files\\Browser\\browser.exe", "Example Vendor", SignatureStatus.Unknown, 42.5, CpuMeasurementSource.Fixture, 1000000, 500000, _clock.UtcNow.AddMinutes(-5), RiskClass.NeedsUserDecision, evidence),
            new ProcessUsageSnapshot(200, "worker.exe", "C:\\Program Files\\Worker\\worker.exe", "Example Vendor", SignatureStatus.Unknown, 12.0, CpuMeasurementSource.Fixture, 500000, 250000, _clock.UtcNow.AddMinutes(-3), RiskClass.NeedsUserDecision, evidence)
        };
        return Task.FromResult(new CollectionResult<ProcessUsageSnapshot>("SimulationProcessCollector", _clock.UtcNow, _clock.UtcNow, CollectionStatus.Succeeded, true, false, null, null, new[] { evidence }, items));
    }
}

public sealed class SimulationSystemResourceCollector : ISystemResourceCollector
{
    private readonly IClock _clock;
    public SimulationSystemResourceCollector(IClock clock) => _clock = clock;
    public Task<CollectionResult<ResourceUsageSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken)
    {
        var evidence = new CollectionEvidence("Fixture", "SimulationSystemResourceCollector", true, false, EvidenceConfidence.High, "Fixture resource values only.");
        var disks = new[] { new DiskUsageSnapshot("C", 1000000000, 400000000) };
        var item = new ResourceUsageSnapshot(55.5, CpuMeasurementSource.Fixture, 1000, 600000000, 1000000000, 60, disks, evidence);
        return Task.FromResult(new CollectionResult<ResourceUsageSnapshot>("SimulationSystemResourceCollector", _clock.UtcNow, _clock.UtcNow, CollectionStatus.Succeeded, true, false, null, null, new[] { evidence }, new[] { item }));
    }
}

public abstract class UnsupportedSimulationAuditCollector
{
    protected readonly IClock Clock;
    protected UnsupportedSimulationAuditCollector(IClock clock) => Clock = clock;
    protected Task<CollectionResult<AuditItemSnapshot>> Unsupported(string name)
        => Task.FromResult(CollectionResult<AuditItemSnapshot>.Unsupported(name, Clock.UtcNow, "Real collector unsupported in Batch 1. Simulation boundary preserved."));
}

public sealed class SimulationStartupItemCollector : UnsupportedSimulationAuditCollector, IStartupItemCollector
{
    public SimulationStartupItemCollector(IClock clock) : base(clock) { }
    public Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken) => Unsupported("SimulationStartupItemCollector");
}
public sealed class SimulationScheduledTaskCollector : UnsupportedSimulationAuditCollector, IScheduledTaskCollector
{
    public SimulationScheduledTaskCollector(IClock clock) : base(clock) { }
    public Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken) => Unsupported("SimulationScheduledTaskCollector");
}
public sealed class SimulationServiceCollector : UnsupportedSimulationAuditCollector, IServiceCollector
{
    public SimulationServiceCollector(IClock clock) : base(clock) { }
    public Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken) => Unsupported("SimulationServiceCollector");
}
public sealed class SimulationBrowserAuditCollector : UnsupportedSimulationAuditCollector, IBrowserAuditCollector
{
    public SimulationBrowserAuditCollector(IClock clock) : base(clock) { }
    public Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken) => Unsupported("SimulationBrowserAuditCollector");
}
public sealed class SimulationAppxAuditCollector : UnsupportedSimulationAuditCollector, IAppxAuditCollector
{
    public SimulationAppxAuditCollector(IClock clock) : base(clock) { }
    public Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken) => Unsupported("SimulationAppxAuditCollector");
}
