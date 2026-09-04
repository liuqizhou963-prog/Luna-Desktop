[CmdletBinding()]
param(
    [string]$ArchivePath = (Join-Path $PSScriptRoot '..\artifacts\app\luna-1.4.7\resources\app.asar')
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$archive = (Resolve-Path $ArchivePath).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$indexPatched = Join-Path $repoRoot "release\.luna-runtime-$stamp-index.asar"
$finalPatched = Join-Path $repoRoot "release\.luna-runtime-$stamp-final.asar"
$bootstrap = Join-Path $repoRoot 'tools\asar\luna-bootstrap.js'

node (Join-Path $repoRoot 'tools\asar\_patch_luna_runtime.cjs') $archive $indexPatched
node (Join-Path $repoRoot 'tools\asar\_patch_asar_bootstrap.cjs') $indexPatched $bootstrap $finalPatched

$backup = "$archive.before-runtime-branding.bak"
if (-not (Test-Path -LiteralPath $backup)) { Copy-Item -LiteralPath $archive -Destination $backup }
Copy-Item -LiteralPath $finalPatched -Destination $archive -Force
Write-Output "Runtime branding patched: $archive"
Write-Output "Temporary patched archive retained for audit: $finalPatched"
