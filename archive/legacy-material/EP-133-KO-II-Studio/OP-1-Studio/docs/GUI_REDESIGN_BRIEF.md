# Brief interface — vers un outil propre, simple, fun et raccord avec la machine

Vu le 12 août 2026, en complément de `ANALYSE_CONCURRENTS.md`, `CLONE_RESEARCH.md`, `OP1_KNOWLEDGE_BASE.md` et `TOOLING_SHORTLIST.md` (déjà à jour, pas réécrits ici) et après lecture du code actuel (`app/page.tsx`, `app/globals.css`).

## 1. Où on en est réellement (code, pas doc)

`app/page.tsx` fait 833 lignes en un seul fichier, tout en JSX inline sans découpage par écran (confirme le constat déjà noté dans le jalon M4.6). Ce qui existe déjà et fonctionne :

- bandeau machine en tête (molettes colorées, mini écran LCD façon OP-1) — identité forte, personne d'autre ne l'a ;
- écran Firmware avec catalogue de mods par catégorie et vignettes ;
- Studio : 4 pistes, transport commun, gain, fades, formes d'onde réelles, rendu WAV offline, export stems Tape, export Album + manifeste ;
- Clone clavier jouable + moniteur audio USB + piano-roll MIDI éditable et quantifiable.

Ce qui manque encore côté écran (pas juste doc) : un vrai écran d'accueil (l'app ouvre directement sur Firmware), l'index/tableau de la bibliothèque Sons, la grille de pads fidèle à la machine, et le module Éducation.

## 2. Étude de la machine officielle (source : teenage.engineering, guides & fiche produit, août 2026)

Confirmé directement sur le site officiel, à citer si besoin :

