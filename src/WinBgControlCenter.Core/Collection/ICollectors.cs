using WinBgControlCenter.Core.Dashboard;

namespace WinBgControlCenter.Core.Collection;

public interface IInventoryCollector
{
    Task<InventorySnapshot> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface IProcessCollector
{
    Task<CollectionResult<ProcessUsageSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface ISystemResourceCollector
{
    Task<CollectionResult<ResourceUsageSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface IStartupItemCollector
{
    Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface IScheduledTaskCollector
{
    Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface IServiceCollector
{
    Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface IBrowserAuditCollector
{
    Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}

public interface IAppxAuditCollector
{
    Task<CollectionResult<AuditItemSnapshot>> CollectAsync(CollectionRequest request, CancellationToken cancellationToken);
}
