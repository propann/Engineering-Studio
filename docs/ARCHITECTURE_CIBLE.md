# Architecture cible du Studio Hub

## Intention

Le projet est une suite locale de création musicale pour plusieurs machines.
Le Hub, OP-1 Studio et EP-133 Studio doivent partager un même socle sans
devenir une application unique et difficile à maintenir.

Le déploiement (ordinateur, Raspberry Pi ou autre) est une conséquence de
cette architecture. Il ne doit pas dicter l’organisation du code.

## Les quatre couches

```text
Interfaces
  Hub, OP-1 Studio, EP-133 Studio
        ↓
Cas d’usage
  profil, workspace, bibliothèque, sauvegarde, import/export, exercices
        ↓
Socle commun
  types, audio, MIDI, stockage, permissions, état machine
        ↓
Adaptateurs
  OP-1, EP-133, Web MIDI, USB, fichiers locaux, services optionnels
```

### 1. Interfaces

Les applications affichent les écrans et déclenchent des cas d’usage. Elles
ne doivent pas contenir chacune leur propre version de la logique de profil,
de sauvegarde, de MIDI ou de stockage.

### 2. Cas d’usage

Cette couche décrit les actions du produit : créer un workspace, analyser un
son, sauvegarder une machine, restaurer un projet, préparer un transfert ou
lancer un exercice. Elle ne dépend pas d’un framework d’interface.

### 3. Socle commun

Cette couche contient les contrats et les implémentations partagées :

- modèles et types de données ;
- audio et analyse ;
- messages et transport MIDI ;
- stockage local et bibliothèques ;
- permissions, validation et journalisation ;
- profil de machine et capacités disponibles.

### 4. Adaptateurs

Chaque machine traduit ses formats et ses opérations vers les contrats du
socle commun. Le code OP-1 ne doit pas être requis pour utiliser EP-133, et
inversement.

## Règles de dépendance

```text
app → cas d’usage → socle commun → adaptateurs
```

- Une application ne dépend pas d’une autre application.
- Un package de domaine ne dépend pas de React, Vite, Next ou Cloudflare.
- Les accès matériel et fichiers passent par des interfaces explicites.
- Les opérations destructives nécessitent validation et permissions.
- Le cloud reste un adaptateur optionnel ; le mode local fonctionne seul.
- Un package partagé doit être réellement utilisé ou rester clairement marqué
  comme expérimental.

## État actuel

- `apps/studio-hub` est le portail et l’orchestrateur d’interface.
- `apps/op1-studio` est une application Vinext/React avec des outils OP-1
  spécifiques.
- `apps/ep133-studio` est une application Vite/React orientée EP-133.
- `@studio-hub/audio-bridge` et `@studio-hub/midi-bridge` sont les briques
  actuellement les plus concrètement partagées.
- Les packages de profils, instruments, ressources, jeux et intégration
  forment une base de plateforme encore partiellement raccordée aux apps.

## Ordre de migration

1. Stabiliser les types et les contrats de workspace, profil, projet et
   machine.
2. Raccorder le stockage, les sauvegardes et les permissions à un socle
   commun.
3. Formaliser l’interface d’adaptateur instrument OP-1/EP-133.
4. Faire consommer ces cas d’usage par le Hub, puis par les deux studios.
5. Unifier le build et le lancement après stabilisation fonctionnelle.

## Décisions retenues pour l’instant

- produit local-first ;
- monorepo conservé ;
- trois interfaces spécialisées conservées ;
- cloud et déploiement traités après le socle produit ;
- aucune nouvelle infrastructure obligatoire introduite à ce stade.
