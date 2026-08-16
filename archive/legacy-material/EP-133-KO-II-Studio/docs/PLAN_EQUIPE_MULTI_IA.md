# Plan d’équipe multi‑IA — EP-133 KO II Studio

## 1. Objectif

Accélérer le développement de l’EP-133 KO II Studio en faisant travailler
plusieurs assistants IA sur le même projet, avec des responsabilités séparées,
des branches Git indépendantes et une validation finale contrôlée.

Le but n’est pas de laisser trois IA modifier les mêmes fichiers au hasard.
Le but est de créer une petite équipe logicielle : un coordinateur, un
constructeur, un analyste et une procédure d’intégration.

## 2. Répartition des rôles

### GPT / Codex — coordinateur et intégrateur

- lit `PROJECT_CONTEXT.md`, `AGENTS.md` et `docs/ROADMAP.md` ;
- transforme une idée en tâche précise ;
- choisit les fichiers concernés ;
- répartit le travail entre les autres assistants ;
- relit les résultats et tranche les contradictions ;
- lance les tests, le build et les validations matérielles ;
- intègre les changements et publie la branche.

Codex est le seul rôle autorisé à déclarer une fonctionnalité terminée.

### Claude — constructeur et refactoriseur

- implémente les tâches de code clairement définies ;
- travaille dans une branche ou un worktree dédié ;
- propose des composants, fonctions et tests ;
- ne modifie pas la feuille de route pour déclarer son propre travail terminé ;
- rend un résumé des fichiers changés, des choix et des limites.

### Gemini — analyste et contrôleur qualité

- analyse le code existant et la documentation externe ;
- cherche les cas limites, les régressions et les incohérences ;
- prépare des tests ou des scénarios navigateur ;
- compare le comportement avec la documentation officielle de l’EP-133 ;
- ne modifie pas le code principal sans mission explicite ;
- distingue toujours navigateur simulé et machine EP-133 réelle.

## 3. Organisation Git

Le dépôt canonique reste `EP-133-KO-II-Studio`. Chaque assistant travaille
dans une branche distincte :

```text
main
 ├── agent/codex-integration
 ├── agent/claude-implementation
 └── agent/gemini-audit
```

Pour les travaux parallèles lourds, utiliser des worktrees :

```bash
git worktree add ../ep133-claude agent/claude-implementation
git worktree add ../ep133-gemini agent/gemini-audit
```

Règles :

- une tâche = une branche ;
- un fichier ne doit pas être modifié par deux IA en parallèle ;
- aucun `git reset --hard` ;
- chaque branche doit passer les tests pertinents ;
- l’intégration se fait par commit relu, cherry-pick ou pull request ;
- le commit final doit expliquer ce qui a été validé et ce qui reste ouvert.

## 4. Documents de coordination

| Document | Fonction |
|---|---|
| `AGENTS.md` | règles permanentes du dépôt |
| `PROJECT_CONTEXT.md` | contexte produit et contraintes historiques |
| `docs/ROADMAP.md` | priorités et état général |
| `docs/AI_WORKLOG.md` | journal des missions entre assistants |
| `docs/A_VALIDER_PHYSIQUEMENT.md` | preuves encore nécessaires sur l’EP-133 |
| `docs/REGISTRE_IDEES.md` | idées, décisions et éléments reportés |

Chaque mission doit préciser : objectif, fichiers autorisés, preuves attendues,
tests à lancer et limites connues.

## 5. Cycle de travail

### Étape A — cadrage

Codex écrit une fiche courte :

```text
Mission :
Objectif utilisateur :
Fichiers autorisés :
Hors périmètre :
Validation attendue :
Risque matériel :
```

### Étape B — analyse indépendante

Gemini ou Claude lit le dépôt et propose une solution. À ce stade, aucune
modification importante n’est intégrée automatiquement.

### Étape C — implémentation

Claude ou Codex code dans sa branche. Les changements restent réversibles et
les fichiers hors mission sont préservés.

### Étape D — contrôle

Gemini relit le diff, cherche les oublis et ajoute si nécessaire un test ciblé.
La machine réelle n’est jamais remplacée par une simulation dans un rapport.

### Étape E — intégration

Codex compare les propositions, résout les conflits, lance :

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Puis Codex met à jour la feuille de route et indique clairement les parties
validées dans le navigateur, sur un pont local ou sur un EP-133 réel.

## 6. Répartition par type de tâche

| Tâche | Responsable principal | Contrôle |
|---|---|---|
| Interface React et grille Studio | Claude | Codex + test navigateur |
| Protocole MIDI/SysEx | Codex | Gemini + capture réelle |
| Documentation et guides | Gemini | Codex |
| Tests unitaires et E2E | Gemini | Codex |
| Écriture machine | Codex uniquement | checkpoint + relecture réelle |
| Design et ergonomie | Claude | utilisateur |
| Roadmap et décisions | Codex | utilisateur |

## 7. Règles de sécurité

- aucun SysEx inconnu envoyé à la machine ;
- lecture seule par défaut ;
- checkpoint avant toute écriture ;
- cible matérielle affichée explicitement ;
- relecture et comparaison après écriture ;
- aucune suppression, DFU ou formatage dans un workflow IA automatique ;
- les samples de l’utilisateur restent locaux et ne sont pas redistribués ;
- une IA ne peut pas transformer une hypothèse en validation.

## 8. Première version pratique

Pour démarrer sans complexité :

1. garder ce dépôt comme espace commun ;
2. utiliser Codex comme coordinateur ;
3. ouvrir Claude dans un worktree de développement ;
4. utiliser Gemini pour les audits et comptes rendus ;
5. conserver toutes les décisions dans `docs/AI_WORKLOG.md` ;
6. fusionner uniquement les commits vérifiés.

Cette organisation pourra évoluer vers un orchestrateur automatique, mais la
validation humaine et Git doivent rester les garde-fous principaux.
