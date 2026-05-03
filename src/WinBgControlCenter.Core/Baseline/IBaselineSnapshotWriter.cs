namespace WinBgControlCenter.Core.Baseline;

public interface IBaselineSnapshotWriter
{
    Task<string> WriteAsync(BaselineSnapshot snapshot, string directory, CancellationToken cancellationToken);
}
