namespace WinBgControlCenter.Core.Collection;

public enum EvidenceConfidence { High, Medium, Low, Unknown }

public sealed record CollectionEvidence(
    string Source,
    string CollectionMethod,
    bool IsReadOnly,
    bool TimedOut,
    EvidenceConfidence Confidence,
    string Notes);
