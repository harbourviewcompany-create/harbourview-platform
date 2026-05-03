using Xunit;
using WinBgControlCenter.Simulation;

namespace WinBgControlCenter.Core.Tests;

public sealed class Batch1ProofGeneratorTests
{
    [Fact]
    public async Task Batch1ProofGenerator_CreatesOperatorProof()
    {
        var proof = await new Batch1ProofGenerator().GenerateAsync(CancellationToken.None);
        Assert.Equal("passed", proof.Status);
        Assert.False(proof.HostMutation);
        Assert.Contains("Batch1ProofGenerator_CreatesOperatorProof", proof.TestsExecuted);
    }
}
