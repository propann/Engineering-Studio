# Recherche clones et principes retenus

La comparaison porte sur les dépôts publics consultés le 12 août 2026.

## Ce que l'on retient

- [TOP-1](https://github.com/AlbertSmit/TOP-1) : architecture modulaire,
  quatre pistes, mixer, métronome, transport et raccourcis. C'est une
  référence de logique audio, pas une dépendance Windows.
- [OP-1 Kenobi](https://github.com/alexmandelshtam/op1kenobi) : composants
  séparés, écoute locale, état de session et objectif d'enregistrement/export.
  C'est une référence d'interface et de simulation, pas un pilote matériel.
- [op1REpackerGUI](https://github.com/epixjava/op1REpackerGUI) : parcours
  explicite unpack, modify, analyse et repack avec outils séparés. C'est une
  référence pour le Labo firmware, qui reste isolé du studio audio.
- [FL-OP1-controller-script](https://github.com/ryrun/FL-OP1-controller-script) :
  mappings simples du transport OP-1 vers un logiciel hôte. C'est une base
  pour notre pont MIDI, après validation des messages reçus.

## Règle produit

Les outils ne sont plus présentés comme des bulles ou des cartes empilées.
Chaque module dispose d'une fenêtre de travail dédiée : Firmware, Sauvegardes,
Bibliothèque Sons, Studio (Tape & Album), Exercices MIDI et Documentation. Le
Studio propose un mode Clone OP-1 et un mode OP-1 MIDI. Chaque
fenêtre garde son état, son journal et ses préconditions.

## Limite importante

Un clone visuel ne suffit pas à importer un projet sur l'OP-1. L'import doit
produire les fichiers réels attendus par le disque OP-1, vérifier le format,
faire une sauvegarde préalable et terminer par une éjection contrôlée.
