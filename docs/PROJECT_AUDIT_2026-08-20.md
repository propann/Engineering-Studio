# Audit de référence — Engineering Studio

Date : 2026-08-20
Dépôt : propann/Engineering-Studio
Branche de référence : main
Nature : audit du code et de la documentation, sans prétendre certifier le matériel

> Document historique arrêté au **2026-08-20**. Les changements livrés après cet audit sont suivis dans `docs/STATUS.md`, `docs/ROADMAP.md` et `docs/TEAM_SYNC.md`.

## Addendum de synchronisation — 2026-08-22

Depuis cet audit, `main` contient notamment :

- le clone OP‑1 tactile avec écran Tape, quatre pistes, REC lié à la piste active et commandes regroupées au-dessus du clavier ;
- le clavier virtuel recoloré selon la machine, avec séparateurs orange et bande supérieure masquée ;
- la préécoute et le chargement des samples sauvegardés sur la piste active ;
- la persistance locale des métadonnées et des sources audio après actualisation ;
- une idée Strudel documentée hors du studio OP‑1, sans intégration active.

Ces ajouts ne valent pas validation matérielle du transfert. La règle reste : formats et tests propres à chaque machine, aucune écriture machine implicite.

## Résumé honnête

Engineering Studio est un monorepo React/TypeScript/Vite qui rassemble un Hub
central et des modules OP-1, EP-133, audio, MIDI, sauvegarde, firmware et
documentation. La base est déjà riche et se déploie sur Coolify.

Le produit doit toutefois être décrit comme une base fonctionnelle en
intégration, pas comme un produit matériel définitivement validé. Les
fonctions Web MIDI, File System Access, audio temps réel et les écritures sur
machines dépendent du navigateur, des permissions et du matériel réellement
connecté.

## Ce qui existe dans le dépôt

### Applications

- apps/studio-hub : application principale, point d’entrée déployé.
- apps/op1-studio : module OP-1 intégré au Hub.
- apps/ep133-studio : module EP-133 intégré au Hub.

### Packages partagés

- packages/audio-bridge : analyse et utilitaires audio.
- packages/midi-bridge : types, paquets et messages MIDI partagés.

### Infrastructure

- Vite et React à la racine.
- vite.config.ts avec root: apps/studio-hub.
- Alias TypeScript/Vite vers les packages partagés.
- Port interne et public : 3000.
- Lockfile officiel : bun.lock.
- Déploiement Coolify/Nixpacks validé avec Bun.

## Parcours principal actuel

~~~text
Landing
  ├── OP-1 Studio
  ├── EP-133 Studio
  ├── Hub Outils
  ├── Profil / fiche atelier
  ├── Éditeur audio et patches
  ├── MIDI / documentation
  └── Firmware / thèmes / exercices
~~~

La navigation est actuellement gérée par un état React et
window.navigateMaquette. C’est adapté à la maquette actuelle, mais une
navigation par URL devra être prévue avant une version multi-page partageable.

## Données et confidentialité locale

- Le profil est stocké dans localStorage sous studio-hub-profile.
- Les fichiers de travail sont écrits uniquement après sélection explicite
  d’un dossier par l’utilisateur via File System Access API.
- Il n’existe pas de base serveur de profils dans cette version.
- Un navigateur neuf ou un profil navigateur neuf ne doit donc pas recevoir le
  profil d’un autre utilisateur.
- Les valeurs de démonstration personnelles ont été retirées des valeurs par
  défaut le 20 août 2026.

Cette isolation est une isolation par navigateur/origine, pas un système
d’authentification multi-compte. Il ne faut pas présenter l’application comme
un SaaS multi-utilisateur tant qu’aucune identité serveur et aucune politique
d’accès n’existent.

## Constats techniques importants

### Corrigé pendant cet audit

- Autorisation du domaine Coolify dans preview.allowedHosts.
- Valeurs par défaut neutres pour un nouvel arrivant.
- Suppression des exemples audio nommés avec une identité personnelle.
- Documentation d’architecture, de données et de déploiement ajoutée.

### À surveiller

- Plusieurs pages possèdent encore leur propre lecture du profil au lieu d’un
  hook partagé.
- Certains modules affichent des données de démonstration : elles doivent être
  étiquetées Demo et ne jamais être présentées comme des données utilisateur.
- Le routage global est fragile au rechargement direct d’une page.
- Les tests automatisés sont insuffisants pour déclarer tous les modules
  fiables.
- Les affirmations historiques de docs/archived/ ne sont pas des preuves de
  fonctionnement actuel.

## Priorités de travail

1. Centraliser readProfileName() et l’état d’onboarding.
2. Ajouter un test de démarrage propre : localStorage vide, aucun profil,
   aucune donnée personnelle affichée.
3. Ajouter un test de persistance : créer un profil, recharger, retrouver le
   profil uniquement dans la même origine.
4. Remplacer progressivement window.navigateMaquette par un routeur stable.
5. Distinguer visuellement Demo, Local et Machine connectée.
6. Auditer chaque module audio/MIDI avec un parcours reproductible.

## Commandes de vérification

~~~bash
bun install --frozen-lockfile
bun run typecheck
bun run build
bun run preview --host 0.0.0.0 --port 3000
~~~

Si Bun n’est pas installé, utiliser une installation npm sans générer de
nouveau lockfile uniquement pour un diagnostic local. Le lockfile de référence
reste bun.lock.

