# Rapport d’audit du code — Studio Hub (baseline du 16 août)

**Date :** 16 août 2026  
**Périmètre :** monorepo `/home/azoth/studio-hub`, applications OP‑1 Studio et EP‑133 Studio, packages TypeScript, outils Python/Rust, configuration et tests.  
**Nature :** audit statique complété par builds et tests disponibles. Aucun changement fonctionnel n’a été appliqué.

> Ce rapport est la photographie de l’audit initial. Depuis sa rédaction, la
> branche d’intégration a ajouté les parcours E2E Hub, le coffre hors machine
> et une correction d’hydratation OP‑1. Les priorités toujours ouvertes sont
> suivies dans [`docs/ROADMAP_ACTIVE_2026-08-16.md`](docs/ROADMAP_ACTIVE_2026-08-16.md).

## 1. Synthèse exécutive

Le projet est un monorepo ambitieux et déjà fonctionnel sur ses deux applications principales. Les builds OP‑1 et EP‑133 passent, les tests JavaScript disponibles passent, et les dépendances internes ne présentent pas de cycle détecté.

L’état global n’est toutefois pas encore suffisamment industrialisé pour être qualifié de « production ready » sans réserve. Le principal risque est la chaîne de validation : les scripts globaux appellent des commandes absentes dans une majorité des workspaces, TypeScript 7 refuse la configuration héritée des packages, et le lint bloque sur une erreur `any`. Deux risques de sécurité méritent aussi une correction prioritaire : le rendu de SVG fourni par l’utilisateur via `dangerouslySetInnerHTML` et les messages `postMessage` envoyés vers `*`.

**Évaluation globale : moyen / à consolider.**

## 2. Périmètre et architecture observée

- 28 workspaces : 26 packages et 2 applications.
- Stack principale : React 19, TypeScript, Vite/Vitest, Next/vinext, Zustand, Web Audio/MIDI.
- Deux applications distinctes :
  - `apps/op1-studio` : application OP‑1, Vite/vinext, bridge local Tauri/Rust et outils Python.
  - `apps/ep133-studio` : application EP‑133, Vite/PWA, outils locaux de transfert et d’analyse.
- Environ 36 500 lignes de code applicatif TypeScript/JavaScript/Python/Shell, hors dépendances générées.
- 64 fichiers liés aux tests ou configurations de test recensés ; plusieurs tests Python ne sont pas lancés par le script npm principal.

## 3. Résultats des vérifications

| Vérification | Résultat |
|---|---|
| Build EP‑133 | **OK** — Vite produit les artefacts ; avertissement sur chunks > 500 kB |
| Build OP‑1 | **OK** — vinext build terminé |
| Tests packages JS disponibles | **OK** pour les packages exécutés ; 1 package sans fichier de test échoue |
| Tests EP‑133 | **OK** — checks engine, MIDI, exports, WAV, conversion, profils et 10 tests unitaires |
| Tests OP‑1 Node | **OK** — 5 tests passent |
| `npm run build:all` | **ÉCHEC** — 26 workspaces n’ont pas de script `build` |
| `npm run test:all` | **ÉCHEC** — scripts absents et `midi-analysis` sans fichier de test |
| `npm run typecheck -ws` | **ÉCHEC** — TypeScript 7 rejette `baseUrl`; certains workspaces n’ont pas de script |
| `npm run lint:all` | **ÉCHEC** — scripts absents et erreur `no-explicit-any` dans OP‑1 |
| Tests Python OP‑1 | **NON EXÉCUTÉS** — `pytest` n’est pas installé dans l’environnement |
| `npm audit` | **NON CONCLUANT** — registre npm inaccessible (`ENOTFOUND`) |

## 4. Constats prioritaires

### P0 — Chaîne monorepo annoncée comme globale mais non exécutable

**Preuve :** [`package.json`](package.json:15) définit `build:all`, `test:all` et `lint:all` avec `npm run ... -ws`, alors que la majorité des packages n’exposent pas les scripts correspondants.

**Impact :** une CI ou un développeur peut croire que tout le dépôt est validé alors que les commandes globales échouent avant de fournir un signal exploitable. Les packages `audio-bridge`, `compression`, `shared-stores`, `shared-ui` et `types` n’ont notamment pas de tests ; plusieurs n’ont ni build ni typecheck.

**Recommandation :** choisir explicitement un modèle :

1. ajouter des scripts uniformes (`build`, `typecheck`, `test`, `lint`) à chaque workspace, y compris des scripts neutres pour les packages sans runtime ; ou
2. remplacer les commandes `-ws` par une liste explicite de workspaces réellement validables, avec une commande séparée pour les applications.

Ajouter ensuite une CI qui exécute ces commandes sur une installation propre.

### P0 — Configuration TypeScript incompatible avec la version installée

**Preuve :** [`tsconfig.json`](tsconfig.json:21) utilise `baseUrl`, et les `tsconfig.json` des packages héritent de cette configuration. TypeScript 7 renvoie `TS5102` (« Option 'baseUrl' has been removed ») et `TS5090`.

**Impact :** les typechecks des packages échouent systématiquement, même lorsque leur code est correct. La validation statique ne protège donc pas les changements de bibliothèque.

