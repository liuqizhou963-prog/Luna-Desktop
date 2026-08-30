[CmdletBinding()]
param(
    [string]$Source,
    [string]$Destination
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ([string]::IsNullOrWhiteSpace($Source)) {
    $Source = Join-Path $repoRoot 'artifacts\app\luna-1.4.7'
}
if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path $repoRoot 'release\luna-1.4.7-win-x64'
}
$sourcePath = (Resolve-Path $Source).Path
$destinationPath = [IO.Path]::GetFullPath($Destination)

if (-not (Get-ChildItem -LiteralPath $sourcePath -Filter '*.exe' -File -ErrorAction SilentlyContinue)) {
    throw "Luna executable was not found under $sourcePath"
}

New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null

# Copy the packaged Electron runtime while leaving analysis copies and user data behind.
$robocopyArgs = @(
    $sourcePath,
    $destinationPath,
    '/E',
    '/COPY:DAT',
    '/DCOPY:DAT',
    '/R:1',
    '/W:1',
    '/NFL',
    '/NDL',
    '/NP',
    '/XD',
    (Join-Path $sourcePath 'app-source'),
    (Join-Path $sourcePath 'sessions'),
    (Join-Path $sourcePath 'node_modules'),
    '/XF',
    'app.asar.before-*',
    'app.asar.reopen-fix',
    'Uninstall*.bak'
)
& robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

Write-Output "Release directory created: $destinationPath"
Get-ChildItem -LiteralPath $destinationPath -Recurse -File |
    Measure-Object Length -Sum |
    Select-Object Count, @{Name='Bytes'; Expression={ $_.Sum }}
