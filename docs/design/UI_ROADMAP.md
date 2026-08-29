# Feuille de route UI — Engineering Studio

> **Lot spécialisé.** La feuille de route principale est [`docs/ROADMAP.md`](../ROADMAP.md) ;
> ce document en détaille le lot Interface. En cas de contradiction, la principale gagne.


Version : 1.0 — 26 août 2026  
Responsable documentaire : Codex  
Branche de livraison : `main`

## Objectif final

Faire d'Engineering Studio un seul produit visuel, utilisable en thèmes
**Atelier** et **Studio**, tout en conservant la personnalité de l'OP-1 et de
l'EP-133. Une page est terminée seulement si ses fonctions, ses états, son
responsive et son accessibilité sont validés.

## Règles d'exécution

1. Migrer une zone à la fois ; ne pas refaire toute l'application dans un seul
   commit.
2. Extraire le composant commun avant de copier un nouveau motif.
3. Ne supprimer un ancien style qu'après migration et vérification de tous ses
   consommateurs.
4. Aucun changement visuel ne doit modifier une logique audio, MIDI, fichier ou
   sauvegarde sans test dédié.
5. Chaque phase se termine par `typecheck`, tests, build et contrôle visuel aux
   largeurs `360 / 768 / 1280 / 1600 px`, dans les deux thèmes.

## Vue d'ensemble

| Phase | Lots | Priorité | Dépend de | État |
| --- | --- | --- | --- | --- |
| UI-00 | Socle thèmes et shell | P0 | — | Livré |
| UI-01 | Composants fondamentaux | P0 | UI-00 | Livré |
| UI-02 | Accueil et Hub | P0 | UI-01 | Première migration livrée |
| UI-03 | Sauvegardes et états sûrs | P0 | UI-01 | Migration engagée |
| UI-04 | Bibliothèque sonore | P1 | UI-01 | Navigation commune livrée |
| UI-05 | MIDI et Rack audio | P1 | UI-01 | Shell commun livré |
| UI-06 | Training Lab | P1 | UI-01 | Shell commun livré |
| UI-07 | Profil et Éditeur d'image | P2 | UI-01 | Migration engagée |
| UI-08 | Nettoyage et validation finale | P0 | UI-02 à UI-07 | À faire |

## UI-00 — Socle thèmes et shell

### Livré

- `core/theme.ts` : lecture, application et persistance locale ;
- `themes.css` : tokens Atelier / Studio et corrections de contraste ;
- bouton de thème accessible ;
- menu mobile réel dans `TopBar` ;
- focus visible commun ;
- documentation du design system ;
- test du contrat des deux thèmes.

### Reste à verrouiller

- ~~**UI-001**~~ — **livré le 2026-08-27.** Test de contrat d'interface `TopBar.test.tsx` pour le bouton thème, le menu mobile et les liens essentiels ;
- ~~**UI-002**~~ — **livré le 2026-08-27.** La règle de maquette est devenue
  `.maquette-nav` ; sa cible n'existe plus, elle ne frappe donc plus rien. Sur
  les cinq `<nav>` du dépôt, trois déclaraient déjà leur propre `display` et
  n'étaient pas concernés ; `.orphan-pages-filters` porte désormais le sien, et
  le style en ligne de `.lab-tabs` est passé en feuille. Le rattrapage à
  `!important` a disparu avec sa cause. `styles.selecteurs.test.ts` interdit le
  retour d'un sélecteur d'élément nu ;
- **UI-003** — corriger les tokens CSS invalides hérités ;
- ~~**UI-004**~~ — **livré le 2026-08-27.** Vérification automatisée des contrastes principaux WCAG AA dans `theme.contrast.test.ts`.

### Critère de fin

Le thème choisi survit au rechargement, aucune page ne clignote dans le mauvais
thème et la navigation reste complète à 360 px.

## UI-01 — Composants fondamentaux

Créer `apps/studio-hub/src/ui/` avec les composants suivants :

### UI-101 — `Button`

Variantes : `primary`, `secondary`, `ghost`, `danger`, `icon`.  
États : repos, hover, focus, active, loading, disabled.  
Règles : cible de 44 px, label obligatoire, aucune couleur brute.

