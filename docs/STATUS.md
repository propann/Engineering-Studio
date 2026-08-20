# État actuel — Engineering Studio

Date de référence : 2026-08-20

## Synthèse

Le Hub est déployé sur Coolify et accessible en HTTPS. Le dépôt contient une
base front-end riche, mais les fonctions matérielles et les tests complets
restent à valider progressivement.

## Tableau de vérité

| Domaine | État |
|---|---|
| Dépôt GitHub | Opérationnel, branche main |
| Build Vite | Configuré à la racine |
| Déploiement Coolify | Opérationnel sur le port 3000 |
| HTTPS | Actif via le proxy Coolify |
| Nouvel arrivant neutre | Corrigé dans les valeurs par défaut |
| Profil local | Module partagé, migration v2, lecture/écriture/suppression |
| Workspace local | Fonctionnel après permission navigateur |
| Hub de navigation | Fonctionnel, routage React interne |
| OP-1 Studio | Intégré, validation matérielle à poursuivre |
| EP-133 Studio | Intégré, validation matérielle à poursuivre |
| Audio / synthèse | Interface et moteurs présents, audit moteur par moteur à faire |
| Web MIDI | Code présent, test avec appareils réels à poursuivre |
| Écritures firmware/machine | Ne pas déclarer validées sans appareil et checkpoint |
| Tests automatisés | Insuffisants pour une certification globale |

## Derniers travaux

- Configuration Coolify/Nixpacks alignée sur Bun.
- Domaine de production autorisé dans Vite preview.
- Health check documenté : HTTP interne sur le port 3000.
- Valeurs personnelles retirées des nouveaux profils.
- Exemples audio personnels renommés en exemples de démonstration.
- Documentation principale rangée dans docs/INDEX.md.
- Module profil partagé ajouté dans apps/studio-hub/src/core/profile.ts.

## Ce qui est fiable

- Le dépôt canonique est propann/Engineering-Studio.
- main est la branche de référence.
- Le service public est engineering-studio.duckdns.org.
- Le stockage de profil actuel est local au navigateur.
- Le serveur ne reçoit pas le profil local dans cette version.

## Prochaines étapes recommandées

1. Ajouter des tests de démarrage avec localStorage vide.
2. Tester manuellement une nouvelle fenêtre privée sur le domaine HTTPS.
3. Brancher les pages restantes sur le module profil partagé.
4. Ajouter une vérification de build dans CI.
5. Auditer les états locaux indépendants des modules.
6. Préparer un routage URL stable avant de rendre les pages partageables.

## Règle de communication

Ne pas utiliser « Production Ready » pour l’ensemble du produit tant que les
tests automatisés, les parcours navigateur et la validation matérielle ne sont
pas documentés. Dire plutôt : « Hub local fonctionnel, intégration matérielle
en cours ».
