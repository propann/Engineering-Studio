# Contexte de reprise — OP-1 Studio

Dernière mise à jour : **12 août 2026** · langue de travail : français · cible :
**OP-1 original uniquement**.

## Récupération sur le PC Windows

Le clone utilisateur est prévu ici :

```text
C:\Users\azoth\Documents\GitHub\OP-1-Studio
```

Depuis PowerShell :

```powershell
cd C:\Users\azoth\Documents\GitHub\OP-1-Studio
git pull --ff-only origin main
python -m unittest discover -s tests -p "test_*.py"
npm run lint
```

Le dépôt est une application Tauri/React avec des scripts Python servant
d'oracles de sécurité et de compatibilité. Aucun firmware propriétaire, pack
tiers ou cache d'outil ne doit être ajouté à Git.

## Clavier Studio — grille interactive (12 août 2026)

`StudioMachinePanel` a été entièrement réécrit autour d'un éditeur de grille
64 × 16 :

- **Mode éditeur** : clic souris pour peindre des cases (5 couleurs), Espace
  pour valider un bloc rectangulaire, Suppr pour tout effacer. L'état est
  persisté dans `localStorage` sous la clé `op1-studio-grid-v1`.
- **Palette** : blanc `#DFD9FF` → touche blanche, orange `#e8a020` → touche
  noire, bleu `#698EFF` → encodeur, vert `#00ED95` → bouton fonction, rouge
  `#FF3A5D` → transport.
- **Mode jeu** : les blocs validés deviennent des éléments SVG interactifs —
  touches piano avec ovale + nom de note + pastille colorée, touches noires
  avec cercle, encodeurs avec arc SVG animé et drag vertical, boutons fonction
  et transport.
- **Notes MIDI** : blanches C3–B4 (`WHITE_NOTES`), noires C#3–A#4
  (`BLACK_NOTES`) assignées de gauche à droite.
- **Barre de contrôle** : bouton `▲ clavier` / `▼ clavier` pour
  déployer/replier l'ensemble, bouton `✎ éditeur` pour basculer entre les
  deux modes. Panneau déployé par défaut (`panelOpen = true`).
- **Migration** : `colorToType()` migre les anciens blocs sans champ `type`.

## Où en est le travail

- Inspecteur `.op1` en lecture seule : CRC-32, SHA-256, LZMA-Alone, TAR,
  chemins sûrs et limites de taille.
- Sauvegarde avec manifeste SHA-256 et téléchargement limité au catalogue
  officiel.
- Étude locale reproductible de l'OS officiel 246 : 117 entrées TAR, 107
  fichiers, 10 dossiers ; source non stockée dans Git.
- Round-trip `op1repacker` sans modification : contenus des 107 fichiers
  retrouvés, mais repack non binaire-identique.
- Catalogue des mods dans `data/mods/catalog.json` et documentation dans
  `docs/FIRMWARE_MOD_CATALOG.md`.
- Dépôt local universel dans `docs/CONTENT_LIBRARY.md`, registre de sources
  dans `data/content/sources.json` et scanner dans
  `tools/content_catalog.py`.
- Les modifications firmware restent dans un **Labo expert** manuel ; le
  parcours officiel ne modifie ni n'écrit automatiquement un firmware.

## Mods vérifiés ou classés

Vérifiés sur une copie OS 246 : `iter`, `presets-iter`, `filter`,
`subtle-fx`, `gfx-tape-invert`, `gfx-iter-lab` et les variantes CWO appliquées
séparément. La GUI apporte aussi `cwo-wizard` et `iter-lostart` ; le premier
est vérifié en application, le second doit encore recevoir une fixture de
repack dédiée.

Classés comme expérimental : thème Glitter, SVG arbitraire, presets/samples
d'usine personnalisés et quantification binaire de notes. Les modifications
de `OP1_vdk.ldr`, le déchiffrement, l'OTP, l'ECC, le flash et le bootloader sont
de la recherche uniquement ou sont exclus.

Lire [docs/FIRMWARE_MOD_CATALOG.md](docs/FIRMWARE_MOD_CATALOG.md) avant de
proposer un nouveau bouton ou une nouvelle option.

## Dépôt local universel

Créer un coffre hors du dépôt Git :

```powershell
python tools/content_catalog.py init C:\Users\azoth\Documents\OP-1-Studio-Library
python tools/content_catalog.py scan C:\Users\azoth\Documents\OP-1-Studio-Library
python tools/content_catalog.py verify C:\Users\azoth\Documents\OP-1-Studio-Library
```

Le coffre accueille patches synthé/drum, samples, Tape, packs, thèmes,
sauvegardes et firmwares locaux. Chaque fichier reçoit un SHA-256 et reste en
quarantaine tant que l'auteur, la source, la licence et la compatibilité ne
sont pas renseignés.

Sources étudiées : `op1.fun`, OP-1 Center, téléchargements Teenage
Engineering, `teoperator`, `op-patch-util`, `op-patchstudio`, `op1aiff` et
`op1svg`. Les importations de services communautaires sont explicitement
pilotées par l'utilisateur ; pas de scraping, pas de compte, pas de
redistribution de packs payants.

## Commandes de laboratoire

```bash
python3 tools/firmware_inspector.py ./op1_246.op1 --include-files
python3 -m unittest tests/test_firmware_inspector.py
bash scripts/fetch-community-tools.sh
```

Les clones communautaires sont placés dans `.cache/community-tools/`, ignorés
par Git et épinglés dans `tools/sources.yml`. Le firmware de test doit rester
dans `.cache/firmware/`, également ignoré.

## Prochaines étapes recommandées

1. Faire passer le registre de mods dans des fixtures légales synthétiques.
2. Écrire le parseur AIFF/APPL et le codec patch dans le cœur Rust après
   comparaison `op-patch-util` / `teoperator`.
3. Ajouter les sidecars de provenance à l'interface du coffre local.
4. Ajouter une fixture de repack pour Glitter, Wizard et Lost Art.
5. Ne considérer une écriture TE-boot qu'après sauvegarde vérifiée, validation
   complète et confirmation manuelle de l'utilisateur.

## Références primaires

- [`op1repacker`](https://github.com/op1hacks/op1repacker)
- [`op1REpackerGUI`](https://github.com/op1hacks/op1REpackerGUI)
- [`teoperator`](https://github.com/schollz/teoperator)
- [`op-patch-util`](https://github.com/AlexCharlton/op-patch-util)
- [`OP-1Z-Sample-Manager`](https://github.com/romangarms/OP-1Z-Sample-Manager)
- [`op1.fun`](https://op1.fun/)
- [Firmware OP-1 officiel](https://teenage.engineering/downloads/op-1/original)
### Legende des types MIDI

Dans l'editeur de clavier, chaque couleur construit un type de controle :
blanc = note blanche, orange = note noire, bleu = potentiometre, vert = bouton,
rouge = transport. La legende visible reprend la meme palette que le moteur de
validation et les blocs sauvegardes.
