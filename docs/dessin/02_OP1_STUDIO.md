# Direction artistique — OP‑1 Studio

## Rôle

OP‑1 Studio est l’atelier de préparation et de création autour de l’OP‑1 :
firmware documenté, images, samples, Tape, projets, exercices MIDI et plans de
sauvegarde.

## Modules visibles dans le code

| Module | Usage | Principal |
|---|---|---|
| Firmware | catalogue, vérification, préparation locale | `Préparer` / `Vérifier` |
| Sauvegardes | plan de backup, coffre et transfert contrôlé | `Préparer une sauvegarde` |
| Sons | import WAV/AIFF, waveform, trim, fondus, packs | `Préparer le pack` |
| Studio | Tape, mixage, projets, stems, Album | `Nouveau projet` / `Lecture` |
| Images | bibliothèque SVG et éditeur pixel | `Ouvrir l’éditeur pixel` |
| Services | outils locaux et ressources référencées | `Consulter` |
| Exercices MIDI | pratique et retour clavier | `Connecter MIDI` / `Démarrer` |
| Documentation | procédures et limites | liens de lecture |

## En-tête recommandé

```text
[OP‑1] OP‑1 STUDIO / [module actif]
[Accueil] [Firmware] [Sauvegardes] [Sons] [Studio] [Images] [Services]
[Documentation] [Exercices MIDI]       [Pont local] [MIDI] [HUB OUTILS]
```

`Accueil` retourne à la grille OP‑1. `HUB OUTILS` retourne au Hub principal.
Ces deux boutons doivent avoir des formes et icônes différentes.

## Éditeur de samples

Parcours à dessiner :

```text
Choisir fichier → analyse audio → waveform → début/fin → fondus
→ Préparer le fichier → exporter / ajouter au pack
```

Distinction obligatoire :

- `Préparer` = travail local, réversible, créatif ;
- `Transférer` = opération machine, prudente, avec confirmation ;
- `Sauvegarder` = copie de sécurité, jamais confondue avec un export.

## Éditeur d’images

L’utilisateur sélectionne un écran, voit ses dimensions, ouvre l’éditeur pixel,
réinitialise ou exporte un patch JSON. L’écran cible OP‑1 est 320×160.

Boutons : `Charger des écrans .svg`, `Importer tout content/display`,
`Prévisualiser le thème`, `Ouvrir l’éditeur pixel`, `Réinitialiser`,
`Exporter le patch JSON`.

Le bouton d’export doit être disponible seulement lorsqu’une modification
existe. L’aperçu doit montrer un badge `SVG contrôlé`.

## Studio Tape

Le visuel doit évoquer un instrument et non un explorateur de fichiers :
transport, pistes, clips, mixage et export sont prioritaires. Les actions de
projet (`Nouveau`, `Ouvrir`, `Enregistrer`) restent dans une barre stable.

## Signaux d’état

- `PONT LOCAL · REQUIS` : bridge non connecté ;
- `MIDI · DÉCONNECTÉ` : l’outil reste utilisable localement ;
- `MIDI ✓` : entrée/sortie disponibles ;
- `SANS MACHINE` : préparation locale possible ;
- `OP‑1 REQUIS` : action machine désactivée avec explication.
