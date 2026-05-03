using System.Text.Json;
using WinBgControlCenter.Simulation;

var outputPath = args.Length > 0 ? args[0] : Path.Combine("artifacts", "simulation", "batch1-proof.json");
Directory.CreateDirectory(Path.GetDirectoryName(outputPath) ?? ".");
var proof = await new Batch1ProofGenerator().GenerateAsync(CancellationToken.None);
var json = JsonSerializer.Serialize(proof, new JsonSerializerOptions { WriteIndented = true });
await File.WriteAllTextAsync(outputPath, json);
Console.WriteLine(json);
