$ErrorActionPreference = "Stop"

function Run-Check {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command
  )

  Write-Host ("[RUN] " + $Name) -ForegroundColor Yellow
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host ("[FAIL] " + $Name) -ForegroundColor Red
    exit 1
  }
  Write-Host ("[OK] " + $Name) -ForegroundColor Green
}

function Assert-Path {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$PathValue
  )

  Write-Host ("[RUN] " + $Name) -ForegroundColor Yellow
  if (-not (Test-Path -Path $PathValue)) {
    Write-Host ("[FAIL] Missing required path: " + $PathValue) -ForegroundColor Red
    exit 1
  }
  Write-Host ("[OK] " + $Name) -ForegroundColor Green
}

Write-Host "== DIRECT Production Readiness Check ==" -ForegroundColor Cyan

$checks = @(
  @{ Name = "Root build"; Command = "npm run build --if-present" },
  @{ Name = "Platform API build"; Command = "npm run platform-api:build" },
  @{ Name = "Context service build"; Command = "npm run direct:build" },
  @{ Name = "Console build"; Command = "npm run console:build" },
  @{ Name = "Test suite"; Command = "npm run test:all" }
)

foreach ($check in $checks) {
  Run-Check -Name $check.Name -Command $check.Command
}

if ($env:SKIP_SECURITY_AUDIT -eq "true") {
  Write-Host "[SKIP] Security audit was skipped because SKIP_SECURITY_AUDIT=true" -ForegroundColor DarkYellow
}
else {
  Run-Check -Name "Security audit" -Command "npm run security:check"
}

$requiredPaths = @(
  "docker-compose.yml",
  "docs/production-readiness.md",
  "docs/openapi/platform-api.yaml",
  "infra/aws/terraform/main.tf",
  "infra/gcp/terraform/main.tf",
  "infra/azure/terraform/main.tf",
  "infra/railway/terraform/main.tf",
  "apps/platform-api/Dockerfile",
  "apps/direct-console/Dockerfile",
  "apps/knowledge-pipeline/Dockerfile"
)

foreach ($pathItem in $requiredPaths) {
  Assert-Path -Name ("Required artifact: " + $pathItem) -PathValue $pathItem
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
  Run-Check -Name "Docker Compose config validation" -Command "docker compose config -q"
}
else {
  Write-Host "[SKIP] Docker command not found; compose validation skipped." -ForegroundColor DarkYellow
}

Write-Host "== Ready: production checks passed ==" -ForegroundColor Green
