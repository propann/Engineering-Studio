# Engineering Studio

Engineering Studio est un atelier local-first pour machines musicales :
OP-1, EP-133 K.O. II, audio, MIDI, samples, projets, firmware et sauvegardes.

Le dépôt de référence est :

https://github.com/propann/Engineering-Studio

## État actuel

La base est fonctionnelle et déployée sur Coolify. Elle reste en intégration :
les fonctions Web MIDI, File System Access, audio temps réel et les écritures
sur machines doivent être validées avec le matériel concerné.

Le Hub est accessible en production à :

https://engineering-studio.duckdns.org

## Architecture

~~~text
Engineering-Studio/
├── apps/
│   ├── studio-hub/       application principale déployée
│   ├── op1-studio/       module OP-1
│   └── ep133-studio/     module EP-133
├── packages/
│   ├── audio-bridge/     utilitaires audio partagés
│   └── midi-bridge/      types et messages MIDI partagés
├── docs/                 documentation classée
├── scripts/              vérifications et opérations de dépôt
├── package.json          scripts racine
├── bun.lock              lockfile officiel
└── vite.config.ts        configuration du Hub et de Coolify
~~~

Le build racine utilise apps/studio-hub comme racine Vite et sert le résultat
sur le port 3000. OP-1 Studio et EP-133 Studio sont actuellement intégrés au
Hub, pas déployés comme services séparés.

## Démarrage local

Pré-requis : Node.js récent et Bun.

~~~bash
git clone https://github.com/propann/Engineering-Studio.git
cd Engineering-Studio
bun install --frozen-lockfile
bun run dev
~~~

Ouvrir http://localhost:3000.

Commandes utiles :

~~~bash
bun run typecheck
bun run build
bun run preview --host 0.0.0.0 --port 3000
~~~

## Déploiement Coolify

~~~text
Repository : propann/Engineering-Studio
Branch     : main
Root       : /
Port       : 3000
Domain     : https://engineering-studio.duckdns.org
~~~

Commandes Coolify :

~~~text
Install : bun install --frozen-lockfile
Build   : bun run build
Start   : bun run preview --host 0.0.0.0 --port 3000
~~~

Voir [docs/guides/COOLIFY_DEPLOYMENT.md](docs/guides/COOLIFY_DEPLOYMENT.md)
pour le health check et les erreurs déjà rencontrées.

## Données utilisateur

Engineering Studio est local-first :

- le profil est stocké dans localStorage sous studio-hub-profile ;
- aucun profil n’est fourni par le serveur Coolify ;
- les dossiers ne sont accessibles qu’après sélection explicite par
  l’utilisateur ;
- un nouvel arrivant démarre avec un profil neutre et sans machine/disque
  personnel préchargé.

Voir [docs/guides/NEW_USER_DATA_MODEL.md](docs/guides/NEW_USER_DATA_MODEL.md).

## Documentation

- [Index documentaire](docs/INDEX.md)
- [Audit de référence](docs/PROJECT_AUDIT_2026-08-20.md)
- [Architecture actuelle](docs/architecture/ARCHITECTURE_CURRENT.md)
- [État du projet](docs/STATUS.md)
- [Stratégie Git](docs/guides/BRANCHING_STRATEGY.md)

Les documents de docs/archived/ sont historiques. Ils ne remplacent pas la
vérification du code actuel.

## Git

main est la branche de référence et de production. Pour une évolution :

~~~bash
git switch main
git pull --ff-only origin main
git switch -c feature/nom-court
~~~

Ne jamais inclure de secrets, node_modules, dist ou fichiers locaux dans un
commit. Préserver les modifications utilisateur non liées au travail en cours.

## Licence

Voir les licences des modules et packages concernés. Toute nouvelle partie
doit conserver une licence compatible avec les fichiers qu’elle modifie.

