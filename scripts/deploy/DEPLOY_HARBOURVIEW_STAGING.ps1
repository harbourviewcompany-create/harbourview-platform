param(
    [string]$Server = "your-server-ip",
    [string]$User = "harbourview",
    [string]$TargetPath = "/opt/harbourview/staging"
)

Write-Host "Building Harbourview..."
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "Build failed"
}

Write-Host "Uploading Harbourview build to staging server..."
scp -r .next package.json public $User@${Server}:$TargetPath

Write-Host "Restarting staging service..."
ssh $User@$Server "sudo systemctl restart harbourview-staging"

Write-Host "Running staging verification..."
ssh $User@$Server "curl -I http://127.0.0.1:3000"
