using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Core.Collection;

public sealed class InventoryCollectionCoordinator : IInventoryCollector
{
    private readonly IClock _clock;
    private readonly IProcessCollector _processCollector;
    private readonly ISystemResourceCollector _resourceCollector;
    private readonly IStartupItemCollector _startupCollector;
    private readonly IScheduledTaskCollector _scheduledTaskCollector;
    private readonly IServiceCollector _serviceCollector;
    private readonly IBrowserAuditCollector _browserCollector;
    private readonly IAppxAuditCollector _appxCollector;

    public InventoryCollectionCoordinator(
        IClock clock,
        IProcessCollector processCollector,
        ISystemResourceCollector resourceCollector,
        IStartupItemCollector startupCollector,
        IScheduledTaskCollector scheduledTaskCollector,
        IServiceCollector serviceCollector,
        IBrowserAuditCollector browserCollector,
        IAppxAuditCollector appxCollector)
    {
        _clock = clock;
        _processCollector = processCollector;
        _resourceCollector = resourceCollector;
        _startupCollector = startupCollector;
        _scheduledTaskCollector = scheduledTaskCollector;
        _serviceCollector = serviceCollector;
        _browserCollector = browserCollector;
        _appxCollector = appxCollector;
    }

    public async Task<InventorySnapshot> CollectAsync(CollectionRequest request, CancellationToken cancellationToken)
    {
        var started = _clock.UtcNow;
        var process = await SafeCollect(() => _processCollector.CollectAsync(request, cancellationToken), "ProcessCollector", started, Array.Empty<ProcessUsageSnapshot>());
        var resource = await SafeCollect(() => _resourceCollector.CollectAsync(request, cancellationToken), "SystemResourceCollector", started, Array.Empty<ResourceUsageSnapshot>());
        var startup = await SafeCollect(() => _startupCollector.CollectAsync(request, cancellationToken), "StartupItemCollector", started, Array.Empty<AuditItemSnapshot>());
        var tasks = await SafeCollect(() => _scheduledTaskCollector.CollectAsync(request, cancellationToken), "ScheduledTaskCollector", started, Array.Empty<AuditItemSnapshot>());
        var services = await SafeCollect(() => _serviceCollector.CollectAsync(request, cancellationToken), "ServiceCollector", started, Array.Empty<AuditItemSnapshot>());
        var browsers = await SafeCollect(() => _browserCollector.CollectAsync(request, cancellationToken), "BrowserAuditCollector", started, Array.Empty<AuditItemSnapshot>());
        var appx = await SafeCollect(() => _appxCollector.CollectAsync(request, cancellationToken), "AppxAuditCollector", started, Array.Empty<AuditItemSnapshot>());

        var statuses = new[] { process.Status, resource.Status, startup.Status, tasks.Status, services.Status, browsers.Status, appx.Status };
        var aggregate = statuses.All(s => s == CollectionStatus.Succeeded) ? CollectionStatus.Succeeded : CollectionStatus.Partial;
        var evidence = new[] { new CollectionEvidence("Local", "Coordinator", true, false, EvidenceConfidence.Medium, "Partial results are preserved. No mutation capability present.") };

        return new InventorySnapshot(Guid.NewGuid().ToString("N"), _clock.UtcNow, process, resource, startup, tasks, services, browsers, appx, aggregate, evidence, false);
    }

    private async Task<CollectionResult<T>> SafeCollect<T>(Func<Task<CollectionResult<T>>> collect, string name, DateTimeOffset started, IReadOnlyList<T> empty)
    {
        try
        {
            return await collect();
        }
        catch (OperationCanceledException)
        {
            return CollectionResult<T>.TimedOutResult(name, started, _clock.UtcNow);
        }
        catch (UnauthorizedAccessException ex)
        {
            return new CollectionResult<T>(name, started, _clock.UtcNow, CollectionStatus.AccessDenied, false, false, "AccessDenied", ex.GetType().Name,
                new[] { new CollectionEvidence("Local", name, true, false, EvidenceConfidence.Unknown, "Access denied. Treated as unknown, not safe.") }, empty);
        }
        catch (Exception ex)
        {
            return new CollectionResult<T>(name, started, _clock.UtcNow, CollectionStatus.Failed, false, false, ex.GetType().Name, "Collector failed without exposing raw command output.",
                new[] { new CollectionEvidence("Local", name, true, false, EvidenceConfidence.Unknown, "Failure preserved as safe evidence.") }, empty);
        }
    }
}
