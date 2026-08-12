param(
    [string]$Op1Root = 'C:\Users\azoth\Downloads\OP-1',
    [int]$PackCount = 10,
    [string]$OutputFolder = 'PACKS_OP1_COPIE_DIRECTE',
    [string]$ExcludeManifest = '',
    [string]$ExcludePack = '',
    [string]$ExcludeType = ''
)

$ErrorActionPreference = 'Stop'
$outputRoot = Join-Path $Op1Root $OutputFolder
$libraryRoots = @{
    synth = Join-Path $Op1Root 'SYNTH'
    drum  = Join-Path $Op1Root 'PERCU'
}

if (Test-Path -LiteralPath $outputRoot) {
    throw "Le dossier de sortie existe deja : $outputRoot"
}

$packs = foreach ($number in 1..$PackCount) {
    $packName = 'PACK_{0:D2}' -f $number
    $packRoot = Join-Path $outputRoot $packName
    $synthFolder = 'P{0:D2}S' -f $number
    $drumFolder = 'P{0:D2}D' -f $number
    $synthPath = Join-Path $packRoot (Join-Path 'synth' $synthFolder)
    $drumPath = Join-Path $packRoot (Join-Path 'drum' $drumFolder)
    New-Item -ItemType Directory -Path $synthPath, $drumPath -Force | Out-Null
    [pscustomobject]@{
        Number = $number
        Name = $packName
        Root = $packRoot
        synth = $synthPath
        drum = $drumPath
        SynthCount = 0
        DrumCount = 0
    }
}

$manifest = [System.Collections.Generic.List[object]]::new()
$excludedHashes = @{}
if ($ExcludeManifest -and (Test-Path -LiteralPath $ExcludeManifest)) {
    foreach ($row in Import-Csv -LiteralPath $ExcludeManifest) {
        if ((-not $ExcludePack -or $row.pack -eq $ExcludePack) -and
            (-not $ExcludeType -or $row.type -eq $ExcludeType) -and $row.sha256) {
            $excludedHashes[$row.sha256] = $true
        }
    }
}

function Get-ShortName {
    param(
        [System.IO.FileInfo]$File,
        [string]$Destination,
        [int]$Sequence
    )

    $base = ($File.BaseName.ToLowerInvariant() -replace '[^a-z0-9]', '')
    if ([string]::IsNullOrWhiteSpace($base)) { $base = 'sound' }
    $base = $base.Substring(0, [Math]::Min(8, $base.Length))
    $candidate = "$base.aif"
    if (-not (Test-Path -LiteralPath (Join-Path $Destination $candidate))) {
        return $candidate
    }

    $suffix = '{0:D2}' -f ($Sequence % 100)
    $prefixLength = [Math]::Min(8, [Math]::Max(1, 10 - $suffix.Length))
    $candidate = $base.Substring(0, [Math]::Min($prefixLength, $base.Length)) + $suffix + '.aif'
    $attempt = 1
    while (Test-Path -LiteralPath (Join-Path $Destination $candidate)) {
        $suffix = '{0:D3}' -f $attempt
        $prefixLength = [Math]::Max(1, 10 - $suffix.Length)
        $candidate = $base.Substring(0, [Math]::Min($prefixLength, $base.Length)) + $suffix + '.aif'
        $attempt++
    }
    return $candidate
}

foreach ($kind in 'synth', 'drum') {
    $categories = @(Get-ChildItem -LiteralPath $libraryRoots[$kind] -Directory | Sort-Object Name)
    $categoryOffset = 0

    foreach ($category in $categories) {
        $files = @(Get-ChildItem -LiteralPath $category.FullName -File -Filter *.aif | Sort-Object Name)
        $fileIndex = 0

        foreach ($file in $files) {
            $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            if ($excludedHashes.ContainsKey($sourceHash)) { continue }

            $countProperty = if ($kind -eq 'synth') { 'SynthCount' } else { 'DrumCount' }
            $minimum = ($packs | Measure-Object -Property $countProperty -Minimum).Minimum
            $eligible = @($packs | Where-Object { $_.$countProperty -eq $minimum })
            $selected = $eligible[($categoryOffset + $fileIndex) % $eligible.Count]
            $destination = $selected.$kind
            $shortName = Get-ShortName -File $file -Destination $destination -Sequence ($fileIndex + 1)
            $target = Join-Path $destination $shortName
            Copy-Item -LiteralPath $file.FullName -Destination $target

            $targetHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
            if ($sourceHash -ne $targetHash) { throw "Copie invalide : $target" }

            $selected.$countProperty++
            $manifest.Add([pscustomobject]@{
                pack = $selected.Name
                type = $kind
                categorie = $category.Name
                fichier_source = $file.Name
                fichier_op1 = $shortName
                chemin_pack = $target.Substring($outputRoot.Length + 1).Replace('\', '/')
                taille_octets = $file.Length
                sha256 = $sourceHash
            })
            $fileIndex++
        }
        $categoryOffset++
    }
}

$manifest | Export-Csv -LiteralPath (Join-Path $outputRoot 'MANIFESTE_PACKS.csv') -NoTypeInformation -Encoding UTF8

$readme = @"
PACKS OP-1 ORIGINAL - COPIE DIRECTE

Chaque PACK_XX est autonome. Son contenu contient les dossiers synth et drum.

Installation :
1. Sur l'OP-1, faire SHIFT + COM puis choisir DISK.
2. Ouvrir le disque OP-1 sur l'ordinateur.
3. Ouvrir un seul PACK_XX et copier ses dossiers synth et drum a la racine du disque OP-1.
4. Ejecter proprement le disque OP-1, puis attendre son redemarrage/indexation.

Ne pas copier plusieurs packs en meme temps : chaque pack est dimensionne pour
rester sous la limite pratique de 42 patches synth et 42 patches drum.

Les noms des fichiers destines a l'OP-1 utilisent uniquement des caracteres
simples et ne depassent pas 10 caracteres avant l'extension.
"@
$readme | Set-Content -LiteralPath (Join-Path $outputRoot 'LISEZ_MOI.txt') -Encoding UTF8

$packs | Select-Object Name, SynthCount, DrumCount,
    @{N='Bytes';E={(Get-ChildItem -LiteralPath $_.Root -Recurse -File | Measure-Object Length -Sum).Sum}}
