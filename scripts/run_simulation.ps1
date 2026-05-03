$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path artifacts/simulation | Out-Null
$test = dotnet test .\WinBgControlCenter.sln --configuration Release --filter "FullyQualifiedName~SimulationActionExecutorTests" --logger "trx;LogFileName=simulation-tests.trx"
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  @{ status='failed'; mode='simulation'; hostMutation=$false; exitCode=$exitCode; generatedUtc=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content artifacts/simulation/simulation-report.json
  exit $exitCode
}
@{ status='passed'; mode='simulation'; hostMutation=$false; testsExecuted=@('SimulationExecutor_BlocksForbiddenAction','SimulationExecutor_PerformsNoHostMutationMessage'); generatedUtc=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content artifacts/simulation/simulation-report.json
