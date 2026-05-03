namespace WinBgControlCenter.Core;

public sealed class ForbiddenActionGuard
{
    public static readonly IReadOnlySet<ActionKind> Forbidden = new HashSet<ActionKind>
    {
        ActionKind.RemoteWmi, ActionKind.FirewallRuleChange, ActionKind.PersistentDaemonInstall,
        ActionKind.BrowserCompanionInstall, ActionKind.BrowserExtensionDisable, ActionKind.BrowserExtensionUninstall,
        ActionKind.EtwMonitoringEnable, ActionKind.AppxUninstall, ActionKind.ExecutableQuarantine,
        ActionKind.ExecutableMove, ActionKind.RegistryClean, ActionKind.DriverUpdate, ActionKind.Overclock,
        ActionKind.CloudLookup, ActionKind.AutoApplyOptimization
    };
    public bool IsForbidden(ActionKind actionKind) => Forbidden.Contains(actionKind);
}
