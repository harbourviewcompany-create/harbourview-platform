namespace WinBgControlCenter.Core.Time;

public sealed class FixedClock : IClock
{
    public FixedClock(DateTimeOffset utcNow) => UtcNow = utcNow.ToUniversalTime();
    public DateTimeOffset UtcNow { get; private set; }
    public void Advance(TimeSpan value) => UtcNow = UtcNow.Add(value);
}
