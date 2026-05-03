using WinBgControlCenter.Core.Collection;

namespace WinBgControlCenter.Core.Dashboard;

public enum SignatureStatus { Trusted, Untrusted, Unknown }

public sealed record DiskUsageSnapshot(string Name, long TotalBytes, long FreeBytes);

public sealed record ResourceUsageSnapshot(
    double? CpuPercent,
    CpuMeasurementSource CpuMeasurementSource,
    int CpuSampleWindowMs,
    long MemoryUsedBytes,
    long MemoryTotalBytes,
    double MemoryPercent,
    IReadOnlyList<DiskUsageSnapshot> DiskSummaries,
    CollectionEvidence Evidence);

public sealed record ProcessUsageSnapshot(
    int ProcessId,
    string ProcessName,
    string? ExecutablePath,
    string? Publisher,
    SignatureStatus SignatureStatus,
    double? CpuPercent,
    CpuMeasurementSource CpuMeasurementSource,
    long WorkingSetBytes,
    long PrivateMemoryBytes,
    DateTimeOffset? StartedUtc,
    RiskClass RiskClass,
    CollectionEvidence Evidence);

public sealed record DashboardSnapshot(
    DateTimeOffset CapturedUtc,
    double? CpuPercent,
    CpuMeasurementSource CpuMeasurementSource,
    int CpuSampleWindowMs,
    long MemoryUsedBytes,
    long MemoryTotalBytes,
    double MemoryPercent,
    IReadOnlyList<DiskUsageSnapshot> DiskSummaries,
    IReadOnlyList<ProcessUsageSnapshot> TopProcesses,
    CollectionStatus CollectionStatus);
