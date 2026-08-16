# Feuille de route active — Studio Hub, OP‑1 et EP‑133

**Date de recalage :** 16 août 2026  
**Statut :** branche `integration/studio-hub`, PR ouverte, non fusionnée  
**Source de vérité :** ce document pour les priorités produit. Les roadmaps historiques restent utiles pour le contexte, mais ne décrivent plus seules l’état actuel.

## 1. Produit livré aujourd’hui

Le produit est organisé en trois niveaux :

| Niveau | Outils réellement accessibles | État |
|---|---|---|
| **Portail Studio Hub** | Porte d’entrée, fiche personnage, plusieurs machines, capacités EP‑133 64/128 Mo, espace partagé, coffre de sauvegardes sélectives | **Livré côté interface et tests locaux** |
| **OP‑1 Studio** | Firmware, services/patchs, éditeur d’images, éditeur de samples, Sons, Sauvegardes, Tape & Album, Exercices, Documentation, MIDI | **Livré par modules ; matériel et écritures contrôlées à valider** |
| **EP‑133 Studio** | Pattern & Song, Sons & Transfert, clone, Test Machine, Rhythm Hero, Documentation, MIDI/SysEx | **Livré par modules ; campagne matérielle exhaustive à poursuivre** |

### Parcours Hub → outil

Les cartes suivantes sont présentes dans la page Outils :

1. OP‑1 Studio
2. EP‑133 Studio
3. Éditeur d’image OP‑1
4. Éditeur de samples OP‑1
5. Services OP‑1 — firmware et patchs
6. Sons & transferts EP‑133
7. Jeux & entraînement EP‑133

Le coffre de l’atelier reste accessible depuis la section Ressources partagées. Il centralise les snapshots, la sélection des catégories, la restauration et la progression, sans recréer une fiche machine.

Les paramètres `hubProfile`, `hubMachine*`, `hubReturn` et `hubTool` sont transmis au lancement. Les studios savent ouvrir directement leurs écrans principaux ; toutes les statistiques d’usage ne remontent pas encore au Hub.

## 2. Statut de référence

| Domaine | Livré | Partiel / limite actuelle |
|---|---|---|
| Portail et profil local | Landing, profil persistant, inventaire nommé, capacité EP‑133 64/128, workspace IndexedDB | Migration de toutes les anciennes sauvegardes et test navigateur multi-session |
| Catalogue d’outils | Sept cartes, catégories et liens directs | Test E2E des sept ouvertures |
| Coffre Hub | Sélection par catégories, snapshots locaux, restauration contrôlée, suivi de progression | Validation navigateur avec un vrai dossier et gros volume |
| Raccord OP‑1 | Profil, workspace, retour Hub, routes éditeur/samples/services/firmware | Écriture matériel, permissions FSA et remontée de statistiques |
| Raccord EP‑133 | Profil, machine nommée/capacité, workspace, retour Hub, routes game/sounds/docs/test | Store partagé, stats bidirectionnelles et test complet Hub → modification → retour |
| Éditeurs | Image OP‑1, samples OP‑1, Pattern/Song EP‑133, Sons & Transfert EP‑133 | Éditeur avancé de paramètres de patch OP‑1 à distinguer de la préparation de patch |
| Sécurité | Sanitisation SVG, contrôle d’origine Hub côté OP‑1, confirmations locales | Revue complète des origines côté EP‑133 et route bibliothèque locale |
| Qualité | Typecheck, build et tests monorepo passent sur la branche | 10 avertissements lint OP‑1, tests navigateur des parcours Hub manquants |

## 3. Priorités actives

### P0 — Fermer l’intégration et rendre le parcours vérifiable

Objectif : ouvrir chaque outil depuis le Hub, conserver l’identité et revenir sans recréer la fiche.

- [x] Regrouper les outils actifs dans la page Outils.
- [x] Ouvrir directement les écrans OP‑1 image, samples, services et firmware.
- [x] Ouvrir directement les écrans EP‑133 jeux, sons, documentation et test machine.
- [x] Transmettre profil, machine déclarée, capacité EP‑133, workspace et URL de retour.
- [ ] Écrire un test navigateur du parcours landing → profil existant → Hub → chaque outil → retour Hub.
- [ ] Vérifier la persistance après fermeture/réouverture du navigateur, sans nouvelle fiche.
- [ ] Passer la PR d’intégration en revue puis la fusionner après ces contrôles.

### P1 — Coffre et sauvegardes crédibles

