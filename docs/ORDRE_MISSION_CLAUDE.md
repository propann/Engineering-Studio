# Ordre de mission — Claude

> **Lot spécialisé.** La feuille de route principale est [`ROADMAP.md`](ROADMAP.md) ;
> ce document en détaille le lot Registre. En cas de contradiction, la principale gagne.


## Objectif

Transformer la fenêtre **Pages** en registre professionnel de tous les outils du dépôt, sans perdre de code et sans présenter une maquette comme une fonction réelle.

## Lot Claude

1. Recenser automatiquement tous les fichiers `apps/studio-hub/src/pages/*.tsx`.
2. Comparer ce recensement avec :
   - les imports différés de `App.tsx` ;
   - le type `Page` ;
   - le `switch` de navigation ;
   - les boutons de `TopBar`, `Landing` et `ToolsHub`.
3. Classer chaque entrée :
   - active ;
   - orpheline récupérable ;
   - doublon ;
   - archive ;
   - démo ;
   - non vérifiée/dangereuse.
4. Ajouter dans la fenêtre Pages :
   - recherche ;
   - filtres machine et état ;
   - provenance MACHINE/LOCAL/PROFIL/DÉMO/NON VÉRIFIÉ ;
   - chemin source ;
   - nombre de portes d'entrée ;
   - bouton Voir ;
   - action Connecter au Hub ;
   - archivage local réversible.
5. Interdire toute suppression de code depuis l'interface.
6. Ne jamais rendre inaccessible une page dont le registre est la dernière porte.
7. Proposer le rattachement des pages récupérables au bon groupe du Hub.

## Pages prioritaires

- `SoundEditorHub.tsx` : récupérée dans le routeur, à évaluer face à Sound Library et Audio Rack ;
- `AdvancedImageEditor.tsx` : vérifier doublon ou complément de l'éditeur OP-1 ;
- `SoundPatchCreator.tsx` : vérifier rattachement au Rack ;
- `RhythmHero.tsx` : distinguer ancienne page informative et vrai jeu EP-133.

## Interdictions

- aucun faux cloud ;
- aucune fausse connexion machine ;
- aucune suppression irréversible ;
- aucune valeur de sauvegarde codée en dur présentée comme réelle ;
- ne pas pousser si la CI échoue.

## Critères d'acceptation

- chaque page réelle est recensée ;
- aucune entrée fantôme ;
- chaque page déclare sa cible et sa provenance ;
- toute page orpheline reste ouvrable ;
- tests du registre verts ;
- capture desktop et mobile ;
- rapport des doublons avant suppression éventuelle.
