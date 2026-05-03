using Xunit;
using WinBgControlCenter.Core;

namespace WinBgControlCenter.Core.Tests;

public sealed class ForbiddenActionGuardTests
{
    [Fact] public void ForbiddenActions_AreBlocked() { var guard = new ForbiddenActionGuard(); foreach (var action in ForbiddenActionGuard.Forbidden) Assert.True(guard.IsForbidden(action)); }
    [Fact] public void AllowedScaffoldAction_IsNotForbidden() => Assert.False(new ForbiddenActionGuard().IsForbidden(ActionKind.DisableStartupItem));
}