Objectif : rendre le coffre exploitable avec un vrai dossier local, sans confusion entre snapshot local et écriture machine.

- [x] Afficher les catégories sélectionnables et la barre de progression.
- [x] Prévoir snapshots, restauration contrôlée et suivi par machine.
- [ ] Tester un cycle réel avec gros volume : sauvegarde complète, sauvegarde sélective samples/bandes, restauration et comparaison.
- [ ] Afficher clairement source, destination, nombre de fichiers, taille et erreurs partielles.
- [ ] Ajouter une reprise sûre après interruption et un rapport exportable du cycle.
- [ ] Relier les actions du coffre aux bridges machine uniquement après checkpoint, diff, relecture et confirmation.

### P1 — Validation matérielle OP‑1 et EP‑133

Objectif : séparer définitivement « plan préparé » et « écriture réussie ».

- [ ] OP‑1 Disk : sauvegarde, hash, suppression/restauration d’un fichier de test, éjection et débranchement simulé.
- [ ] OP‑1 MIDI/USB : rattacher les contrôles appris aux fonctions réelles du Studio.
- [ ] EP‑133 : campagne lecture seule complète sur projets, pads, samples, groupes et capacité 64/128 Mo.
- [ ] EP‑133 : valider une écriture ciblée avec checkpoint, relecture binaire et état de retour explicite.
- [ ] Documenter câble retiré, permission refusée, volume différent et fichier corrompu.

### P2 — Raccord de données Hub ↔ studios

Objectif : éviter les doubles fiches et faire remonter les informations utiles sans créer un second compte.

- [x] Importer et mettre en cache le profil transmis par le Hub dans les studios.
- [x] Importer la machine déclarée et son nom ; importer la capacité EP‑133.
- [x] Établir le canal workspace et le retour vers le Hub.
- [ ] Remplacer les caches locaux dispersés par un contrat partagé versionné.
- [ ] Valider et filtrer les messages entrants par origine, source et schéma dans les deux studios.
- [ ] Faire remonter au Hub les statistiques réellement produites : sauvegardes, projets, samples, entraînement.
- [ ] Documenter les permissions et la reconnexion du `FileSystemDirectoryHandle`.

### P2 — Finir les outils nouvellement exposés

- [ ] **Éditeur de samples OP‑1** : test import → analyse → conversion AIFF → export, avec sources réversibles.
- [ ] **Services/patchs OP‑1** : préciser que le module prépare/analyse les patchs ; réserver l’édition avancée à un chantier identifié.
- [ ] **Éditeur d’images OP‑1** : tests de rejet SVG, aperçu sûr, export et bibliothèque locale.
- [ ] **Sons & Transfert EP‑133** : test par projet cible, dépendances manquantes, écriture ciblée et annulation.
- [ ] **Pattern & Song EP‑133** : test de sauvegarde/rechargement, MIDI, arrangement et restauration d’un projet.
- [ ] **Jeux & entraînement** : faire remonter la progression utile au profil Hub et couvrir le parcours hors machine.

### P3 — Dette, code mort et documentation

- [ ] Supprimer ou isoler les huit composants OP‑1 signalés comme non montés par le lint, après vérification de leur destination.
- [ ] Remplacer les deux `<img>` signalés ou documenter leur exception.
- [ ] Corriger la commande de validation globale pour annoncer exactement les workspaces testés.
- [ ] Clarifier la licence héritée MIT/AGPL dans le README et le PR.
- [ ] Ajouter un bandeau « document historique » aux anciennes roadmaps et renvoyer vers ce document.
- [ ] Générer un nouvel audit de code mort après cette passe de nettoyage.

## 4. Ordre d’exécution recommandé

1. Test navigateur du portail et des sept cartes.
2. Test réel du coffre local sur dossier de travail, sans machine connectée.
3. Validation matérielle OP‑1/EP‑133 en lecture seule puis sur une cible de test.
4. Stabilisation du contrat Hub, des permissions et des statistiques.
5. Nettoyage du code mort et mise à jour des roadmaps historiques.
6. Revue et fusion de la PR d’intégration.

## 5. Hors périmètre immédiat

Pas de compte distant, paiement, cloud, synchronisation en ligne ou catalogue communautaire automatique avant la validation des sauvegardes locales, des éditeurs et des écritures matérielles contrôlées.

## 6. Commandes de validation de la branche

```bash
npm run typecheck:all
npm run build:all
npm run test:all
npm run lint:all
```

État au 16 août 2026 : les quatre commandes passent ; le lint termine avec 10 avertissements non bloquants déjà identifiés.
