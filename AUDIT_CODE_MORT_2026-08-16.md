# Audit du code mort — Studio Hub (baseline du 16 août)

> Audit de référence avant la dernière passe d’intégration. Les suppressions
> de profils locaux décrites plus bas sont déjà intégrées ; ce document reste
> le registre des candidats à nettoyer, sans suppression automatique. L’état
> de livraison courant est dans [`docs/ROADMAP_ACTIVE_2026-08-16.md`](docs/ROADMAP_ACTIVE_2026-08-16.md).

**Date :** 16 août 2026  
**Méthode :** lint ESLint, typecheck TypeScript, recherche des références de symboles et des imports, inventaire des workspaces et vérification des appels depuis les applications.  
**Principe :** aucune suppression automatique lorsque le fichier peut être une extension future, une API publique ou un point d’entrée chargé par convention.

## Synthèse

Le code mort certain est principalement concentré dans `apps/op1-studio/app/page.tsx`, qui contient plusieurs anciens composants complets non appelés. Le dépôt contient aussi plusieurs modules exportés mais utilisés seulement dans la documentation, ainsi que deux packages réduits à leurs tests.

**Estimation :** environ 300 à 450 lignes de composants OP‑1 supprimables avec faible risque, plus plusieurs petits modules à confirmer avec l’équipe produit. Cette estimation ne compte pas les tests, la documentation ni les fichiers chargés par convention.

## 1. Code mort certain — suppression recommandée

### Composants jamais utilisés dans OP‑1

Les définitions suivantes apparaissent dans [`apps/op1-studio/app/page.tsx`](apps/op1-studio/app/page.tsx) mais aucune référence d’appel n’existe dans le dépôt applicatif. ESLint les signale également comme inutilisées :

- `MachineControls` — ligne 299
- `TapeMachine` — ligne 316
- `MidiRoll` — ligne 329
- `GlobalArrangement` — ligne 341
- `CloneSurface` — ligne 355
- `UsbAudioMonitor` — ligne 375
- `TrackGainControls` — ligne 388
- `WaveformOverview` — ligne 435

Ces composants doublonnent en partie les composants spécialisés actuels (`StudioMachinePanel`, `StudioTapeEditor`, `StudioTrackList`). Ils ne sont ni exportés ni utilisés par une route, un import dynamique ou un test.

**Action :** supprimer ces composants et les styles CSS associés après vérification visuelle. Garder uniquement les types ou helpers réellement utilisés ailleurs, notamment `MidiEvent` utilisé dans le format de projet.

### États et fonctions sans effet observable

- `toggleRollNote` dans `page.tsx:651` n’est appelé par aucun composant depuis la suppression logique de `MidiRoll`.
- `logs` dans `page.tsx:1066` est calculé mais jamais rendu ni transmis.
- `lastEnc` et `lastFn` dans [`StudioMachinePanel.tsx`](apps/op1-studio/app/components/StudioMachinePanel.tsx:576) sont déclarés mais jamais lus.
- Le prop `muted` de `TrackLane` dans [`StudioTrackList.tsx`](apps/op1-studio/app/components/StudioTrackList.tsx:186) est destructuré mais la valeur utilisée est `isMuted`/`isMutedDirect`.

**Action :** supprimer ces états/fonctions/props et leurs setters associés. Si les journaux ou les valeurs encodeur sont prévus pour une prochaine interface, les déplacer dans une branche explicitement marquée ou un module expérimental hors du chemin de production.

## 2. Code probablement mort — validation produit nécessaire

### Module de sélection de pattern

[`PatternSelector.tsx`](apps/ep133-studio/src/components/editor/PatternSelector.tsx) exporte `PatternSelector`, mais aucune utilisation n’a été trouvée dans l’application. Il peut s’agir d’un écran d’édition non branché.

**Décision requise :** soit l’intégrer dans l’éditeur de patterns, soit le supprimer avec ses styles et tests éventuels.

### Modules audio et chargement d’exercices EP‑133

- [`audioFormatUnified.ts`](apps/ep133-studio/src/core/audio/audioFormatUnified.ts) est documenté et exporte une API complète, mais aucune utilisation runtime n’a été trouvée ; ses références sont dans la documentation de conception.
- [`loader.ts`](apps/ep133-studio/src/core/engine/loader.ts) expose `loadExercise`, sans appel applicatif détecté.

**Décision requise :** si ces modules sont une API future, les déplacer dans un dossier `experimental` ou ajouter un test d’API publique. Sinon, les supprimer pour éviter de maintenir une promesse non utilisée.

### Communication Hub et hooks d’initialisation

Les modules de communication bas niveau suivants n’ont pas de consommateur
applicatif détecté :

