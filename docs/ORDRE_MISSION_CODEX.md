# Ordre de mission — Codex

> **Lot spécialisé.** La feuille de route principale est [`ROADMAP.md`](ROADMAP.md) ;
> ce document en détaille le lot Studios et jeu. En cas de contradiction, la principale gagne.


## Lot immédiat livré

- déposer l'audit sectoriel ;
- récupérer l'éditeur sonore historique dans la fenêtre Pages ;
- agrandir légèrement l'autoroute OP-1 ;
- caler le compte à rebours au BPM ;
- faire partir la première note du haut ;
- ajouter un métronome activable ;
- ajouter quatre exercices fondamentaux ;
- imposer des règles automatiques au catalogue ;
- rendre la progression du personnage plus exigeante ;
- pousser sur `main` et surveiller la CI.

## Lot suivant

1. Corriger les styles OP-1 lorsqu'ils sont intégrés dans le Hub.
2. Corriger Apprendre → EP-133 pour ouvrir le jeu directement.
3. Ajouter les badges de provenance aux actions sensibles.
4. Retirer les clouds fictifs et l'ancien BackupPanel.
5. Ajouter des tests E2E :
   - compte à rebours ;
   - pré-défilement ;
   - clic de métronome ;
   - première note non manquée au lancement ;
   - progression et anti-farming XP ;
   - ouverture de toutes les pages recensées.
6. Vérifier le SHA réellement déployé sur Coolify.

## Définition de terminé

Une fonction est terminée seulement si son état réel est visible, son parcours est testable dans le Hub, sa CI est verte et sa documentation décrit exactement ses limites.
