# Le créateur de dessin — contenu original plutôt qu'importé

Document d'organisation, pas de code. Idée posée le 12 août 2026, en
remplacement direct de la piste refusée plus tôt le même jour (chercher des
firmwares modifiés en ligne pour en extraire les images) : au lieu d'aller
récupérer des dessins dont on ne connaît ni l'auteur ni la licence, OP‑1
Studio dessine ses propres écrans. Ça règle le problème de source à la
racine — le contenu nous appartient parce qu'on l'a fait, pas parce qu'on l'a
trouvé.

## Ce que c'est

Un éditeur vectoriel intégré, à l'échelle réelle de l'écran OP‑1, pour créer
des icônes et écrans **originaux** au même endroit que l'édition non
destructive des SVG déjà livrée (`display_bridge.py` + écran Images). C'est
la brique qui manquait à la fonction déjà notée « Import d'un SVG arbitraire
dessiné par l'utilisateur » dans
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) (section C, classée
expérimentale) — au lieu d'un simple champ d'import qui accepte n'importe
quel fichier venu de n'importe où, on donne à l'utilisateur l'outil pour
dessiner directement dedans.

## Pourquoi ça règle le problème de licence

| Avant (refusé) | Avec le créateur de dessin |
|---|---|
| Firmware modifié téléchargé en ligne, source et licence inconnues | Rien de téléchargé, rien d'extrait d'un tiers |
| Images qui contiennent probablement du contenu propriétaire TE + un mod tiers non attribué | Dessin fait dans l'app, appartient à celui qui l'a fait |
| Import en masse impossible à vérifier un par un | Un dessin à la fois, créé consciemment |

Le seul contenu tiers qui reste légitime est celui déjà couvert par les
règles existantes : les SVG extraits du **firmware officiel téléchargé par
l'utilisateur lui-même** (`display_bridge.py`, déjà conforme à `NOTICE.md`)
et les mods communautaires ajoutés un par un avec licence vérifiée
(`FIRMWARE_MOD_CATALOG.md`). Le créateur de dessin est une troisième source,
propre par construction : ni téléchargée ni extraite, dessinée.

## Contraintes qui le rendent utilisable (pas un éditeur SVG générique)

Sans contraintes, un éditeur vectoriel libre produirait des écrans qui ne
ressemblent pas à la machine. Trois garde-fous, tirés de ce qu'on a déjà
observé sur du vrai firmware :

- **Canevas à la résolution réelle** : `viewBox` 320×160, la résolution
  confirmée des écrans OS 246 (`playmode.svg`, `rymd.svg`, `tapeconfig.svg`,
  déjà en stock d'après `GUI_REDESIGN_BRIEF.md` §4) — pas une taille
  arbitraire à recadrer plus tard.
- **Palette limitée à la vraie palette machine** : vert `#00ed95`, rouge
  `#ff3a5d`, bleu `#698eff`, blanc `#dfd9ff`, fond violet `#9256d7` (sourcés
  et vérifiés sur machine réelle dans `FIRMWARE_MOD_RESOURCES.md`) — le
  sélecteur de couleur ne propose que ces teintes plutôt qu'une roue
  chromatique complète.
- **Style contraint** : traits fins, une seule couleur par élément, fond
  sombre — le style déjà observé sur les 3 SVG d'origine en stock, pas un
  style libre qui casserait la lisibilité sur l'écran réel.

## Fonctions cibles

| Fonction | Rôle |
|---|---|
| Canevas 320×160 avec grille/repères | dessiner à l'échelle exacte de l'écran |
| Formes vectorielles simples (traits, chemins, formes de base) | suffisant pour le style d'icône de la machine, pas un logiciel d'illustration complet |
| Palette limitée aux couleurs machine confirmées | garantit un rendu fidèle sans réglage manuel |
| Aperçu en direct sur le mini-écran du bandeau machine | validation visuelle immédiate, déjà un atout du projet noté dans `GUI_REDESIGN_BRIEF.md` |
| Bibliothèque de formes de départ (celles déjà en stock, dupliquées puis modifiées, pas copiées telles quelles dans un mod final) | point de départ sans repartir de zéro |
| Export vers `op1_gfx.patch_image_file` (même moteur que `gfx-cwo-*`/`gfx-tape-invert`) | aucun nouveau moteur à écrire, réutilise `display_bridge.py patch` |
| **Validation `op1svg` avant tout export utilisable** | déjà identifié comme le garde-fou manquant dans `TOOLING_GAP_ANALYSIS.md` (section 2, priorité 1) — normalise/valide avant que le dessin devienne un patch |
| Attribution automatique « créé dans OP‑1 Studio » dans le manifeste du patch | traçabilité claire, distingue un dessin original d'un import |

## Où ça s'intègre

Sous-section de **Graphismes** dans la fenêtre Firmware fusionnée décrite
dans `FIRMWARE_LAB_FUNCTIONS.md` — pas une nouvelle fenêtre. Le créateur de
dessin et l'éditeur non destructif de SVG existants partagent le même
canevas, la même palette de référence et le même export.

```text
Firmware
└── Graphismes
    ├── Charger & trier les SVG d'un firmware officiel   (existe)
    ├── Éditer un SVG chargé, non destructif              (existe)
    └── Créer un dessin original                          (ce document)
```

## Ce que ça ne fait toujours pas

- ça ne remplace pas la nécessité de vérifier la licence d'un mod
  communautaire existant (Glitter, CWO, etc.) — ces mods restent traités un
  par un, comme aujourd'hui ;
- ça n'ouvre pas la porte à importer un fichier trouvé ailleurs sans passer
  par la validation `op1svg` ;
- ça ne garantit pas qu'un dessin custom soit accepté par la machine sans
  test — même règle que le reste du Labo expert : jamais présenté comme une
  écriture réussie avant vérification.

## Référence croisée

[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) (section C) ·
[`TOOLING_GAP_ANALYSIS.md`](TOOLING_GAP_ANALYSIS.md) (`op1svg`, priorité 1) ·
[`GUI_REDESIGN_BRIEF.md`](GUI_REDESIGN_BRIEF.md) (palette et SVG en stock) ·
[`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md) (palette machine
sourcée) · [`LOCAL_TOOLS.md`](LOCAL_TOOLS.md) (`display_bridge.py`)
