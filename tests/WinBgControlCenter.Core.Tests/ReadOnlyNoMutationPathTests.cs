using Xunit;

namespace WinBgControlCenter.Core.Tests;

public sealed class ReadOnlyNoMutationPathTests
{
    private static readonly string[] BannedProductionTokens =
    {
        "Process.Kill", "CloseMainWindow", "ServiceController.Stop", "ServiceController.Start", "Registry.SetValue", "RegistryKey.SetValue", "DeleteSubKey", "schtasks /change", "schtasks /delete", "netsh", "New-NetFirewallRule", "Remove-AppxPackage", "Get-WmiObject", "Invoke-WmiMethod", "ManagementObject", "EventPipe", "EventListener", "File.Move", "File.Delete", "Directory.Delete", "ProcessStartInfo", "Verb = \"runas\"", "ElevatedHelper", "HttpClient", "WebRequest", "Socket", "TcpClient", "UdpClient", "telemetry", "analytics", "updater"
    };

    [Fact]
    public void ProductionSource_DoesNotContainBannedMutationTokens()
    {
        var root = FindRepoRoot();
        var files = Directory.EnumerateFiles(Path.Combine(root, "src"), "*.cs", SearchOption.AllDirectories).ToArray();
        var findings = ScanFiles(files, BannedProductionTokens);
        Assert.True(findings.Count == 0, string.Join(Environment.NewLine, findings));
    }

    [Fact]
    public void ScriptsAndPackages_DoNotContainBannedRuntimeTokens()
    {
        var root = FindRepoRoot();
        var files = Directory.EnumerateFiles(Path.Combine(root, "scripts"), "*.*", SearchOption.AllDirectories)
            .Concat(Directory.EnumerateFiles(root, "Directory.Packages.props", SearchOption.TopDirectoryOnly))
            .Concat(Directory.EnumerateFiles(root, "*.csproj", SearchOption.AllDirectories))
            .ToArray();
        var findings = ScanFiles(files, BannedProductionTokens.Where(t => t is not "updater").ToArray());
        Assert.True(findings.Count == 0, string.Join(Environment.NewLine, findings));
    }

    public static IReadOnlyList<string> ScanText(string label, string text, IEnumerable<string> tokens)
    {
        return tokens.Where(token => text.Contains(token, StringComparison.OrdinalIgnoreCase)).Select(token => $"{label}: {token}").ToArray();
    }

    private static IReadOnlyList<string> ScanFiles(IEnumerable<string> files, IEnumerable<string> tokens)
    {
        var findings = new List<string>();
        foreach (var file in files)
        {
            var text = File.ReadAllText(file);
            findings.AddRange(ScanText(file, text, tokens));
        }
        return findings;
    }

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "WinBgControlCenter.sln"))) dir = dir.Parent;
        return dir?.FullName ?? throw new InvalidOperationException("Repo root not found.");
    }
}