### UI-102 — `StatusBadge`

États : `ready`, `test`, `offline`, `readonly`, `warning`, `danger`.  
Chaque état utilise texte + forme + couleur.

### UI-103 — `Card`

Variantes : `machine`, `tool`, `module`, `metric`.  
La carte n'est cliquable que si toute sa surface déclenche une seule action.

### UI-104 — `Tabs`

Navigation clavier, défilement horizontal mobile et `aria-selected`.

### UI-105 — `EmptyState`

Quatre zones : constat, cause, conséquence, action principale.

### UI-106 — `ConfirmDialog`

Variantes standard et dangereuse, focus piégé, résumé de l'action et annulation
toujours visible.

### UI-107 — `PageHeader` et `AppShell`

Titre, retour, description courte, état global et action de page. La TopBar ne
doit plus être recâblée différemment dans chaque écran.

### Critère de fin

Chaque composant possède une démo isolée, ses deux thèmes, ses états, ses tests
clavier et une API documentée dans le code.

### Livraison du 26 août 2026

`Button`, `StatusBadge`, `Card`, `Tabs`, `EmptyState`, `ConfirmDialog`,
`PageHeader` et `AppShell` sont disponibles dans `apps/studio-hub/src/ui/`.
Leurs contrats de rendu, d'état et de navigation clavier sont couverts par les
tests. L'accueil sert de démonstration intégrée dans les deux thèmes.

## UI-02 — Accueil et Hub

### UI-201 — Accueil compact

Fichiers : `Landing.tsx`, styles de l'accueil.

- garder les deux machines visibles sans scroll à 1440 × 900 ;
- supprimer les CTA répétés ;
- limiter le héros à une promesse, deux machines et trois preuves ;
- rendre l'alerte serveur compacte avec détails repliables ;
- recadrer l'EP-133 à une échelle comparable à l'OP-1.

### UI-202 — Hiérarchie du Hub

Fichiers : `ToolsHub.tsx`, `outils.css`.

- rang 1 : deux cartes machine larges ;
- rang 2 : outils principaux moyens ;
- rang 3 : utilitaires compacts ;
- retirer les visuels génériques `243` sans fonction ;
- limiter chaque description à deux lignes ;
- conserver toutes les routes actuellement testées.

### Critère de fin

Un nouvel utilisateur identifie les deux studios, Sauvegardes, Sons, Apprendre
et Réglages en moins de cinq secondes.

## UI-03 — Sauvegardes et états sûrs

Fichiers : `BackupLab.tsx`, `VaultPanel.tsx`, `backup-lab.css`.

### UI-301 — Machine à états

Documenter et afficher :

`non configurée → dossier requis → machine absente → scan → contenu détecté →
sélection → sauvegarde → vérification → succès/échec`.

### UI-302 — Restauration isolée

- zone rouge séparée ;
- snapshot, date, taille, contenu et checksum visibles ;
- sauvegarde préalable proposée ;
- double confirmation ;
- aucune écriture machine tant que le protocole physique n'est pas validé.

### UI-303 — États vides

Un état vide par cause réelle : aucune machine, aucun dossier, permission
perdue, machine non détectée, dossier vide, archive incompatible.

### Critère de fin

À chaque instant, l'utilisateur sait ce qui est connecté, ce qui va être lu,
ce qui va être écrit et comment annuler.

## UI-04 — Bibliothèque sonore

Fichiers : `SoundLibrary.tsx`, `SoundLibraryPanel.tsx`, `SoundEditorHub.tsx`.

### UI-401 — Navigation à deux axes

- axe machine : `OP-1 / EP-133` ;
- axe source : `Machine / Personnel` ;
- vue secondaire : `Catalogue / Éditeur`.

Ne jamais afficher trois rangées d'onglets concurrentes : le contexte machine
reste dans le header, la source dans le panneau et la vue dans la barre outil.

### UI-402 — Carte son commune

Nom, durée, format, fréquence, taille, tags, compatibilité et aperçu. Les
actions destructives restent dans un menu secondaire.

### UI-403 — Éditeur traditionnel

Transport, waveform, début/fin, normalisation, conversion, annuler/rétablir et
export avec une barre fixe.

