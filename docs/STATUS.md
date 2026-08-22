# État actuel — Engineering Studio

Date de référence : **2026-08-22**

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
| Tests automatisés | 🔶 contrôles natifs séparés OP-1 / EP-133 en CI ; validation complète en cours |
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
| OP-1 Studio — clone tactile | ✅ quatre pistes, transport, REC piste active, écran/racks, clavier MIDI et couleurs machine | 
| OP-1 Studio — samples sauvegardés | ✅ préécoute et chargement sur la piste active depuis la bibliothèque locale | 
| OP-1 Studio — persistance après actualisation | ✅ métadonnées `localStorage` + blobs audio `IndexedDB` | 

**Ce qu'il ne faut pas déclarer validé** : la restauration *par l'application*
vers une machine. Le mécanisme d'écriture l'est — écrire, démonter, relire,
comparer les empreintes — mais pas son orchestration.

**Contrat machine :** la CI partage le niveau de sécurité, pas le protocole matériel. Les contrôles OP-1 couvrent ses AIFF, patches, volume et MIDI ; les contrôles EP-133 couvrent ses projets, samples et échanges MIDI/SysEx. Un test de l'un ne constitue jamais une preuve pour l'autre.

## Derniers travaux

- Configuration Coolify/Nixpacks alignée sur Bun.
- Domaine de production autorisé dans Vite preview.
- Health check documenté : HTTP interne sur le port 3000.
- Valeurs personnelles retirées des nouveaux profils.
- Exemples audio personnels renommés en exemples de démonstration.
- Documentation principale rangée dans docs/INDEX.md.
- Module profil partagé ajouté dans apps/studio-hub/src/core/profile.ts.
- Clone OP‑1 aligné sur l’interface demandée : contrôles Piste 1–4 dans la bande supérieure, bande haute du clavier retirée, écran/racks tactiles et mode machine visible.
- Autosauvegarde du projet OP‑1 ajoutée : réglages, pistes, références et sources audio sont restaurés après actualisation dans la même origine.
- Bibliothèque « Samples sauvegardés » ajoutée : préécoute puis chargement local sur la piste sélectionnée, sans écriture machine.

## Ce qui est fiable

- Le dépôt canonique est propann/Engineering-Studio.
- main est la branche de référence.
- Le service public est engineering-studio.duckdns.org.
- Le stockage de profil actuel est local au navigateur.
- Le serveur ne reçoit pas le profil local dans cette version.

## Prochaines étapes recommandées

1. Ajouter des tests de démarrage avec localStorage vide et IndexedDB vide.
2. Tester manuellement une nouvelle fenêtre privée sur le domaine HTTPS et vérifier la restauration d’un projet audio.
3. Ajouter un scénario navigateur de remplacement et suppression d’une source persistée.
3. Brancher les pages restantes sur le module profil partagé.
4. Conserver les installations des studios synchronisées avec leurs manifests.
5. Auditer les états locaux indépendants des modules.
6. Préparer un routage URL stable avant de rendre les pages partageables.

## Règle de communication

Ne pas utiliser « Production Ready » pour l’ensemble du produit tant que les
tests automatisés, les parcours navigateur et la validation matérielle ne sont
pas documentés. Dire plutôt : « Hub local fonctionnel, intégration matérielle
en cours ».


### Dernier alignement OP-1 Studio

- Clavier MIDI virtuel : bouton LECTURE/PAUSE visible et relié au transport existant.
- Configuration MIDI locale : enveloppe versionnée, sauvegardée côté client, avec verrouillage explicite après validation.
- Journal MIDI : affichage limité aux 3 messages les plus récents ; le tampon diagnostic reste téléchargeable.
