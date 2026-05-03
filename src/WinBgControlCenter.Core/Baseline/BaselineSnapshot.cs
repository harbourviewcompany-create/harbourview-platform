using WinBgControlCenter.Core.Collection;
using WinBgControlCenter.Core.Dashboard;

namespace WinBgControlCenter.Core.Baseline;

public sealed record BaselineSnapshot(
    string SnapshotId,
    DateTimeOffset CreatedUtc,
    BaselineIdentity MachineAndUserIdentity,
    string AppVersion,
    InventorySnapshot CollectorResults,
    DashboardSnapshot DashboardSnapshot,
    string RiskSummary,
    bool MutationCapabilityPresent);
