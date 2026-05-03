namespace WinBgControlCenter.Core;

public sealed class TimeoutSafetyMapper
{
    public bool ActionsAllowedFromTimeoutResult<T>(TimeoutResult<T> result) => false;
}
