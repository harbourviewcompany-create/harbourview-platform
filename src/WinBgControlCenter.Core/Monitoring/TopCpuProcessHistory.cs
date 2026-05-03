namespace WinBgControlCenter.Core.Monitoring;

public sealed class TopCpuProcessHistory
{
    private readonly int _maxSamples;
    private readonly Queue<CpuSample> _samples = new();
    private readonly object _gate = new();

    public TopCpuProcessHistory(int maxSamples)
    {
        if (maxSamples <= 0) throw new ArgumentOutOfRangeException(nameof(maxSamples));
        _maxSamples = maxSamples;
    }

    public int MaxSamples => _maxSamples;

    public void Add(CpuSample sample)
    {
        lock (_gate)
        {
            _samples.Enqueue(sample);
            while (_samples.Count > _maxSamples) _samples.Dequeue();
        }
    }

    public IReadOnlyList<CpuSample> GetSamples()
    {
        lock (_gate) return _samples.OrderBy(s => s.CapturedUtc).ToArray();
    }

    public IReadOnlyList<CpuSample> GetTop(int count)
    {
        lock (_gate) return _samples.OrderByDescending(s => s.CpuPercent).ThenBy(s => s.ProcessName, StringComparer.OrdinalIgnoreCase).Take(count).ToArray();
    }

    public void PruneOlderThan(DateTimeOffset cutoffUtc)
    {
        lock (_gate)
        {
            var kept = _samples.Where(s => s.CapturedUtc >= cutoffUtc).OrderBy(s => s.CapturedUtc).ToArray();
            _samples.Clear();
            foreach (var sample in kept) _samples.Enqueue(sample);
        }
    }
}
