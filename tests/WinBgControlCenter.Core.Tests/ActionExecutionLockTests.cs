using Xunit;
using WinBgControlCenter.Core;

namespace WinBgControlCenter.Core.Tests;
public sealed class ActionExecutionLockTests { [Fact] public void SingleActionLock_BlocksConcurrentMutation() { var l = new ActionExecutionLock(); Assert.True(l.TryAcquire()); Assert.False(l.TryAcquire()); l.Release(); Assert.True(l.TryAcquire()); } }