**Recommandation :** soit pinner TypeScript sur une version supportant encore cette configuration, soit migrer les alias vers la syntaxe attendue par TypeScript 7 et vérifier la résolution côté Vite/vinext. Ajouter un typecheck racine reproductible après migration.

### P1 — Aperçu SVG non sûr dans l’éditeur OP‑1

**Preuve :** [`DisplayCreatorPanel.tsx`](apps/op1-studio/app/components/DisplayCreatorPanel.tsx:49) et [`page.tsx`](apps/op1-studio/app/page.tsx:266) / [`page.tsx`](apps/op1-studio/app/page.tsx:284) injectent du SVG éditable avec `dangerouslySetInnerHTML`. La validation du créateur vérifie seulement la présence de `viewBox` et l’absence littérale de `<script` ([`DisplayCreatorPanel.tsx`](apps/op1-studio/app/components/DisplayCreatorPanel.tsx:28)).

**Impact :** un SVG importé ou collé peut contenir des attributs événementiels, des liens externes, des éléments actifs ou des variantes contournant ce contrôle. Comme l’aperçu est rendu dans le document de l’application, une charge malveillante peut devenir une XSS locale.

**Recommandation :** sanitiser avec une politique SVG allowlist stricte avant tout rendu, supprimer `script`, `foreignObject`, attributs `on*`, URLs externes et éléments non nécessaires. Idéalement rendre l’aperçu dans un `iframe sandbox` sans `allow-scripts`, et conserver le SVG original séparé du SVG nettoyé. Ajouter des tests de rejet pour `onload`, `href`, `foreignObject`, entités et SVG imbriqué.

### P1 — `postMessage` sans origine cible

**Preuve :** les deux canaux Hub utilisent `window.parent.postMessage(..., '*')` dans [`hubCommunication.ts`](apps/op1-studio/app/core/hub/hubCommunication.ts:30) et [`hubCommunication.ts`](apps/ep133-studio/src/core/hub/hubCommunication.ts:30).

**Impact :** les événements de session et leurs données peuvent être reçus par toute fenêtre qui héberge l’application. Le code ne vérifie pas non plus l’origine d’un éventuel canal entrant.

**Recommandation :** définir une liste d’origines autorisées via configuration, utiliser une origine exacte dans `postMessage`, et valider `event.origin`, `event.source`, le schéma et la taille des payloads côté réception. Éviter de journaliser des données utilisateur en production.

### P1 — Route locale de bibliothèque pilotée par un chemin arbitraire

**Preuve :** [`route.ts`](apps/op1-studio/app/api/display-library/route.ts:22) accepte `root` depuis la requête et construit `path.resolve(root, "images", "original")` ([`route.ts`](apps/op1-studio/app/api/display-library/route.ts:25)).

**Impact :** le serveur local lit des SVG depuis tout dossier accessible qui respecte cette structure. Dans un usage strictement local, le risque est limité, mais une exposition réseau du serveur ou une page malveillante peut tenter de sonder des répertoires et d’exfiltrer leur contenu.

**Recommandation :** ne jamais accepter un chemin absolu libre depuis le navigateur. Stocker le coffre sélectionné côté bridge/Tauri, vérifier qu’il est sous un répertoire autorisé, limiter la taille et le nombre de fichiers, et désactiver cette route hors développement local.

### P1 — Package `midi-analysis` incomplet et non suivi

**Preuve :** [`packages/midi-analysis/package.json`](packages/midi-analysis/package.json:1) est actuellement non suivi par Git (`git status` le signale `??`), déclare `vitest` mais ne contient aucun fichier `*.test.*`.

**Impact :** le package peut disparaître d’un commit ou casser `test:all` avec « No test files found ». Son contrat public n’est pas protégé par des tests.

**Recommandation :** décider s’il doit être livré : le versionner avec son code source et des tests minimaux, ou le supprimer du workspace tant qu’il est expérimental. Utiliser `vitest --passWithNoTests` uniquement si l’absence de tests est intentionnelle et documentée.

### P2 — Complexité et dette de maintenance dans les écrans principaux

**Preuve :** `apps/ep133-studio/src/App.tsx` approche 2 000 lignes et `apps/op1-studio/app/page.tsx` dépasse 1 400 lignes. Le lint OP‑1 remonte 23 avertissements de variables/composants inutilisés et une erreur bloquante.

**Impact :** forte charge cognitive, régressions plus probables, tests unitaires difficiles à cibler et évolution lente des fonctionnalités audio/MIDI.

**Recommandation :** extraire par domaines : navigation, persistance, transport, projet, profil, audio, pont machine et composants de page. Supprimer les branches mortes ou les marquer explicitement comme fonctionnalités à venir. Activer progressivement `noUnusedLocals`/règles lint sans avertissements tolérés.

### P2 — Bundle EP‑133 trop concentré

**Preuve :** le build produit un chunk principal d’environ 733 kB et un chunk WAV d’environ 2,0 MB, avec avertissement Vite/Rolldown sur les chunks > 500 kB.

