using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Core.Baseline;

public sealed class BaselineSnapshotService : IBaselineSnapshotService
{
    private readonly IClock _clock;
    private readonly IInventoryCollector _inventoryCollector;
    private readonly IDashboardDataService _dashboardDataService;
    private readonly Func<BaselineIdentity> _identityFactory;

    public BaselineSnapshotService(IClock clock, IInventoryCollector inventoryCollector, IDashboardDataService dashboardDataService, Func<BaselineIdentity>? identityFactory = null)
    {
        _clock = clock;
        _inventoryCollector = inventoryCollector;
        _dashboardDataService = dashboardDataService;
        _identityFactory = identityFactory ?? BaselineIdentity.Redacted;
    }

    public async Task<BaselineSnapshot> CreateAsync(CancellationToken cancellationToken)
    {
        var inventory = await _inventoryCollector.CollectAsync(CollectionRequest.Default(_clock.UtcNow), cancellationToken);
        var dashboard = await _dashboardDataService.CreateSnapshotAsync(cancellationToken);
        return new BaselineSnapshot(Guid.NewGuid().ToString("N"), _clock.UtcNow, _identityFactory(), "1.0.0-batch1", inventory, dashboard, "Read-only Batch 1 baseline. No mutation capability present.", false);
    }
}
