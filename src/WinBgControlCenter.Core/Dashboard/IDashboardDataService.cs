namespace WinBgControlCenter.Core.Dashboard;

public interface IDashboardDataService
{
    Task<DashboardSnapshot> CreateSnapshotAsync(CancellationToken cancellationToken);
}
