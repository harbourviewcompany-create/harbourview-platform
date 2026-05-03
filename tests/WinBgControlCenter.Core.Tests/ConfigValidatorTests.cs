using Xunit;
using WinBgControlCenter.Core;

namespace WinBgControlCenter.Core.Tests;

public sealed class ConfigValidatorTests
{
    private const string ValidSafety = "{\"schemaVersion\":\"1.0\",\"hardExclusions\":{\"processNames\":[\"lsass.exe\"],\"serviceNames\":[\"WinDefend\"],\"scheduledTaskPathPrefixes\":[\"\\\\Microsoft\\\\Windows\\\\\"]},\"forbiddenActions\":[\"RemoteWmi\",\"FirewallRuleChange\",\"PersistentDaemonInstall\",\"BrowserCompanionInstall\",\"BrowserExtensionDisable\",\"BrowserExtensionUninstall\",\"EtwMonitoringEnable\",\"AppxUninstall\",\"ExecutableQuarantine\",\"ExecutableMove\",\"RegistryClean\",\"DriverUpdate\",\"Overclock\",\"CloudLookup\",\"AutoApplyOptimization\"]}";
    private const string ValidRisk = "{\"schemaVersion\":\"1.0\",\"defaultRiskClass\":\"NeedsUserDecision\",\"rules\":[{\"id\":\"r1\",\"targetKind\":\"StartupItem\",\"conditions\":{},\"riskClass\":\"NeedsUserDecision\",\"allowedActions\":[\"DisableStartupItem\"],\"reason\":\"ok\"}]}";
    private const string ValidTimeout = "{\"schemaVersion\":\"1.0\",\"inventoryRefreshTimeoutMs\":1,\"timeoutMeansSafe\":false,\"blockActionsWhenRequiredEvidenceTimesOut\":true}";

    [Fact] public void ValidConfig_AllowsActions() => Assert.True(new ConfigValidator().Validate(ValidSafety, ValidRisk, ValidTimeout).ActionsAllowed);
    [Fact] public void EmptyHardExclusionProcessList_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety.Replace("[\"lsass.exe\"]", "[]"), ValidRisk, ValidTimeout).ActionsAllowed);
    [Fact] public void MissingForbiddenAction_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety.Replace("\"RemoteWmi\",", ""), ValidRisk, ValidTimeout).ActionsAllowed);
    [Fact] public void UnknownForbiddenAction_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety.Replace("AutoApplyOptimization\"", "AutoApplyOptimization\",\"BadAction\""), ValidRisk, ValidTimeout).ActionsAllowed);
    [Fact] public void RiskRuleInvalidTargetKind_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety, ValidRisk.Replace("StartupItem", "BadKind"), ValidTimeout).ActionsAllowed);
    [Fact] public void RiskRuleForbiddenAllowedAction_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety, ValidRisk.Replace("DisableStartupItem", "RemoteWmi"), ValidTimeout).ActionsAllowed);
    [Fact] public void TimeoutLessThanOrEqualZero_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety, ValidRisk, ValidTimeout.Replace("\"inventoryRefreshTimeoutMs\":1", "\"inventoryRefreshTimeoutMs\":0")).ActionsAllowed);
    [Fact] public void TimeoutMeansSafeTrue_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety, ValidRisk, ValidTimeout.Replace("\"timeoutMeansSafe\":false", "\"timeoutMeansSafe\":true")).ActionsAllowed);
    [Fact] public void BlockActionsFalse_ForcesReadOnly() => Assert.False(new ConfigValidator().Validate(ValidSafety, ValidRisk, ValidTimeout.Replace("\"blockActionsWhenRequiredEvidenceTimesOut\":true", "\"blockActionsWhenRequiredEvidenceTimesOut\":false")).ActionsAllowed);
}
