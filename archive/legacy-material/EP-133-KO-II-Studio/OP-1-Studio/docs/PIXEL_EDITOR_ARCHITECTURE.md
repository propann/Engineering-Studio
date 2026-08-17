# Architecture de l'éditeur pixel des images OP-1

Document de cadrage pour la page Images. Objectif : fournir un éditeur précis,
réversible et contrôlé pour les SVG présents dans un firmware OP-1 local, puis
préparer un firmware modifié sans jamais écrire directement sur la machine.

## Décision

Nous ne devons pas intégrer un éditeur graphique généraliste tel quel. Le bon
choix est un éditeur natif OP-1 Studio, construit autour d'une grille entière
et d'un modèle d'asset contrôlé.

Le projet [Dotting](https://github.com/hunkim98/dotting) est la meilleure source
de référence étudiée : composant React, zoom/pan, grille, calques, pinceau,
gomme, remplissage, sélection, ligne, rectangle et ellipse, sous licence MIT.
Il peut servir de prototype isolé pour valider l'ergonomie, mais le format
interne et l'export doivent rester à nous.

[PixelCraft](https://github.com/rgab1508/PixelCraft) est intéressant pour la
mécanique minimale de pixel, la palette et la transparence, mais le projet
recommande des images inférieures à `128×128` pour rester fluide : ce n'est pas
une base suffisante pour un écran `320×160`.

[Poxil](https://github.com/F4tal1t/Poxil) possède beaucoup d'outils, calques,
animation et export, mais il embarque trop de produit autour de l'éditeur.
[JS Paint](https://github.com/1j01/jspaint) est utile comme référence UX, mais
est trop généraliste pour garantir le format OP-1.

## Recherche complémentaire

| Projet | Ce qu'il apporte | Ce qui bloque pour OP-1 Studio | Décision |
|---|---|---|---|
| [Piskel](https://github.com/piskelapp/piskel) | éditeur pixel complet, animation, sprites, canvas, fonctionnement hors ligne, code JavaScript/HTML/CSS | application entière, nombreuses dépendances, pas d'export SVG OP-1, licence Apache-2.0 à respecter | excellente référence fonctionnelle, pas une dépendance directe |
| [miniPaint](https://github.com/viliusle/miniPaint) | calques, sélection, undo, pinceau, gomme, remplissage, pipette, transparence et beaucoup d'outils | éditeur photo généraliste trop volumineux, raster PNG/JPG au centre, iframe peu contrôlable pour nos validations | utile pour comparer les outils, pas pour le cœur |
| [STRd6/pixel-editor](https://github.com/STRd6/pixel-editor) | très petit éditeur pixel sous MIT, intégrable, modèle simple | ancien code CoffeeScript, intégration documentée par `iframe` et `postMessage`, dépendance à une URL externe dans l'exemple | bon réservoir d'idées, à ne pas embarquer tel quel |
| [Dotting](https://github.com/hunkim98/dotting) | composant React, dimensions libres, grille, zoom/pan, calques et outils pixel principaux sous MIT | projet de petite communauté, export firmware absent, import SVG absent | meilleur candidat pour un prototype local contrôlé |
| [@bensitu/image-editor](https://github.com/bensitu/image-editor) + [Fabric.js](https://github.com/fabricjs/fabric.js) | TypeScript, historique, masques, formes, annotations, import/export | raster et transformations libres, pas un vrai canevas pixel verrouillé, dépendance Fabric importante | écarté pour le pixel OP-1 |
| [Poxil](https://github.com/F4tal1t/Poxil) | outils pixel, sélection, calques, animation, export SVG/PNG/GIF | fonctionnalités de collaboration et produit trop larges | référence UX uniquement |

### Choix arrêté

Pour avancer sans risquer de casser la page Images, le mini-éditeur sera un
composant local `Op1PixelEditor` :

1. le moteur de grille et les outils seront inspirés de Dotting et Piskel ;
2. le modèle de données sera propre à OP-1 Studio, avec une matrice de pixels,
   une palette autorisée et les dimensions de l'asset ;
3. aucun `iframe`, CDN, service distant ou chargement de code à l'exécution ;
4. l'import SVG sera un adaptateur séparé et réversible ;
5. l'export sera notre adaptateur SVG/patch, soumis aux contrôles firmware.

Ce choix nous donne les outils d'un éditeur complet tout en permettant de
désactiver précisément les opérations incompatibles : redimensionnement libre,
anti-aliasing, gradients, filtres, couleurs hors palette, coordonnées
fractionnaires et export PNG présenté par erreur comme un firmware installable.

### Périmètre du premier prototype

Le prototype ne dépendra d'aucun nouveau service et portera uniquement sur un
asset fictif `320×160` : grille, zoom, crayon, gomme, pipette, remplissage,
ligne, rectangle, undo/redo et aperçu à taille réelle. Il devra exporter un SVG
déterministe mais ne modifiera encore aucun firmware. Après validation visuelle
et tests, on le branchera sur un SVG extrait en lecture seule.

## Dimensions et types d'assets

Le canevas ne doit jamais imposer `320×160` à tous les fichiers.

| Type | Règle |
|---|---|
| Écran OP-1 | `viewBox 0 0 320 160`, grille pixel exacte |
| Overlay ou écran partiel | dimensions lues dans le `viewBox`, sans redimensionnement implicite |
| Police `opfont.svg` | mode vectoriel spécialisé, pas de rasterisation destructive par défaut |
| `colors.svg` et fichiers internes | affichage marqué “référence interne”, édition désactivée tant que le rôle n'est pas confirmé |
| SVG non identifié | ouverture en lecture seule jusqu'à validation de sa structure |

Chaque asset doit afficher : nom, catégorie, largeur, hauteur, `viewBox`,
hash de l'original et état “original / modifié / validé”.

### Inventaire vérifié sur le firmware local OS 246

L'inventaire a été relu dans `.cache/firmware/op1_246/content/display/` le 13
août 2026. Il contient 61 SVG :

| Profil | Nombre | Règle d'édition |
|---|---:|---|
| `320×160` | 53 | profil écran autorisé pour le premier éditeur pixel |
| `340.156×170.079` | 1 (`colors.svg`) | profil interne, lecture seule |
| `340.157×170.078` | 3 (`fmpopup.svg`, `octave.svg`, `save.svg`) | profil spécifique, pas de conversion automatique |
| `340.2×170.1` | 2 (`in.svg`, `micline.svg`) | profil spécifique, pas de conversion automatique |
| `1000×700` | 1 (`lander.svg`) | easter egg/asset atypique, verrouillé |
| `2182.676×1444.252` | 1 (`opfont.svg`) | police vectorielle, éditeur pixel interdit |

Le nombre de pixels est donc une règle d'emplacement, pas une simple limite de
taille de fichier. Une image de `320×160` ne pourra être envoyée que vers un
emplacement dont le manifeste déclare exactement `320×160`. Toute différence de
dimension, de `viewBox`, de nom ou de hash source doit produire un refus.

## Feuille de route de la page Images

### Étape 1 — inventaire et verrouillage (en cours)

- lire le `viewBox` de chaque SVG ;
- afficher largeur/hauteur dans la bibliothèque ;
- classer les profils sécurisés, spécifiques et verrouillés ;
- refuser toute mise à l'échelle implicite ;
- conserver le SVG original et son hash.

### Étape 2 — éditeur pixel sécurisé (premier prototype)

- canvas à grille entière, zoom et coordonnées visibles ;
- crayon, gomme, pipette, remplissage, ligne et rectangle ;
- palette limitée aux couleurs autorisées de l'asset ;
- undo/redo et remise à l'original ;
- import rasterisé uniquement dans les dimensions déclarées ;
- aucun export firmware à cette étape.

### Étape 3 — export contrôlé

- produire un SVG déterministe sans script, image externe, filtre ni gradient ;
- regrouper les pixels adjacents en rectangles lorsque c'est sûr ;
- valider dimensions, palette, coordonnées et taille avant génération du patch ;
- générer un manifeste avant/après avec hash source et hash résultat.

### Étape 4 — préparation firmware

- appliquer le patch uniquement sur une copie déballée ;
- vérifier que le fichier cible et son profil correspondent au manifeste ;
- préserver la banque samples/audio sans modification ;
- reconstruire un firmware de sortie clairement nommé ;
- ne jamais écrire directement vers la machine.

### Étape 5 — profils avancés

- créer des éditeurs spécifiques pour les assets `340×170` ;
- traiter `lander.svg` avec son propre profil si nécessaire ;
- garder `opfont.svg` en édition vectorielle spécialisée ;
- ajouter comparaison visuelle, rapport de validation et restauration.

### Étape 6 — thèmes complets et fenêtres de synthèse

- importer en une seule action tout le dossier `content/display` d'un firmware ;
- conserver le manifeste complet du firmware et le hash de chaque SVG ;
- proposer un thème global sous forme de table couleur source → couleur cible ;
- prévisualiser toutes les images avant/après et exclure les couleurs absentes ;
- appliquer le thème uniquement aux fichiers dont la structure et le profil sont
  connus, avec liste explicite des fichiers ignorés ;
- regrouper les fenêtres de synthèse par moteur (`fm`, `cls`, `pd`, `pls`,
  `dsynth`, `st`, `slump`, `id`, `t10`, etc.) ;
- afficher la fenêtre de chaque moteur dans son profil réel `320×160` ;
- permettre des variantes de thème par moteur sans confondre les éléments
  statiques avec les éléments dessinés par le code du firmware ;
- générer un seul rapport de thème et un patch par fichier, jamais un remplacement
  silencieux de tout le dossier.

Le bouton d'import global est maintenant préparé dans la page Images : il filtre
les SVG contenus dans `content/display` et laisse les autres fichiers du
firmware hors du périmètre graphique.

## Fonctionnalités de la première vraie version

- grille pixel avec zoom entier `1×` à `32×`, déplacement et aperçu à taille réelle ;
- crayon 1 pixel, gomme, pipette, pot de peinture, ligne, rectangle et ellipse ;
- sélection rectangulaire, déplacement, copier/coller et miroir horizontal/vertical ;
- palette machine issue de l'asset, couleurs personnalisées contrôlées et transparence ;
- calque de dessin séparé du fond et des éléments importés ;
- annulation/rétablissement illimités, avec historique par opération ;
- raccourcis clavier et dessin souris/stylet sans coordonnées flottantes ;
- aperçu SVG normalisé et aperçu miniature dans l'interface machine ;
- indicateur des pixels hors zone, des couleurs non autorisées et des éléments non supportés.

## Importer un SVG existant sans perdre le contrôle

L'original doit toujours être conservé intact. À l'ouverture d'un SVG :

1. lire et valider le `viewBox` ;
2. rendre le SVG dans une grille entière à la dimension déclarée ;
3. conserver le texte SVG original dans un calque verrouillé ;
4. créer un calque pixel éditable ;
5. signaler explicitement que l'édition pixel peut perdre des détails vectoriels ;
6. permettre de revenir à l'original ou de produire un export vectoriel normalisé.

L'export pixel doit produire un SVG strict et déterministe : formes entières,
palette contrôlée, aucun script, aucune ressource externe, aucun filtre ou
attribut non pris en charge. Les suites de pixels adjacents pourront ensuite
être regroupées en rectangles pour garder un fichier léger.

Le fichier original ne doit jamais être écrasé. Chaque modification est
associée à un manifeste contenant l'ancien hash, le nouveau hash, le `viewBox`,
la liste des couleurs, l'outil utilisé et la date de génération.

## Réinstallation dans un firmware

Le flux sûr est volontairement local et en plusieurs contrôles :

```text
firmware original local
        ↓ lecture seule + inventaire des SVG
asset choisi + sauvegarde originale
        ↓ édition pixel
SVG normalisé + validation structurelle + aperçu
        ↓ patch whole-file avec hash de l'original
copie de firmware déballée
        ↓ contrôle des chemins et vérification du patch
firmware modifié exporté (.op1)
```

Le bridge existant `tools/display_bridge.py` reste le point d'entrée pour
l'inventaire, le tri, le manifeste et la génération de patch. Il faut ensuite
ajouter une validation dédiée avant toute reconstruction : le patch doit viser
un fichier connu, son hash source doit correspondre, le `viewBox` doit rester
valide et le fichier original doit être récupérable.

Il n'y aura pas d'écriture automatique sur l'OP-1. L'application exportera une
copie clairement nommée, un rapport de validation et la sauvegarde de l'asset.
Le transfert vers la machine restera une action manuelle et explicite.

## Feuille de route technique

1. Extraire le modèle `DisplayAsset` et le registre de dimensions depuis
   `display_bridge.py`.
2. Ajouter un composant `PixelCanvas` sans dépendance lourde, testé sur
   `320×160` et sur les dimensions atypiques.
3. Implémenter le modèle pixel, palette, outils, historique et sélection.
4. Ajouter le rasteriseur SVG contrôlé et l'export SVG déterministe.
5. Relier la bibliothèque des 61 assets à l'éditeur avec filtres par catégorie
   et verrouillage des fichiers internes/non identifiés.
6. Ajouter validation, manifeste, patch et reconstruction d'une copie de
   firmware ; tester l'absence de modification du firmware source.
7. Ajouter seulement ensuite les fonctions avancées : calques multiples,
   symétrie, comparaison avant/après et édition vectorielle spécialisée de la
   police.

## Critères de qualité

- aucune coordonnée fractionnaire dans un dessin pixel ;
- aucune perte de l'original après import ;
- test aller-retour import → export → import ;
- test de patch sur copie temporaire uniquement ;
- test de refus si hash, dimension ou chemin ne correspondent pas ;
- test visuel à `1×` et à fort zoom ;
- tests TypeScript, Python et build exécutés avant livraison.
