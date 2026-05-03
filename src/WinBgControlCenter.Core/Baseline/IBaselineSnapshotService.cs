namespace WinBgControlCenter.Core.Baseline;

public interface IBaselineSnapshotService
{
    Task<BaselineSnapshot> CreateAsync(CancellationToken cancellationToken);
}