### Critère de fin

Importer, retrouver, écouter, préparer et envoyer un son nécessite au maximum
une navigation machine et une navigation source.

## UI-05 — MIDI et Rack audio

### UI-501 — Transport MIDI central

Fichiers : `MidiSettings.tsx`, `MidiSyncPanel.tsx`.

- tempo, connect, start, stop et état dans une barre compacte ;
- une carte par machine ;
- notes de test dans un panneau dédié ;
- arpégiateur replié par défaut ;
- `PANIC` fixe, rouge, isolé et toujours accessible.

### UI-502 — Rack audio à trois zones

Fichiers : `AudioPluginRack.tsx`, `audio-plugin-rack.css`.

1. navigation moteurs ;
2. panneau de travail ;
3. inspecteur contextuel.

Les effets secondaires sont repliables. Le transport et l'export restent
stables. Aucun texte fonctionnel sous 12 px.

### UI-503 — Responsive studio

- desktop : trois zones ;
- tablette : navigation en tiroir, travail + inspecteur ;
- mobile : une zone, tiroirs plein écran et transport collant.

### Critère de fin

Le rack est utilisable sans zoom navigateur à 1280 × 720 et toutes les actions
critiques restent atteignables au clavier.

## UI-06 — Training Lab

Fichiers : `Exercises.tsx`, `RhythmHero.tsx`, composants de jeu OP-1/EP-133.

### UI-601 — Entrée commune

Machine, exercice, difficulté, calibration et périphérique MIDI.

### UI-602 — Départ de partie

- écran de jeu plus haut ;
- compte à rebours ;
- métronome ;
- cascade lancée depuis le haut avec temps de préparation ;
- pause et sortie visibles.

### UI-603 — Règles d'exercice

Une définition d'exercice doit déclarer notes autorisées, octave, tempo,
tolérance, durée, prérequis et récompense. Une validation refuse toute note
absente du clavier cible sans changement d'octave explicite.

### UI-604 — Progression

Débrief commun, précision, timing, combo, XP et progression du personnage.

### Critère de fin

Les exercices OP-1 et EP-133 partagent le même cycle préparation → jeu →
débrief → progression.

## UI-07 — Profil et Éditeur d'image

### UI-701 — Profil en trois étapes

Identité, machines, dossier local. Drives et préférences passent dans Réglages
avancés. Aucune intégration cloud n'est affichée sans fonction réelle.

### UI-702 — Éditeur d'image 320 × 160

Fichier, historique, outils, zoom, grille, aperçu OP-1 et bibliothèque
rétractable. La zone de dessin possède la priorité spatiale.

### Critère de fin

Le profil obligatoire tient sur trois écrans mobiles courts et l'éditeur peut
être utilisé sans ouvrir le panneau de bibliothèque.

## UI-08 — Nettoyage et validation finale

### UI-801 — Dette CSS

- supprimer styles morts et doublons ;
- démanteler progressivement `styles-maquette-map.css` ;
- retirer les styles en ligne non dynamiques ;
- interdire les nouveaux `!important` hors correctif documenté ;
- inventorier les couleurs brutes restantes.

### UI-802 — Accessibilité

Audit clavier, focus, contrastes, libellés, live regions, dialogues et réduction
des animations.

### UI-803 — Matrice visuelle

Captures de référence :

- pages : accueil, Hub, sauvegardes, sons, MIDI, rack, Training, profil,
  éditeur image ;
- thèmes : Atelier et Studio ;
- largeurs : 360, 768, 1280, 1600 px ;
- états : vide, prêt, chargement, erreur et danger si applicable.

### UI-804 — Suppression finale

Supprimer une ancienne règle seulement quand `rg` confirme qu'elle n'a plus de
consommateur et que les captures n'ont pas régressé.

## Définition de « terminé » pour un ticket UI

- comportement réel branché ;
- deux thèmes ;
- desktop + mobile ;
- clavier + focus ;
- états vide, chargement, erreur, succès et disabled pertinents ;
- aucune couleur ou mesure arbitraire évitable ;
- tests mis à jour ;
- `typecheck`, tests et build réussis ;
- documentation ajustée si le contrat change ;
- capture revue avant push sur `main`.
