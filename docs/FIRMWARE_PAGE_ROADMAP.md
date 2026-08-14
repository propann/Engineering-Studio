# Feuille de route — page Firmware seule

Feuille de route dédiée à la page Firmware, séparée de
[`ROADMAP.md`](ROADMAP.md) parce que ce chantier a pris assez d'ampleur pour
mériter la sienne. Rassemble les idées données le 14 août 2026 (en vrac,
reformulées ici une par une) sur ce qui vient d'être livré et ce qui reste
à construire, dans l'ordre où ça a du sens de s'y attaquer.

Contexte : [`FIRMWARE_PAGE_UI_SPEC.md`](FIRMWARE_PAGE_UI_SPEC.md) (référence
`op1REpackerGUI`, disposition trois colonnes) et
[`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) (tout ce qu'on sait sur le
firmware lui-même) restent les documents de fond — celui-ci ne les répète
pas, il liste juste ce qu'il reste à faire sur **cette page précise**.

## Livré (14 août 2026)

- Bug de navigation corrigé : « Firmware » (barre latérale et carte
  d'accueil) ouvrait par erreur l'atelier graphique (Images) au lieu du
  centre de contrôle Firmware.
- Bouton « Détecter l'OP-1 en MIDI » retiré (pas pertinent ici, la
  préparation firmware passe par Disk mode/TE-boot, pas par MIDI — voir
  [`OP1_CONNECTION_MODES.md`](OP1_CONNECTION_MODES.md)).
- Bandeau « Prototype interactif » retiré.
- Disposition en trois colonnes toujours visibles (actions / mods / outils)
  à la place du suivi à 4 étapes, inspirée d'`op1REpackerGUI`.

## 1. Charger un firmware de base comme source de travail active

**Constat actuel** : le bouton « Télécharger le firmware officiel » ne fait
qu'un téléchargement navigateur classique — le fichier ne devient pas une
« source active » que le reste de la page peut inspecter ou modifier. Le
sélecteur « Fichier local à vérifier » est le seul point d'entrée vers une
source réellement utilisable par les mods.

**Cible** : les deux chemins (télécharger l'officiel, choisir un fichier
local) doivent aboutir au même état — un firmware source chargé, vérifié
(`tools/firmware_inspector.py` déjà capable de le faire), affiché comme tel
en haut de la colonne centrale, prêt à recevoir les mods sélectionnés.
« Si ça n'existe pas encore, on le crée » — s'il n'y a pas encore de
firmware source choisi, la page doit le dire clairement plutôt que de
laisser les colonnes Mods/Outils actives dans le vide.

## 2. Petit écran de statut (mini-écran) dans la page Firmware

Idée : une fois un firmware chargé, afficher son état dans un petit écran
façon machine (même famille visuelle que `.mini-screen` du bandeau
principal) — version, taille, CRC valide/invalide, nombre de mods
sélectionnés. Réutilise un composant déjà existant plutôt que d'en
inventer un nouveau ; voir aussi le chantier d'entête compact (§5 plus
bas, demandé séparément) qui pourrait partager le même widget.

## 3. Catégories de mods repliables (gagner de la place)

**Constat actuel** : les 5 catégories (Écrans, Audio, Ressources,
Fonctions, Thèmes) s'affichent toutes dépliées en même temps — long à
parcourir.

**Cible** : chaque catégorie devient un bouton (nom + compteur de mods
sélectionnés dans cette catégorie) ; cliquer déplie la liste de cette seule
catégorie. Une seule catégorie ouverte à la fois, ou plusieurs — à trancher
au moment de coder selon ce qui reste le plus lisible. Pas de changement
de données, seulement l'affichage (le `firmwareMods`/`selectedMods`
existants suffisent).

## 4. Détail d'un mod : une page qui explique + une case à cocher au même endroit

**Constat actuel** : cliquer sur l'aperçu image ouvre une fenêtre de détail
(`selectedMod`, déjà construite) qui montre l'image et la description,
mais la case à cocher pour activer le mod reste sur la petite carte, pas
sur cette fenêtre de détail — deux endroits différents pour « comprendre »
et « activer ».

**Cible** : cliquer n'importe où sur un mod (pas seulement l'image) ouvre
sa fiche détaillée ; la case à cocher d'activation vit sur cette fiche,
pas seulement sur la carte compacte. La carte compacte peut garder une
case à cocher rapide pour qui ne veut pas ouvrir le détail, mais la fiche
devient le parcours de référence pour comprendre avant d'activer.

## 5. Écran de simulation — prévisualiser l'effet des mods sélectionnés

Idée plus ambitieuse, pas encore cadrée en détail : un aperçu qui montre à
quoi ressemblerait un écran (ou le firmware) une fois les mods graphiques
sélectionnés appliqués, avec un bouton dédié pour une « vue rapide ».
Techniquement faisable pour les mods d'écran (`gfx-*`) qui sont des SVG
remplacés — un aperçu avant/après est déjà le principe de
`Op1PixelEditor`/`DisplayEditor` dans la fenêtre Images. Reste à décider :
un aperçu par mod sélectionné (simple, déjà presque couvert par la fiche
détail §4), ou un aperçu combiné de tous les mods actifs à la fois (plus
proche de ce qui est décrit ici, plus de travail). **Pas commencé,
nécessite une décision de portée avant de coder.**

## 6. Connexion des dossiers pour l'éditeur d'images — déjà livré, à vérifier

Déjà construit : le coffre local (`images/original/library/workspace/
themes/exports/manifests`, voir [`IMAGE_LIBRARY.md`](IMAGE_LIBRARY.md)) et
les boutons « Charger des écrans .svg » / « Importer tout content/display »
dans la fenêtre Images permettent déjà de choisir des images depuis un
dossier connecté, pas seulement un import fichier par fichier. Rien à
construire ici a priori — à confirmer que c'est bien ce que tu avais en
tête, sinon préciser ce qui manque encore.

## 7. Patches qui « passent par un flash » — deux mécanismes bien différents, à ne pas confondre

Point important trouvé en creusant la question : il y a **deux façons
totalement différentes** de mettre un son sur la machine, pas une seule :

| | Patch utilisateur (`synth/user/*.aif`, `drum/user/*.aif`) | Preset d'usine (`op1_factory.db`) |
|---|---|---|
| Où | Fichier AIFF copié en Disk mode | Ligne SQLite à l'intérieur du firmware `.op1` |
| Comment | `op-patch-util` (délégué, décision déjà actée) | `op1repacker`, mod `data-factory-presets` |
| Écriture machine | Copie de fichier simple | **Nécessite de repacker et réinstaller tout le firmware** |
| Risque | Faible, déjà le chemin recommandé | Élevé — `data/mods/catalog.json` le classe `candidate-fixtures-required`, priorité P1 |

Un patch synthé/drum classique **ne passe jamais par un flash** — c'est un
fichier copié, pas un firmware réinstallé. Seuls les presets d'usine
intégrés au firmware lui-même demandent un repack + TE-boot. Si l'objectif
est de fabriquer un son personnalisé utilisable sur la machine, le chemin
patch utilisateur (déjà prévu, voir
[`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md)) est le bon —
beaucoup plus simple et déjà dans la feuille de route principale.

## 8. Créer un synthé et l'injecter — possible, mais à ne pas confondre avec la fabrication d'un patch

Réponse honnête à « je ne sais pas si on peut » : **oui, techniquement
possible**, mais il faut distinguer deux choses très différentes derrière
le mot « créer un synthé » :

1. **Fabriquer un patch utilisateur** avec un des 13 moteurs déjà présents
   sur la machine (Cluster, Digital, DNA…) — c'est l'éditeur de moteur déjà
   décrit dans `ENGINE_EDITOR_CONCEPT.md` (lecture des presets réels,
   4 knobs + ADSR + FX + LFO, contrôle de compatibilité avant export). Pas
   un nouveau moteur : un réglage d'un moteur existant, exporté comme
   patch `.aif` normal, copié comme n'importe quel autre patch utilisateur.
   **C'est ce qui est déjà dans la feuille de route principale (M3), pas
   commencé mais cadré.**
2. **Ajouter un preset d'usine supplémentaire dans `op1_factory.db`** (la
   voie du mod `data-factory-presets`, §7 ci-dessus) — techniquement
   possible (SQLite standard, déjà lu et écrit par `op1repacker`), mais
   classé risque élevé et nécessite un repack + TE-boot complet à chaque
   changement. Pas la voie recommandée pour un usage courant.

**Ce qui n'est pas possible** : injecter un nouveau moteur de synthèse
*compilé* (un vrai 14e algorithme, différent d'Iter qui n'était qu'une
ligne SQLite déjà présente en mémoire) — ça demanderait de modifier
`OP1_vdk.ldr`, chiffré, aucune preuve communautaire reproductible, classé
explicitement hors périmètre (voir
[`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §15).

**Recommandation** : avancer sur (1) — l'éditeur de moteur pour un patch
utilisateur — c'est du typage `Sons`/M3 déjà cadré depuis le 13 août, pas
un nouveau chantier Firmware. (2) reste possible plus tard mais commence
au même stade que « Presets/samples d'usine personnalisés » déjà listé en
risque élevé dans `FIRMWARE_MOD_CATALOG.md`.

## 9. Entête compact des fenêtres (chantier séparé, déjà demandé)

Demandé dans la foulée mais concerne **toutes** les fenêtres, pas
seulement Firmware : bouton de sortie déplacé dans le premier bloc de
l'entête (à gauche, façon retour plutôt que croix flottante), entête
réduit en hauteur, petit écran de statut machine toujours visible, mode de
connexion affiché, une mini-représentation de la bande. Pas encore
implémenté — chantier à part entière qui touche
`.tool-window-header`/`.machine-strip` dans `app/globals.css` et la
structure de `app/page.tsx` partagée par toutes les fenêtres. Sera traité
séparément de la présente feuille de route Firmware, avec sa propre
vérification live avant de le considérer fait.

## Ordre de travail proposé

1. §3 (catégories repliables) — gain immédiat, faible risque, données déjà là.
2. §4 (fiche détail = case à cocher) — cohérent avec §3, même zone de code.
3. §1 (firmware source active) — condition pour que §2 et §5 aient un sens.
4. §2 (mini-écran de statut) — une fois §1 fait, il y a quelque chose à afficher.
5. §5 (simulation) — après le reste, la portée exacte reste à trancher.
6. §9 (entête compact) — chantier transverse, en parallèle si besoin, pas bloquant sur 1-5.
7. §7/§8 — pas un chantier de code immédiat, juste la clarification déjà écrite ci-dessus ; la vraie prochaine étape est l'éditeur de moteur déjà dans `ROADMAP.md` (M3).
