param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectName,

  [string]$Template = "next-supabase"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$TemplatePath = Join-Path $Root "templates\$Template"
$TargetPath = Join-Path (Get-Location) $ProjectName

if (!(Test-Path $TemplatePath)) {
  throw "Template not found: $TemplatePath"
}

if (Test-Path $TargetPath) {
  throw "Target already exists: $TargetPath"
}

Copy-Item -Path $TemplatePath -Destination $TargetPath -Recurse

Write-Host "Created project: $TargetPath" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  cd $ProjectName"
Write-Host "  Copy-Item .env.example .env.local"
Write-Host "  npm install"
Write-Host "  npm run typecheck"
Write-Host "  npm test"
Write-Host "  npm run build"
