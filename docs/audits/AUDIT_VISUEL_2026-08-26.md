# Audit visuel — Engineering Studio

Périmètre : branche `main`, commit de départ
`c86e5fddda499259fc78ee4233a62338f804c7f7`.

## Verdict

L'accueil et le Hub ont déjà une identité solide : papier technique, grille,
noir, orange, jaune acide, photographies machine et ombres franches. Le défaut
principal apparaît après l'entrée dans les outils : plusieurs systèmes visuels
coexistent et donnent l'impression de changer de logiciel.

La priorité n'est pas d'ajouter des effets. Il faut partager une même ossature,
réduire le texte, clarifier la hiérarchie et rendre le thème sombre réellement
lisible.

## Problèmes principaux

1. `styles.css` dépasse 4 300 lignes et contient plus de 300 couleurs
   hexadécimales distinctes.
2. Le rack audio, le MIDI, la bibliothèque et les jeux utilisent des palettes,
   rayons, densités et composants différents.
3. Plusieurs textes techniques descendent entre 8 et 10 px.
4. La TopBar n'avait pas de menu mobile réellement rendu.
5. Une ancienne règle responsive globale masque les éléments `nav` sous
   900 px et peut toucher des onglets locaux.
6. Les emojis portent trop souvent le rôle d'icône principale.
7. Les actions sûres et dangereuses ne sont pas toujours assez séparées.
8. Certaines pages utilisent encore beaucoup de styles en ligne, notamment
   `RhythmHero.tsx`.

## Décision prise

Deux thèmes, un seul design system :

- **Atelier**, clair et mécanique ;
- **Studio**, sombre et contrasté.

La spécification complète est dans
[`docs/design/DESIGN_SYSTEM.md`](../design/DESIGN_SYSTEM.md).

L'étude est transformée en plan exécutable dans :

- [`UI_ROADMAP.md`](../design/UI_ROADMAP.md) : phases, tickets, dépendances et
  critères de fin ;
- [`UI_DEVELOPMENT_PLAYBOOK.md`](../design/UI_DEVELOPMENT_PLAYBOOK.md) : règles
  obligatoires pour développeurs et agents IA ;
- [`UI_PAGE_SPEC_TEMPLATE.md`](../design/UI_PAGE_SPEC_TEMPLATE.md) : trame de
  spécification pour chaque écran.

## Première passe livrée

- tokens Atelier / Studio centralisés ;
- thème persistant uniquement en local ;
- bouton de thème accessible dans la TopBar ;
- menu mobile réel et état ouvert/fermé ;
- focus clavier commun ;
- contraste sombre corrigé sur le shell, l'accueil, le Hub, la bibliothèque,
  le MIDI, les sauvegardes et le profil ;
- consoles audio conservées sombres, avec texte et contrôles renforcés ;
- état actif corrigé pour la bibliothèque sonore ;
- documentation du système visuel et test du contrat des deux thèmes.

## Ordre de migration restant

1. Extraire les composants communs `Button`, `Card`, `Badge`, `Tabs` et
   `EmptyState`.
2. Compacter l'accueil et le Hub sans perdre les deux machines.
3. Finaliser les états scan / sauvegarde / restauration.
4. Recomposer le rack audio avec modules repliables et inspecteur contextuel.
5. Recomposer le MIDI autour d'un transport central et isoler `PANIC`.
6. Organiser la bibliothèque en OP-1 / EP-133 × machine / personnel.
7. Fusionner les jeux dans un `Training Lab` commun.
8. Simplifier le profil en trois étapes obligatoires et réglages avancés.
9. Structurer l'éditeur d'image comme un éditeur traditionnel 320 × 160.

Les identifiants de tickets, fichiers concernés, dépendances et critères de fin
sont maintenus dans `UI_ROADMAP.md`. Cette roadmap est la source d'exécution ;
la liste ci-dessus reste le résumé de lecture.

## Contrôle qualité

- TypeScript : réussi.
- Tests : 52 fichiers, 1 047 tests réussis après intégration du dernier `main`.
- Build Vite de production : réussi.
- Inspection Figma : en attente d'un lien de nœud précis contenant `node-id`.
