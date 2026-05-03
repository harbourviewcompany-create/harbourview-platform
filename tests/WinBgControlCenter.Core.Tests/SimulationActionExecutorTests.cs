using Xunit;
using WinBgControlCenter.Core;
using WinBgControlCenter.Simulation;

namespace WinBgControlCenter.Core.Tests;
public sealed class SimulationActionExecutorTests { [Fact] public void SimulationExecutor_BlocksForbiddenAction() => Assert.Throws<InvalidOperationException>(() => new SimulationActionExecutor().Execute(new ActionRequest(ActionKind.RemoteWmi, true))); [Fact] public void SimulationExecutor_PerformsNoHostMutationMessage() { var r = new SimulationActionExecutor().Execute(new ActionRequest(ActionKind.DisableStartupItem, true)); Assert.True(r.Succeeded); Assert.Contains("No host mutation", r.ResultMessage); } }
