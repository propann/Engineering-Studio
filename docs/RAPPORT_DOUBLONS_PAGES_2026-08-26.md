# Rapport des doublons — pages prioritaires

Date : 26 août 2026 · Lot Claude, étape 7 de `ORDRE_MISSION_CLAUDE.md`

**Aucune suppression n'a été faite.** Ce document est la condition préalable
posée par l'ordre de mission ; il constate, il ne tranche pas seul.

Méthode : lecture des sources, pas des tables. Pour chaque page, ce qu'elle
contient, qui la monte, et ce qu'on perdrait à la retirer.

---

## 1. `SoundEditorHub.tsx` — pas un doublon, mais une route en trop

**Ce n'est pas une page perdue.** Le composant est déjà monté dans
`SoundLibrary.tsx`, comme onglet « Éditeur & préparation » :

    TopBar → Bibliothèque sonore → Éditeur & préparation

Ses 1 067 lignes sont donc bien atteintes. Ce qui n'est pas atteint, c'est la
**route** `sound-editor-hub`, que rien n'ouvre.

**Le défaut réel est ailleurs, et il est sérieux.** `SoundEditorHub` ne rend
volontairement aucune `TopBar` — c'est écrit dans son en-tête : celle qu'il
rendait appelait `navigateMaquette` et démontait donc sa page hôte au premier
clic. Ouvert par sa route directe, il s'affiche par conséquent **sans aucune
barre de navigation**. Le seul lien qui en sorte mène à `backup-lab`, au milieu
de 630 lignes.

Autrement dit : « Voir la page » depuis le registre y **enferme** l'utilisateur.

**Recommandation** — deux options, aucune n'étant une suppression de code :

1. Retirer la route `sound-editor-hub` d'`App.tsx` (le composant reste, monté
   par `SoundLibrary`). Le registre cesse alors d'annoncer une page à
   connecter qui n'en est pas une.
2. La garder et lui donner une sortie, en passant à `SoundEditorHub` une prop
   de retour vers `sound-library`.

L'option 1 correspond à la réalité : l'éditeur EST une vue de la Bibliothèque.
L'option 2 se défend si l'on veut un lien direct partageable — mais il faudra
alors un vrai routage URL, que l'audit sectoriel liste déjà comme manquant.

---

## 2. `AdvancedImageEditor.tsx` — complément, pas doublon

| | `AdvancedImageEditor` | `ImageEditorOP1` |
|---|---|---|
| Lignes | 586 | 1 310 |
| Mentions de l'OP-1 / 320×160 | 2 | 34 |
| Nature | éditeur **générique** : pixel et SVG, pinceaux, formes, filtres, historique | éditeur **ciblé** : écrans OP-1 320 × 160 |

Les deux ne font pas le même travail. L'un dessine, l'autre produit un écran au
format exact de la machine. `AdvancedImageEditor` porte d'ailleurs un bouton
vers `firmware-lab` : il appartient à la chaîne des mods, pas à celle des
patches.

**Recommandation** : ne pas supprimer. Le rattacher au groupe OP-1 du Hub, à
côté de Firmware Lab, dont il est l'amont.

---

## 3. `SoundPatchCreator.tsx` — complément du Rack, pas doublon

Il fabrique des patches **pour le matériel** : sept moteurs de l'OP-1 (`fm`,
`dna`, `cluster`, `string`, `phase`, `digital`, `pulse`) et leurs encodeurs.

`AudioPluginRack`, ses 4 215 lignes et ses quinze moteurs, est un synthétiseur
**logiciel** : Mutable, Dexed, Surge, Helm… Aucun des deux jeux de moteurs ne
recoupe l'autre. Ce sont deux métiers.

**Un détail à nettoyer** : sa prop `enModule` n'est utilisée nulle part —
`App.tsx` est son seul appelant, avec `onClose`. Paramètre mort.

**Recommandation** : ne pas supprimer. Le rattacher au groupe OP-1. Retirer
`enModule` ou l'utiliser.

---

## 4. `RhythmHero.tsx` — page informative, le jeu est ailleurs

124 lignes, quatre marqueurs d'interactivité, deux boutons « retour aux
outils ». **Il n'y a pas de jeu dedans** : c'est un texte de présentation.

Le vrai jeu de rythme du dépôt est `GameGuitarHeroPanel.tsx`, dans
`apps/op1-studio` — 2 400 lignes, notes qui tombent, aliens, ligne de jeu,
score. Il vise l'OP-1, pas l'EP-133.

Le P0 n° 2 de l'audit sectoriel demande d'« ouvrir Rhythm Hero EP-133
directement sur le jeu ». **Ce jeu n'existe pas encore côté EP-133** : la page
actuelle en annonce un. C'est le point le plus proche d'une promesse non tenue
parmi les quatre.

**Recommandation** : ne pas supprimer, mais **ne pas la rattacher au Hub en
l'état** — elle promet un entraînement qu'elle ne rend pas. Deux voies :

1. La transformer en vraie page de jeu EP-133 ;
2. La réécrire honnêtement comme page d'information, en retirant la promesse
   d'« exercices progressifs et parties enregistrées ».

Elle reste, en attendant, classée `DÉMO` dans le registre.

---

## Synthèse

| Page | Verdict | Suppression ? |
|---|---|---|
| `SoundEditorHub` | route redondante, page hôte déjà accessible — **et cul-de-sac** | non : retirer la ROUTE, garder le composant |
| `AdvancedImageEditor` | complément générique de l'éditeur OP-1 | non |
| `SoundPatchCreator` | complément matériel du Rack logiciel | non |
| `RhythmHero` | page informative promettant un jeu absent | non, mais à ne pas rattacher tel quel |

**Aucune des quatre pages ne justifie une suppression de code.** Le seul retrait
défendable est celui d'une *route*, pas d'un fichier.
