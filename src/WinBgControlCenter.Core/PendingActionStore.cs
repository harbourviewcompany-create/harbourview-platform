using System.Text.Json;

namespace WinBgControlCenter.Core;

public sealed class PendingActionStore
{
    private readonly string _path;
    public PendingActionStore(string path) { _path = path; Directory.CreateDirectory(_path); }
    public void Write(PendingActionRecord record) => File.WriteAllText(Path.Combine(_path, record.PendingActionId + ".json"), JsonSerializer.Serialize(record));
    public IReadOnlyList<PendingActionRecord> GetIncomplete() => Directory.EnumerateFiles(_path, "*.json").Select(f => JsonSerializer.Deserialize<PendingActionRecord>(File.ReadAllText(f))!).Where(r => r.Status is not "Completed" and not "Failed" and not "Blocked").ToArray();
}
