using System.Text.Json;

namespace WinBgControlCenter.Core;

public sealed class ConfigValidator
{
    public ConfigValidationResult Validate(string safetyJson, string riskJson, string timeoutJson)
    {
        var errors = new List<string>();
        ValidateSafety(safetyJson, errors);
        ValidateRisk(riskJson, errors);
        ValidateTimeout(timeoutJson, errors);
        return new ConfigValidationResult(errors.Count == 0, errors.Count == 0, errors);
    }

    private static void ValidateSafety(string json, List<string> errors)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (!root.TryGetProperty("hardExclusions", out var hard)) { errors.Add("Missing hardExclusions."); return; }
        RequireNonEmpty(hard, "processNames", errors);
        RequireNonEmpty(hard, "serviceNames", errors);
        RequireNonEmpty(hard, "scheduledTaskPathPrefixes", errors);
        if (!root.TryGetProperty("forbiddenActions", out var forbidden) || forbidden.ValueKind != JsonValueKind.Array) { errors.Add("Missing forbiddenActions."); return; }
        var names = forbidden.EnumerateArray().Select(x => x.GetString()).Where(x => x is not null).ToHashSet(StringComparer.OrdinalIgnoreCase)!;
        foreach (var required in ForbiddenActionGuard.Forbidden.Select(x => x.ToString())) if (!names.Contains(required)) errors.Add($"Missing forbidden action {required}.");
        foreach (var name in names) if (!Enum.TryParse<ActionKind>(name, true, out var parsed) || !ForbiddenActionGuard.Forbidden.Contains(parsed)) errors.Add($"Unknown forbidden action {name}.");
    }

    private static void ValidateRisk(string json, List<string> errors)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (!root.TryGetProperty("defaultRiskClass", out var defaultRisk) || !Enum.TryParse<RiskClass>(defaultRisk.GetString(), true, out _)) errors.Add("Invalid defaultRiskClass.");
        if (!root.TryGetProperty("rules", out var rules) || rules.ValueKind != JsonValueKind.Array || rules.GetArrayLength() == 0) { errors.Add("Rules must be non-empty."); return; }
        foreach (var rule in rules.EnumerateArray())
        {
            if (!rule.TryGetProperty("targetKind", out var target) || !Enum.TryParse<SystemItemKind>(target.GetString(), true, out _)) errors.Add("Invalid targetKind.");
            if (!rule.TryGetProperty("riskClass", out var risk) || !Enum.TryParse<RiskClass>(risk.GetString(), true, out _)) errors.Add("Invalid riskClass.");
            if (!rule.TryGetProperty("allowedActions", out var actions) || actions.ValueKind != JsonValueKind.Array) { errors.Add("Invalid allowedActions."); continue; }
            foreach (var action in actions.EnumerateArray())
            {
                var name = action.GetString();
                if (!Enum.TryParse<ActionKind>(name, true, out var parsed)) { errors.Add($"Invalid actionKind {name}."); continue; }
                if (ForbiddenActionGuard.Forbidden.Contains(parsed)) errors.Add($"Risk rule includes forbidden action {name}.");
            }
        }
    }

    private static void ValidateTimeout(string json, List<string> errors)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        foreach (var prop in root.EnumerateObject().Where(p => p.Name.EndsWith("TimeoutMs", StringComparison.OrdinalIgnoreCase))) if (prop.Value.GetInt32() <= 0) errors.Add($"Invalid timeout {prop.Name}.");
        if (!root.TryGetProperty("timeoutMeansSafe", out var safe) || safe.GetBoolean()) errors.Add("timeoutMeansSafe must be false.");
        if (!root.TryGetProperty("blockActionsWhenRequiredEvidenceTimesOut", out var block) || !block.GetBoolean()) errors.Add("Timeout evidence must block actions.");
    }

    private static void RequireNonEmpty(JsonElement parent, string name, List<string> errors)
    {
        if (!parent.TryGetProperty(name, out var arr) || arr.ValueKind != JsonValueKind.Array || arr.GetArrayLength() == 0) errors.Add($"{name} must be non-empty.");
    }
}
