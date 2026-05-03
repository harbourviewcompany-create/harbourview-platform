using WinBgControlCenter.Core.Dashboard;

namespace WinBgControlCenter.Core.Monitoring;

public sealed record CpuSample(int ProcessId, string ProcessName, double CpuPercent, CpuMeasurementSource Source, DateTimeOffset CapturedUtc);
