using Xunit;
using WinBgControlCenter.Core;

namespace WinBgControlCenter.Core.Tests;
public sealed class TimeoutSafetyMapperTests { [Fact] public void TimedOutEvidence_BlocksActions() => Assert.False(new TimeoutSafetyMapper().ActionsAllowedFromTimeoutResult(new TimeoutResult<string>(false, true, false, null, "timeout"))); [Fact] public void CompletedEvidence_DoesNotAutomaticallyAllowActions() => Assert.False(new TimeoutSafetyMapper().ActionsAllowedFromTimeoutResult(new TimeoutResult<string>(true, false, false, "ok", null))); [Fact] public void TimeoutNeverClassifiesSafe() => Assert.False(new TimeoutResult<string>(false, true, false, null, null).ActionsAllowed); }
