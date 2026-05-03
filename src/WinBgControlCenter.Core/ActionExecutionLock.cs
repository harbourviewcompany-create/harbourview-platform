namespace WinBgControlCenter.Core;

public sealed class ActionExecutionLock
{
    private int _locked;
    public bool TryAcquire() => Interlocked.Exchange(ref _locked, 1) == 0;
    public void Release() => Interlocked.Exchange(ref _locked, 0);
}
