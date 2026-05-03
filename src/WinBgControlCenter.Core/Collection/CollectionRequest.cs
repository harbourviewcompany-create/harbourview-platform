namespace WinBgControlCenter.Core.Collection;

public sealed record CollectionRequest(TimeSpan Timeout, DateTimeOffset RequestedUtc)
{
    public static CollectionRequest Default(DateTimeOffset now) => new(TimeSpan.FromSeconds(5), now);
}