> « the four colored encoders, and the symbols on the keyboard are all designed for easy reading and to make it intuitive and non-technical to control and shape your sounds » — [teenage.engineering/products/op-1/original](https://teenage.engineering/products/op-1/original)

Points utiles pour être raccord :

- **4 encodeurs T1–T4 color-codés**, liés à ce qui s'affiche à l'écran (pas des boutons génériques) — [guide layout officiel](https://teenage.engineering/guides/op-1/original/layout).
- **Écran** : rendu vectoriel temps réel à 60 fps sur AMOLED. Nos captures firmware (`playmode.svg`, `rymd.svg`, `tapeconfig.svg`) sont en `viewBox 320×160` — **c'est la résolution réelle de l'écran OP-1**, donc réutilisables telles quelles comme fond de mini-écran au lieu d'une déco générique.
- **Philosophie de design** : restraint — peu de réglages visibles à la fois, chaque écran ne montre que ce qui est pertinent à l'instant (confirmé aussi côté concurrents dans `ANALYSE_CONCURRENTS.md`, section Studio).
- **Correction sourcée (12 août, après-midi) :** la vraie palette des 4 encodeurs, documentée par l'outil communautaire `op1-glitter` (voir [`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md)) qui les repeint avec succès sur une machine réelle, est **vert `#00ed95`, rouge `#ff3a5d`, bleu `#698eff`, blanc `#dfd9ff`**. Notre CSS (`app/globals.css`) et le logo (`docs/assets/op1-studio-mark.svg`) utilisent un **orange** à la place du blanc pour le 4e encodeur — ce n'est pas raccord avec la machine. Le code `MachineControls` dans `app/page.tsx` a lui déjà les bons labels (`BLEU`, `VERT`, `BLANC`, `ROUGE`). À corriger dans le CSS et le logo quand quelqu'un touche ce chantier visuel (pas fait dans cette passe pour ne pas croiser le travail en cours sur `app/page.tsx`).

## 3. Concurrents — ce qui manquait dans `ANALYSE_CONCURRENTS.md`

Complément trouvé sur le forum officiel ([liste communautaire à jour](https://op-forums.com/t/definitive-list-of-op-1-f-companion-software/30248)) et le site Teenage Engineering :

- **`drum utility` — outil officiel Teenage Engineering** ([teenage.engineering/apps/drum-utility](https://teenage.engineering/apps/drum-utility)) : c'est la référence la plus "raccord marque" du comparatif, et elle manquait. Grille de 24 emplacements numérotés avec noms suggérés par défaut (kick, kick alt, snare, rim, clap/snap, tambo/perc, closed hi-hat, open hi-hat, ride, crash…), glisser-déposer, aperçu au clavier ou en MIDI, `Espace` pour prévisualiser, `Suppr` pour effacer, `Maj` pour zoomer la forme d'onde, export en un bouton. Fond quasi neutre (`#F5F5F5`), aucune décoration : **c'est exactement le niveau de sobriété à viser pour notre grille de pads (M3)**.
- Autres outils confirmés mais mineurs pour nous : `digichain` (chaînes de samples), `LFO Buddy` (LFO MIDI), `OG-1` (app Android backup/restore + lecteur 4 pistes, patterns proches de notre Studio), `Xfer OP-1 drum utility` (Win/Mac). Rien qui change la feuille de route, mais `drum utility` officiel doit remplacer `OP-PatchStudio` comme référence n°1 pour la grille de pads — c'est du premier parti, pas un clone communautaire.

## 4. Inventaire réel des dessins « en stock » — attention, moins que prévu

Vérification sur le disque (`find` sur tout le dépôt, hors `node_modules`) :

| Fichier | Origine | Utilisable tel quel |
|---|---|---|
| `public/firmware-mods/playmode.svg` | écran Play Mode extrait du firmware OS246 | oui — 320×160, résolution écran réelle |
| `public/firmware-mods/rymd.svg` | écran RYMD extrait | oui |
| `public/firmware-mods/tapeconfig.svg` | écran Tape Config extrait | oui |
| `tools/vendor/op1repacker/assets/display/iter-lab.svg` | visuel du mod Iter Lab | oui, mais côté outil firmware, pas UI web |
| `docs/assets/op1-studio-mark.svg` | logo maison (déjà notre création) | oui, c'est notre bannière |

**Ce qui n'est pas en stock, contrairement à ce que suggère `data/mods/catalog.json`** : le catalogue référence « 61 SVG d'interface et d'écrans » et « 40 RAW audio » du pack firmware complet, mais ces fichiers ne sont **pas commités** — et c'est volontaire (`CONTEXT.md` : *« Aucun firmware propriétaire, pack tiers ou cache d'outil ne doit être ajouté à Git »*). Ils n'existent que si tu extrais toi-même un firmware officiel en local via `scripts/fetch-community-tools.sh` / `firmware_bridge.py`, dans `.cache/`, ignoré par Git.

**Conséquence concrète pour le boulot GUI :** on a réellement 3 écrans d'origine + notre logo à réutiliser tout de suite. Pour avoir plus de matière graphique authentique (icônes de mode, curseurs, symboles clavier), il faut soit extraire un firmware officiel en local (légal, lecture seule, déjà outillé), soit redessiner nous-mêmes des icônes dans le même style (traits fins, couleur unique sur fond sombre, comme `tapeconfig.svg`).

## 5. Fonctions à exposer, écran par écran (base de travail pour la refonte)

**Accueil (n'existe pas encore)** : grille de cartes par module (Firmware / Sauvegardes / Sons / Studio / Éducation / Documentation), badge « sans machine » ou « OP-1 requis » par carte, bandeau machine conservé au-dessus.

**Firmware (existe, à garder)** : source → catalogue mods par catégorie avec vignette → contrôles → export ; Labo expert séparé, opt-in.

**Sauvegardes (partiel)** : liste des sauvegardes avec taille, barre Storage/Usage qui passe au rouge avant la limite, bouton suppression isolé en rouge, plan de transfert (`device_transfer_plan.py`) affiché comme liste de fichiers avec hash avant toute confirmation.

**Sons & patches (à construire, priorité M3)** : tableau bibliothèque avec recherche/filtre/tri/favoris ; grille de pads fidèle à la disposition physique des 24 pads, lettre clavier visible sur chaque pad (repère direct pour le module Éducation) ; code couleur son d'origine vs importé ; onglet multisample avec clavier piano.

**Studio Tape & Album (le plus avancé)** : garder tel quel, mais simplifier l'écran de découpe à une seule forme d'onde + deux poignées + durée en direct quand on trim une piste, plutôt que d'afficher tous les réglages en même temps.

**Éducation (n'existe pas encore, M4.5)** : trois entrées visibles dès l'ouverture (apprentissage structuré / leçons ciblées / morceaux), grille de pads réutilisée de la section Sons, import MIDI pour « apprendre un morceau ».

**Documentation (n'existe pas encore)** : une page par module livré, pas une doc généraliste écrite d'un coup.

## 6. Direction de design proposée : propre, simple, un peu débile, raccord machine

- **Propre/simple** : un seul réglage visible à la fois par action (inspiré de `drum utility` officiel et de l'écran de découpe « Manager for OP1 »), pas de mur de curseurs.
- **Raccord machine** : réutiliser les 3 vrais écrans OS246 (`playmode`, `rymd`, `tapeconfig`) comme textures de mini-écran plutôt que des formes d'onde décoratives inventées ; garder les 4 encodeurs colorés comme grammaire visuelle du bandeau, pas comme décoration répétée partout.
- **Le côté « débile » assumé** : l'OP-1 lui-même a une radio FM intégrée et un capteur de mouvement pour des effets gadget — l'humour fait partie de la machine, pas un ajout artificiel. Pistes concrètes, sans nuire au sérieux des écrans machine (sauvegarde/transfert) :
  - un easter egg dans le journal d'activité (une ligne rigolote après une longue session inactive, dans le ton des messages d'attente de la machine) ;
  - noms de presets par défaut avec un peu de personnalité plutôt que « Track 1 », comme le fait `drum utility` officiel (« kick alt », « clap/snap ») ;
  - une micro-animation discrète des molettes quand rien ne se passe (elles « respirent » légèrement), jamais sur les écrans de sauvegarde/transfert où le sérieux prime.
- **Limite claire** : le fun reste cosmétique. Aucune blague ou animation sur les écrans qui touchent à une écriture réelle sur la machine — cohérent avec la règle d'or déjà en place (`README.md`).

## 7bis. Mise à jour — éditeur d'images livré

L'éditeur d'images machine décrit en section 4 a été construit :
`tools/display_bridge.py` (tri par catégorie/confiance + génération de
patch JSON) et l'écran "Images" dans l'application (chargement local,
aperçu groupé, édition non destructive, export patch). Voir
[`LOCAL_TOOLS.md`](LOCAL_TOOLS.md#editeur-dimages-machine) pour l'usage.
Point de vigilance : un chantier parallèle (navigation persistante de la
barre d'outils, voir `NEXT_STEP.md`) touche la même zone de `app/page.tsx` —
vérifier après chaque changement côté navigation que l'onglet "Images"
reste bien câblé.

## 7ter. Quadrillage machine et arrondis produit — appliqué le 13 août 2026

Demande : uniformiser les fenêtres avec une ambiance qui prolonge la
machine, un quadrillage rouge quasi transparent en fond, des formes plus
arrondies. Fait, en ciblant les changements globaux/additifs pour ne pas
croiser le travail en cours d'un autre agent sur `app/page.tsx` et les
composants — même logique de prudence que la section 7bis ci-dessus.

- **`--red` corrigé** dans `app/globals.css` : `#e3473f` → `#ff3a5d`, la
  vraie couleur du 4e encodeur documentée en section 2 ci-dessus (source
  `op1-glitter`). Le token n'était utilisé nulle part avant ce changement —
  aucune régression visuelle possible, seulement l'ajout ci-dessous qui s'en
  sert maintenant.
- **Quadrillage** : `body` a maintenant un calque `linear-gradient` en plus
  du dégradé existant, `24px` de pas, `var(--grid-line)` = rouge machine à
  5 % d'opacité — visible dans les marges/espaces entre panneaux, pas dessus
  (les panneaux gardent leur fond opaque). Classe `.machine-grid`
  réutilisable si un panneau plein écran veut le même fond.
- **Arrondi produit** : nouveau token `--radius-product: 18px`, pas encore
  appliqué nulle part — à utiliser sur les futurs conteneurs "vitrine"
  (cartes d'accueil, fenêtres pleine largeur) plutôt que sur les petits
  contrôles, qui gardent `--radius-control`.

**Volontairement pas fait ici** — c'est la vraie « uniformisation » demandée
et elle touche chaque composant, pas juste les tokens partagés : reprendre
un par un les rayons codés en dur (`border-radius: 4px/5px/6px/7px...`
dispersés dans tout `app/globals.css`) pour les remplacer par l'échelle de
tokens, et vérifier que chaque fenêtre (Firmware, Sauvegardes, Sons, Studio,
Exercices, Documentation) rend bien la même famille de formes une fois les
tokens en place. À faire une fois que le chantier `app/page.tsx` en cours
est stabilisé, pour ne pas re-toucher les mêmes lignes que lui.

## 7. Prochaines étapes concrètes

1. Découper `app/page.tsx` en composants par écran (prérequis déjà identifié en M4.6, à faire avant d'ajouter l'écran d'accueil pour ne pas alourdir un fichier déjà trop gros).
2. Construire l'écran d'accueil (grille de cartes + badges) en réutilisant le bandeau machine existant.
3. Construire la grille de pads fidèle (M3), avec `drum utility` officiel comme référence directe plutôt qu'un concurrent communautaire.
4. Décider : extraire un firmware officiel en local pour récupérer de vrais visuels supplémentaires, ou redessiner à la main dans le style des 3 SVG déjà en stock.
