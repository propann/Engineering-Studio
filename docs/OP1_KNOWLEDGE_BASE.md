# Base de connaissances — OP‑1 original

Ce document rassemble les faits utiles au développement. Il distingue les comportements documentés par Teenage Engineering des connaissances issues d’outils communautaires. Toute hypothèse doit être testée sur des fixtures puis, si nécessaire, sur une machine volontaire.

## Modes d’accès

### Mode normal

Depuis l’OS 243, l’OP‑1 original peut servir de périphérique USB audio en entrée et sortie. Il expose aussi des fonctions MIDI. Ce mode ne donne pas accès à l’arborescence des fichiers.

### Disk mode

Le guide officiel indique d’ouvrir l’écran COM avec `Shift + COM`, puis de choisir le mode Disk (`T3`). L’OP‑1 apparaît comme un volume amovible. Il faut l’éjecter proprement depuis l’ordinateur avant de quitter ce mode.

Le guide officiel définit la sauvegarde complète de façon simple : copier tous les fichiers de l’OP‑1 vers l’ordinateur. La restauration consiste à les recopier et remplacer le contenu correspondant. OP‑1 Studio ajoutera un manifeste et des contrôles autour de ce mécanisme.

### TE‑boot

Machine éteinte et USB débranché, attendre quelques secondes, maintenir `COM`, puis allumer. Le menu permet notamment :

- touche `1` : mise à jour du firmware ;
- touche `2` : test fonctionnel ;
- touche `7` : réinitialisation usine, destructive pour le contenu utilisateur ;
- touche `8` : formatage du disque interne, destructif et suivi d’une réinstallation du firmware.

Le logiciel ne doit jamais automatiser les touches 7 ou 8.

## Arborescence logique observée

Les guides et outils communautaires convergent vers ces espaces, mais les sous-dossiers et la casse peuvent varier :

```text
OP-1/
├── album/          # mixages deux faces
├── drum/           # patches de batterie, dont user/
├── synth/          # patches synthé/sampler, dont user/
├── tape/           # track_1.aif à track_4.aif
└── snapshot/       # snapshots de sons selon version/contexte
```

Règles d’implémentation :

- détecter les dossiers et fichiers sans forcer leur casse ;
- conserver tout fichier inconnu lors d’une sauvegarde/restauration ;
- ne créer un chemin que s’il est documenté ou déjà présent ;
- ne pas coder en dur un nombre de patches contesté ; mesurer et signaler la capacité observée ;
- limiter les noms de sons destinés à la machine à dix caractères simples lorsque le guide l’exige.

## Sons et patches

Un fichier de patch OP‑1 est un AIFF qui peut combiner un aperçu audio et des métadonnées propres à la machine. Il ne faut donc pas traiter tous les `.aif` comme de simples enregistrements interchangeables.

| Cible | Durée maximale documentée | Préparation prudente |
|---|---:|---|
| Synth sampler | 6 secondes | mono, PCM 16 bits, 44,1 kHz, AIFF |
| Drum sampler | 12 secondes | mono, PCM 16 bits, 44,1 kHz, AIFF |
| Patch natif | dépend du moteur | préserver les chunks inconnus et métadonnées |

Pour un drum patch, des outils comme `teoperator` et `op-patch-util` savent placer ou découper plusieurs sons et écrire les métadonnées attendues. Leur sortie doit être testée sur des fixtures avant intégration.

## Tape

- quatre pistes ;
- six minutes de durée totale ;
- audio 44,1 kHz / 16 bits ;
- fichiers exposés en Disk mode : `tape/track_1.aif` à `tape/track_4.aif` ;
- un export individuel ne contient pas le mix, l’EQ, l’effet master ni le drive appliqués par l’OP‑1.

Conséquence produit : l’aperçu de Tape doit aligner les quatre fichiers sur la même origine temporelle. Le futur Studio peut rendre quatre stems compatibles, mais ne doit pas prétendre recréer toutes les décisions de mixage internes.

## Album

L’album enregistre le mix des quatre pistes, avec les traitements master. Les faces A et B peuvent contenir jusqu’à six minutes chacune. Les documents et outils existants utilisent plusieurs variantes (`sideA.aif`, `SideA.aif`, parfois `side_a.aif`) : le code doit détecter les alias et afficher le nom réellement trouvé.

## Séquenceurs et morceaux

Les séquenceurs conservent des données de notes propres aux moteurs synthé et drum. Ils ne constituent pas un fichier de morceau universel directement exportable. L’Endless sequencer accepte jusqu’à 128 notes selon le guide.

Pour une première fonction de création de morceau, le modèle fiable est donc :

1. arranger des clips sur quatre pistes dans OP‑1 Studio ;
2. rendre quatre AIFF synchronisés, 44,1 kHz / 16 bits, de six minutes maximum ;
3. sauvegarder l’état actuel de la machine ;
4. préparer un plan de remplacement des pistes ;
5. laisser l’utilisateur finaliser et mixer sur l’OP‑1.

La modification directe de `tape.db` reste hors périmètre tant que son format et son comportement de reconstruction ne sont pas suffisamment maîtrisés.

## Firmware officiel

Au 11 août 2026, la page officielle liste l’OS **246**, publié le 13 décembre 2022, comme version la plus récente pour l’OP‑1 original. Ses notes mentionnent une correction de bruit lié aux entrées line/mic/radio. Les versions 245 et 243 ont notamment ajouté la prise en charge de variantes d’écran et l’USB audio.

Procédure officielle résumée :

1. éteindre l’OP‑1, débrancher l’USB et attendre trois secondes ;
2. maintenir `COM` pendant l’allumage pour entrer dans TE‑boot ;
3. choisir la touche 1 ;
4. connecter l’USB et attendre le volume amovible ;
5. **copier manuellement le fichier `.op1` sur ce volume** ;
6. éjecter le volume depuis le système d’exploitation ;
7. presser `COM` sur la machine et la laisser terminer.

Le fichier firmware est donc copié dans le volume de mise à jour TE‑boot. Ce
n’est pas le même usage que le Disk mode (`Shift + COM`, puis `T3`) utilisé pour
la sauvegarde et le remplissage de la machine. L’application prépare et
vérifie le fichier, mais le transfert firmware reste une étape manuelle et
visible.

OP‑1 Studio doit montrer ces étapes, pas simuler l’action physique.

## Structure du conteneur firmware — connaissance communautaire

Les recherches `op1-docs`/`op1hacks` décrivent un fichier `.op1` comme :

1. quatre octets de CRC‑32 ;
2. un flux LZMA ;
3. une archive TAR après décompression.

L’archive contient notamment des ressources audio et graphiques, des bases `op1.db`, `op1_factory.db`, `tape.db` et des chargeurs. Le code principal du firmware est chiffré dans les recherches publiées. Ces informations servent à l’inspection et à la validation du conteneur, pas au contournement de protections.

## Points à confirmer sur matériel

- nom/label exact des volumes sur chaque système et version OS ;
- comportement après copie d’un fichier temporaire ou inconnu ;
- variantes exactes des noms d’album ;
- limites de patches réellement imposées par chaque version ;
- reconstruction des index après restauration ;
- conservation des chunks AIFF inconnus par les bibliothèques choisies ;
- VID/PID selon mode normal, Disk et TE‑boot.

Consulter [SOURCES.md](SOURCES.md) pour les références.
