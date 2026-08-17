# Canal Hub ↔ studios

## Contrat de lancement

Le Hub ouvre OP‑1 ou EP‑133 dans une nouvelle fenêtre et transmet la fiche
locale dans `hubProfile`. Le dossier de travail est transmis par le message
`hub:workspace` lorsque le studio signale `studio:ready`.

En développement, l’origine du Hub est `http://127.0.0.1:5179` par défaut.
Elle peut être remplacée par `VITE_HUB_ORIGIN` dans chaque studio. Les URL de
lancement restent configurables par `VITE_OP1_URL` et `VITE_EP133_URL` côté Hub.

## Sécurité du canal

- le studio répond à la fenêtre `window.opener` (ou au parent si intégré), pas
  à `window.parent` sans distinction ;
- les messages entrants du studio vérifient l’origine exacte du Hub et la
  fenêtre source attendue ;
- le Hub mémorise chaque fenêtre qu’il a ouverte et refuse un `studio:ready` ou
  un événement provenant d’une autre fenêtre ou d’une autre origine ;
- les événements sortants des studios utilisent une origine exacte, jamais `*`;
- les événements `backup_created` et `session_update` mettent à jour les
  compteurs du Hub après cette vérification.

## Vérifications réalisées

Les validations actuelles passent avec :

- `npm run typecheck -w apps/studio-hub`
- `npx tsc --noEmit -p apps/op1-studio/tsconfig.json`
- `npm run typecheck:all`
- `npm run build:all`
- `npm run test:all`

Le parcours complet avec deux fenêtres, permission du dossier et une machine
réelle doit encore être couvert par un test navigateur dédié. Le matériel ne
doit pas être simulé comme validé tant que ce test n’a pas été exécuté.
