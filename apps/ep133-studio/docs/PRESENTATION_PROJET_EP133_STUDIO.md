# Présentation du projet — EP-133 KO II Studio

## Le projet en une phrase

EP-133 KO II Studio est un compagnon local qui permet de comprendre, jouer,
composer, sauvegarder et retrouver les projets d’un Teenage Engineering EP-133
K.O. II, même lorsque la machine n’est pas branchée.

## Le problème

L’EP-133 est une machine très complète, mais son écran et ses contrôles compacts
rendent certaines opérations difficiles : comprendre un projet long, retrouver
un sample, comparer deux versions, éditer précisément un pattern, apprendre un
passage rythmique ou vérifier ce qui sera envoyé à la machine.

Les outils existants savent généralement faire une partie du travail : gérer des
samples, exporter vers un DAW ou transférer des fichiers. Ils ne réunissent pas
naturellement l’apprentissage, l’édition, la sauvegarde et la compréhension du
projet réel.

## La solution

Le Studio propose une suite locale organisée autour de cinq fonctions :

### 1. Comprendre la machine

Le Studio peut lire les projets, les patterns, les scènes, les Songs, les pads,
les slots sonores et les métadonnées. Il conserve une distinction stricte entre
ce qui est lu sur une vraie machine et ce qui est seulement testé dans le
navigateur.

### 2. Composer et éditer

L’éditeur reproduit la logique de l’EP-133 : groupes A–D, 12 pads, patterns,
notes, vélocité, durée, mode ONE ou KEYS, sélection par rectangle, déplacement,
duplication, quantification et arrangement Song.

### 3. Jouer et apprendre

Rhythm Hero transforme les patterns en exercices. Le joueur reçoit un retour
sur le timing, la précision, les MISS et les pads confondus. À terme, un passage
difficile d’un projet personnel pourra devenir directement un exercice.

### 4. Sauvegarder et restaurer avec prudence

La bibliothèque locale, le clone machine et la Time Machine doivent permettre de
retrouver l’état d’un projet avant une modification. Toute écriture vers
l’EP-133 doit être préparée, confirmée, relue et vérifiée.

### 5. Contrôler et diagnostiquer

La page TEST MACHINE observe les notes, canaux, CC, horloge et SysEx. Elle
permettra d’apprendre les contrôles réellement émis par la machine et de les
associer à des actions du Studio, sans inventer de commandes propriétaires.

## Pourquoi une équipe multi-IA

Le projet combine plusieurs domaines difficiles :

- React, TypeScript et ergonomie ;
- audio, WAV et conversion ;
- MIDI, Web MIDI et SysEx ;
- lecture et écriture de formats binaires ;
- tests navigateur et validation matérielle ;
- documentation multilingue ;
- sauvegarde et sécurité des données.

Une seule IA peut travailler sur le projet, mais une équipe organisée permet de
faire relire les décisions importantes. GPT/Codex coordonne et intègre, Claude
construit les fonctionnalités, Gemini audite la logique et la documentation.

Les assistants ne sont pas considérés comme trois programmeurs qui écrivent
simultanément dans le même fichier. Ils travaillent dans des branches séparées,
avec un journal commun et des tests obligatoires avant intégration.

## Vision à moyen terme

Le Studio doit devenir un **Learning & Project OS** pour l’EP-133 :

```text
brancher
  ↓
comprendre le projet
  ↓
cloner et sauvegarder
  ↓
éditer ou composer
  ↓
jouer et apprendre
  ↓
tester les changements
  ↓
retourner vers la machine avec preuve
```

La machine reste au centre. Le Studio ne cherche pas à la remplacer, mais à
la rendre plus lisible, plus sûre et plus exploitable.

## Ce que le projet refuse de faire

- envoyer des SysEx inconnus sans preuve ;
- promettre une compatibilité firmware non testée ;
- supprimer ou écraser un projet sans checkpoint ;
- confondre une simulation navigateur avec une validation matérielle ;
- transformer l’outil en service cloud avant d’avoir stabilisé le produit local ;
- laisser une IA modifier silencieusement des fichiers hors de sa mission.

## État actuel

Le projet possède déjà :

- un Studio React fonctionnel ;
- un éditeur de patterns et Song ;
- un module Rhythm Hero ;
- une bibliothèque de projets et de sons ;
- un clone lecture seule de la machine ;
- des transferts matériels vérifiés sur des cas contrôlés ;
- une page TEST MACHINE avec capture MIDI/SysEx ;
- une documentation française, anglaise et espagnole ;
- une feuille de route et une organisation Git pour le travail multi‑IA.

Les prochains travaux prioritaires sont l’apprentissage des contrôles physiques,
la capture complète du protocole entrant, l’édition musicale expressive et la
validation de scénarios matériels plus larges.

## Résumé pour présenter le projet

> EP-133 KO II Studio est un studio compagnon local pour le Teenage Engineering
> EP-133. Il lit et sauvegarde les projets de la machine, permet d’éditer les
> patterns et les Songs, transforme la musique en exercices de finger-drumming,
> analyse les échanges MIDI/SysEx et prépare les retours vers le matériel avec
> checkpoint et vérification. Le projet est développé avec une équipe multi-IA
> organisée par branches Git : une IA coordonne, une construit et une contrôle.
