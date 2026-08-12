# Fenêtres restantes — inventaire des fonctions cibles

Suite de [`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md), même
exercice pour les autres fenêtres de l'application : **Accueil**,
**Sauvegardes**, **Sons**, **Studio**, **Exercices** et **Documentation**.
Avec Firmware (qui absorbe Images), ça couvre les 7 cartes actuellement
livrées dans `HomeHub` — aucune page prévue n'est laissée de côté. Document
d'organisation uniquement, pas de code. État vérifié le 12 août 2026, sur la
base de `app/page.tsx`, `README.md`, `PROJECT_STATUS.md`, `APP_SCOPE.md`,
`GUI_REDESIGN_BRIEF.md` et `LOCAL_TOOLS.md`.

## Rappel de cohérence : "Machine" (`APP_SCOPE.md`) n'est pas une fenêtre séparée

`APP_SCOPE.md` liste cinq espaces dont un espace **Machine** (explorateur,
remplissage, éjection). Dans l'implémentation actuelle il n'existe pas de tel
onglet : ses fonctions sont réparties entre **Sauvegardes** (inventaire,
snapshot, plan de transfert) et **Sons** (préparation de pack, transfert
audio). Ce document garde ce découpage réel plutôt que d'ajouter une septième
fenêtre ; si un vrai espace Machine devient nécessaire (ex. explorateur de
fichiers OP-1 générique, pas seulement audio), il faudra trancher séparément
plutôt que le glisser silencieusement dans Sauvegardes.

---

## Sauvegardes

| Fonction | État | Outil |
|---|---|---|
| Détection en lecture seule d'un volume OP-1 (`tape`, `album`, `synth`, `drum`) | existe | `tools/device_inventory.py` |
| Choix explicite du dossier racine de sauvegarde | existe | UI `backups` |
| Snapshot complet avec manifeste SHA-256 par fichier | existe | `tools/backup_manifest.py create` |
| Vérification d'un snapshot existant | existe | `tools/backup_manifest.py verify` |
| Résumé de la dernière sauvegarde (date, nombre de fichiers, taille) | existe (donnée figée dans l'UI, pas encore branchée à un vrai snapshot) | UI `backups` |
| Comparaison entre deux sauvegardes (fichiers changés) | existe côté validation matérielle (`HARDWARE_TESTS.md`), pas encore affichée dans l'UI | à construire |
| Barre Storage/Usage qui passe au rouge avant la limite | à construire (proposé dans `GUI_REDESIGN_BRIEF.md`) | — |
| Plan de transfert (liste copy/skip + hash source/cible, avant toute écriture) | existe en CLI | `tools/device_transfer_plan.py prepare` |
| Exécution du transfert avec confirmation explicite | existe en CLI, pas branché à l'UI | `tools/device_transfer_plan.py execute --confirm` |
| Restauration d'un fichier supprimé depuis un snapshot | existe en CLI, pas branché à l'UI | `tools/device_transfer_plan.py restore --confirm` |
| Bouton de suppression isolé visuellement (rouge, séparé des actions sûres) | à construire | proposé dans `GUI_REDESIGN_BRIEF.md` |
| Time Capsule Pistes (Tape + Album uniquement, sans firmware ni samples) | existe | UI `backups`, bouton dédié |
| Connexion Drive (sauvegarde distante) | notice seulement, pas implémenté | UI `backups` |
| Éjection native du volume après opération | à construire | dépend du bridge natif (`ROADMAP.md` étape 5) |

## Sons (bibliothèque + patches + pads)

| Fonction | État | Outil |
|---|---|---|
| Préflight WAV/AIFF (durée, format, limites 6 s synthé / 12 s drum) | existe | `tools/sample_preflight.py` |
| Classement automatique `synth/user` vs `drum/user` | existe | `tools/sample_preflight.py` |
| Conversion mono 44,1 kHz / 16 bits via FFmpeg | existe | `tools/sample_preflight.py` |
| Contrôles patch synthé (fréquence de base) | existe | `SoundControlsPanel` |
| Contrôles patch drum (octave racine, mode basse résolution) | existe | `SoundControlsPanel` |
| Création de patch via `op-patch-util` | existe en CLI | `tools/patch_bridge.py` |
| Grille de 24 pads fidèle à la disposition physique, lettres clavier visibles | existe | `SoundPadGrid` |
| Glisser-déposer un sample sur un pad, prévisualisation clavier/`Espace`, suppression `Suppr` | existe | `SoundPadGrid` |
| Bibliothèque avec recherche/filtre/tri/favoris | recherche, filtres et favoris existent ; tri avancé à poursuivre | `SoundLibraryIndex` |
| Onglet multisample avec clavier piano | à construire | — |
| Code couleur son d'origine vs importé | à construire | — |
| Préparation de pack (`synth/user`, `drum/user`, `tape`, `album`) | existe | UI `sounds` |
| Transfert du pack vers l'OP-1 | plan préparé, écriture réelle bloquée tant que le bridge natif n'existe pas | UI `sounds` + `tools/device_transfer_plan.py` |
| Import depuis un dépôt local universel (coffre hors Git) | existe en CLI | `tools/content_catalog.py` |
| Import depuis des services communautaires (op1.fun, etc.) | piloté manuellement par l'utilisateur, pas de scraping ni compte | `CONTEXT.md` |

## Studio (Tape & Album)

| Fonction | État |
|---|---|
| Quatre pistes avec transport commun | existe |
| Position audio maître, gain par piste | existe |
| Trim de fin, fade-in et fade-out non destructifs | existe |
| Vue globale de six minutes | existe |
| Formes d'onde réelles (analyse audio, pas décorative) | existe |
| Rendu WAV offline | existe |
| Export stems Tape séparés | existe |
| Export face Album + manifeste | existe |
| Piano-roll éditable avec quantification | existe |
| Capture MIDI temporelle (note-on/note-off) et relecture programmée | existe |
| Simplification de l'écran de découpe à une forme d'onde + deux poignées + durée en direct | existe dans le mode Trim focalisé de Studio |
| Rechargement des sources audio depuis leurs chemins locaux après réouverture d'un projet | à construire — limite connue de `PROJECT_STATUS.md` |
| Format de projet `op1-studio-project` v1 (sauvegarde/rechargement mixage, clips, événements MIDI) | existe |

## Exercices (module MIDI / éducation)

| Fonction | État |
|---|---|
| Sélection d'une suite d'accords et d'un tempo | existe (UI statique) |
| Détection Web MIDI, entrée/sortie identifiées | existe côté module MIDI général, pas encore branché ici |
| Validation locale des notes reçues, de l'ordre des accords et du timing | annoncé dans l'UI (`tool-note`), pas encore implémenté |
| Grille de pads réutilisée depuis Sons pour un mode "finger drumming" | à construire, proposé dans `GUI_REDESIGN_BRIEF.md` (référence technique : `sampi/finger`) |
| Import MIDI pour apprendre un morceau existant | à construire |
| Trois entrées d'apprentissage distinctes (structuré / leçons ciblées / morceaux) | à construire, jalon M4.5 non commencé |
| Repère clavier direct (lettre visible par pad, cohérent avec Sons) | dépend de la grille de pads partagée ci-dessus |

## Documentation

| Fonction | État |
|---|---|
| Fiches courtes par fonctionnalité (Exercices, firmware officiel, éditeur firmware) | existe, format minimal |
| Lien externe vers le guide TE-boot officiel | existe |
| Une page par module livré plutôt qu'une doc généraliste écrite d'un coup | orientation prise dans `GUI_REDESIGN_BRIEF.md`, pas encore réalisée dans l'UI (ce document et les autres `docs/*.md` existent en dehors de l'app, pas encore affichés dedans) |
| Recherche/sommaire dans la documentation intégrée | à construire |
| Lien direct depuis chaque fenêtre vers sa propre fiche de doc | à construire |

---

## Accueil

Livré (`app/components/HomeHub.tsx`, confirmé par `ROADMAP.md` M4.6 :
« le hub d'accueil par modules est maintenant livré »). Corrige une
information obsolète encore présente dans `GUI_REDESIGN_BRIEF.md`/
`PROJECT_STATUS.md`, qui la décrivaient comme manquante.

| Fonction | État |
|---|---|
| Grille de 7 cartes module (Firmware, Sauvegardes, Sons, Studio, Images, Exercices, Documentation) | existe |
| Badge "SANS MACHINE" / "OP-1 REQUIS" par carte | existe |
| Bandeau machine (molettes, mini écran) conservé au-dessus | existe (dans `app/page.tsx`, hors `HomeHub`) |
| Carte "Images" séparée | à retirer si la fusion avec Firmware décrite dans `FIRMWARE_LAB_FUNCTIONS.md` est retenue — sinon la carte pointe vers un onglet qui n'existera plus |

## Référence croisée

[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) · [`APP_SCOPE.md`](APP_SCOPE.md) ·
[`GUI_REDESIGN_BRIEF.md`](GUI_REDESIGN_BRIEF.md) · [`PATCH_EDITOR_SPEC.md`](PATCH_EDITOR_SPEC.md) ·
[`LOCAL_TOOLS.md`](LOCAL_TOOLS.md) · [`PROJECT_STATUS.md`](PROJECT_STATUS.md)
