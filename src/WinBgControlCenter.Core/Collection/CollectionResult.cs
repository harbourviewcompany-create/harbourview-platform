namespace WinBgControlCenter.Core.Collection;

public sealed record CollectionResult<T>(
    string CollectorName,
    DateTimeOffset StartedUtc,
    DateTimeOffset CompletedUtc,
    CollectionStatus Status,
    bool Succeeded,
    bool TimedOut,
    string? ErrorCode,
    string? ErrorMessage,
    IReadOnlyList<CollectionEvidence> Evidence,
    IReadOnlyList<T> Items)
{
    public bool ActionsAllowed => false;

    public static CollectionResult<T> Unsupported(string collectorName, DateTimeOffset now, string notes) =>
        new(collectorName, now, now, CollectionStatus.Unsupported, false, false, "Unsupported", notes,
            new[] { new CollectionEvidence("Local", "Unsupported", true, false, EvidenceConfidence.Unknown, notes) },
            Array.Empty<T>());

    public static CollectionResult<T> TimedOutResult(string collectorName, DateTimeOffset started, DateTimeOffset completed) =>
        new(collectorName, started, completed, CollectionStatus.TimedOut, false, true, "TimedOut", "Collection timed out.",
            new[] { new CollectionEvidence("Local", "Timeout", true, true, EvidenceConfidence.Unknown, "Timeout means unknown, not safe.") },
            Array.Empty<T>());
}
