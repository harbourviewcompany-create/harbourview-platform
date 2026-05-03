using Xunit;

namespace WinBgControlCenter.Core.Tests;

public sealed class NoMutationScannerNegativeFixtureTests
{
    [Fact]
    public void ScannerFailsAgainstControlledNegativeFixture()
    {
        const string negativeFixture = "public void Bad(){ Process.Kill(); var c = new HttpClient(); }";
        var findings = ReadOnlyNoMutationPathTests.ScanText("negative-fixture", negativeFixture, new[] { "Process.Kill", "HttpClient" });
        Assert.Contains(findings, f => f.Contains("Process.Kill", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(findings, f => f.Contains("HttpClient", StringComparison.OrdinalIgnoreCase));
    }
}
