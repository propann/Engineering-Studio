# Livraison UI — 26 août 2026

## Livré

- bibliothèque fondamentale dans `apps/studio-hub/src/ui/` ;
- tokens communs pour états, espacements, rayons, typographie et overlays ;
- tests de la TopBar et des contrastes Atelier / Studio ;
- accueil compact : deux machines, trois garanties et cinq accès directs ;
- Hub raccordé à `AppShell`, `PageHeader` et `Card` ;
- Backup Lab raccordé au shell commun avec état du dossier et véritable état
  vide ;
- Bibliothèque sonore avec `Tabs` clavier et état du dossier ;
- page MIDI, Training Lab, Rack audio, Profil et Éditeur d'image raccordés au
  shell commun ;
- suppression des faux choix Google Drive et Dropbox du Profil ;
- suppression de `styles/maquette-design.css`, non importé et porteur du
  sélecteur global `nav` ainsi que de tokens invalides.

## Préservé

- logique audio et moteurs du Rack ;
- routage et transport MIDI ;
- lecture, scan, hachage, sauvegarde et restauration ;
- stockage local et permissions du dossier ;
- routes existantes des 21 pages.

## Validations

- TypeScript strict ;
- 55 fichiers de tests, 1 057 tests ;
- build Vite de production ;
- vérification des contrastes principaux WCAG AA ;
- `git diff --check`.

## Reste à fermer

- détailler la machine à états de restauration et sa double confirmation ;
- terminer la hiérarchie interne du Rack en trois zones ;
- remplacer les derniers styles statiques en ligne des pages historiques ;
- terminer le parcours Profil en trois étapes courtes ;
- produire la matrice de captures aux quatre largeurs dans les deux thèmes ;
- comparer au Figma dès réception d'un lien de frame contenant `node-id`.
