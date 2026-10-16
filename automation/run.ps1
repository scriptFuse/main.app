param(
    [ValidateSet('Run', 'Test', 'Smoke', 'InstallBrowser')]
    [string]$Task = 'Run',
    [ValidateSet('quickScript', 'booking', 'custom')]
    [string]$Package = 'quickScript',
    [ValidateSet('fr', 'en')]
    [string]$Language = 'fr',
    [string]$BaseUrl,
    [ValidateSet('chrome', 'msedge')]
    [string]$Channel,
    [switch]$Images,
    [switch]$Review,
    [string]$MavenPath
)

$ErrorActionPreference = 'Stop'
if (!$MavenPath) {
    $mavenCommand = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($mavenCommand) {
        $MavenPath = $mavenCommand.Source
    } else {
        # IntelliJ includes Maven even when it is not installed on PATH.
        $ideaRoots = @("$env:ProgramFiles\JetBrains", "$env:LOCALAPPDATA\Programs")
        foreach ($ideaRoot in $ideaRoots) {
            $candidate = Get-ChildItem -LiteralPath $ideaRoot -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -like '*IntelliJ*' } |
                Sort-Object Name -Descending |
                ForEach-Object { Join-Path $_.FullName 'plugins\maven-plugin\lib\maven3\bin\mvn.cmd' } |
                Where-Object { Test-Path -LiteralPath $_ } |
                Select-Object -First 1
            if ($candidate) { $MavenPath = $candidate; break }
        }
    }
}
if (!$MavenPath -or !(Test-Path -LiteralPath $MavenPath)) {
    throw 'Maven not found. Import automation/pom.xml in IntelliJ, or pass -MavenPath pointing to mvn.cmd.'
}

$previousBrowserPath = $env:PLAYWRIGHT_BROWSERS_PATH
$previousSkipDownload = $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $PSScriptRoot '.browsers'
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
Push-Location $PSScriptRoot
try {
    $mavenArgs = @('-B', '-ntp', "-Dmaven.repo.local=$PSScriptRoot\.m2")
    switch ($Task) {
        'Test' { $mavenArgs += 'test' }
        'InstallBrowser' {
            $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '0'
            $mavenArgs += @('compile', 'exec:java', '-Dexec.mainClass=com.microsoft.playwright.CLI', '-Dexec.args=install chromium')
        }
        default {
            $appArgs = @('--package', $Package, '--language', $Language)
            if ($Task -eq 'Smoke') { $appArgs += '--smoke' }
            if ($Images) { $appArgs += '--images' }
            if ($Review) { $appArgs += '--review' }
            if ($Channel) { $appArgs += @('--channel', $Channel) }
            if ($BaseUrl) {
                if ($BaseUrl -match '[\s"]') { throw 'BaseUrl must not contain whitespace or quotes.' }
                $appArgs += @('--base-url', $BaseUrl)
            }
            $mavenArgs += @('compile', 'exec:java', "-Dexec.args=$($appArgs -join ' ')")
        }
    }
    & $MavenPath @mavenArgs
    if ($LASTEXITCODE -ne 0) { throw "Automation failed (exit code $LASTEXITCODE)." }
} finally {
    Pop-Location
    $env:PLAYWRIGHT_BROWSERS_PATH = $previousBrowserPath
    $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = $previousSkipDownload
}
