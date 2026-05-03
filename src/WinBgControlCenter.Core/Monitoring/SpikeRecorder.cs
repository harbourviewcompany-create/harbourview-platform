using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;
using WinBgControlCenter.Core.Time;

namespace WinBgControlCenter.Core.Monitoring;

public sealed class SpikeRecorder : ISpikeRecorder
{
    private readonly IClock _clock;
    private readonly SpikeRecorderOptions _options;

    public SpikeRecorder(IClock clock, SpikeRecorderOptions options)
    {
        _clock = clock;
        _options = options;
    }

    public SpikeRecord? Evaluate(DashboardSnapshot snapshot)
    {
        if ((snapshot.CpuPercent ?? 0) < _options.CpuThresholdPercent) return null;
        var now = _clock.UtcNow;
        return new SpikeRecord(
            Guid.NewGuid().ToString("N"),
            now,
            now,
            "CPU",
            snapshot.CpuPercent ?? 0,
            _options.CpuThresholdPercent,
            snapshot.TopProcesses,
            snapshot,
            new CollectionEvidence("Local", "SpikeRecorder", true, false, EvidenceConfidence.Medium, "Review only. No mutation executed or scheduled."),
            _options.Mode,
            "Review");
    }
}
