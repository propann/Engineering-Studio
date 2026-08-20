# Backup Lab — audit de la documentation et de l’implémentation

Date de référence : 2026-08-20  
Périmètre : coffre local du Hub, OP-1, EP-133, projets et restauration.

## Conclusion courte

Le dépôt possède déjà trois niveaux différents de sauvegarde. Ils ne doivent
pas être présentés comme une seule fonction :

| Niveau | État réel | Ce qui est prouvé |
|---|---|---|
| Coffre local du Hub | Fonctionnel dans le navigateur Chromium | Copie locale par catégories, manifeste, SHA-256 après copie, rapport JSON et restauration choisie par l’utilisateur |
| OP-1 Disk Mode | Moteur de fichiers et plan de transfert disponibles | Manifestes SHA-256, vérification, plan de restauration et garde-fous testés sur un faux système de fichiers |
| EP-133 clone / machine | Lecture réelle avancée ; écriture séparée et dangereuse | Clone matériel lecture seule validé ; écriture de projet/son exposée par pont local avec confirmation, checkpoint et relecture ; parcours global à revalider régulièrement |

Le produit peut donc dire : **sauvegarde locale exploitable et clonage EP-133
lecture seule validé**. Il ne doit pas encore dire : **restauration complète
des machines garantie depuis le Hub web**.

## Ce que le Hub fait réellement

`apps/studio-hub/src/VaultPanel.tsx` est le chemin le plus concret côté Hub.

- Le dossier maître est choisi avec la File System Access API.
- Les catégories sont séparées :
  - OP-1 : `tape`, `album`, `drum`, `synth` ;
  - EP-133 : `projects`, `samples`.
- Un snapshot est écrit dans `op1/backups/<id>/` ou
  `ep133/backups/<id>/`, sous `files/`, avec `manifest.json`.
- Chaque fichier est relu après écriture et son SHA-256 est comparé avant que
  le snapshot soit déclaré terminé.
- Un snapshot incomplet est supprimé lorsque le navigateur le permet et reste
  ignoré par le lecteur s’il ne possède pas de manifeste valide.
- La restauration demande une cible et une confirmation explicite, puis
  recopie uniquement les catégories cochées en vérifiant les hashes attendus.
- Un rapport JSON de l’opération peut être téléchargé.

### Limite importante de la restauration

La restauration remplace les fichiers portant le même chemin dans la cible,
mais le Hub ne crée pas encore automatiquement un checkpoint de cette cible
avant l’opération. Une erreur utilisateur ou une mauvaise cible peut donc
écraser un fichier local sans retour simple depuis le Hub.

Avant de déclarer la restauration « sûre », il faut ajouter :

1. un préflight listant les fichiers qui seront créés ou remplacés ;
2. un checkpoint facultatif ou obligatoire de la cible ;
3. une vérification de l’identité de la machine/dossier cible ;
4. une option d’annulation avant la première écriture ;
5. un rapport séparant fichiers créés, remplacés, ignorés et en erreur.

## OP-1 : ce qui existe et ce qui manque

Le moteur Python `apps/op1-studio/tools/backup_manifest.py` est plus fiable que
`apps/op1-studio/app/components/BackupPanel.tsx` :

- il parcourt les répertoires OP-1 autorisés sans suivre les liens symboliques ;
- il refuse les chemins dangereux et sépare la source de la destination ;
- il copie les fichiers dans un snapshot, calcule SHA-256 et vérifie la copie ;
- il écrit un manifeste versionné et sait le vérifier ;
- `device_transfer_plan.py` prépare des actions de transfert et impose un
  checkpoint ainsi qu’une confirmation avant une écriture.

En revanche, le panneau OP-1 actuellement affiché dans l’application contient
encore des données de démonstration (date, nombre de fichiers, taille et arbre)
et ses boutons « Drive » et « Time Capsule » affichent surtout des notifications.
Le bouton « Préparer une sauvegarde » décrit un plan, mais ne lance pas encore
le moteur Python ni le coffre Hub.

La spécification `docs/specs/DOC_MODULE_OP1_STUDIO_SPECIFICATION.md` décrit le
bon objectif — réutiliser le coffre SHA-256 — mais son statut « validée » est
trop large tant que le composant UI n’utilise pas effectivement ce chemin.

## EP-133 : besoins particuliers

