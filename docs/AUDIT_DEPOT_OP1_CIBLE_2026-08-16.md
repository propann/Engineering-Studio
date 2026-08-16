# Étude du dépôt cible OP-1 Studio

Date de l’audit : 16 août 2026  
Dépôt étudié : `https://github.com/propann/OP-1-Studio.git`  
Branche distante observée : `main`  
Commit observé : `7a0a07f` — documentation alignée sur la validation MIDI réelle.

## 1. Résultat exécutif

Le dépôt cible est un vrai produit OP-1 déjà riche, et non un simple ancien prototype. Il contient :

- l’application OP-1 complète ;
- le studio quatre pistes, MIDI, exercices et bibliothèque de sons ;
- les outils firmware, images, patches, samples et sauvegardes ;
- les bridges Python et la coque Tauri ;
- une documentation technique très avancée ;
- des validations sur un OP-1 réel, notamment en mode Disk et pour le MIDI.

Il peut devenir le dépôt d’accueil du projet global, mais il ne faut pas pousser notre dépôt local par écrasement. Les deux historiques Git sont indépendants et le dépôt distant contient des corrections OP-1 plus récentes que la copie locale présente dans `apps/op1-studio`.

## 2. Validation du dépôt distant

Dans une copie temporaire propre du dépôt :

| Contrôle | Résultat |
|---|---|
| `npm ci` | OK — 507 paquets installés |
| `npm run build` | OK |
| `npm test` | OK — 31 tests Node |
| `python3 -m unittest discover -s tests -p 'test_*.py'` | OK — 42 tests Python |
| `npm run lint` | ÉCHEC — 2 erreurs, 23 avertissements |
| `npm audit` après installation | 21 vulnérabilités signalées : 1 basse, 4 modérées, 16 hautes |

Les deux erreurs de lint concernent :

1. un `setState` synchrone dans un effet de `Op1PixelEditor` ;
2. une fonction `sendMidi` utilisée avant sa déclaration dans `StudioMachinePanel`.

Les avertissements sont principalement du code non utilisé dans `page.tsx`, `StudioTapeEditor`, `StudioTrackList` et quelques recommandations d’images.

## 3. Fonctionnalités réellement présentes

Le dépôt distant est particulièrement solide sur le périmètre OP-1 :

- détection Web MIDI et mesure réelle de notes / contrôles ;
- clavier construit et procédure d’apprentissage MIDI ;
- sauvegardes locales avec manifestes SHA-256 ;
- plan de transfert et restauration avec confirmation ;
- inspection firmware en lecture seule et laboratoire de mods ;
- créateur d’images 320×160 et éditeur pixel ;
- conversion audio vers AIFF mono 44,1 kHz / 16 bits ;
- lecture de patches AIFF et préflight audio ;
- projet Studio v1, piano-roll, rendu offline, stems et Album ;
- exercices mélodie, accord, drumkit, effets et import MIDI.

La documentation distante est honnête sur les limites : l’intégration web ne déclenche pas encore tous les bridges locaux, le transfert machine complet et le cœur natif Safe Change Engine restent à terminer.

## 4. Différence avec notre dépôt local

Notre dépôt `/home/azoth/studio-hub` apporte :

- le Hub et la fiche personnage centralisée ;
- le coffre partagé OP-1 / EP-133 ;
- les sauvegardes sélectives ;
- le raccord Hub → studios ;
- les packages partagés et adaptateurs ;
- l’éditeur de samples et les raccords de profil récents ;
- l’archive des anciens projets.

Mais la copie locale `apps/op1-studio` n’est pas basée sur le dernier `main` distant. Elle contient des ajouts utiles (`core`, stores, hooks Hub, éditeur de samples, sanitation SVG), tandis que le dépôt distant contient des changements OP-1 plus récents, notamment le correctif Web MIDI et les mesures matérielles.

Conclusion : copier notre dossier local sur `main` ferait perdre ou régresserait une partie du travail OP-1 récent.

## 5. Risques avant fusion

### Historiques indépendants

Le dépôt local Studio Hub et `OP-1-Studio` n’ont pas la même racine Git. Une fusion directe produirait un conflit d’architectures et ne préserverait pas naturellement l’historique applicatif.

### Organisation actuelle différente

Le dépôt distant est centré sur OP-1 à la racine. Studio Hub est un monorepo avec `apps/`, `packages/`, `archive/` et un portail séparé.

### Version locale OP-1 en retard

Le gitlink local pointe vers une ancienne base OP-1 et ses fichiers de travail ne représentent pas les derniers commits du dépôt distant. Il faut réappliquer les raccords Hub sur la version distante actuelle, pas écraser cette version avec l’ancienne copie.

### Licence à clarifier

Le dépôt distant signale lui-même une incohérence : `LICENSE` indique MIT tandis que `package.json` et la documentation indiquent AGPL-3.0-only. Cette question doit être tranchée avant renommage, publication ou offre commerciale.

## 6. Stratégie recommandée

Ne pas pousser directement sur `main`. Préparer une branche distante dédiée, par exemple `integration/studio-hub`, depuis le `main` actuel :

1. conserver le dépôt OP-1 distant comme base de vérité pour l’OP-1 ;
2. déplacer progressivement l’application OP-1 vers `apps/op1-studio` ou décider de garder OP-1 à la racine ;
3. ajouter `apps/ep133-studio`, `apps/studio-hub` et les packages partagés ;
4. reprendre les raccords Hub sur le dernier code OP-1 distant ;
5. fusionner les roadmaps dans une documentation unique, avec une colonne séparant logiciel testé, matériel testé et restant à faire ;
6. corriger au minimum les 2 erreurs de lint avant PR ;
7. ouvrir une pull request brouillon avant tout changement de `main`.

Cette méthode conserve les validations OP-1 récentes et ajoute le Hub sans régression silencieuse.

## Verdict

Le dépôt cible est le bon endroit pour accueillir le projet global, mais il doit être traité comme la base OP-1 la plus récente, pas comme un dépôt vide. La prochaine étape sûre est une branche d’intégration depuis son `main`, suivie d’une fusion contrôlée des roadmaps, de la documentation et des applications.

Aucun push n’a été effectué pendant cet audit.
