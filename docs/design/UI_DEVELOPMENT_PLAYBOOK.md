# Manuel de développement UI — Engineering Studio

Ce document est le contrat de travail pour tout développeur ou agent IA qui
modifie l'interface. Il complète
[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) et
[`UI_ROADMAP.md`](UI_ROADMAP.md).

## 1. Hiérarchie des décisions

En cas de doute, appliquer cet ordre :

1. sécurité des fichiers et des machines ;
2. fonction réelle ;
3. compréhension de l'état ;
4. accessibilité et responsive ;
5. cohérence du design system ;
6. décoration.

Une décoration ne justifie jamais de masquer une limite, simuler une fonction
ou réduire la lisibilité.

## 2. Interdictions

- Pas de troisième thème.
- Pas de nouvelle palette locale à une page.
- Pas de faux cloud, faux compte, faux scan ou faux état connecté.
- Pas d'action d'écriture machine présentée comme sûre avant validation.
- Pas de composant copié si un rôle commun existe déjà.
- Pas de texte fonctionnel sous 12 px.
- Pas d'emoji comme seule icône ou seul libellé.
- Pas de `style={{...}}` pour une valeur statique.
- Pas de nouveau `!important` sans commentaire expliquant la collision.
- Pas de sélecteur global d'élément (`nav`, `button`, `main`) dans une feuille
  de page.
- Pas de suppression CSS sans recherche de tous les consommateurs.
- Pas de push si typecheck, tests ou build échouent.

## 3. Avant de coder

### Étape A — comprendre la fonction

Répondre par écrit :

- Quelle tâche réelle l'utilisateur accomplit-il ?
- Quelles données sont lues ?
- Quelles données peuvent être écrites ou détruites ?
- Quel périphérique ou droit navigateur est nécessaire ?
- Quels sont les états vide, chargement, succès, erreur et permission perdue ?

### Étape B — inventorier l'existant

Chercher avec `rg` :

- composant équivalent ;
- classe et token existants ;
- route et tests qui consomment la page ;
- documentation métier ;
- comportement partagé dans OP-1 Studio ou EP-133 Studio.

Réutiliser avant d'extraire ; extraire avant de recréer.

### Étape C — définir le périmètre

Un ticket UI doit nommer : fichiers touchés, fichiers explicitement exclus,
états couverts, largeurs testées et critères de fin.

## 4. Structure recommandée

```text
apps/studio-hub/src/
├── components/          composants métier partagés
├── core/                état, stockage, MIDI, audio, thème
├── pages/               assemblage des écrans
├── ui/                  composants visuels fondamentaux
│   ├── AppShell.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   ├── StatusBadge.tsx
│   └── Tabs.tsx
├── styles/              tokens spécialisés documentés
└── themes.css           tokens Atelier / Studio et migration
```

Une page orchestre. Elle ne doit pas contenir un nouveau mini design system.

## 5. Utiliser les thèmes

Les couleurs passent par les variables `--ui-*` définies dans `themes.css`.

```css
.example-panel {
  color: var(--ui-text);
  background: var(--ui-panel);
  border: 2px solid var(--ui-border);
  box-shadow: 4px 4px 0 var(--ui-shadow);
}
```

Un accent machine est autorisé :

```css
.machine-card[data-machine="op1"] { --machine-accent: var(--ui-orange); }
.machine-card[data-machine="ep133"] { --machine-accent: var(--ui-blue); }
```

L'accent ne redéfinit ni le fond, ni la typographie, ni la géométrie.

## 6. Concevoir un composant

Chaque composant doit avoir :

- un nom lié à son rôle, pas à sa couleur ;
- une API minimale et typée ;
- un état disabled réel ;
- un focus visible ;
- un label accessible ;
- un comportement documenté sur mobile ;
- les deux thèmes sans prop `darkMode` locale.

### Bouton

Le texte commence par un verbe : `Scanner`, `Sauvegarder`, `Restaurer`. Une
action dangereuse ne partage ni couleur ni position avec l'action principale.

### Carte

Une carte informative ne reçoit pas de curseur pointer. Une carte cliquable ne
contient pas plusieurs actions concurrentes sur toute sa surface.

### Onglets

Les onglets changent de vue, pas de page. Une navigation vers une autre page
utilise la navigation principale.

### Dialogue

Le titre décrit l'action. Le corps décrit la conséquence. `Annuler` reste
visible et reçoit le focus le plus sûr si l'action est dangereuse.