- [`apps/op1-studio/app/core/hub/hubCommunication.ts`](apps/op1-studio/app/core/hub/hubCommunication.ts)
- [`apps/ep133-studio/src/core/hub/hubCommunication.ts`](apps/ep133-studio/src/core/hub/hubCommunication.ts)

Les hooks d’initialisation sont maintenant montés dans les deux apps et ne sont
plus considérés comme morts. Les modules bas niveau peuvent être chargés par
une intégration externe ou être prévus pour un contrat futur : ils ne doivent
pas être supprimés sans vérifier ce contrat.

### `FirmwareSubtabs` et authentification ChatGPT

- [`FirmwareSubtabs.tsx`](apps/op1-studio/app/components/FirmwareSubtabs.tsx) n’est pas importé ; il semble remplacé par le rendu inline de `page.tsx`.
- [`chatgpt-auth.ts`](apps/op1-studio/app/chatgpt-auth.ts) n’a pas de consommateur explicite. Les exports peuvent toutefois être utilisés par une convention de framework ou un futur endpoint.

**Action :** vérifier les routes et conventions Next/vinext avant suppression. `FirmwareSubtabs` est un candidat fort à la suppression ; `chatgpt-auth.ts` doit être conservé jusqu’à vérification du déploiement d’authentification.

## 3. Workspaces et fichiers à faible valeur runtime

- `packages/game-integration` et `packages/performance-benchmarks` n’ont pas de source de production : ils contiennent essentiellement des tests. Ils sont utiles pour les vérifications croisées, mais ne doivent pas être présentés comme des bibliothèques runtime.
- `packages/midi-analysis` est encore un workspace sans source ni test. Son script accepte maintenant l’absence de tests pour débloquer la CI, mais cela masque une fonctionnalité non livrée.
- Plusieurs fichiers `README`, plans et fixtures peuvent sembler non référencés ; ils ne sont pas du code mort et ne doivent pas être supprimés sur la seule base d’une recherche d’import.

## 4. Faux positifs à ne pas supprimer

- Les fichiers `index.ts` exportant des APIs de package peuvent être consommés par un autre workspace via le champ `exports` sans apparaître comme import local simple.
- Les routes Next, les fichiers `layout.tsx`, les workers et les commandes Python/Rust sont des points d’entrée conventionnels.
- Les tests et fixtures non importés par l’application sont des entrées de test, pas du code mort.
- Les modules de bridge local peuvent être appelés depuis Tauri ou un environnement externe ; ils nécessitent une vérification d’intégration avant suppression.

## 5. Plan de nettoyage sécurisé

1. Supprimer les huit composants OP‑1 certains inutilisés et les styles associés.
2. Supprimer `toggleRollNote`, `logs`, `lastEnc`, `lastFn` et le prop `muted` inutilisé.
3. Lancer build, tests, typecheck et lint après chaque groupe de suppressions.
4. Décider du sort de `PatternSelector`, `audioFormatUnified`, `loader` et `FirmwareSubtabs` avec une recherche des routes et imports dynamiques.
5. Soit implémenter `midi-analysis`, soit le retirer du workspace ; ne pas le maintenir indéfiniment en `passWithNoTests`.
6. Ajouter une règle CI de détection du code mort, par exemple Knip ou une analyse TypeScript `noUnusedLocals`, après avoir traité les points d’entrée conventionnels.

## Conclusion

Le code mort n’est pas uniformément réparti : il provient surtout d’anciennes maquettes regroupées dans le gros `page.tsx` OP‑1 et de modules préparatoires non branchés. Le nettoyage peut être effectué à faible risque sur les composants listés comme certains. Les modules expérimentaux et les bridges doivent rester soumis à validation d’intégration avant toute suppression.

## Mise à jour après raccordement Hub — 16 août 2026

Le nettoyage ciblé demandé a été effectué :

- suppression des anciens stores et modules de fiche locale OP‑1 ;
- suppression du bridge Python et du test `profile.json` OP‑1 ;
- suppression des commandes Tauri `profile_read/profile_write` et de leurs wrappers ;
- suppression de la fiche locale EP‑133, de son test dédié et de l’ancien chemin de scan qui l’alimentait ;
- suppression des écritures/lectures locales de profil EP‑133 ;
- suppression des styles CSS de la fiche EP‑133 devenus orphelins, en conservant le style de message de transfert encore utilisé.

Le profil reste uniquement dans le Hub et est transmis aux studios comme contexte de session. Les métadonnées techniques d’un clone de machine restent autorisées dans les manifests et historiques de sauvegarde.

Contrôles après nettoyage : `npm run typecheck:all`, `npm run lint:all`, `npm run build:all`, `npm run test:all` et `git diff --check` passent. Le lint OP‑1 ne signale plus de code mort ; il conserve seulement deux avertissements de règle d’optimisation sur des balises `<img>` de l’interface firmware. Le build EP‑133 conserve uniquement l’avertissement de taille de chunk.
