# Audit visuel des concurrents — captures du 12 août 2026

Complément visuel à [`ANALYSE_CONCURRENTS.md`](ANALYSE_CONCURRENTS.md), qui
analysait déjà ces outils par description. Ici, chaque outil a été ouvert et
manipulé réellement dans un navigateur pour vérifier le détail exact des
écrans, pas seulement leur README. Pas de captures d'écran embarquées dans
le dépôt (interfaces tierces, droits d'auteur) : description précise à la
place, comme le reste de la documentation du projet.

## op1.fun — bibliothèque communautaire de patches

Page d'accueil : fond sombre, un patch mis en avant en grand (auteur, nom,
forme d'onde en trait bleu fin sur fond noir, tableau de métadonnées en 3
colonnes : type/sample rate/FX, file size/length/LFO, download count/license/
octave). Juste en dessous, un **dessin vectoriel plat de la face complète de
l'OP-1** (boutons, molettes, touches, port cassette) — c'est un asset qu'on
pourrait recréer nous-mêmes dans le même esprit pour illustrer notre propre
onglet Accueil.

Plus bas : grille "newest patches" et "newest packs" en deux colonnes, chaque
carte avec auteur, titre, compteur like/commentaire, et pour les packs le
détail `DRUM × N` / `SAMPLE × N`. Navigation du site : patches / packs / tapes
/ samples / log in / sign up.

**Différence délibérée avec notre positionnement :** op1.fun est un site
communautaire avec compte utilisateur et upload public. OP-1 Studio reste
volontairement local et sans compte — à afficher comme un choix, pas un
manque.

## OP-PatchStudio — la référence la plus proche de notre écran Sons

Cinq onglets plats sans icônes : drum / multisample / library / donate /
feedback, soulignement noir sur l'onglet actif.

**Onglet drum**, deux modes :
- mode normal : grille 2×12 pads ronds, libellé physique en haut de chaque
  pad (`KD2`, `SD2`, `CLP`, `CH`, `Y`, `OH`, `RC`, `CC`, `COW`, `LC`, `HC` /
  `KD1`, `SD1`, `RIM`, `TB`, `SH`, `CL`, `CAB`, `LT1`...) et la touche
  clavier ordinateur dessous (`W`,`E`,`R`.../`A`,`S`,`D`,`F`...) — disposition
  qui suit exactement les rangées physiques de l'OP-1, avec un espace visuel
  entre groupes de pads ;
- bouton **"organize"** : bascule vers deux grosses zones de dépôt en masse
  ("drop lower row here", "drop upper row here", jusqu'à 14 et 10 fichiers) —
  un mode de chargement par lot qu'on n'a pas du tout dans notre
  bibliothèque Sons actuelle, à considérer pour M3 ;
- bouton **"midi"** : bascule vers un panneau "connect midi devices" avec le
  même visuel de grille de pads en fond.
- tableau "sample management" sous la grille : colonnes `drum key` / `file
  details` (zone glisser-déposer) / `waveform` / `actions` (lecture,
  suppression, **micro rouge pour enregistrer directement**, réglages).

**Onglet multisample** : clavier piano complet (rendu en barres grises/
blanches classiques, labels C1 à C5+), toggle explicite `c3=60` /
`c4=60` pour la convention de numérotation MIDI, tableau d'échantillons
avec une grande zone de dépôt centrale (icône note de musique, "no samples
loaded"), barre d'actions basse : clear all / record / browse.

**Onglet library** : recherche, filtre par type, case favoris, colonnes
triables (name/type/samples/updated), pagination "page 1 of 1".

Tout est local au navigateur (aucune donnée n'a persisté entre nos deux
visites de l'onglet library) — cohérent avec notre propre approche locale.

## teoperator — le contre-exemple minimaliste qui marche

Aucune skeuomorphie, aucune icône : un formulaire vertical unique sur fond
gris foncé. Champs : `url` (coller un lien YouTube/Instagram/etc.), `or
upload` (glisser un fichier), `start/end` en secondes, `patch type` (drum/
synth), `remove silence?`, `# splices` (optionnel), puis un seul bouton
`chop it up!`.

**Ce qui est vraiment différent de tout ce qu'on a documenté ailleurs :**
la découpe en patch drum se fait par **détection automatique des transitoires
de la forme d'onde**, pas par découpage manuel. On peut aussi partir d'une
URL externe (extrait audio) plutôt que d'un fichier déjà présent sur le
disque. Aucun équivalent chez nous ni chez OP-PatchStudio.

## DigiChain — utilitaire de sample chains (référence secondaire)

Interface sombre dense : tableau de fichiers (colonnes Selected / Filename -
slice# - note / Length), barre d'outils avec boutons "remove selected",
"reset sort/order", "selected actions", bouton REC + icône micro, et à droite
une rangée de boutons de découpe en tranches fixes (`OFF`, `4`, `8`, `16`,
`32`, `64`, `128`) plus un badge `OP`. Un panneau "Audio Config" propose des
"common configurations" prédéfinies. Outil clairement destiné à un usage
avancé (chaînage de samples pour sampler), pas une priorité pour notre
bibliothèque Sons grand public, mais bon repère pour un futur mode expert.

## teenage.engineering — langage visuel officiel (pas un concurrent, la référence)

Page `/products/op-1/original/features` : quatre grosses **icônes en forme
de molette 3D** (ombre douce, dégradé gris clair, effet bouton physique),
chacune avec un pictogramme trait fin centré et coloré : vague bleue
(synthesis), cercle+tige vert (instant sampler), deux ronds façon bobines
orange (4-track tape), barres grises (mixer and effects). C'est la même
famille visuelle que nos molettes `MachineControls` actuelles — confirme
qu'on est déjà dans le bon registre, mais eux poussent l'effet "vrai bouton"
plus loin (relief, ombre, pas juste un cercle plat).

Page `/products/op-1/original/modules` : visualisation en **graphe de
nœuds** (points oranges reliés par des lignes fines, layout façon réseau),
chaque nœud cliquable révèle une catégorie (ex. "synthesis / samplers").
Esthétique intéressante mais probablement pas adaptée à notre besoin
d'affichage clair des moteurs sonores — à noter comme curiosité de style,
pas comme modèle à suivre.

## Résumé actionnable

| Constat | Action produit suggérée |
|---|---|
| OP-PatchStudio : dépôt en masse par rangée | Ajouter un mode d'import groupé à la grille de pads (M3) |
| OP-PatchStudio : micro rouge pour enregistrer direct dans un pad | Ajouter un bouton d'enregistrement micro par pad, pas seulement l'import fichier |
| teoperator : découpe automatique par transitoires + import URL | Fonction future distincte, pas une priorité immédiate, mais à garder en tête pour la bibliothèque Sons |
| TE features : icônes-molette avec relief plus prononcé | Renforcer l'ombre/le relief de nos molettes `MachineControls` plutôt que les garder plates |
| op1.fun : dessin vectoriel plat de la machine complète | Réutilisable comme illustration d'accueil, à dessiner nous-mêmes (pas de copie d'un asset tiers) |
