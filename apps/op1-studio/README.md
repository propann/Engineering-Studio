# OP-1 Studio

> Le bureau de contrôle pour apprivoiser un OP-1 sans lui faire peur.

OP-1 Studio est une application locale, inspirée de l'écran et des couleurs
de la machine, qui réunit dans une seule interface tout ce qui entoure un
OP-1 original : firmware, images d'écran, sauvegardes, bibliothèque de
sons, un studio quatre pistes, du MIDI, et un module d'entraînement au
clavier. Elle préfère montrer exactement ce qu'elle s'apprête à faire plutôt
que d'appuyer très fort sur un bouton magique.

![OP-1 Studio](docs/assets/op1-studio-mark.svg)

> [!IMPORTANT]
> Projet communautaire indépendant, sans affiliation avec Teenage
> Engineering. Les marques, firmwares et fichiers de la machine restent la
> propriété de leurs ayants droit — voir [NOTICE.md](NOTICE.md).

## Aperçu des fenêtres

Captures prises le 14 août 2026 sur `npm run dev`, prototype interactif
sans machine connectée (bandeau « NO DEVICE » visible sur l'accueil).

![Accueil — l'atelier OP-1](docs/assets/screenshots/accueil.jpg)

| Fenêtre | Aperçu | Ce qu'on y voit |
|---|---|---|
| **Studio · Tape & Album** | ![Studio](docs/assets/screenshots/studio.jpg) | quatre pistes façon bande OP‑1, transport commun, formes d'onde réelles, piano‑roll MIDI éditable et quantifiable, rendu WAV offline, export Stems/Album en AIFF mono |
| **Sons** | ![Sons](docs/assets/screenshots/sons.jpg) | bibliothèque en deux colonnes (machine / ordinateur), cinq catégories réelles, forme d'onde avec marqueurs de patch, tri et favoris, conversion locale vers AIFF prête pour la machine |
| **Exercices** | ![Exercices](docs/assets/screenshots/exercices.jpg) | écran de notes qui tombent façon Guitar Hero, quatre modes (Drumkit / Mélodie / Accord / Morceau importé en MIDI), jugement note/timing avec score et progression locale |
| **Firmware** | ![Firmware](docs/assets/screenshots/firmware.jpg) | plan en quatre étapes (Source → Mods → Contrôles → Export), catalogue de mods par catégorie avec vignette, checklist « plan sécurisé », jamais d'écriture automatique sur la machine |
| **Images** | ![Images](docs/assets/screenshots/images.jpg) | créateur de dessin original 320×160 (palette machine), tri des 61 écrans SVG du firmware par catégorie et confiance, mode thème global, éditeur pixel local |
| **Sauvegardes** | ![Sauvegardes](docs/assets/screenshots/sauvegardes.jpg) | inventaire d'un volume Disk mode réel (65 fichiers, 269 Mo sur la machine de test), manifeste vérifié, Time Capsule Pistes séparée du firmware/samples |

## Ce qui est déjà là

- **Firmware** : catalogue de mods documentés (moteur Iter et effet Filter
  cachés, valeurs FX adoucies, thèmes graphiques), inspecteur CRC/LZMA/TAR
  et moteur `op1repacker` vendored pour préparer un build valide en labo
  isolé — jamais dans le parcours officiel.
- **Images** : les 61 écrans SVG d'un firmware officiel déballé localement
  sont triés par catégorie avec un niveau de confiance sourcé par fichier,
  un premier éditeur pixel (`Op1PixelEditor`) permet une édition non
  destructive avant export de patch, un créateur de dessin original
  (canevas 320×160, palette machine) évite tout import de contenu tiers, et
  un mode thème recolore d'un coup toutes les fenêtres compatibles. Voir
  [`docs/OP1_IMAGE_BIBLE.md`](docs/OP1_IMAGE_BIBLE.md).
- **Bibliothèque Sons** : oracle audio WAV et AIFF+patch OP‑1 en lecture
  seule (marqueurs de patch matérialisés sur la forme d'onde), préflight
  durée/canaux/profondeur/écrêtage, conversion locale vers AIFF mono
  44,1 kHz/16 bits — le format réel attendu par la machine, pas du WAV.
- **Sauvegardes** : inventaire, sauvegarde avec manifeste SHA‑256,
  comparaison de snapshots et plan de transfert Disk mode qui ne copie
  jamais sans confirmation explicite (`--confirm`).
- **Studio** : clone visuel quatre pistes, machine Tape, piano‑roll MIDI
  éditable et quantifiable, rendu offline, export Stems (`track_N.aif`) et
  Album (`side_a.aif`/`side_b.aif`) en AIFF mono — les noms et le format
  réels du disque OP‑1, pas une approximation.
- **Exercices** : écran de notes qui tombent aligné colonne par colonne sur
  le clavier construit, quatre modes d'entraînement, import de morceaux au
  format MIDI, disposition clavier ordinateur AZERTY/QWERTY sans réglage
  (basée sur la position physique de la touche, pas le caractère produit).
- **MIDI & audio USB** : détection Web MIDI silencieuse à l'ouverture,
  clavier jouable depuis l'ordinateur, capture des notes entrantes, essai
  de routage audio quand le navigateur expose l'OP‑1 comme interface audio.

Le détail de ce qui est livré, en cours ou encore à l'état d'idée est tenu à
jour dans [docs/ROADMAP.md](docs/ROADMAP.md), avec le même niveau
d'exigence : rien n'est marqué « livré » sans un test ou une vérification
qui l'accompagne.

## La règle d'or

Les opérations sensibles restent explicites. Les bridges locaux préparent,
valident et produisent des manifestes ; l'interface ne prétend pas avoir
écrit sur la machine quand elle ne l'a pas fait. Autrement dit : le bouton
ne porte pas de cape. Le détail complet de cette politique pour le firmware
est dans [docs/FIRMWARE_SAFETY.md](docs/FIRMWARE_SAFETY.md).

## Démarrage

Prérequis : Node.js ≥ 22.13, Python 3 et, pour les outils audio, FFmpeg.
Depuis la racine :

```powershell
npm install
npm run dev
```

Puis ouvrir l'URL affichée par la commande (`http://localhost:5173` par
défaut avec Vite) dans Chrome ou Edge pour Web MIDI et l'audio USB.

Installation des outils locaux (Rust/Cargo, `op-patch-util`, FFmpeg) :

```powershell
.\tools\Install-OP1StudioTools.ps1 -All
```

## Outils en ligne de commande

Chaque bridge est un adaptateur Python isolé, sans accès réseau hors de
celui qu'il documente explicitement, qui ne touche jamais un fichier source
ni n'écrit sur un volume OP‑1 sans confirmation explicite de l'appelant.

**Firmware & images**

```powershell
python tools/firmware_fetch.py --help          # telechargement officiel valide (hote, taille, conteneur)
python tools/firmware_inspector.py --help      # CRC/LZMA/TAR/SHA-256 en lecture seule
python tools/firmware_bridge.py --help         # build reproductible + manifeste SHA-256
python tools/display_bridge.py --help          # tri des SVG d'ecran par categorie + patch non destructif
python tools/svg_preflight.py --help           # validation SVG avant modification
```

**Sons, patches, pistes**

```powershell
python tools/sample_preflight.py --help        # validation/conversion de samples
python tools/patch_bridge.py --help            # adaptateur sur op-patch-util
python tools/aiff_inspector.py --help          # inspection de conteneur AIFF, lecture seule
python tools/tape_bridge.py --help             # preparation de 4 pistes locales pour import Tape
python tools/content_catalog.py --help         # bibliotheque locale avec provenance et hash
```

**Projet, profil, machine**

```powershell
python tools/project_bridge.py --help          # format projet OP-1 Studio versionne
python tools/profile_bridge.py --help          # profil utilisateur dans un coffre local
python tools/device_inventory.py "E:"          # inventaire d'un volume monte, lecture seule
python tools/backup_manifest.py create "E:" backups/hardware-tests --label op1-disk
python tools/device_transfer_plan.py backups/tape-import "E:"
python tools/device_transfer_plan.py prepare backups/tape-import "E:"
python tools/device_transfer_plan.py restore backups/hardware-tests/op1-delete-restore-test_<snapshot> "E:" synth/user/8.aif --confirm
```

`device_inventory.py` inspecte un volume monté en lecture seule et
`backup_manifest.py` copie puis vérifie un snapshot local. Le transfert
direct vers le volume OP‑1 est volontairement bloqué tant que le moteur de
changement sécurisé (M5.3) n'est pas terminé. `device_transfer_plan.py`
prépare uniquement la liste des copies, avec hash source/cible ; il ne
lance aucune écriture sans la sous‑commande `execute` et son option
explicite `--confirm`.

## Tests

```powershell
npm run build
npm test
npm run lint
python -m unittest discover -s tests -p "test_*.py"
```

`npm test` fait tourner `npm run build` puis la suite Node native
(`node --test`) sur les modules audio/patch/MIDI/clavier ; la suite Python
couvre chaque bridge indépendamment (firmware, samples, projet, appareil,
images, catalogue).

## Architecture actuelle

```text
app/page.tsx             interface et fenetres de travail
app/components/          composants par fenetre (Studio, Sons, Exercices, Images...)
app/lib/                 oracles audio/patch, conversion, MIDI, disposition clavier
app/globals.css          langage visuel OP-1 Studio
tools/                   bridges locaux : firmware, images, sons, projet, appareil
data/                    catalogues (firmware, mods, contenu, clavier)
docs/                    feuille de route, bibles firmware/images, audits, recherches
tests/                   tests JS (Node --test) et contrats Python (unittest)
```

## Documentation technique

Les études techniques les plus denses sont consolidées en deux
« bibles » — un seul document à lire avant de démarrer un chantier
plutôt que de relire chaque étude séparément :

- [`docs/OP1_FIRMWARE_BIBLE.md`](docs/OP1_FIRMWARE_BIBLE.md) — conteneur
  `.op1`, base de données d'usine, moteurs/effets/LFO/séquenceurs, format
  patch, boutons machine ↔ champs JSON, comportement Tape, modes de
  connexion, catalogue de mods, avec pour chaque fait ce qui est déjà codé,
  codable maintenant ou hors périmètre.
- [`docs/OP1_IMAGE_BIBLE.md`](docs/OP1_IMAGE_BIBLE.md) — inventaire complet
  des 61 écrans SVG, palette exacte de la machine, patrons visuels
  réutilisables pour un éditeur de moteur, dictionnaire de codenames.

Voir aussi [docs/ROADMAP.md](docs/ROADMAP.md) et
[docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) pour l'état de livraison
détaillé et les limites connues.

## Feuille de route

1. finaliser le moteur de changement sécurisé (M5.3) pour la sauvegarde et
   le transfert réel vers un volume OP‑1 ;
2. brancher un cœur natif (Tauri/Rust) qui reprenne la logique aujourd'hui
   en Python, pour l'empaquetage desktop (M8) ;
3. ajouter la validation `op1svg` avant tout export d'image (thème,
   créateur de dessin, import), seul garde-fou encore manquant sur ce
   chantier ;
4. construire l'éditeur de moteur/preset (lecture des presets d'usine,
   contrôle de compatibilité avant export) ;
5. combos et touches d'effet dans le module Exercices.

Voir [docs/ROADMAP.md](docs/ROADMAP.md) pour le détail complet, jalon par
jalon.

## Contribuer

Lire [CONTRIBUTING.md](CONTRIBUTING.md), choisir un jalon, ajouter un test
quand un contrat change et garder les opérations machine vérifiables. Une
bonne contribution doit laisser moins de surprises qu'elle n'en trouve.

## Licence

Le code du dépôt est distribué sous **MIT**, conformément à
[`LICENSE`](LICENSE). Les dépendances, firmwares et ressources externes
conservent leurs licences respectives ; voir [NOTICE.md](NOTICE.md). Les
projets AGPL étudiés restent des références externes et ne sont pas incorporés
au code de cette application.
