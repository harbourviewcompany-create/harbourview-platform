using System.Text.Json;

namespace WinBgControlCenter.Core.Baseline;

public sealed class BaselineSnapshotWriter : IBaselineSnapshotWriter
{
    public async Task<string> WriteAsync(BaselineSnapshot snapshot, string directory, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, $"baseline-{snapshot.SnapshotId}.json");
        var json = JsonSerializer.Serialize(snapshot, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(path, json, cancellationToken);
        return path;
    }
}
