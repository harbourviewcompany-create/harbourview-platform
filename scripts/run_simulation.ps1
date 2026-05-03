$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path artifacts/simulation | Out-Null

dotnet test .\WinBgControlCenter.sln --configuration Release --filter "FullyQualifiedName~SimulationActionExecutorTests|FullyQualifiedName~Batch1ProofGeneratorTests" --logger "trx;LogFileName=simulation-tests.trx"
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  @{ status='failed'; mode='simulation'; hostMutation=$false; exitCode=$exitCode; generatedUtc=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content artifacts/simulation/simulation-report.json
  Get-Content artifacts/simulation/simulation-report.json -Raw
  exit $exitCode
}

dotnet run --project .\src\WinBgControlCenter.Simulation\WinBgControlCenter.Simulation.csproj --configuration Release --no-build -- .\artifacts\simulation\batch1-proof.json
$proofExit = $LASTEXITCODE
if ($proofExit -ne 0) { exit $proofExit }

@{ status='passed'; mode='simulation'; hostMutation=$false; testsExecuted=@('SimulationExecutor_BlocksForbiddenAction','SimulationExecutor_PerformsNoHostMutationMessage','Batch1ProofGenerator_CreatesOperatorProof'); generatedUtc=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content artifacts/simulation/simulation-report.json
Get-Content artifacts/simulation/simulation-report.json -Raw
Get-Content artifacts/simulation/batch1-proof.json -Raw
