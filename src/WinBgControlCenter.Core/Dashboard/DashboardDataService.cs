using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Core.Dashboard;

public sealed class DashboardDataService : IDashboardDataService
{
    private readonly IClock _clock;
    private readonly IInventoryCollector _inventoryCollector;

    public DashboardDataService(IClock clock, IInventoryCollector inventoryCollector)
    {
        _clock = clock;
        _inventoryCollector = inventoryCollector;
    }

    public async Task<DashboardSnapshot> CreateSnapshotAsync(CancellationToken cancellationToken)
    {
        var inventory = await _inventoryCollector.CollectAsync(CollectionRequest.Default(_clock.UtcNow), cancellationToken);
        var resource = inventory.ResourceResults.Items.FirstOrDefault();
        var processes = inventory.ProcessResults.Items.OrderByDescending(p => p.CpuPercent ?? -1).Take(10).ToArray();
        return new DashboardSnapshot(
            _clock.UtcNow,
            resource?.CpuPercent,
            resource?.CpuMeasurementSource ?? CpuMeasurementSource.Unknown,
            resource?.CpuSampleWindowMs ?? 0,
            resource?.MemoryUsedBytes ?? 0,
            resource?.MemoryTotalBytes ?? 0,
            resource?.MemoryPercent ?? 0,
            resource?.DiskSummaries ?? Array.Empty<DiskUsageSnapshot>(),
            processes,
            inventory.AggregateStatus);
    }
}
