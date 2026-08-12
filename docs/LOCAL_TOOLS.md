# Outils locaux OP-1

La selection verifiee des outils externes et l'ordre d'integration sont dans
[`TOOLING_SHORTLIST.md`](TOOLING_SHORTLIST.md).

## Installation des moteurs

Depuis PowerShell, l'installateur utilisateur prepare FFmpeg et Rust sans
modifier les fichiers systeme :

```powershell
.\tools\Install-OP1StudioTools.ps1 -All
```

FFmpeg sert a normaliser les samples. Rust/Cargo installe aussi
`op-patch-util` depuis son depot Git. Les binaires sont places hors du depot
dans `%LOCALAPPDATA%\OP-1-Studio\tools`.

## Moteur firmware

`tools/vendor/op1repacker/` contient `op1repacker` 0.2.6 et ses assets. Il
fournit les actions `unpack`, `modify`, `repack` et `analyze` ainsi que les
options `iter`, `presets-iter`, `filter`, `subtle-fx`, `gfx-iter-lab`,
`gfx-cwo-moose` et `gfx-tape-invert`.

Le moteur doit être appelé par le futur pont local. L’interface ne doit jamais
lancer `modify` ou `repack` sans copie de travail, sauvegarde vérifiée,
validation du conteneur et confirmation explicite.

## Pont de build

`tools/firmware_bridge.py` est le point d'entree local pour les premiers
firmwares. Il copie le fichier source, travaille dans un dossier temporaire,
produit un nouveau `.op1`, ecrit un manifeste SHA-256 et confirme
`FLASHED=False`. Il ne monte pas et ne flashe jamais la machine.

```powershell
python tools/firmware_bridge.py --input "C:\chemin\op1_246.op1" --options iter presets-iter filter subtle-fx gfx-iter-lab gfx-cwo-moose gfx-tape-invert
```

## Outils a integrer ensuite

- `opie` : backup et restauration complete, a relier a la fenetre Sauvegardes.
- `op-patch-util` : conversion WAV vers patches AIF pour la bibliotheque Sons.
- `op1tools` : previews audio, comptage des presets et automatisation USB.
- `FL-OP1-controller-script` : commandes transport et integration DAW via MIDI.
- `TOP-1` : reference pour les moteurs audio et sequenceurs.
- `op1kenobi` : reference d'interface web et de simulation.

Ces depots restent des integrations candidates : ils devront etre ajoutes avec
leur licence, leur version et un adaptateur local limite.

## Inventaire et sauvegarde machine

`tools/device_inventory.py` reconnait un OP-1 original par ses repertoires
`tape`, `album`, `synth` et `drum`. Il ne modifie jamais le volume et renvoie
un inventaire JSON avec le niveau de confiance, le nombre de fichiers et la
taille de chaque categorie. La lettre du lecteur n'est donc pas utilisee
comme preuve suffisante.

```powershell
python tools/device_inventory.py "E:"
```

`tools/backup_manifest.py` prend ensuite le chemin explicitement confirme,
copie chaque fichier dans un snapshot separe et verifie son SHA-256. Le
snapshot doit rester hors du volume source :

```powershell
python tools/backup_manifest.py create "E:" backups/hardware-tests --label op1-disk
python tools/backup_manifest.py verify backups/hardware-tests/op1-disk_<snapshot>
```

Ces deux commandes sont le socle du futur `Safe Change Engine`. Elles ne
restaurent pas et n'ecrivent pas sur l'OP-1.

## Packs audio

`tools/Build-OP1DirectPacks.ps1` prépare des packs `synth` et `drum` pour le
disque OP-1. Il répartit les fichiers, limite les noms, évite les doublons par
SHA-256, vérifie chaque copie et produit `MANIFESTE_PACKS.csv`.

## Time Capsule des pistes

La Time Capsule concerne uniquement les dossiers `tape` et `album` : pistes,
prises et exports audio. Elle n'embarque ni firmware, ni mods, ni samples
utilisateur. Les firmwares restent dans le flux Firmware et les samples dans
le preflight audio.

`tools/tape_bridge.py` prepare jusqu'a quatre fichiers audio en pistes
`tape/track_1.aif` a `track_4.aif`, mono 44,1 kHz / 16 bits, limitees a six
minutes. Il cree un manifeste et ne copie jamais directement vers la machine.

```powershell
python tools/tape_bridge.py --inputs track1.wav track2.wav --output backups/tape-import
```

## Controle des samples

`tools/sample_preflight.py` inspecte les WAV/AIFF, ignore les pistes `tape` et
`album`, classe automatiquement les fichiers sous `synth/user` ou `drum/user`,
applique les limites 6 s / 12 s et produit `MANIFESTE_SAMPLES.json`. Avec
FFmpeg installe, il convertit les sources en AIFF mono 44,1 kHz / 16 bits sans
modifier les originaux.

```powershell
python tools/sample_preflight.py "C:\chemin\vers\samples" --check-only
python tools/sample_preflight.py "C:\chemin\vers\samples" --output "backups\sample-preflight"
```

`tools/patch_bridge.py` fournit ensuite les commandes controlees de
`op-patch-util` :

```powershell
python tools/patch_bridge.py synth --input sample.wav --output patch.aif
python tools/patch_bridge.py drum --inputs kick.wav snare.wav --output kit.aif --octave 5
```

## Collecteur de sons

Le script local `Music/OP-1/app.py` est un collecteur `op1.fun`. Il inventorie
les sons dans SQLite/CSV, classe par genre et type, respecte `robots.txt` et ne
pilote pas le matériel. Il pourra alimenter la bibliothèque Sons via un import
de catalogue, mais ses identifiants et licences doivent rester associés à
chaque fichier.

## Limites

Le navigateur ne peut pas exécuter directement un binaire Python ni monter un
volume USB. Le pont local devra donc exposer des opérations étroites : analyse,
copie de sauvegarde, préparation de pack, repack vers un nouveau fichier et
éjection sûre. Il ne doit pas fournir une exécution shell arbitraire.
