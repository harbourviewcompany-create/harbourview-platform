namespace WinBgControlCenter.Core;
public enum ActionKind { None, DisableStartupItem, RemoteWmi, FirewallRuleChange, PersistentDaemonInstall, BrowserCompanionInstall, BrowserExtensionDisable, BrowserExtensionUninstall, EtwMonitoringEnable, AppxUninstall, ExecutableQuarantine, ExecutableMove, RegistryClean, DriverUpdate, Overclock, CloudLookup, AutoApplyOptimization }
public enum SystemItemKind { Process, Service, StartupItem, ScheduledTask, BrowserItem, AppxPackage }
public enum RiskClass { NeverTouch, WatchOnly, NeedsUserDecision, RecommendDisable }
public sealed record ConfigValidationResult(bool IsValid, bool ActionsAllowed, IReadOnlyList<string> Errors);
public sealed record TimeoutResult<T>(bool Completed, bool TimedOut, bool ActionsAllowed, T? Value, string? Error);
public sealed record PendingActionRecord(string PendingActionId, string Status);
public sealed record ActionRequest(ActionKind ActionKind, bool UserConfirmed);
public sealed record ActionResult(bool Succeeded, string ResultMessage);
