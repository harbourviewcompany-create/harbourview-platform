namespace WinBgControlCenter.Core.Time;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
