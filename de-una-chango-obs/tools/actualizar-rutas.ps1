param(
    [string]$JsonPath,
    [switch]$CreateBackup
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($JsonPath)) {
    $JsonPath = Join-Path $projectRoot 'DE_UNA_CHANGO_OBS.json'
}

if (-not (Test-Path -LiteralPath $JsonPath -PathType Leaf)) {
    throw "No existe el archivo JSON: $JsonPath"
}

$JsonPath = (Resolve-Path -LiteralPath $JsonPath).Path
$rootForward = $projectRoot.Replace('\', '/').TrimEnd('/')

$text = [System.IO.File]::ReadAllText($JsonPath, [System.Text.Encoding]::UTF8)

$evaluator = [System.Text.RegularExpressions.MatchEvaluator] {
    param($match)
    return $rootForward + '/'
}

$updated = [regex]::Replace(
    $text,
    '(?i)(?:[a-z]:/|/)(?:[^"\r\n]*?/)?(?=overlays/|assets/music/|assets/transitions/)',
    $evaluator
)

$null = ConvertFrom-Json -InputObject $updated

if ($updated -eq $text) {
    Write-Host "[OK] Las rutas ya apuntan a esta carpeta:" -ForegroundColor Green
    Write-Host "     $rootForward"
    Write-Host "     JSON validado: $JsonPath"
    exit 0
}

if ($CreateBackup) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = "$JsonPath.bak-$timestamp"
    Copy-Item -LiteralPath $JsonPath -Destination $backup
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($JsonPath, $updated, $utf8NoBom)

Write-Host "[OK] Rutas actualizadas correctamente." -ForegroundColor Green
Write-Host "     Carpeta del proyecto: $rootForward"
Write-Host "     JSON listo para importar: $JsonPath"
