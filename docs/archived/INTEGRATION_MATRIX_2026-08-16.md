# Matrice d’intégration des livrables — 16 août 2026

Ce document compare les livrables de l’ancien écosystème avec le dépôt
`OP-1-Studio` sur la branche `integration/studio-hub`. Il sert de filtre avant
de recopier du code : un
outil n’est intégré que s’il est réellement monté, compilable et cohérent avec
les studios OP‑1/EP‑133 actuels.

> Mise à jour : la consolidation et les tests Hub sont maintenant dans la PR
> d’intégration. Ce document ne justifie plus une recherche de gitlinks ou une
> copie brute des anciens projets.

## Résultat de la consolidation

| Élément intéressant trouvé | Décision | État dans le Hub actuel |
|---|---|---|
| Portail avec fiche personnage | Intégré et refait dans `apps/studio-hub` | Profil local, sélection des machines, choix du dossier, création des zones partagées, ouverture des studios |
| Transmission de la fiche au studio | Intégrée | Le Hub ajoute `hubProfile` à l’URL ; les studios reçoivent désormais aussi le handle du workspace par `postMessage` |
| Dossier partagé / sauvegardes unifiées | Intégrée dans le Hub | Le coffre mémorise le handle, crée `shared`, `op1/*` et `ep133/*`, produit des snapshots sélectifs avec manifeste/SHA‑256, reconnaît les clones EP‑133 existants et restaure seulement les catégories cochées |
| Fiche personnage dans les studios | Retirée | La carte/page de fiche EP‑133 et le panneau de profil OP‑1 ont été supprimés ; l’identité visible reste dans le Hub |
| Éditeur de samples ancien | Non recopié tel quel | L’ancien OP‑1 est un prototype utile mais son import contient encore des données simulées ; `SampleEditorPanel` actuel est monté dans OP‑1 et couvre import, waveform, trim, fades et export AIFF |
| Éditeur d’image / SVG ancien | Non recopié tel quel | L’ancien `svg-editor` est un éditeur générique Fabric non branché au Hub et son build échoue sur la résolution de `fabric` ; OP‑1 possède déjà `DisplayCreatorPanel`, `Op1PixelEditor` et les patches contrôlés |
| Éditeur de patterns EP‑133 ancien | Non recopié | Dans l’ancien `sound-editor`, la branche EP‑133 affiche encore “coming soon” ; l’éditeur actuel EP‑133 est nettement plus avancé et reste la source de vérité |
| Contrôles de lecture / export anciens | Réutilisation sélective | À reprendre seulement après comparaison avec les contrôles déjà présents dans les studios actuels ; pas de doublon copié sans test |
| Documentation et feuilles de route | Intégrées comme audit | Voir `AUDIT_ROADMAPS_2026-08-16.md` ; les affirmations “terminé” ont été confrontées au code et aux cases restantes |

## Raccords déjà réalisés

1. Le nouveau portail est un workspace normal du dépôt parent :
   `apps/studio-hub`.
2. Le profil local est enregistré sous `studio-hub-profile`.
3. Le choix d’un dossier prépare les sous-dossiers communs et machine.
4. Les boutons OP‑1 et EP‑133 lancent les studios configurés par
   `VITE_OP1_URL` et `VITE_EP133_URL`.
5. OP‑1 et EP‑133 reçoivent automatiquement l’identité et le handle du
   workspace par le Hub ; l’identité reste centralisée dans le Hub et n’est
   plus éditable dans les studios. Chaque outil conserve seulement un cache
   importé en lecture seule pour survivre à un rafraîchissement.
6. Le coffre de l’atelier permet de sauvegarder et restaurer OP‑1/EP‑133 par
   catégories (`tape`, `album`, `drum`, `synth`, `projects`, `samples`).

## Raccords encore ouverts, confirmés par les roadmaps

- valider dans un navigateur le parcours complet de permission et de transfert
  de handle sur un vrai dossier (le coffre et les studios sont raccordés au
  même contrat, mais le test courant utilise une arborescence simulée) ;
- faire remonter au Hub les statistiques et le dernier backup créé depuis les
  studios, au lieu de seulement compter les snapshots créés dans le coffre ;
- ajouter le retour studio → Hub (statistiques, notifications, dernier backup)
  et un test E2E du parcours complet ;
- vérifier le montage effectif du MIDI, de la PWA et des ponts locaux ;
- faire remonter au Hub les statistiques et le dernier backup créé depuis les
  studios, au lieu de seulement compter les snapshots créés dans le coffre ;

L’audit de code mort et le nettoyage ciblé des profils locaux ont maintenant été
effectués. Les éléments restants ci-dessus sont des évolutions produit ou des
validations navigateur, pas des raccords de dossiers manquants.

## Limites importantes

Les anciens dépôts n’ont pas été supprimés ni écrasés. Les deux applications
actuelles restent les sources de vérité produit ; l’ancien dépôt est conservé
comme référence de conception jusqu’à validation du produit intégré.

La branche `integration/studio-hub` suit désormais les applications comme des
dossiers normaux. Les copies de travail externes éventuelles sont seulement des
références et ne font pas partie de la PR.
