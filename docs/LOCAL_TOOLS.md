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

## Editeur d'images machine

`tools/display_bridge.py` deballe un `.op1` en lecture seule (copie
temporaire, jamais le fichier source), liste les 61 SVG de
`content/display/` et les trie par categorie documentee avec un niveau de
confiance (`high` = confirme par une page officielle teenage.engineering ou
notre propre `data/mods/catalog.json`, `medium` = concept documente mais nom
d'ecran non confirme, `low`/`non_identifie` = codename interne sans source
externe) :

```powershell
python tools/display_bridge.py sort --input backups/firmware-builds/OP1_op1_246_mods.op1 --output-dir backups/display-sorted
```

Le manifeste `backups/display-sorted/manifest.json` et les SVG tries restent
hors du depot (`backups/` est ignore par Git). L'ecran "Images" de
l'application charge ensuite ces fichiers `.svg` localement (bouton "Charger
des ecrans .svg"), les regroupe par categorie, permet une edition non
destructive du code SVG avec apercu en direct, et exporte un patch JSON au
format lu par `op1_gfx.patch_image_file` — le meme moteur que les mods
`gfx-cwo-moose` et `gfx-tape-invert` deja references par `firmware_bridge.py`.
Aucune ecriture n'est faite dans le firmware depuis le navigateur ; le patch
exporte doit encore etre applique localement :

```powershell
python tools/display_bridge.py patch --file tapeconfig.svg --original original.svg --edited edite.svg --output tapeconfig.patch.json
```

Pour importer les images d'un firmware deja ouvert localement, le catalogue
cree automatiquement l'arborescence de travail puis copie les SVG sans
modifier la source :

```powershell
python tools/content_catalog.py import-display backups .cache/firmware/op1_246 --firmware op1_246
```

Les originaux sont conserves dans
`backups/images/original/<firmware>/`, les copies triees dans
`backups/images/library/<firmware>/`, et les empreintes SHA-256 dans
`backups/images/manifests/`. L'application native recree aussi ces dossiers
(ainsi que les dossiers sons, patches, tapes, exports et firmware) quand un
nouveau dossier de travail est configure. Cette initialisation ne supprime
aucun fichier existant.

La description complète de cette organisation et du chargement automatique
est dans [`IMAGE_LIBRARY.md`](IMAGE_LIBRARY.md).

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

Le troisième contrat est `tools/device_transfer_plan.py`. Il prend un pack
local deja prepare et un volume OP-1 monte, puis renvoie un plan JSON avec les
actions `copy` et `skip`. Seuls `tape/`, `album/`, `synth/user/` et
`drum/user/` sont acceptes :

```powershell
python tools/device_transfer_plan.py prepare backups/tape-import "E:"
```

Le resultat contient `machineWrite: false`. L'execution effective exige un
snapshot verifie et une confirmation explicite :

```powershell
python tools/device_transfer_plan.py execute backups/tape-import "E:" `
  backups/hardware-tests/op1-disk_<snapshot> --confirm
```

L'execution ne supprime aucun fichier, utilise un fichier temporaire, puis
verifie le SHA-256 apres chaque copie. L'ejection native reste une etape
separee a ajouter avant utilisation courante.

La restauration d'un fichier manquant utilise le meme contrat et refuse par
defaut d'ecraser un fichier existant :

```powershell
python tools/device_transfer_plan.py restore backups/hardware-tests/op1-delete-restore-test_<snapshot> "E:" synth/user/8.aif --confirm
```

Cette operation ne supprime jamais de fichier. L'option `--replace` est
necessaire pour remplacer explicitement un fichier present.

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

Le firmware officiel validé est conservé dans la bibliothèque locale avec sa
version, sa source et ses empreintes. OP-1 Studio ne flashe pas le firmware et
ne l'installe pas à distance : l'utilisateur déplace lui-même le fichier sur le
volume TE-boot, puis l'éjecte selon la procédure Teenage Engineering.

## Controle des samples

`tools/sample_preflight.py` inspecte les WAV, AIFF, FLAC, MP3, M4A/AAC, OGG et
Opus, ignore les pistes `tape` et `album`, classe automatiquement les fichiers
sous `synth/user` ou `drum/user`, applique les limites 6 s / 12 s et produit
`MANIFESTE_SAMPLES.json`. Avec FFmpeg installé, il convertit les sources en
AIFF mono 44,1 kHz / 16 bits sans modifier les originaux. Les formats
compressés sont lus via `ffprobe` pour vérifier durée, canaux et fréquence
avant conversion.

La sortie est volontairement unique : le PC peut accepter plusieurs formats,
mais le gestionnaire ne transfère vers l'OP-1 qu'un fichier compatible et
contrôlé. Les presets OP-1 synth/drum utilisent en plus un `.aif` spécial qui
peut contenir des données de son ; un simple fichier audio ne doit donc pas
être présenté comme un preset complet.

### Preflight AIFF et SVG

`tools/aiff_inspector.py` inspecte un fichier AIFF en lecture seule : format,
hash SHA-256, metadonnees audio, liste des chunks et chunks inconnus. Il sert
de compatibilite avec `op1aiff` sans installer ni executer ce sidecar externe.

`tools/svg_preflight.py` controle un SVG avant toute edition ou export : XML,
`viewBox` 320x160, balises a risque, styles et nombres trop precis. Un statut
`review` bloque l'idee d'un export automatique ; ce controle ne modifie jamais
le fichier source et reste le repli local de `op1svg`.

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
