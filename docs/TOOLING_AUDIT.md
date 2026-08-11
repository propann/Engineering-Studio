# Audit des outils existants

État vérifié le **11 août 2026**. « Intégrer » signifie étudier et épingler une version après audit ; aucun code tiers n’est encore incorporé dans ce dépôt.

| Projet | Licence annoncée | Apport | Décision proposée |
|---|---|---|---|
| [`op-patch-util`](https://github.com/AlexCharlton/op-patch-util) | À vérifier au fichier LICENSE | CLI Rust pour lire/modifier/créer patches synthé et drum | **Candidat prioritaire** : réutiliser les primitives validées, sans intégrer avant audit de licence |
| [`teoperator`](https://github.com/schollz/teoperator) | MIT | Conversion audio, synth patches, kits drum, découpe transients/fixe | **Référence + compatibilité** ; utile pour fixtures croisées |
| [`op1tools`](https://github.com/blattm/op1tools) | MIT | Scripts Linux de détection, montage, sauvegarde, éjection | **Référence seulement** ; réécrire avec validations multiplateformes |
| [`OP-1Z-Sample-Manager`](https://github.com/romangarms/OP-1Z-Sample-Manager) | GPL‑3.0 | Gestion samples, tape, backup/restore, aperçu multiplateforme | **Benchmark direct** ; code réutilisable si attribution et audit précis |
| [`op1repacker`](https://github.com/op1hacks/op1repacker) | MIT | Unpack/repack/analyse de firmware | **Labo expert isolé uniquement**, jamais dans le parcours officiel |
| [`op1REpackerGUI`](https://github.com/op1hacks/op1REpackerGUI) | MIT | GUI de repack, thèmes, fonctions issues d’opie | **Inspiration UX expert**, ne pas rendre central |
| [`opie`](https://github.com/op1hacks/opie) | Pré‑alpha, licence à revérifier au commit choisi | Ancien gestionnaire macOS : backup, restore, presets | **Étude historique**, pas dépendance |
| [`op1aiff`](https://github.com/op1hacks/op1aiff) | MIT | Petit utilitaire de preset AIFF | **Fixtures et tests de compatibilité** |
| [`op1svg`](https://github.com/op1hacks/op1svg) | MIT | Normalisation de SVG pour l’écran OP‑1 | **Option future** pour le labo graphique |
| [`op1-fw-archive`](https://github.com/op1hacks/op1-fw-archive) | Firmware propriétaire | Archive communautaire de versions firmware | **Métadonnées seulement** ; ne jamais redistribuer les binaires |
| [`op1-docs`](https://github.com/sualk/op1-docs) | À vérifier par fichier | Recherche sur conteneur, bases, chiffrement et ressources | **Source technique**, ne copier que ce que la licence permet |
| [`connect-op1`](https://github.com/jidagraphy/connect-op1) | À confirmer | Exemple WebUSB et identifiant `2367:0004` | **Indicateur de détection**, jamais preuve unique |
| [`OP-PatchStudio`](https://github.com/joseph-holland/op-patchstudio) | MIT annoncée | Éditeur web/PWA de samples et waveforms, sortie OP-XY et import OP-1 | **Inspiration et benchmark**, moteur OP-1 à valider avant réutilisation |
| [`op1-glitter`](https://github.com/Nanobot567/op1-glitter) | MIT annoncée | Thèmes de couleurs et IDs SVG | **Sidecar expert**, normalisation et fixtures à ajouter |
| [`op1.fun.app`](https://github.com/dustMason/op1.fun.app) | À vérifier | Compagnon macOS : packs, patches, samples, Tape | **Benchmark UX**, pas de dépendance ni téléchargement silencieux |
| [`OP-1 Note Quantization`](https://github.com/stfj/OP-1-Note-Quantization-PublicGit) | À vérifier | Patch binaire de gammes pour OS 246 | **Recherche seulement**, aucun bouton d'installation |
| [`op1-decryptor`](https://github.com/sualk/op1-decryptor) | Non déclarée | Recherche sur le chiffrement de `OP1_vdk.ldr` | **Référence historique**, aucune clé ni extraction dans l'app |
| [`op1dumps`](https://github.com/Tolsi/op1dumps) | Non déclarée | Dumps flash/ECC/OTP et réparation | **Exclu**, risque matériel critique |
| [`op1.fun`](https://op1.fun/) | Service tiers | Bibliothèque communautaire et patch builder | **Lien/import manuel** ; pas de scraping ni dépendance au compte |

## Étude exécutée sur un firmware réel

Le laboratoire a récupéré l’OS officiel **246** depuis Teenage Engineering,
sans le committer, puis a vérifié son conteneur avec l’inspecteur du projet.
Il a ensuite déballé et reconstruit une copie avec `op1repacker` au commit
`390b18e4193a3af4f44e8f89b5f6c017a71ddf96`.

- enveloppe confirmée : `CRC-32 little-endian → LZMA-Alone → TAR` ;
- 117 entrées, 107 fichiers et 10 dossiers observés ;
- version interne : `R. 00246`, build `00246`, te‑boot `2.30` ;
- round-trip sans modification : 107 fichiers retrouvés et contenus
  identiques ;
- fichier reconstruit valide, mais différent en taille et en SHA‑256 : un
  repack n’est pas une copie binaire identique ;
- la copie finale vers le volume TE‑boot reste manuelle, conformément au guide
  officiel.

Le détail des mesures, commandes et limites se trouve dans
[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md). Le code tiers n’est pas intégré : notre
inspecteur garde les validations de chemin, de taille et de type de membre qui
manquent à l’extracteur historique.

## Ce que l’on récupère réellement

### Dans le cœur du produit

- modèles de données et garde-fous écrits pour OP‑1 Studio ;
- logique compatible avec `op-patch-util` privilégiée, car Rust et MIT ;
- fixtures générées par plusieurs outils pour vérifier que les patches sont interprétés de la même manière ;
- idées de conversion de `teoperator`, sans lancer arbitrairement un binaire téléchargé ;
- concepts backup/tape éprouvés par OP‑1Z Sample Manager, avec attribution si du code est repris.

### Comme sidecars optionnels

- FFmpeg pour décoder une large gamme de formats, si la distribution et les licences de codecs sont clarifiées par plateforme ;
- `op1repacker` uniquement dans le Labo expert, dans un processus isolé ;
- outils de diagnostic USB propres au système, jamais via une commande shell construite depuis une entrée utilisateur.

### Comme sources, pas comme dépendances

- archive des firmwares pour comprendre l’historique ;
- documents de reverse engineering pour reconnaître le conteneur ;
- gestionnaires anciens pour repérer les cas limites et attentes utilisateurs.

## Risques de réutilisation

- Une licence de dépôt peut ne pas couvrir chaque binaire ou contenu stocké.
- Un projet marqué MIT ne rend pas le firmware qu’il manipule redistribuable.
- Les scripts de montage/éjection conçus pour une distribution Linux ne sont pas suffisamment robustes pour une application grand public.
- Les limites de patches publiées divergent selon les outils ; le produit doit observer la machine et expliquer l’incertitude.
- L’écriture de métadonnées AIFF peut perdre des chunks inconnus si une bibliothèque réencode tout le fichier.

## Processus d’adoption d’un outil

1. épingler un commit ;
2. relire licence, historique et dépendances ;
3. créer des fixtures non propriétaires ;
4. comparer l’entrée/sortie avec au moins une autre implémentation ;
5. ajouter attribution et SBOM ;
6. isoler l’exécution et limiter les chemins accessibles ;
7. documenter une solution de repli si l’outil disparaît.

Le registre machine-lisible est disponible dans [`../tools/sources.yml`](../tools/sources.yml).

Le registre des mods est dans [`../data/mods/catalog.json`](../data/mods/catalog.json)
et le registre des sources de contenu dans
[`../data/content/sources.json`](../data/content/sources.json). Les compteurs
de services communautaires y sont datés et traités comme des observations
dynamiques, pas comme un inventaire à aspirer.
