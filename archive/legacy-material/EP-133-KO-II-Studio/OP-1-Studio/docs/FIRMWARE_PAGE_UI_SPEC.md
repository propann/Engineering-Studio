# Spec UI — page Firmware, inspirée d'`op1REpackerGUI`

Document écrit le 14 août 2026, avant l'implémentation, à la demande
explicite : « il faut s'inspirer de l'UI qui existe pour notre repackeur…
il y a une UI sur git on peut partir de là, l'intégrer avec notre ligne
graphique et ajouter les outils ». Décrit ce qu'on garde de la référence,
ce qu'on adapte, et ce qu'on refuse — avant de toucher au code, pas après.

## Référence étudiée

[`op1hacks/op1REpackerGUI`](https://github.com/op1hacks/op1REpackerGUI),
commit épinglé `3f54f41c771c6045df8e6771fd965b055cef1084` (MIT), déjà
répertorié comme **référence UX uniquement** dans
[`TOOLING_AUDIT.md`](TOOLING_AUDIT.md)/[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md) :
« ne pas reprendre ses écritures sans réécriture ». Capture d'écran étudiée :
`assets/op1REGUI.png` du dépôt (extrait localement via `git show`, jamais
commis ici — même règle que le reste du Labo, `.cache/` gitignoré).

### Ce qu'on observe

Fenêtre desktop Tkinter, trois colonnes fixes + une barre basse :

```text
┌─────────────┬──────────────────────────────────┬──────────────┐
│ REpacker    │ Mods                              │ SVG Tools    │
│ Firmware    │ Select a mod to enable it…        │ Normalize    │
│ tools       │ ☐ iter          Enable "iter"…    │ Analyze      │
│             │ ☐ presets-iter  Add community…    │              │
│ [Unpack]    │ ☐ filter        Enable "filter"…  │ Advanced     │
│ [Modify]    │ ☐ subtle-fx     Make FX less…     │ Tools        │
│ [Repack]    │ ☐ gfx-iter-lab  …                 │ [Opie]       │
│ [Analyze]   │ ☐ gfx-cwo-moose …                 │ [Glitter]    │
│             │ ☐ gfx-tape-inv  …                 │ [GFX Tips]   │
│             │ (checkbox · id · description,      │ [Browse]     │
│             │  une ligne par mod)                │              │
├─────────────┴──────────────────────────────────┴──────────────┤
│ [barre de statut/log]                              [Browse]    │
└──────────────────────────────────────────────────────────────┘
```

Trois idées structurantes valables indépendamment du style visuel :

1. **Colonne gauche = verbes d'action**, peu nombreux, toujours visibles —
   pas un flux à étapes qu'il faut dérouler pour retrouver le bouton
   pertinent.
2. **Colonne centrale = un seul tableau de mods**, checkbox + nom + phrase
   descriptive, pas de vignette imposante — l'attention va à la liste, pas
   à la décoration.
3. **Colonne droite = outils secondaires groupés par thème** (SVG, avancé),
   séparés visuellement des mods principaux plutôt que noyés dedans.

### Ce qu'on ne reprend pas

- Les verbes **« Unpack / Modify / Repack »** exposent le vocabulaire brut
  de l'outil, pas l'intention utilisateur — remplacés chez nous par
  « Vérifier », « Préparer le plan », « Exporter » (déjà le vocabulaire du
  reste de l'app, voir `FIRMWARE_SAFETY.md`).
- Aucun bouton **« Browse »** générique qui ouvrirait un accès fichier non
  contrôlé — nos actions de fichier restent typées (« Choisir un fichier
  .op1 », jamais un explorateur générique).
- **« Run Opie toolkit »**/**« Glitter »** comme actions en un clic : Opie
  est classé étude historique, Glitter n'a pas encore de moteur local
  écrit (voir [`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §12) — la
  colonne droite chez nous pointe vers les vrais outils déjà construits
  (`display_bridge.py`, écran Images), pas vers des intégrations qui
  n'existent pas.
- Le style Tkinter sombre générique — remplacé par notre langage visuel
  existant (mini-écran, encodeurs colorés, cartes à coins arrondis).

## Adaptation retenue pour `app/page.tsx`

Réorganisation d'un contenu déjà construit et fonctionnel (catalogue de
mods avec aperçus, sélection de fichier, plan sécurisé) — pas une
réécriture depuis zéro. Correspondance :

| op1REpackerGUI | Chez nous |
|---|---|
| Colonne gauche (Unpack/Modify/Repack/Analyze) | Rail gauche : **Source** (télécharger l'officiel / choisir un fichier local) + **Plan sécurisé** (les 3 contrôles + « Préparer le plan »), déjà existants, regroupés verticalement |
| Colonne centrale (tableau de mods) | Centre : catalogue de mods déjà construit (`firmwareMods`, groupé par catégorie Écrans/Audio/Ressources/Fonctions/Thèmes), conservé tel quel |
| Colonne droite (SVG Tools / Advanced Tools) | Rail droit, **nouveau** : raccourcis vers les vrais outils SVG/Images déjà livrés (`tools/display_bridge.py`, `tools/svg_preflight.py`, écran Images) — liens vers des fonctions existantes, pas des boutons qui ne font rien |
| Barre de statut basse | La notice existante (`.notice`) suffit ; pas de barre dédiée en plus |

Le suivi de progression à 4 étapes (« Source → Mods → Contrôles →
Exporter ») affiché en haut de la page actuelle est retiré : il dupliquait
visuellement ce que la disposition en colonnes rend déjà lisible d'un
coup d'œil, sans dérouler un parcours linéaire — cohérent avec le principe
1 de la référence (peu de boutons, toujours visibles, pas un flux à étapes).

## Ce qui ne change pas

- Aucune nouvelle écriture sur la machine : toujours « préparer un plan »,
  jamais « installer ». Voir [`FIRMWARE_SAFETY.md`](FIRMWARE_SAFETY.md).
- Le catalogue de mods (`firmwareMods`), les aperçus SVG et la logique de
  sélection restent les mêmes — seule la disposition change.
- `data/mods/catalog.json` reste la source de vérité pour l'état
  vérifié/candidat/exclu de chaque mod (voir
  [`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §11).

## Référence croisée

[`TOOLING_AUDIT.md`](TOOLING_AUDIT.md) ·
[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md) ·
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) ·
[`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §11-§12
