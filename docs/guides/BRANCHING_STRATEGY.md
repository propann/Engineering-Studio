# Git — stratégie actuelle

**Dépôt :** `propann/OP-1-Studio`  
**Branche canonique :** `main`  
**Dernière consolidation :** PR #1, fusionnée le 17 août 2026

## Règle simple

`main` contient la version réunie et vérifiée de Studio Hub, OP‑1 Studio,
EP‑133 Studio, des packages partagés et de la documentation. Toute nouvelle
évolution part de `main` et revient vers `main` par une PR courte et ciblée.

```text
main
├── feature/hub-...
├── feature/op1-...
├── feature/ep133-...
└── docs/...
```

Les branches de module de l’ancien fonctionnement ne sont plus la source de
vérité. Elles peuvent être supprimées après vérification de leur contenu ou
conservées comme archives Git.

## Branches actuellement connues

- `main` : branche de production et de référence.
- `integration/studio-hub` : consolidation déjà fusionnée dans `main`, à
  conserver seulement tant qu’un nettoyage des références n’est pas décidé.
- `phase4/adaptive-framework` : historique de travail et prototypes.
- `agent/op1-studio-workspace` : ancien espace de travail OP‑1.

Les branches historiques ne doivent recevoir aucun nouveau commit produit.
Leur contenu utile est déjà représenté dans `main` ou dans `archive/`.

## Avant de travailler

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/nom-court
```

Choisir un nom qui décrit une seule intention :

- `feature/hub-vault-progress`
- `fix/op1-sample-import`
- `fix/ep133-midi-origin`
- `docs/update-product-presentation`

## Avant la PR

```bash
npm run typecheck:all
npm run build:all
npm run test:all
npm run lint:all
git diff --check
git status --short
```

Une PR doit préciser le parcours utilisateur concerné, les fichiers touchés,
les commandes exécutées et les validations matérielles encore manquantes.

## Principes de conservation

- Ne jamais supprimer un prototype sans l’avoir identifié et archivé.
- Ne pas ajouter de réglages locaux, secrets, `node_modules`, builds ou
  verrous générés dans une PR.
- Ne pas présenter un package expérimental comme une fonction produit tant
  qu’il n’est pas raccordé à un écran et à un test.
- Les écritures machine, firmware et SysEx restent séparées des tests locaux
  et demandent un checkpoint explicite.
