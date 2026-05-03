namespace WinBgControlCenter.Simulation;

public sealed record Batch1Proof(
    string Status,
    DateTimeOffset GeneratedUtc,
    bool HostMutation,
    object BaselineSnapshotProof,
    object DashboardModelProof,
    object CpuHistoryProof,
    object SpikeRecorderProof,
    object NoMutationScanResult,
    IReadOnlyList<string> TestsExecuted);
