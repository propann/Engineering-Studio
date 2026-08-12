param(
    [switch]$Ffmpeg,
    [switch]$Rust,
    [switch]$PatchUtil,
    [switch]$All
)

$ErrorActionPreference = 'Stop'
$runtime = Join-Path $env:LOCALAPPDATA 'OP-1-Studio\tools'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null

function Add-UserPath([string]$path) {
    $current = [Environment]::GetEnvironmentVariable('Path', 'User')
    $parts = @($current -split ';' | Where-Object { $_ })
    if ($parts -notcontains $path) {
        [Environment]::SetEnvironmentVariable('Path', (($parts + $path) -join ';'), 'User')
    }
    $env:Path = "$path;$env:Path"
}

if ($All) { $Ffmpeg = $true; $Rust = $true; $PatchUtil = $true }
if (-not ($Ffmpeg -or $Rust -or $PatchUtil)) { $Ffmpeg = $true; $Rust = $true; $PatchUtil = $true }

$ffmpegExe = Join-Path $runtime 'ffmpeg\bin\ffmpeg.exe'
if ($Ffmpeg -and -not (Test-Path $ffmpegExe) -and -not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    $zip = Join-Path $runtime 'ffmpeg-release-essentials.zip'
    $extract = Join-Path $runtime 'ffmpeg'
    Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $zip -UseBasicParsing
    if (Test-Path $extract) { Remove-Item -LiteralPath $extract -Recurse -Force }
    Expand-Archive -LiteralPath $zip -DestinationPath $runtime -Force
    $folder = Get-ChildItem -LiteralPath $runtime -Directory | Where-Object { $_.Name -like 'ffmpeg-*essentials_build' } | Select-Object -First 1
    if (-not $folder) { throw 'Dossier FFmpeg introuvable apres extraction.' }
    Move-Item -LiteralPath $folder.FullName -Destination $extract
    Remove-Item -LiteralPath $zip -Force
    Add-UserPath (Join-Path $extract 'bin')
}

if ($Rust -and -not (Test-Path (Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe')) -and -not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    $rustup = Join-Path $runtime 'rustup-init.exe'
    Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile $rustup -UseBasicParsing
    & $rustup -y --default-toolchain stable-msvc --profile minimal
    Remove-Item -LiteralPath $rustup -Force
    Add-UserPath (Join-Path $env:USERPROFILE '.cargo\bin')
}

if ($PatchUtil) {
    $cargo = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'
    $patchUtilExe = Join-Path $env:USERPROFILE '.cargo\bin\op-patch-util.exe'
    if (-not (Test-Path $patchUtilExe)) {
        if (-not (Test-Path $cargo)) { throw 'Cargo est requis pour installer op-patch-util.' }
        & $cargo install --git https://github.com/AlexCharlton/op-patch-util --locked
    }
}

Write-Output ('FFMPEG=' + (Test-Path (Join-Path $runtime 'ffmpeg\bin\ffmpeg.exe')))
Write-Output ('CARGO=' + (Test-Path (Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe')))
if (Test-Path (Join-Path $runtime 'ffmpeg\bin\ffmpeg.exe')) { & (Join-Path $runtime 'ffmpeg\bin\ffmpeg.exe') -version | Select-Object -First 1 }
if (Test-Path (Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe')) { & (Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe') --version }
if (Test-Path (Join-Path $env:USERPROFILE '.cargo\bin\op-patch-util.exe')) { & (Join-Path $env:USERPROFILE '.cargo\bin\op-patch-util.exe') --version }
