# Architecture actuelle

## Vue d’ensemble

Engineering Studio est un monorepo front-end local-first :

~~~text
Navigateur
  └── studio-hub (React + Vite, port 3000)
        ├── OP-1 Studio
        ├── EP-133 Studio
        ├── Audio Plugin Rack
        ├── Sound Editor / Patch Creator
        ├── MIDI Settings
        ├── Firmware / Theme Lab
        └── Profile + Workspace

Packages partagés
  ├── @studio-hub/audio-bridge
  └── @studio-hub/midi-bridge
~~~

## Point d’entrée de build

Le vite.config.ts racine définit :

- root: apps/studio-hub ;
- les alias des packages partagés ;
- le serveur sur 0.0.0.0:3000 ;
- la preview de production sur 0.0.0.0:3000 ;
- preview.allowedHosts pour le domaine Coolify.

Le script build de la racine produit la build du Hub. Les modules OP-1 et
EP-133 sont importés dans le Hub au niveau applicatif : ils ne sont pas encore
des services déployés indépendamment.

## État local-first

~~~text
Profil              → localStorage: studio-hub-profile
Préférences module  → localStorage/sessionStorage selon le module
Dossier de travail  → File System Access API, après permission utilisateur
MIDI                → Web MIDI API, dans un contexte sécurisé
Audio               → Web Audio API, dans le navigateur
Serveur             → sert la SPA, ne stocke pas les profils actuellement
~~~

## Limites d’architecture

- App.tsx fait office de routeur applicatif.
- Les pages connaissent encore directement la forme du profil.
- Une clé localStorage partagée par plusieurs versions doit être migrée
  prudemment si son schéma change.
- Une nouvelle session navigateur commence sans profil, mais un autre profil
  du même navigateur peut rester présent jusqu’à suppression manuelle.

## Module profil

Le stockage du profil passe par `apps/studio-hub/src/core/profile.ts`.
Ce module centralise la clé `studio-hub-profile`, la valeur neutre
`NOUVEAU MEMBRE`, `readProfile()`, `writeProfile()`, `migrateProfile()` vers
la version 2, `clearProfile()` et `readProfileName()`.

Il utilise uniquement le `localStorage` de l’origine courante. Il ne fait
aucun appel réseau et ne connaît pas Coolify. Le dossier choisi par
l’utilisateur reste une sauvegarde séparée, gérée par la fiche via File System
Access API.

## Règle pour les prochains modules

La centralisation est maintenant en place pour le Hub, la Landing, la fiche
profil, la barre supérieure et l’éditeur d’image. Les prochaines pages doivent
importer ce module au lieu de lire directement `localStorage`. Les autres clés
locales de thèmes, dessins et patches restent des stockages de modules ; elles
ne doivent pas être confondues avec l’identité du profil.
