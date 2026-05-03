using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;

namespace WinBgControlCenter.Core.Monitoring;

public enum SpikeRecorderMode { Simulation, ReadOnly }

public sealed record SpikeRecorderOptions(double CpuThresholdPercent, SpikeRecorderMode Mode);

public sealed record SpikeRecord(
    string SpikeId,
    DateTimeOffset StartedUtc,
    DateTimeOffset EndedUtc,
    string TriggerMetric,
    double TriggerValue,
    double Threshold,
    IReadOnlyList<ProcessUsageSnapshot> TopProcessesAtSpike,
    DashboardSnapshot DashboardSnapshotAtSpike,
    CollectionEvidence Evidence,
    SpikeRecorderMode Mode,
    string Recommendation);

public interface ISpikeRecorder
{
    SpikeRecord? Evaluate(DashboardSnapshot snapshot);
}
