# État actuel — Engineering Studio

Date de référence : **2026-08-21**

## Synthèse

Le Hub est déployé sur Coolify en HTTPS, et le rack est passé d'un instrument
qu'on écoute à un outil qui **produit des fichiers** : samples encodés au format
de la machine visée, écrits et relus pour vérification.

Sept vérifications matérielles ont été faites, avec date et observation, dans
[TESTS_PHYSIQUES.md](TESTS_PHYSIQUES.md) — c'est le document qui dit ce que les
les tests automatiques ne peuvent pas prouver.

## Tableau de vérité

| Domaine | État |
|---|---|
| Dépôt GitHub | Opérationnel, branche `main` |
| Intégration continue | ✅ tourne sur `main`, la branche réellement déployée |
| Déploiement Coolify | Opérationnel, HTTPS via le proxy |
| Tests automatisés | ✅ Hub/packages ; le CI racine ne lance pas les suites autonomes des deux studios |
| Profil local | ✅ récupérable depuis le dossier de travail |
| Dossier de travail | ✅ mémorisé, permission vérifiée au rechargement |
| Coffre — sauvegarde | ✅ validée à l'usage, dossiers vides compris |
| Coffre — restauration | 🔶 mécanisme validé sur l'OP-1, orchestration non |
| Écriture sur l'OP-1 | ✅ vérifiée octet par octet, machine rendue intacte |
| Web MIDI | ✅ instantané à l'usage sur l'OP-1 |
| Rack — synthèse | ✅ 15 moteurs, 91 patches, superposition par patch |
| Rack — fabrication de samples | ✅ note seule et pack chromatique, son validé |
| Rack — effets | 🔶 delay et égaliseur ; ADSR et arpégiateur à faire |
| Rack dans les studios | ✅ EP‑133 et OP‑1 |
| Rack MIDI (arpégiateur, 30 gammes) | ✅ |
| Rack d'effets (saturation, chorus) | ✅ |
| Chaque rack porte son interface | ✅ verrouillé par test |
| Rack principal : une source unique | ✅ 2026-08-22, onglets de section rebranchés |
| MIDI partagé entre composants | ✅ répartiteur, cinq consommateurs migrés |
| EP-133 par SysEx | ⬜ aucun mode disque, tout passe par là |

**Ce qu'il ne faut pas déclarer validé** : la restauration *par l'application*
vers une machine. Le mécanisme d'écriture l'est — écrire, démonter, relire,
comparer les empreintes — mais pas son orchestration.

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
4. Raccorder les suites autonomes au CI avec une installation reproductible.
5. Auditer les états locaux indépendants des modules.
6. Préparer un routage URL stable avant de rendre les pages partageables.

## Règle de communication

Ne pas utiliser « Production Ready » pour l’ensemble du produit tant que les
tests automatisés, les parcours navigateur et la validation matérielle ne sont
pas documentés. Dire plutôt : « Hub local fonctionnel, intégration matérielle
en cours ».
