using WinBgControlCenter.Core.Dashboard;

namespace WinBgControlCenter.Core.Collection;

public sealed record AuditItemSnapshot(
    string Id,
    string Name,
    string Vendor,
    string Description,
    CollectionEvidence Evidence);

public sealed record InventorySnapshot(
    string SnapshotId,
    DateTimeOffset CreatedUtc,
    CollectionResult<ProcessUsageSnapshot> ProcessResults,
    CollectionResult<ResourceUsageSnapshot> ResourceResults,
    CollectionResult<AuditItemSnapshot> StartupItemResults,
    CollectionResult<AuditItemSnapshot> ScheduledTaskResults,
    CollectionResult<AuditItemSnapshot> ServiceResults,
    CollectionResult<AuditItemSnapshot> BrowserAuditResults,
    CollectionResult<AuditItemSnapshot> AppxAuditResults,
    CollectionStatus AggregateStatus,
    IReadOnlyList<CollectionEvidence> Evidence,
    bool MutationCapabilityPresent);
