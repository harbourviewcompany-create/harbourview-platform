using System.Security.Cryptography;
using System.Text;

namespace WinBgControlCenter.Core.Baseline;

public enum IdentityMode { Redacted, Hashed }

public sealed record BaselineIdentity(
    IdentityMode MachineIdentityMode,
    string MachineIdentityValue,
    IdentityMode UserIdentityMode,
    string UserIdentityValue)
{
    public static BaselineIdentity Redacted() => new(IdentityMode.Redacted, "[REDACTED]", IdentityMode.Redacted, "[REDACTED]");

    public static BaselineIdentity Hashed(string machineName, string userName)
    {
        return new BaselineIdentity(IdentityMode.Hashed, Hash("WBCC-BATCH1-MACHINE", machineName), IdentityMode.Hashed, Hash("WBCC-BATCH1-USER", userName));
    }

    private static string Hash(string ns, string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ns + ":" + value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