**Impact :** démarrage plus lent, coût réseau et mémoire plus élevés, surtout sur appareil mobile ou matériel embarqué.

**Recommandation :** charger dynamiquement les outils WAV, l’éditeur avancé et les écrans rarement utilisés. Mesurer LCP, temps d’interactivité et mémoire avant/après ; ne pas simplement augmenter la limite d’avertissement.

## 5. Points positifs

- Les builds des deux applications passent.
- Les tests métier EP‑133 couvrent des zones importantes : MIDI, exports, WAV, conversion et profils.
- Les tests Node OP‑1 passent sur rendu, audio, import MIDI et conversion.
- Les packages ont une séparation métier raisonnable et aucun cycle de dépendances interne n’a été détecté.
- Le bridge Rust désactive explicitement l’écriture firmware (`firmware_writes_enabled: false`) et les opérations sensibles sont modélisées comme des plans nécessitant confirmation.
- Les écritures de profil/clavier utilisent des fichiers temporaires et des validations de schéma côté Rust.
- Les contrôles de chemin et d’archives côté outils Python montrent une attention réelle aux traversées de répertoires ; ils doivent néanmoins être intégrés à une exécution CI.

## 6. Plan d’action recommandé

### Immédiat

1. Corriger la stratégie des scripts workspace et rendre `build`, `test`, `typecheck`, `lint` déterministes.
2. Régler la compatibilité TypeScript 7 ou pinner la version réellement supportée.
3. Neutraliser le rendu SVG non sanitizé et remplacer `postMessage('*')` par une origine configurée.
4. Décider du statut Git et de la couverture de `packages/midi-analysis`.

### Court terme

1. Installer pytest dans l’environnement de développement/CI et intégrer les tests Python au pipeline.
2. Ajouter une CI avec installation propre, typecheck, lint, tests unitaires, tests Node/Python et builds des deux apps.
3. Ajouter des tests de sécurité sur SVG, messages inter-fenêtres et routes locales.
4. Découper les gros composants et supprimer les avertissements lint.

### Moyen terme

1. Mettre en place le code splitting EP‑133 et des budgets de bundle.
2. Produire un rapport de dépendances verrouillé avec `npm audit` en CI, lorsque le registre est accessible.
3. Documenter clairement les composants expérimentaux, les bridges locaux et les limites du mode web/desktop.

## 7. Conclusion

Le socle fonctionnel est solide et les chemins métier principaux sont déjà testés. Le projet doit maintenant investir dans la fiabilité de la validation et dans le durcissement des frontières d’exécution locales. Les quatre corrections prioritaires sont : pipeline monorepo, TypeScript, sanitation SVG et sécurité `postMessage`. Une fois ces points traités, l’audit pourrait être requalifié avec un niveau de confiance nettement supérieur.

## 8. Corrections appliquées après l’audit initial

- Les commandes `build:all`, `test:all` et `lint:all` ne tentent plus d’exécuter des scripts inexistants dans tous les packages.
- `test:all` s’exécute en mode non interactif ; `midi-analysis` tolère temporairement l’absence de tests.
- L’alias TypeScript racine n’utilise plus `baseUrl`, supprimé par TypeScript 7.
- Les aperçus SVG OP‑1 passent par une sanitation allowlist avant insertion dans le DOM.
- Les deux canaux Hub utilisent `VITE_HUB_ORIGIN` ou, à défaut, l’origine courante au lieu de `*`.

## 9. Relecture du travail des agents — 16 août 2026

Les rapports d’agents présentent le projet comme un monorepo unifié et prêt
pour la production. La vérification de l’état réel nuance cette conclusion :

- le dépôt parent référence encore `apps/op1-studio` et `apps/ep133-studio` comme
  gitlinks (`160000`) sans `.gitmodules` ; les fichiers locaux présents dans
  ces dossiers ne sont donc pas suivis normalement par le dépôt parent ;
- les builds et tests passent, mais OP-1 ne possède pas de script `typecheck`
  propre et les rapports de statut sont partiellement obsolètes ;
- les packages partagés audio et instrument sont surtout une fondation : les
  applications continuent d’avoir leurs propres parseurs/converters audio ;
- l’interface OP-1 contient encore des composants préparatoires et des branches
  mortes listés dans `AUDIT_CODE_MORT_2026-08-16.md` ;
- la passation EP-133 reste la source la plus fiable pour les limites produit :
  MIDI matériel, score réel et compatibilité d’archives ne sont pas validés.

Une reprise de l’éditeur de samples a été ajoutée dans le parcours Sons :
import local WAV/AIFF, forme d’onde, modes Synth/Drum/Tape, sélection temporelle,
fondus, contrôle de durée et export AIFF mono 44,1 kHz/16 bits sans écriture
machine. Cette brique est compilée mais doit encore recevoir un test navigateur
avec un vrai fichier audio et une validation hardware séparée.

Après ces corrections, `build:all`, `test:all`, `typecheck:all` et `lint:all` passent. Le lint OP‑1 conserve 23 avertissements non bloquants, principalement du code mort identifié dans [l’audit dédié](AUDIT_CODE_MORT_2026-08-16.md), ainsi que deux recommandations de performance sur des balises `<img>`.
