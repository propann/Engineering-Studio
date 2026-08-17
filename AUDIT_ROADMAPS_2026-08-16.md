# Audit des roadmaps et du suivi — 16 août 2026

## Conclusion

Les roadmaps ont bien été inventoriées et comparées aux fichiers réellement
présents et aux points d’entrée des deux applications. Elles ne décrivent pas
toutes le même niveau de maturité : certaines sont historiques, d’autres sont
des plans encore ouverts, tandis que les rapports racine déclarent parfois le
projet « production ready » trop tôt.

## Mise à jour après intégration — 16 août 2026

La branche `integration/studio-hub` a depuis reçu la consolidation du portail,
les huit cartes outils et douze scénarios E2E navigateur. Les statistiques
OP‑1/EP‑133, le compteur de snapshots du coffre, l’annulation avant écriture
EP‑133 et l’archivage/restauration locale des projets sont maintenant couverts.
Les rapports racine restent historiques et ne présentent plus la phase 3 comme
le statut produit complet.

| Document | Alignement actuel |
|---|---|
| `docs/ROADMAP_ACTIVE_2026-08-16.md` | Source de vérité : 13 E2E passent ; validation MIDI réelle, matériel, gros volumes et écritures contrôlées restent ouverts. |
| `README.md`, `INDEX.md` | Pointent vers la roadmap active et documentent `npm run test:e2e:hub` avec 13 scénarios. |
| `STATUS.md`, `PROGRESS.md`, `TEAM_SYNC.md`, `PHASE3_COMPLETION.md` | Marqués historiques ; leurs chiffres de phase 3 ne remplacent plus l’état produit. |
| `GIT_ALIGNMENT_REPORT.md` | Distingue l’ancien audit des gitlinks de l’état actuel monorepo sur `integration/studio-hub`. |
| `MASTER_ROADMAP.md` | Conserve l’historique ; la roadmap active porte maintenant les 13 E2E et les portes restantes. |
| `apps/ep133-studio/ROADMAP_CONNECT_TO_HUB.md` | Raccord de lancement et stats versionnées livrés ; store partagé, gros volume et écriture matérielle restent ouverts. |

## État par feuille de route

| Document | État vérifié | Commentaire |
|---|---|---|
| `MASTER_ROADMAP.md` | Historique recadré | La phase 3 reste un jalon historique ; l’index renvoie vers la roadmap active et les 13 E2E validés. |
| `PROGRESS.md`, `STATUS.md` | Obsolètes sur plusieurs points | Ils déclarent une intégration complète et aucun travail non suivi, alors que le parent contient des changements non committés et que les apps ne sont pas suivies comme des dossiers normaux. |
| `PHASE4_FINAL_STATUS.md` | Valide pour les packages, trop large pour le produit | Les packages adaptatifs et leurs tests existent ; cela ne prouve pas que les applications OP‑1/EP‑133 consomment ces abstractions ni que le produit matériel est prêt. |
| `PHASE4_WEEK3_PLAN.md`, `PHASE4_WEEK3_PROGRESS.md` | Packages livrés, intégration à poursuivre | Les adapters et tests existent, mais le raccordement des interfaces et la validation matériel restent séparés. |
| `apps/op1-studio/MIGRATION_PLAN.md` | En cours | Les stores et le hook MIDI ont été créés, mais leur migration dans les composants, les tests FSA/MIDI, le test matériel et le nettoyage Tauri restent ouverts. |
| `apps/op1-studio/docs/MIGRATION_WEB_ROADMAP.md` | En cours | Les cases Tauri, stores centraux, PWA, compatibilité navigateurs, E2E et validation hardware restent non cochées. |
| `apps/op1-studio/ROADMAP_CONNECT_TO_HUB.md` | Partiellement raccordé | Le Hub lance OP‑1, transmet le workspace et son coffre sait créer/restaurer des snapshots sélectifs ; retour Hub et test round-trip navigateur restent ouverts. |
| `apps/op1-studio/docs/FIRMWARE_PAGE_ROADMAP.md` | Partiellement livré | Navigation, catégories et fiches sont présentes ; simulation, connexions complètes et plusieurs fonctions firmware restent soit à vérifier soit hors périmètre. |
| `apps/op1-studio/docs/ROADMAP.md` | Fonctionnel mais incomplet | Images, audio oracle et conversion sont livrés. Le transfert matériel, le pont local complet et la synchronisation restent ouverts. |
| `apps/ep133-studio/ROADMAP_CONNECT_TO_HUB.md` | Partiellement raccordé | Le Hub lance EP‑133, transmet le workspace et son coffre sait archiver/restaurer projets et samples ; adaptation complète du store et test de bout en bout restent ouverts. |
| `apps/ep133-studio/OPTIMIZATION_PLAN.md` | Non terminé | Optimisation bundle, alignement packages, objectifs de taille et validation monorepo restent ouverts. |
| `apps/ep133-studio/docs/ROADMAP.md` | Partiellement livré | Le player, les projets, les analyses audio et une partie PWA existent ; MIDI matériel complet, SysEx d’écriture, sync, backups et transfert restent à faire. |
| `apps/ep133-studio/docs/PLAN_EQUIPE_MULTI_IA.md` | Processus, pas preuve de livraison | Le document décrit la coordination des agents ; il ne remplace pas les validations techniques ou matérielles. |

## Contrôles code ↔ roadmap

- `apps/op1-studio/app/core/midi/useWebMidi.ts` existe, mais son branchement
  complet dans `StudioMachinePanel` et dans un store MIDI n’est pas démontré.
- Les stores OP‑1 existent, mais les références runtime dans la page principale
  restent limitées ; la roadmap de migration doit donc rester ouverte.
- `vite-plugin-pwa` est configuré côté EP‑133 et le build génère les artefacts,
  mais l’installation réelle et le mode offline n’ont pas été validés dans un
  navigateur.
- `SoundPadGrid` existe mais n’est pas monté dans `SoundsPanel`; la nouvelle
  brique `SampleEditorPanel` est désormais montée et compilée.
- Le code audio est encore dupliqué entre OP‑1 et EP‑133 malgré les intentions
  de partage documentées.
- La communication Hub existe sous forme de modules/hooks et les hooks
  d’initialisation sont maintenant montés dans les deux apps. Le handle du
  workspace est transmis par `postMessage`; le parcours complet et les
  écritures réelles OP‑1 restent à couvrir par un test E2E navigateur.

## Décisions de suivi

1. Ne plus employer « production ready » pour l’ensemble du produit tant que
   le dépôt parent, les ponts Hub et le matériel ne sont pas validés.
2. Marquer les roadmaps historiques comme historiques ou les mettre à jour avec
   une date et un état réel.
3. Créer une seule liste de jalons actifs : dépôt suivi, portail, éditeurs,
   pont local, MIDI matériel, transfert contrôlé et tests E2E.
4. Conserver les limites EP‑133 déjà correctement écrites dans sa passation :
   elles sont plus fiables que les déclarations générales des rapports racine.
