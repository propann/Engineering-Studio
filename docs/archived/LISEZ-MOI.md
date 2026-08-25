# Archives — instantanés figés

Les documents de ce dossier **constatent un état à une date**. Ils ne décrivent
pas le dépôt d'aujourd'hui, et ne doivent pas être corrigés pour le refléter :
les corriger falsifierait ce qu'ils observaient à leur date, qui est toute leur
valeur.

## Ce que ça implique, concrètement

**Leurs liens pointent vers des fichiers d'alors, dont certains n'existent
plus.** Au 2026-08-25, 39 liens internes sont morts, tous dans ce dossier et
dans `docs/backup/` — la documentation vivante, elle, n'en compte aucun. La
plupart visent `docs/ROADMAP_ACTIVE_2026-08-16.md`, supprimé depuis.

C'est pourquoi le garde-fou qui vérifie les liens
(`packages/musique/documentation.test.ts`) **exclut ce dossier**. Ce n'est pas
un oubli à rattraper : c'est la seule façon de garder à la fois une doc vivante
sans lien mort et des archives honnêtes.

**Leurs chiffres sont périmés aussi** — comptes de tests, de patches, de
lignes. Les mêmes gardes qui interdisent de figer ces nombres dans la doc
vivante ne s'appliquent pas ici, pour la même raison.

## Où trouver l'état réel

- [MODULES_STATUS.md](../../MODULES_STATUS.md) — les douze modules du rack
- [docs/STATUS.md](../STATUS.md) — l'état du dépôt et du déploiement
- [docs/INDEX.md](../INDEX.md) — l'entrée de la documentation vivante
