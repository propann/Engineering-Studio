# Engineering Studio — système visuel

Date de référence : 26 août 2026

## Principe

Engineering Studio utilise une seule structure visuelle et deux thèmes. Les
machines gardent leurs accents propres, mais les composants, espacements,
états et règles responsive restent identiques partout.

- **Atelier** : thème clair par défaut, inspiré du papier technique, de LEGO et
  du matériel Teenage Engineering.
- **Studio** : thème sombre à contraste renforcé pour les longues sessions et
  les outils audio denses.

Le choix est enregistré localement dans le navigateur sous la clé
`engineering-studio-theme`. Aucun compte ni service distant n'est nécessaire.

## Tokens communs

| Rôle | Atelier | Studio | Usage |
| --- | --- | --- | --- |
| Fond | `#EBECE6` | `#0F120F` | Pages et shell |
| Panneau | `#FFFFFF` | `#1B1F1B` | Cartes et modules |
| Panneau secondaire | `#DFE1DA` | `#242924` | Contrôles et zones internes |
| Texte | `#111311` | `#F4F5EF` | Titres et contenu |
| Texte secondaire | `#5C635A` | `#B2BAAF` | Aides et métadonnées |
| Bordure | `#111311` | `#747D72` | Géométrie principale |
| Orange | `#FF5A1F` | `#FF704C` | OP-1 et action primaire |
| Acide | `#D9FF43` | `#D9FF43` | Sélection, prêt, progression |
| Bleu | `#4AA7FF` | `#68B8FF` | MIDI, information et focus |
| Danger | `#C81E3A` | `#FF7188` | Erreur, PANIC et restauration |

Les tokens applicatifs vivent dans `apps/studio-hub/src/themes.css`. Ne pas
ajouter une couleur brute dans un nouveau composant si un rôle existant la
couvre déjà.

## Géométrie

- Grille d'espacement : `8 / 16 / 24 / 32 px`.
- Rayon ordinaire : `4 à 8 px`.
- Ombre : décalage franc de `2 à 6 px`, sans halo SaaS.
- Zone tactile : `44 × 44 px` pour les actions principales et mobiles.
- Texte fonctionnel : minimum `12 px`; base recommandée `14 px`.
- Le monospace est réservé aux valeurs, codes, états et labels techniques.

## Shell

Toutes les pages publiques utilisent `TopBar` et le même ordre visuel :

1. marque et retour à l'accueil ;
2. accès machines et outils ;
3. action de page éventuelle ;
4. choix Atelier / Studio ;
5. profil local.

Sous `1180 px`, les raccourcis passent dans un menu. Sous `760 px`, le profil
et les actions secondaires quittent la barre et restent accessibles dans le
menu.

## Composants à partager

La migration doit converger vers ces rôles :

- `AppShell` : TopBar, fond, largeur, titre, retour et zone d'état ;
- `Button` : primary, secondary, ghost, danger, icon-only, loading, disabled ;
- `Card` : machine, outil, module et statistique ;
- `StatusBadge` : prêt, test, hors ligne, lecture seule, danger ;
- `MachineCard` : image, connexion, mémoire, dernière action et CTA ;
- `RackModule` : titre, bypass, aide, contenu et mesure ;
- `Tabs` : machine, bibliothèque, mode ou vue ;
- `EmptyState` : cause, conséquence, action et aide ;
- `ConfirmDialog` : résumé, risque, sauvegarde préalable et confirmation.

## Accessibilité

- Tout élément interactif possède un focus visible bleu.
- Aucun état ne dépend uniquement de la couleur ou d'un emoji.
- Les libellés restent présents pour les boutons icône.
- Les animations respectent `prefers-reduced-motion`.
- Les contrastes du thème Studio sont prioritaires sur les effets décoratifs.

## Règle de migration

Une page migrée ne crée pas sa propre palette. Elle consomme les tokens du
shell, conserve uniquement un accent machine et supprime ses anciennes
surcharges après validation desktop et mobile.
