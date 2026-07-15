# ─────────────────────────────────────────────────────────────
# Taurus Go — load secrets from .env into your Windows environment.
#
# Run this ONCE:   .\setup-env.ps1
# Then open a NEW terminal before starting any service.
#
# Contains no secrets itself -- it only reads .env (which is gitignored),
# so this file is safe to commit.
#
# Why this exists: after the H3 rotation the services have no fallback secret
# (secret: ${JWT_SECRET}), so a service with no JWT_SECRET in its environment
# fails to start with:
#   PlaceholderResolutionException: Could not resolve placeholder 'JWT_SECRET'
# That failure is intentional -- see SECURITY-AUDIT.md H1/H3.
# ─────────────────────────────────────────────────────────────

$envFile = Join-Path $PSScriptRoot '.env'

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env not found at $envFile" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and fill in the values first." -ForegroundColor Yellow
    exit 1
}

$loaded = 0
foreach ($line in Get-Content $envFile) {
    # Skip blanks and comments
    if ($line -match '^\s*$' -or $line -match '^\s*#') { continue }
    if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { continue }

    $name  = $Matches[1]
    $value = $Matches[2].Trim().Trim('"').Trim("'")
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "  skipped $name (empty in .env)" -ForegroundColor DarkGray
        continue
    }

    # 'User' persists across terminals and reboots; also set it here so THIS shell works now.
    [Environment]::SetEnvironmentVariable($name, $value, 'User')
    Set-Item -Path "env:$name" -Value $value

    Write-Host "  set $name ($($value.Length) chars)" -ForegroundColor Green
    $loaded++
}

Write-Host ""
Write-Host "$loaded variable(s) loaded and persisted for your Windows user." -ForegroundColor Cyan
Write-Host "Open a NEW terminal for other sessions to pick them up, then:" -ForegroundColor Cyan
Write-Host "  cd project-service; mvn spring-boot:run" -ForegroundColor White
