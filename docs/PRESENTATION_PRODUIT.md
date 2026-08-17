# Présentation produit — Studio Hub

## Promesse

Studio Hub donne une seule porte d’entrée aux musiciens qui travaillent avec
un OP‑1 et un EP‑133. L’utilisateur crée son atelier une fois, déclare ses
machines, choisit un espace local puis retrouve ses outils sans recréer son
profil dans chaque application.

## Architecture visible par l’utilisateur

### 1. Studio Hub — la porte d’entrée

- fiche persistante et avatar ;
- plusieurs machines nommées ;
- déclaration EP‑133 64 ou 128 Mo ;
- sélection du dossier de travail ;
- page Outils avec les cartes d’accès ;
- bibliothèque centrale de sons dans `shared/sounds`, commune à l’OP‑1 et à
  l’EP‑133, avec import, tags, favoris, préécoute et détection de doublons ;
- coffre pour sauvegarder, restaurer et sélectionner bandes, sons, projets ou
  autres catégories ;
- progression, source, destination et résultat visibles pendant les copies.

### 2. OP‑1 Studio — l’atelier OP‑1

- Tape & Album et transport MIDI ;
- éditeur d’images aux dimensions OP‑1 ;
- préparation et analyse de samples ;
- services, firmware et patchs avec garde-fous ;
- bibliothèque de sons, sauvegardes et documentation ;
- exercices et outils de préparation locale.

### 3. EP‑133 Studio — l’atelier EP‑133

- Pattern et Song ;
- sons, pads et transferts ;
- clonage et lecture de projets ;
- documentation et tests de machine ;
- Rhythm Hero et progression d’entraînement ;
- MIDI, SysEx et exports contrôlés.

### 4. Jeu à deux machines

Le Hub peut distribuer un transport MIDI commun, des notes virtuelles et un
PANIC. Le relais contrôleur OP‑1 est désactivé par défaut et doit être activé
explicitement après le passage de la machine dans le mode adéquat. Le système
filtre l’origine, la fenêtre source et les sorties MIDI pour éviter les échos.

## Parcours de démonstration

1. Ouvrir le Hub.
2. Créer ou retrouver la fiche existante.
3. Déclarer un OP‑1 et un EP‑133, avec la capacité 64/128 Mo si nécessaire.
4. Choisir un dossier de travail.
5. Ouvrir l’éditeur d’image, l’éditeur de samples ou un studio.
6. Importer un WAV dans la bibliothèque centrale, lui attribuer ses cibles,
   puis l’ouvrir dans OP‑1 Studio ou Sons EP‑133.
7. Revenir au Hub sans nouvelle fiche.
8. Ouvrir le coffre et lancer une sauvegarde sélective avec progression.
9. Ouvrir la synchronisation MIDI pour jouer les deux machines ensemble.

## Ce qui rend le produit crédible

- l’identité reste centralisée dans le Hub ;
- les studios ne recréent pas de compte local ;
- la bibliothèque de sons est une ressource unique, mais les studios gardent
  leurs zones machine séparées (`ep133/samples`, `op1/...`) ;
- les sauvegardes affichent le périmètre choisi et sont relues après copie ;
- les écritures machine sont séparées des plans locaux et demandent un
  checkpoint ;
- les validations matérielles et les résultats reproductibles sont distingués
  dans la documentation ;
- les prototypes et travaux expérimentaux restent archivés sans être vendus
  comme des fonctions terminées.

## Références de présentation

- [Dossier design Hub et outils](dessin/00_INDEX.md)
- [Brief pour le designer](BRIEF_DESIGN_HUB_OUTILS.md)
- [Roadmap alignée au code](../ROADMAP_CODE_ALIGNMENT_2026-08-17.md)
- [État courant logiciel/matériel](../STATUS_CURRENT.md)
