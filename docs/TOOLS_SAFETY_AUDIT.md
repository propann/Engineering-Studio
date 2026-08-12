# Étude de fonctionnement des outils — pour ne pas faire de connerie

Audit du 12 août 2026, code lu directement (pas seulement les docs
d'usage). Chaque bridge de `tools/*.py` a un rôle et des garde-fous — ce
document liste ce que le code fait réellement, ce qu'il empêche, et ce qui
reste **sur le dos de l'opérateur** (humain ou UI) parce que l'outil ne peut
pas le vérifier lui-même. Pas de code changé ici, juste la lecture.

Méthode : lecture complète de chaque script, pas juste sa docstring.
`LOCAL_TOOLS.md` reste la référence d'usage (commandes) ; ce document est la
référence de confiance (ce qui protège vraiment, ce qui ne protège pas).

## Vue d'ensemble

| Outil | Écrit sur la machine ? | Écrit sur disque local ? | Réseau ? |
|---|---|---|---|
| `firmware_inspector.py` | non | non | non |
| `firmware_fetch.py` | non | oui (fichier téléchargé) | oui, restreint |
| `firmware_bridge.py` | non | oui (nouveau `.op1`) | non |
| `display_bridge.py` | non | oui (SVG triés, patch JSON) | non |
| `device_inventory.py` | non | non | non |
| `backup_manifest.py` | non | oui (snapshot) | non |
| `device_transfer_plan.py` | **oui, seulement `execute`/`restore`** | oui | non |
| `sample_preflight.py` | non | oui (conversions) | non |
| `patch_bridge.py` | non | oui (patch produit) | non |
| `tape_bridge.py` | non | oui (pistes converties) | non |
| `content_catalog.py` | non | oui (manifeste du coffre) | non |
| `project_bridge.py` | non | oui (projet JSON) | non |

Un seul outil peut écrire sur un volume OP-1 monté : `device_transfer_plan.py`,
et seulement avec `execute`/`restore` + `--confirm`. Tous les autres
préparent, vérifient ou copient localement.

## `firmware_inspector.py` — lecture seule, garde-fous vérifiés dans le code

- rejette tout membre TAR avec chemin absolu, `..`, séparateur `\`, ou type
  autre que fichier/dossier (`_validate_member_path`, `_member_kind`) —
  empêche une traversée de chemin même en mode inspection ;
- limite explicite de taille compressée (32 Mio), décompressée (256 Mio) et
  nombre d'entrées (10 000) — refuse une bombe de décompression avant de finir
  le déballage ;
- vérifie le CRC-32 stocké contre le payload avant toute décompression.

**Point de vigilance :** `recognized_layout` devient vrai dès que **deux**
marqueurs connus sont trouvés (`OP1_vdk.ldr`, `te-boot.ldr`, `op1.db`,
`op1_factory.db`, `tape.db`) — ce n'est pas une preuve que le fichier est un
firmware OP-1 authentique, juste un indice. Ne pas le traiter comme une
validation de source dans l'UI.

## `firmware_fetch.py` — la seule porte réseau du projet

- refuse tout ce qui n'est pas HTTPS + hôte listé dans
  `policy.allowedDownloadHosts` du catalogue + chemin finissant par `.op1`
  (`validate_official_url`) ;
- **revalide chaque redirection** contre la même liste d'hôtes
  (`RestrictedRedirectHandler`) — empêche un hôte autorisé de rediriger vers
  un hôte non autorisé, un point souvent oublié dans ce genre de garde-fou ;
- limite de taille appliquée deux fois : sur l'en-tête `Content-Length`
  déclaré et sur le flux réellement reçu (`_copy_stream`) — un serveur qui
  ment sur la taille ne suffit pas à contourner la limite ;
- écrit dans un fichier temporaire (`.partial`) puis `os.replace` seulement
  après validation complète du conteneur.

**Point de vigilance réel** : le catalogue actuel
(`data/firmware/catalog.json`) a `"sha256": null` pour la seule version
listée. Le code gère bien ce cas (`sha256Approved: false` si absent), mais
ça veut dire qu'aujourd'hui, un téléchargement est validé par la forme du
conteneur (CRC/LZMA/TAR) et pas encore par une empreinte connue à l'avance.
Ne pas laisser l'UI afficher un badge "vérifié" qui sous-entendrait plus que
ça tant que le catalogue n'a pas de `sha256` renseigné.

## `firmware_bridge.py` — build hors machine

- copie systématique du fichier source avant tout `unpack`/`repack`
  (`tempfile.TemporaryDirectory`) — le fichier original passé en `--input`
  n'est jamais ouvert en écriture ;
- `VALID_OPTIONS` fermé par `argparse choices` — impossible de passer une
  option de mod inconnue en ligne de commande ;
- manifeste JSON écrit à côté du build avec `"flashed": false` explicite.

**Point de vigilance réel, à corriger dans les docs plutôt que dans le
code** : `VALID_OPTIONS` ne contient que `gfx-cwo-moose` — **pas**
`gfx-cwo-cat`, `gfx-cwo-dog` ni `gfx-cwo-wizard`, alors que
`FIRMWARE_MOD_CATALOG.md` les présente comme « variantes vérifiées
séparément ». Concrètement : aujourd'hui, seule la variante *moose* est
sélectionnable via ce bridge ; les trois autres n'ont pas (encore) d'entrée
dans `VALID_OPTIONS` malgré la vérification déjà faite ailleurs. Ne pas
supposer que les quatre sont proposables tant que ce n'est pas ajouté ici.

Aussi : rien dans `modify()` n'empêche de combiner deux mods graphiques qui
ciblent le même fichier SVG dans une même commande — l'exclusivité CWO reste
une règle documentée, pas un contrôle en code (même constat déjà noté dans
`FIRMWARE_LAB_FUNCTIONS.md` côté UI, confirmé ici côté bridge).

## `display_bridge.py` — édition non destructive

- `unpack_readonly` ne touche jamais `source` : toujours une copie dans un
  répertoire temporaire ;
- `build_patch` échappe soigneusement les backslashs du texte édité avant de
  les injecter dans une regex de remplacement (`re.sub`) — sans ça, un SVG
  édité contenant un `\` produirait un patch invalide ou une erreur `re.error`
  à l'application ; le commentaire dans le code explique précisément pourquoi.

**Point de vigilance** : `categorize()` classe par nom de fichier
(`CATEGORY_MAP`), pas par contenu — un fichier renommé changerait de
catégorie affichée sans que rien ne le signale comme incohérent. Faible
risque, mais à savoir avant d'afficher la catégorie comme une certitude
dans l'UI plutôt qu'une aide au tri.

## `device_inventory.py` — lecture seule, le plus simple des outils

- rejette tout symlien et tout fichier "spécial" (`InventoryError
  special_file`) ;
- `confidence: "high"` seulement si les quatre dossiers `tape/album/synth/drum`
  sont tous présents, sinon `"medium"` — c'est l'indicateur qui doit
  empêcher l'UI de traiter n'importe quel dossier comme un OP-1 confirmé.

Rien à signaler comme point de vigilance : c'est le seul outil dont la
surface de risque est proche de zéro (aucune écriture, aucun réseau, rejet
strict des cas ambigus).

## `backup_manifest.py` — le socle du Safe Change Engine

- refuse une destination qui contiendrait la source ou l'inverse
  (`destination_inside_source`) — empêche une sauvegarde qui se copierait
  dans elle-même ;
- écriture atomique par fichier temporaire `.partial` puis `os.replace`, avec
  `fsync` avant le remplacement — une coupure de courant laisse un
  `.partial` orphelin, jamais un fichier final à moitié écrit ;
- vérifie le SHA-256 de chaque fichier copié contre la source **avant**
  d'écrire l'entrée manifeste correspondante ;
- si une erreur survient en cours de sauvegarde, le snapshot entier est
  supprimé (`shutil.rmtree` dans le `except`) — pas de snapshot partiel
  silencieux.

**Point de vigilance** : pas de déduplication ni de sauvegarde incrémentale
(déjà noté comme limite connue dans `ARCHITECTURE.md`) — chaque `create`
recopie tout. Ce n'est pas un bug, juste un coût à connaître avant de lancer
des sauvegardes fréquentes sur un gros volume.

## `device_transfer_plan.py` — le seul outil qui peut écrire sur la machine

- `prepare` ne fait jamais d'écriture, retourne toujours `machineWrite:
  false` — sûr par construction ;
- `execute` et `restore` refusent de s'exécuter sans `--confirm`
  (`confirmation_required`), et `execute` revérifie la sauvegarde fournie
  (hash de chaque fichier du snapshot) **avant** de copier quoi que ce soit ;
- toute copie passe par un fichier temporaire `.op1studio.partial`, vérifié
  par hash après écriture, puis `os.replace` — jamais d'écriture directe sur
  le nom final ;
- `restore_file` refuse d'écraser un fichier existant sans `--replace`
  explicite, et ne supprime jamais de fichier, cohérent avec la doc ;
- `_allowed()` restreint toute opération aux quatre racines `tape`, `album`,
  `synth/user`, `drum/user` — un chemin en dehors est rejeté
  (`unexpected_path`), y compris pendant `execute`.

**Point de vigilance réel, le plus important de cet audit** : `execute`
vérifie que la sauvegarde passée en argument est **valide** (hashes
cohérents), mais rien dans le code ne vérifie qu'elle correspond **au même
volume `device`** que celui qu'on s'apprête à écrire. Un opérateur (ou une
UI mal câblée) pourrait fournir une sauvegarde d'un autre OP-1 ou d'un ancien
état sans que l'outil s'en aperçoive — la vérification porte sur
l'intégrité de la sauvegarde, pas sur sa correspondance avec la cible. Tant
que l'UI ne relie pas explicitement "ce volume" à "cette sauvegarde-là", ça
reste une responsabilité humaine, pas un filet de sécurité automatique.

## `sample_preflight.py` / `patch_bridge.py` / `tape_bridge.py`

Les trois suivent le même schéma : jamais d'écriture sur la source, toujours
un dossier de sortie séparé, refus d'écraser une sortie déjà présente
(`patch_bridge.py`, `tape_bridge.py`), FFmpeg localisé de façon prévisible
(`shutil.which` puis chemin `LOCALAPPDATA` fixe, jamais un chemin fourni par
l'utilisateur exécuté tel quel).

**Point de vigilance `sample_preflight.py`** : la limite de durée (6 s
synthé / 12 s drum) est vérifiée sur le fichier **source** avant conversion,
avec une tolérance de 0,01 s — mais rien ne revérifie la durée du fichier de
**sortie** après conversion FFmpeg, seulement son format (mono/44100/16
bits). Un rééchantillonnage qui changerait légèrement la durée ne serait pas
détecté ici. Risque faible, mais à garder en tête si un jour un format
d'entrée exotique produit un écart.

**Point de vigilance `patch_bridge.py`** : `run()` exécute `op-patch-util`
avec `subprocess.run(command, check=False)` **sans capturer stdout/stderr**
— une erreur de l'outil tiers s'affiche directement dans la console de
l'utilisateur, pas dans un format JSON structuré comme le reste des bridges.
Cohérent avec le rôle d'« adaptateur », mais ça veut dire que l'UI ne peut
pas afficher un message d'erreur propre sans changer ce comportement plus
tard.

## `content_catalog.py` — le coffre local

- refuse d'utiliser une racine de système de fichiers comme bibliothèque
  (`normalise_root`) — protège contre un `C:\` ou `/` donné par erreur ;
- `scan()` préserve `importStatus`/`licenseStatus`/`source` déjà renseignés
  d'un scan précédent — un nouveau scan ne réinitialise jamais silencieusement
  une décision de licence déjà prise sur un fichier ;
- `verify()` détecte les fichiers manquants, modifiés et **non suivis** —
  utile pour repérer un fichier ajouté hors du flux `scan`.

**Point de vigilance, à noter plutôt qu'à corriger** : `LAYOUT` prévoit un
dossier `firmware/modded` dans le coffre local — ça peut sembler contredire
la règle « aucun firmware dans le dépôt », mais ce dossier vit **hors Git**,
dans le coffre personnel de l'utilisateur (`CONTEXT.md` le prévoit
explicitement). Bon réflexe à garder : ce coffre n'est pas soumis aux mêmes
règles que le dépôt, mais reste soumis à la politique de quarantaine
(`"unknownLicense": "quarantine"` dans le manifeste par défaut) — un
firmware modifié qui y atterrit reste marqué `quarantine` tant que personne
n'a renseigné sa source.

## `project_bridge.py`

Validation de schéma pure (pas d'E/S sensible) : structure à 4 pistes,
tempo entre 20 et 300, `clips`/`midi_events` toujours des listes. Rien à
signaler, c'est le plus simple des bridges après `device_inventory.py`.

## Synthèse — les trois choses à retenir pour ne pas faire de connerie

1. **Un seul outil écrit sur la machine** (`device_transfer_plan.py execute`/
   `restore`), toujours derrière `--confirm` + vérification de sauvegarde —
   mais cette vérification ne prouve pas que la sauvegarde correspond au bon
   volume. C'est le point le plus important de cet audit.
2. **`firmware_bridge.py` ne propose aujourd'hui qu'une seule variante CWO**
   (`gfx-cwo-moose`) malgré ce que la doc du catalogue de mods laisse
   entendre sur les quatre variantes.
3. **`firmware_fetch.py` est solide contre le réseau** (hôte, HTTPS,
   redirections, taille) mais ne peut pas encore garantir un hash connu à
   l'avance tant que le catalogue n'en publie pas.

## Référence croisée

[`LOCAL_TOOLS.md`](LOCAL_TOOLS.md) (usage) · [`ARCHITECTURE.md`](ARCHITECTURE.md)
(modèles de domaine) · [`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) ·
[`FIRMWARE_SAFETY.md`](FIRMWARE_SAFETY.md) · [`TOOLING_GAP_ANALYSIS.md`](TOOLING_GAP_ANALYSIS.md)
