[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReleasePath
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $ReleasePath).Path
$extensions = @('.json','.js','.jsc','.mjs','.cjs','.ts','.tsx','.md','.yaml','.yml','.env','.txt','.html','.css')
$patterns = @(
    'sk-ant-[A-Za-z0-9_-]{20,}',
    'sk-proj-[A-Za-z0-9_-]{20,}',
    'sk-[A-Za-z0-9]{24,}',
    'AIza[0-9A-Za-z_-]{30,}',
    'gh[pousr]_[A-Za-z0-9]{20,}',
    'github_pat_[A-Za-z0-9_]{20,}',
    'xox[baprs]-[A-Za-z0-9-]{20,}',
    'AKIA[0-9A-Z]{16}'
)
$hits = @()
Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction Stop |
    Where-Object {
        $extensions -contains $_.Extension.ToLowerInvariant() -and
        $_.FullName -notmatch '[\\/]node_modules[\\/]' -and
        $_.FullName -notmatch '[\\/]builtin-skills[\\/]\.trash[\\/]'
    } | ForEach-Object {
    $text = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $text) { return }
    foreach ($pattern in $patterns) {
        if ([regex]::IsMatch($text, $pattern)) { $hits += $_.FullName; break }
    }
}
if ($hits.Count -gt 0) {
    $hits | ForEach-Object { Write-Error "Potential credential found in $_" }
    exit 1
}
Write-Output "Release credential scan passed: no provider key patterns found under $root"
