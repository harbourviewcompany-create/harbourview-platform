namespace WinBgControlCenter.Core.Collection;

public sealed record CollectionTimeoutPolicy(
    TimeSpan InventoryTimeout,
    TimeSpan ProcessTimeout,
    TimeSpan ResourceTimeout)
{
    public static CollectionTimeoutPolicy Default => new(TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
}