## 7. États obligatoires

Pour tout module asynchrone ou matériel :

| État | Question à laquelle l'écran répond |
| --- | --- |
| Vide | Que manque-t-il ? |
| Permission | Quel droit et pourquoi ? |
| Déconnecté | Quelle machine ou quel dossier ? |
| Chargement | Quelle opération est en cours ? |
| Prêt | Qu'est-ce qui sera traité ? |
| Succès | Qu'est-ce qui a été produit et où ? |
| Erreur | Qu'est-ce qui a échoué et que faire ? |
| Danger | Qu'est-ce qui peut être écrasé ou perdu ? |

Ne pas afficher `Prêt` si le système possède seulement une configuration
mémorisée sans permission active.

## 8. Responsive

Concevoir d'abord la hiérarchie, pas des valeurs de largeur isolées.

- `1600 px` : espace professionnel complet ;
- `1280 px` : ordinateur portable ;
- `768 px` : tablette, panneaux en tiroirs ;
- `360 px` : une colonne, actions critiques toujours visibles.

Interdit : réduire toute l'interface jusqu'à rendre le texte minuscule. Quand
l'espace manque, replier, déplacer ou séquencer.

## 9. Accessibilité

- Ordre de tabulation identique à l'ordre visuel.
- `Enter` et `Space` activent les contrôles attendus.
- `Escape` ferme menus, tiroirs et dialogues non bloquants.
- Toute icône a un nom accessible.
- Les statuts dynamiques importants utilisent une live region adaptée.
- Le contraste vise WCAG AA au minimum.
- Les animations respectent `prefers-reduced-motion`.
- La couleur ne porte jamais seule le sens.

## 10. Pages musicales denses

La densité doit suivre trois niveaux :

1. transport et état global ;
2. tâche active ;
3. réglages avancés repliables.

Une valeur audio ou MIDI peut utiliser le monospace. Une explication, un titre
ou une procédure utilise la police de lecture. Les vumètres et graphes ne
remplacent pas les valeurs utiles.

## 11. Figma vers code

Quand un écran Figma existe :

1. demander un lien de nœud contenant `node-id` ;
2. récupérer contexte, capture, annotations, tokens et assets ;
3. comparer aux composants existants ;
4. mapper vers les tokens Engineering Studio ;
5. réutiliser les composants avant d'écrire du JSX ;
6. conserver les vrais assets Figma, sans redessiner une icône à la main ;
7. vérifier les deux thèmes et les quatre largeurs ;
8. documenter tout écart volontaire.

Le code de référence généré par Figma n'est jamais copié tel quel. Le dépôt et
son design system restent la source d'implémentation.

## 12. Procédure de validation

### Contrôle statique

```bash
pnpm typecheck
pnpm test -- --run
pnpm build
git diff --check
```

### Contrôle visuel

Pour chaque page touchée :

- Atelier et Studio ;
- 360, 768, 1280 et 1600 px ;
- repos, focus, hover, disabled ;
- vide, chargement, erreur, succès ;
- menu ouvert, dialogue ouvert ou tiroir ouvert si présent.

### Contrôle fonctionnel

- aucune route perdue ;
- aucun gestionnaire MIDI remplacé ;
- aucune permission demandée hors geste utilisateur ;
- aucune écriture machine ajoutée implicitement ;
- fichiers produits dans le dossier annoncé ;
- retour navigateur et fermeture cohérents.

## 13. Format de compte rendu

Tout changement UI important doit laisser :

1. ce qui a changé ;
2. ce qui n'a pas changé ;
3. tests exécutés ;
4. limites ou validations physiques restantes ;
5. capture ou URL de contrôle quand disponible ;
6. mise à jour de la roadmap si un contrat évolue.

## 14. Ordre de mission pour un agent IA

Copier ce bloc dans toute mission UI :

> Respecte `docs/design/DESIGN_SYSTEM.md`,
> `docs/design/UI_ROADMAP.md` et
> `docs/design/UI_DEVELOPMENT_PLAYBOOK.md`. Inspecte d'abord le code et les
> tests. Réutilise les composants et tokens existants. N'invente aucune
> fonction cloud ni aucun état connecté. Préserve la logique audio, MIDI,
> fichier et sauvegarde. Implémente les deux thèmes, les états pertinents, le
> clavier et le responsive. Ne pousse rien tant que typecheck, tests, build et
> contrôle visuel n'ont pas réussi. Documente clairement toute limite restante.
