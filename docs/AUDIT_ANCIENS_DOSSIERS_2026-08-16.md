# Audit complet des anciens dossiers

Date : 16 août 2026  
Périmètre : anciens projets EP‑133/OP‑1, `studio-ecosystem` et coffres locaux

## Résultat général

Les anciens projets ont été archivés dans
[`archive/legacy-material`](../archive/legacy-material). L’archive contient
587 fichiers propres pour environ 7,5 Mo, après exclusion des dépendances,
builds, caches et dépôts Git internes.

Le dépôt actif n’a pas perdu le cœur firmware : les dossiers OP‑1 et EP‑133
contiennent déjà les documents, catalogues, outils d’inspection, outils de
clone et études SysEx issus des anciens projets.

## Déjà intégré dans le dépôt actif

### OP‑1

- laboratoire conteneur `.op1` : CRC, LZMA, TAR et contrôle des chemins ;
- inspection firmware et ponts locaux ;
- catalogue firmware et catalogue des mods ;
- repacker isolé et patches graphiques ;
- procédures te‑boot/Disk mode et sécurité ;
- documentation synthèse, drum, Tape, images et patches.

Emplacements : `apps/op1-studio/docs`, `apps/op1-studio/tools`,
`apps/op1-studio/data`.

### EP‑133

- documentation SysEx et contrôle MIDI ;
- clonage complet, sauvegarde/restauration et validation ;
- miroir machine, projets, samples et étude firmware/hardware ;
- outils de scan, clone lecture seule et transfert contrôlé.

Emplacements : `apps/ep133-studio/docs`, `apps/ep133-studio/etude`,
`apps/ep133-studio/tools`.

### Profil et sauvegardes

- `profile_bridge.py` et son test ont été récupérés ;
- la fiche centrale du Hub remplace volontairement les anciens profils locaux ;
- les anciennes pages `CreateProfile`, `LocalProfilePanel` et stores locaux
  restent dans l’archive uniquement pour référence historique.

## Éléments retrouvés mais pas encore raccordés

### 1. Analyseur OP‑1 historique

Dans `archive/legacy-material/studio-ecosystem/tools` :

- `op1-scanner.ts` ;
- `op1-master-analyzer.ts` ;
- `op1-test-suite.ts` ;
- `sample-extractor.ts`.

Ces scripts supposent une structure de disque simplifiée (`tape`, `synth`,
`drum`, `samples`, `firmware`) et écrivent directement des rapports. Ils sont
utiles comme prototypes d’orchestration, mais ne doivent pas remplacer les
outils actuels : ils ne partagent pas encore les manifestes, les contrôles de
chemins sûrs ni le mode lecture seule du Hub.

Priorité proposée : porter uniquement le catalogue et le rapport maître dans
le service d’analyse OP‑1, après adaptation aux formats actuels.

### 2. Ancien éditeur de sons

Le prototype `studio-ecosystem/packages/sound-editor` contient encore des
idées utiles : markers, tags, waveform, export, pads et séquenceur. Une partie
est déjà couverte par OP‑1 Studio et EP‑133 Studio ; le reste doit servir de
référence UX, pas être copié comme troisième application.

### 3. Ancien éditeur SVG

Le prototype `studio-ecosystem/packages/svg-editor` contient notamment
calques, historique, guides, transformations et panneau de propriétés. Il est
archivé et constitue une réserve de fonctions pour l’éditeur d’image OP‑1.
Il n’est pas branché directement afin d’éviter un deuxième éditeur concurrent.

### 4. Anciennes pages de profil

Les pages et stores de profil trouvés dans les anciens projets sont obsolètes
pour le produit actuel. Les réintégrer recréerait le problème de plusieurs
fiches et de plusieurs sauvegardes. Seules la normalisation et la migration
utile ont été conservées.

## Coffres personnels analysés

### `/home/azoth/Musique/OP-133`

- environ 90 156 fichiers ;
- environ 18 Go de WAV ;
- environ 2 Go d’archive ZIP ;
- 527 fichiers PCM ;
- catalogues CSV, documentation, projets `.ep.project.json` ;
- checkpoints TAR de sauvegarde ;
- clone EP‑133 avec `manifest.json`, `clone-index.json` et métadonnées.

Ce coffre est une bibliothèque de production, pas du code source. Il ne doit
pas être copié dans Git. Il doit rester la source du coffre local Hub, avec un
index lecture seule et des sauvegardes sélectives.

### `/home/azoth/Musique/Teenage/op1` et `ep133`

Ces dossiers contiennent principalement des bibliothèques audio AIF/PCM,
environ 270 Mo pour OP‑1 et 60 Mo pour EP‑133. Ils sont conservés hors dépôt
et devront être référencés par le gestionnaire de bibliothèque, pas dupliqués.

## Conclusion

Aucun bloc firmware important n’a été oublié dans les anciens dépôts. Les
seuls éléments réellement intéressants encore non raccordés sont :

1. l’orchestrateur d’analyse OP‑1 historique ;
2. certaines fonctions de l’ancien sound editor ;
3. calques/historique avancés de l’ancien SVG editor ;
4. l’indexation du gros coffre audio local.

Le reste est soit déjà intégré, soit volontairement laissé dans l’archive
pour éviter de réintroduire des profils locaux, des doublons ou des écritures
machine dangereuses.

