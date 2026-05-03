using WinBgControlCenter.Core;

namespace WinBgControlCenter.Simulation;

public sealed class SimulationActionExecutor
{
    private readonly ForbiddenActionGuard _guard = new();
    public ActionResult Execute(ActionRequest request)
    {
        if (_guard.IsForbidden(request.ActionKind)) throw new InvalidOperationException("Forbidden action blocked in simulation.");
        return new ActionResult(true, "Simulation only. No host mutation performed.");
    }
}
