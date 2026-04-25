$ErrorActionPreference = "Stop"

Write-Host "Running factory health check" -ForegroundColor Cyan

$required = @("package.json", ".env.example")
foreach ($file in $required) {
  if (!(Test-Path $file)) {
    throw "Missing required file: $file"
  }
}

npm run typecheck
npm test
npm run build

Write-Host "Health check completed" -ForegroundColor Green
