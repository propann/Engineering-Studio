# Analyse concurrentielle — organisation et fonctions par section

Vu le 12 août 2026, en naviguant réellement dans les outils (pas seulement
leur README) : [op1.fun](https://op1.fun/), [OP-PatchStudio](https://op-patch.studio/),
la [OP-1Z Sample Manager](https://github.com/romangarms/OP-1Z-Sample-Manager)
(captures du wiki), [Manager for OP1](https://apps.apple.com/us/app/manager-for-op1/id1521159543)
(captures App Store), [op1REpackerGUI](https://github.com/op1hacks/op1REpackerGUI)
(capture README) et [Melodics](https://melodics.com/finger-drumming) (page
produit). Le but : pour chaque section de OP-1 Studio, savoir quelles
fonctions reprendre, dans quel ordre les présenter, et où on est déjà
meilleurs.

---

## Écran d'accueil / hub général

**Référence forte : OP-1Z Sample Manager.** Son écran d'accueil est une
grille de 5 cartes colorées, une par module (Sample Converter, Sample
Manager, Config Editor, Tape Export, Backup & Restore), chacune avec une
icône, un titre, une phrase d'explication et un badge de compatibilité
(« OP-1 », « OP-Z », ou les deux). Une barre basse regroupe Réglages et À
propos.

**À reprendre :**
- un vrai écran d'accueil avec une carte par module et une phrase
  d'explication, au lieu d'ouvrir directement sur l'écran Firmware ;
- des badges de compatibilité visibles (utile chez nous pour distinguer ce
  qui marche « sans machine » de ce qui demande l'OP-1 branché) ;
- séparer clairement les outils par couleur, comme le fait déjà notre
  palette bleu/vert/blanc/orange/rouge.

**Ce qu'on garde de notre côté :** notre bandeau supérieur façon machine
(molettes, écran LCD) donne une identité qu'aucun concurrent n'a. Ne pas le
sacrifier pour la grille de cartes — la combiner.

---

## Firmware

**Référence : `op1REpackerGUI`.** Interface à trois colonnes : à gauche les
actions brutes (Unpack / Modify / Repack / Analyze), au centre une liste de
mods à cocher avec description courte, à droite des outils SVG et un bloc
« Advanced Tools » séparé (Opie toolkit, Glitter). C'est fonctionnel mais
brut : aucune vignette, aucune catégorie, tout au même niveau visuel.

**Où on est déjà devant :** notre éditeur firmware a des vignettes d'aperçu
par mod, des catégories (Écrans/Audio/Ressources/Fonctions/Thèmes), une
fenêtre de détail agrandie, et un plan en 4 étapes visibles (Source → Mods →
Contrôles → Exporter). Le concurrent n'a rien de tout ça. Rien à copier
ici, mais un repère utile : la séparation stricte « outils bruts » vs
« outils avancés » qu'il applique confirme qu'on a raison de garder le Labo
expert dans une fenêtre à part.

**À surveiller :** son bloc « Advanced Tools » range Opie toolkit et Glitter
ensemble, hors du flux principal — exactement notre logique de Labo expert
opt-in.

---

## Sauvegardes

**Référence forte : OP-1Z Sample Manager (Backup & Restore) + Sample
Manager.** Deux idées à retenir directement :
- une carte **Storage** (espace utilisé / libre) à côté d'une carte
  **Usage** (nombre de samples utilisés) avec une barre de progression qui
  passe visuellement en alerte (rouge) quand on approche de la limite ;
- chaque sauvegarde/fichier est listé en ligne avec taille, un bouton
  « ... » (options) et un bouton de suppression séparé et rouge, jamais au
  même endroit qu'une action neutre.

**Manager for OP1** confirme un autre pattern utile : la liste des projets
affiche nom, date et nombre de pistes en une ligne compacte, avec une icône
de bobine de bande — lisible même pour quelqu'un qui ne connaît pas l'app.

**À reprendre :**
- ajouter une barre d'usage espace disque qui change de couleur avant de
  bloquer une sauvegarde (notre backup-tree actuel liste les dossiers mais
  n'affiche pas encore l'espace utilisé) ;
- séparer visuellement « suppression » de toute autre action, avec une
  couleur d'alerte dédiée (déjà en partie fait, à généraliser).

---

## Sons & patches

**Référence la plus directe : OP-PatchStudio.** C'est la meilleure
référence de tout le comparatif pour cette section :
- onglet **drum** : une grille de pads reproduisant exactement la
  disposition physique des 24 pads de l'OP-1, avec la lettre du clavier
  ordinateur affichée sur chaque pad (`A`, `S`, `D`… ) — directement utile
  pour notre futur module Éducation aussi ;
- en dessous, un tableau « sample management » avec une ligne par son :
  zone glisser-déposer, colonne waveform, et 4 actions séparées (lecture,
  suppression, ré-enregistrement au micro, réglages) ;
- onglet **multisample** : clavier piano complet pour assigner un son par
  plage de notes, avec un réglage discret « c3=60 / c4=60 » pour la
  convention de numérotation des notes (détail de compatibilité qu'on
  n'avait pas identifié) ;
- onglet **library** : recherche, filtre par type, favoris, tri par colonne
  (nom / type / nombre de samples / date), sélection multiple, suppression
  groupée, pagination. C'est exactement l'index local qu'il nous manque
  (M3 dans la feuille de route).
- l'outil est installable en PWA pour un usage hors ligne — bon rappel que
  « ça marche sans connexion » est un argument qu'on peut afficher.

**OP-1Z Sample Manager** ajoute un détail utile : chaque emplacement de son
a une couleur de bordure selon son origine (son par défaut vs son
personnalisé importé), ce qui évite d'écraser un son d'usine par erreur.

**À reprendre en priorité pour M3 :**
1. le tableau de bibliothèque avec recherche + filtre + tri + favoris ;
2. la grille de pads fidèle à la disposition physique, réutilisable pour le
   module Éducation ;
3. le code couleur « son d'origine / son importé ».

---

## Studio (Tape & Album)

**Référence : Manager for OP1.** Son écran de détail de projet montre les 4
pistes comme des tuiles cliquables avec le nom de fichier, un bouton de
lecture et l'icône de bobine réutilisée du logo. Son écran de découpe
(« Trim Your Track ») est minimal : une seule forme d'onde, deux poignées de
sélection, la durée affichée en direct, et seulement deux boutons
(Annuler / Partager).

**À reprendre :** la simplicité de l'écran de découpe — une seule action à
la fois, pas de réglages superflus à côté de la forme d'onde pendant qu'on
coupe. Notre `tape-track` actuel affiche déjà mute/solo/lecture par piste,
ce qui est plus complet que ce concurrent ; à garder.

**Limite du concurrent à ne pas reproduire :** son app n'a que 12 avis et
une note de 2.6/5 — signe que la gestion de projets 4 pistes sur mobile
seule, sans lien clair avec une sauvegarde vérifiée, ne convainc pas les
utilisateurs. Ça confirme la priorité de la feuille de route : le Safe
Change Engine doit être fiable avant que l'écran Studio soit joli.

---

## Éducation (nouveau module)

**Référence : Melodics.** Sa page produit structure la pédagogie en trois
piliers affichés côte à côte : *Structured learning* (progression pas à
pas), *Lessons & courses* (par technique ou par style), *Learn songs*
(morceaux réels, mode entraînement puis performance complète, retour en
direct). C'est exactement les trois modes qu'on avait esquissés dans le
jalon M4.5 — la structure à trois colonnes est un bon calque pour
l'organisation de la fenêtre Exercices & Éducation elle-même.

**Détail technique confirmé :** aucun concurrent n'a un profil OP-1 officiel
dans Melodics ; notre point de départ technique reste `sampi/finger` (déjà
noté dans ROADMAP.md), pas un concurrent commercial à imiter dans le détail
d'interface.

**À reprendre :**
- présenter les trois modes (apprentissage structuré / leçons ciblées /
  morceaux) comme trois entrées visibles dès l'ouverture de la fenêtre, pas
  cachées dans un menu ;
- réutiliser la grille de pads fidèle d'OP-PatchStudio (voir section
  « Sons & patches ») comme base visuelle du module, plutôt que redessiner
  un clavier générique.

---

## Documentation

Aucun concurrent direct n'a de documentation utilisateur intégrée à l'app
elle-même — c'est un vrai angle différenciant pour nous. La seule référence
utile reste le découpage propre du guide officiel Teenage Engineering (une
page par mode : Tape, Drum, Synthesizer, Sequencers, Song rendering), qu'on
suit déjà dans `SOURCES.md`. Rien à changer, juste confirmer qu'on garde ce
découpage « une page par fonction réellement livrée » plutôt qu'une doc
générique écrite d'un coup.

---

## Résumé — ce qu'on intègre concrètement, par jalon

| Jalon existant | Ajout concret tiré de cette analyse |
|---|---|
| M2 (Sauvegardes) | Barre Storage/Usage avec seuil d'alerte coloré |
| M3 (Sons & patches) | Tableau bibliothèque (recherche/filtre/tri/favoris) + grille de pads fidèle + code couleur origine du son |
| M4.5 (Éducation) | Trois entrées visibles (apprentissage structuré / leçons / morceaux), grille de pads réutilisée de M3 |
| M4.6 (Chantier visuel) | Écran d'accueil en grille de cartes par module, avec badges de compatibilité |
| Général | Écran de découpe audio réduit à l'essentiel (une action à la fois) |
