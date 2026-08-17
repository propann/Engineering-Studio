# Revue du travail des autres IA — Studio Hub

Date : 16 août 2026  
Périmètre : branches Git, historique, passations, applications OP-1 / EP-133, packages et validation locale.

## Conclusion

Le travail des autres IA a bien produit un socle technique conséquent : monorepo, modernisation OP-1, enrichissement EP-133, packages partagés, adaptateurs machines, moteurs de jeux et tests unitaires.

En revanche, la mention « production ready » de la Phase 4 est trop large. Les nouvelles briques sont principalement testées entre elles ; elles ne sont pas encore branchées dans les écrans réels du Hub, d’OP-1 ou d’EP-133. Il faut donc les considérer comme une bibliothèque expérimentale / fondation, pas comme des fonctionnalités utilisateur livrées.

## Ce qui a été trouvé

### 1. Branches et travail non intégré

Les branches suivantes existent :

- `consolidation/phase-3-complete`
- `docs-and-config-module`
- `ep133-studio-module`
- `op1-studio-module`
- `shared-packages-module`
- `master`
- `phase4/adaptive-framework` (branche courante)

Les cinq branches « module » sont des pointeurs de coordination. Leur dernier commit est un commit descriptif sans changement de fichiers (`0 changed paths`). Il n’y a donc pas de fonctionnalité cachée à récupérer par un merge de ces branches : leur contenu a déjà été repris dans l’historique commun ou dans la branche Phase 4.

Un seul worktree est actif et aucun journal exploitable n’est présent dans `.agents` ou `.codex`.

### 2. Contributions utiles

- OP-1 : architecture `app/core`, stores Zustand, abstraction Tauri / File System Access et hook Web MIDI. La passation OP-1 décrit correctement cette partie comme une migration encore partielle.
- EP-133 : moteur de jeu, transport MIDI, analyse/conversion WAV, AIFF, éditeur de patterns, sauvegarde locale, lecture de projets et outils de scan/export.
- Packages : configuration adaptative, feature flags, gestion des ressources, profils machines, adaptateurs OP-1 / EP-133, jeux rythme / puzzle / platformer, création et sauvegarde centralisées.
- Documentation : roadmaps, passations et rapports nombreux ; la passation EP-133 contient des limites matérielles importantes à conserver.

### 3. Validation réellement obtenue

La validation locale exécutée le 16 août réussit :

- `npm run typecheck:all`
- `npm run test:all`
- `npm run build:all`
- `git diff --check`

Les tests des packages, les checks métier EP-133 et les 5 tests Node OP-1 passent. Le build EP-133 conserve un avertissement de bundle important : environ 715 kB pour le bundle principal et 2,0 MB pour le module WAV.

## Écarts et risques

### P0 — Les packages Phase 4 ne sont pas utilisés par les applications

La recherche des imports dans `apps/` ne trouve aucun usage des packages Phase 4 (`instrument-*`, `game-*`, `save-manager`, `creation-center`, `interface-adapters`, etc.). Les références sont présentes dans les packages eux-mêmes et dans leurs tests, mais pas dans le Hub, OP-1 ou EP-133.

Conséquence : les tests prouvent que les bibliothèques peuvent fonctionner ensemble, pas que le produit les utilise réellement.

Action : choisir deux intégrations visibles et les brancher explicitement :

1. le Hub utilise `save-manager` pour le coffre et les sauvegardes sélectives ;
2. EP-133 utilise `instrument-ep133` / `game-rhythm` sur un parcours réel ;
3. OP-1 utilise `instrument-op1` ou garde une justification documentée de son chemin autonome.

### P0 — Les applications sont enregistrées comme gitlinks

`git ls-files -s` indique le mode `160000` pour `apps/op1-studio` et `apps/ep133-studio`, sans `.gitmodules` et sans dépôt Git interne présent dans les dossiers. Le dépôt parent versionne donc un pointeur de commit, pas directement les fichiers applicatifs.

Conséquence : une modification faite dans ces dossiers peut ne pas apparaître dans le diff du dépôt parent et peut disparaître lors d’un clone propre.

Action : décider explicitement entre :

- de vrais sous-modules correctement déclarés et publiables ;
- ou des dossiers normaux suivis par le dépôt `studio-hub`.

Pour l’objectif utilisateur d’un dépôt unique, les dossiers normaux sont la voie la plus cohérente.

### P1 — `midi-analysis` est un workspace vide — résolu

Le workspace vide a été retiré du dépôt et sa référence extraneous a été
supprimée du `package-lock.json`. L’API MIDI réellement utilisée et testée
est désormais `@studio-hub/midi-bridge`.

### P1 — Packages de tests présentés comme packages runtime

`game-integration` et `performance-benchmarks` contiennent principalement des tests et aucun code de production. Ils sont utiles comme harnais de validation, mais ne doivent pas être comptés comme bibliothèques runtime dans une présentation produit.

### P1 — Passations contradictoires selon leur date — résolu

La passation OP-1 du 15 août annonce encore une migration à 40 % avec plusieurs stores et tests à faire, tandis que les rapports Phase 4 annoncent une plateforme prête pour la production. La passation EP-133 rappelle aussi que certaines compatibilités matérielles restent à valider sur machine réelle.

Action réalisée : [`STATUS_CURRENT.md`](../STATUS_CURRENT.md) sépare livré,
testé en logiciel, preuves matérielles documentées et prochaines portes.

### Mise à jour après intégration

La branche `integration/studio-hub` a depuis transformé les applications en
dossiers suivis dans le monorepo, centralisé l’état dans
[`ROADMAP_ACTIVE_2026-08-16.md`](ROADMAP_ACTIVE_2026-08-16.md) et ajouté 6
scénarios E2E Hub. Les paragraphes ci-dessous décrivant les gitlinks et
l’absence de raccord navigateur sont donc historiques ; ils restent conservés
comme constat de l’audit initial, mais ne constituent plus une action à
réexécuter.

### P1 — Sécurité des communications Hub / studios — résolu sur la branche d’intégration

Les hooks de démarrage OP-1 et EP-133 valident désormais `event.origin`,
`event.source` et le schéma de chaque message de transport, note et PANIC. Le
Hub envoie ses messages avec l’origine de la fenêtre cible, et l’exemple de
navigation EP-133 n’utilise plus `'*'`.

Validation : le scénario E2E sans machine injecte des messages MIDI valides
depuis `http://evil.invalid`, avec une mauvaise fenêtre source et avec un
schéma invalide, dans les deux studios ; aucun événement note ou PANIC n’est
relayé.

### P2 — Dette de structure

Les applications principales restent concentrées dans de gros fichiers (`App.tsx` EP-133 et `page.tsx` OP-1). Les fonctionnalités sont riches, mais l’extraction progressive des domaines (Hub, MIDI, sauvegarde, éditeur, machine) réduira le risque de régression.

## Verdict

Le travail des autres IA est récupérable et globalement utile. Rien n’indique une branche oubliée contenant une meilleure version prête à fusionner. Le vrai chantier restant n’est pas de chercher un autre commit : c’est de raccorder les packages déjà créés au produit, de clarifier le statut des applications gitlinkées et de maintenir une validation honnête séparant tests logiciels et essais sur machine réelle.

Priorité recommandée : sécuriser le modèle Git, puis intégrer une première brique `save-manager` dans le coffre du Hub et une première brique `instrument-ep133` dans le studio EP-133 avec un test utilisateur de bout en bout.