L’EP-133 n’est pas un simple dossier monté comme l’OP-1. Le dépôt documente un
protocole FILE sur MIDI/SysEx, avec des projets archivés et des samples lus par
slot.

Le clone lecture seule `apps/ep133-studio/tools/clone_ep133_readonly.py` sait
conserver :

- les projets ;
- les PCM ;
- les métadonnées de slots ;
- les hashes SHA-256 ;
- l’historique de manifestes ;
- les différences entre projets, sons ajoutés, sons inchangés et slots absents.

La documentation de validation rapporte un clone réel de 9 projets et 527
sons, ainsi qu’un passage incrémental sans téléchargement. Ces résultats
restent des validations datées d’une machine et d’un environnement local ; ils
ne constituent pas un test automatique reproductible par Coolify.

Le pont local `tools/local_clone_bridge.py` est une autre couche : il permet au
Studio de demander un clone ou une écriture via `127.0.0.1`. Les écritures de
projet et de son exigent `confirm: true`, créent un checkpoint, relisent les
octets écrits et activent le projet. Elles ne doivent jamais être confondues
avec le clone lecture seule.

## Contrat de sauvegarde à retenir

Chaque adaptateur de machine devrait fournir les mêmes informations, même si
son protocole interne change :

```text
BackupAdapter
├── identify()          → machine, modèle, numéro de série si disponible
├── plan(scope)         → fichiers/slots, taille, actions, risques
├── snapshot(scope)     → contenu + manifeste + hashes
├── verify(snapshot)    → fichiers manquants, modifiés, hashes invalides
├── restorePlan(target) → créations, remplacements, conflits
└── restore(plan)       → checkpoint, confirmation, écriture, relecture
```

Le contrat doit distinguer explicitement :

- `local_snapshot` : copie dans le workspace choisi ;
- `machine_read` : lecture depuis une machine connectée ;
- `machine_write` : écriture physique, toujours protégée ;
- `restore_target` : dossier ou slot ciblé, jamais implicite.

## Matrice de validation prioritaire

| Test | Sans machine | Fausse arborescence | Vrai appareil | Bloquant avant déclaration finale |
|---|---:|---:|---:|---:|
| Snapshot local + manifeste | Oui | Oui | Non | Oui |
| Vérification SHA-256 | Oui | Oui | Non | Oui |
| Restauration vers dossier vide | Oui | Oui | Non | Oui |
| Restauration vers dossier contenant des fichiers | Oui | Oui | Non | Oui |
| Checkpoint avant restauration | ✅ fait | ✅ fait | À valider | Oui |
| OP-1 lecture Disk Mode | Non | Oui | Oui | Oui pour matériel |
| OP-1 écriture avec plan | Non | Oui | Oui avec appareil dédié | Oui pour matériel |
| EP-133 clone lecture seule | Non | Simulé | Oui, pont local | Oui pour matériel |
| EP-133 écriture puis relecture | Non | Simulé | Oui, environnement contrôlé | Oui pour matériel |
| Déconnexion pendant transfert | Simulé | Oui | Oui | Oui |
| Gros volume / reprise | Simulé | À faire | À faire | Oui |

## Priorités décidées

1. Remplacer les chiffres fictifs du `BackupPanel` par l’état réel du coffre ou
   afficher clairement « démonstration ».
2. ~~Ajouter le préflight et le checkpoint de cible avant restauration Hub.~~ Fait
   le 2026-08-20 : prévol listant créations et remplacements avec leurs tailles,
   point de retour horodaté dans la cible, 24 tests.
3. Écrire des tests de parcours pour snapshot, restauration, fichier remplacé
   et restauration interrompue.
4. Définir un manifeste commun sans casser les formats OP-1 et EP-133 déjà
   produits.
5. Ajouter une validation navigateur sur un vrai dossier local.
6. Garder la restauration physique des machines derrière un plan explicite,
   une confirmation et une relecture vérifiée.
7. Installer ensuite le pont EP-133 comme service local optionnel, séparé du
   déploiement Coolify.

## Règle de lecture des anciennes docs

Les fichiers dans `docs/archived/` et les fiches de validation matérielle sont
des traces de tests datés. Ils sont utiles pour savoir ce qui a déjà été
essayé, mais le code actuel et les tests présents font foi pour le statut.
Une validation sur une machine réelle doit toujours indiquer la date, le
modèle, l’environnement, le nombre de fichiers et le résultat de relecture.
