# Feuille de route

Le firmware est le premier écran et le premier sujet de confiance. Techniquement, une sauvegarde minimale et une identification sûre de la machine sont des prérequis du même jalon, pas des détours.

**Référence consolidée (14 août 2026)** : [`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) réunit tout ce qui est su sur le firmware et la machine (conteneur, base de données d'usine, format patch, boutons ↔ champs JSON, comportement Tape, graphismes, modes de connexion, catalogue de mods) avec, pour chaque fait, ce qui est déjà codé / codable maintenant / hors périmètre — un seul document à consulter avant de démarrer un chantier firmware/machine plutôt que de relire chaque étude séparément. [`OP1_IMAGE_BIBLE.md`](OP1_IMAGE_BIBLE.md) approfondit spécifiquement les 61 écrans SVG (inventaire complet par catégorie, palette exacte, patrons visuels d'éditeur de moteur, dictionnaire de codenames) pour servir directement l'éditeur d'images. [`FIRMWARE_PAGE_ROADMAP.md`](FIRMWARE_PAGE_ROADMAP.md) est une feuille de route dédiée à la seule page Firmware (UI, pas connaissance machine) — trop de chantiers en cours dessus pour rester dans les puces générales ci-dessous.

## Etat de livraison

Etat de pilotage : 13 aout 2026 (maj apres verification TypeScript).

Le projet a trois niveaux de maturite :

- **socle local livre** : firmware, display, samples, patches, Studio et
  contrats JSON fonctionnent hors interface native ;
- **materiel valide** : l'OP-1 original a ete detecte en Disk et en mode
  normal, sauvegarde, comparaison et delete/restore ont ete verifies sur un
  vrai volume ;
- **integration produit manquante** : l'interface web ne declenche pas encore
  les bridges locaux, le MIDI/audio interactif n'est pas valide dans le
  navigateur et le pont natif d'ejection n'existe pas.

### Tableau de bord

| Zone | Etat reel | Prochaine preuve |
| --- | --- | --- |
| Firmware + Images | moteurs locaux livres, sauvegarde locale et plans UI non destructifs | bridge de préparation natif, sans flash |
| Sauvegardes | backup/verify/plan/execute/restore livres ; plan UI borne ; delete/restore valide sur hardware | bridge natif + ejection |
| Bibliotheque Sons | preflight, patches CLI, grille 24 pads, index UI et plan UI borne livres | pre-ecoute fichier et transfert natif |
| Studio | projet v1, mixage, fades, piano-roll, stems, Album, trim focalise et refs sources livres | reconnexion automatique et import UI |
| MIDI/audio | detection Windows, capture MIDI et auto-detection silencieuse dans Studio | sortie live et essai OP-1 dans Chrome/Edge |
| Education | 5 modes (Drumkit/Melodie/Accord/Effets/Morceau import MIDI), ecran notes qui tombent, clavier aligne, jugement note/timing, progression locale, boucle par section et pad Effet T3 livres (14 aout 2026) | niveaux combos |
| Distribution | dev server et build web | Tauri, installation et permissions |

La priorite n'est plus d'ajouter des prototypes isoles : il faut rendre les
ecrans coherents, brancher les contrats existants par des actions limitees et
fermer les portes de qualite avant toute distribution.

### Architecture des fenetres

`docs/FIRMWARE_LAB_FUNCTIONS.md` et `docs/WINDOW_FUNCTIONS_SPEC.md` deviennent
la reference fonctionnelle des fenetres. La navigation produit reste organisee
autour de sept espaces visibles dans l'accueil :

| Fenetre | Perimetre retenu | Etat architectural |
| --- | --- | --- |
| Accueil | lancement par modules, etats machine et raccourcis | livre |
| Firmware | source, verification, sauvegarde locale, graphismes, audio usine et guide TE-boot | sous-onglet Graphismes livre ; préparation native à poursuivre |
| Sauvegardes | snapshots, comparaison, restauration, Time Capsule Pistes et transfert | livre en moteur, UI/bridge natif a brancher |
| Sons | bibliotheque, preflight, patches, 24 pads et packs | pads livres, index et transfert a poursuivre |
| Studio | Clone OP-1, MIDI, Tape, Album, mixage et projet | coeur livre, sources persistantes a poursuivre |
| Exercices | accords, finger drumming, morceaux et performance MIDI | prototype |
| Documentation | fiches par fenetre, procedures et recherche | fiche minimale |

La carte Images ne devient pas une huitieme fenetre : ses fonctions sont
absorbees par Firmware sous le sous-onglet Graphismes. L'ancien onglet global
Images a ete retire apres validation de cette integration.

### Decisions issues des analyses

- **Graphismes originaux** : le createur de dessin est livre dans Firmware >
  Graphismes. Il genere un SVG local en 320x160, echappe le texte utilisateur
  et valide les invariants avant export ; il ne devient pas un importeur libre
  de fichiers tiers.
- **Outils prioritaires** : `op1aiff` pour inspecter les AIFF en lecture seule
  dans Sons et `op1svg` pour valider les SVG avant patch. Les replis locaux
  `tools/aiff_inspector.py` et `tools/svg_preflight.py` sont maintenant livres
  et testes ; les upstream restent des sidecars optionnels, non executes par
  l'application. `teoperator` reste une fixture de comparaison ; les autres
  outils restent des references.
- **Profil utilisateur** : `profile.json` local, sans compte ni reseau, pour le
  pseudo, les machines nommees, le coffre, les marqueurs de partage et les
  preferences. Il reference `DeviceIdentity` et `BackupManifest` sans les
  remplacer. Le schema TypeScript, l'edition locale du pseudo/machine et
  `tools/profile_bridge.py` sont livres ; la coque Tauri expose maintenant
  `profile_read` et `profile_write` avec confirmation, validation de schema et
  aucune ecriture machine.
  **Idée notée le 14 août 2026, pas construite** : une vraie « fiche
  personnage » qui regroupe ce qui est aujourd'hui dispersé (le pseudo et
  le nom de machine ne sont édités que dans la fenêtre Sauvegardes) — un
  seul endroit pour éditer le pseudo, le dossier de travail
  (`localSpace.root`, déjà dans `LocalProfile`), et les machines nommées
  (`profile.machines[]` est déjà un tableau côté schéma, donc déjà prêt
  pour plusieurs machines — seule l'UI actuelle n'en montre qu'une).
  **Point d'entrée précisé le 14 août 2026** : le bouton « Réglages » de la
  bande de navigation (`app/page.tsx`, actif dans tous les écrans depuis le
  passage à la bande horizontale) ne fait aujourd'hui qu'afficher une
  notice statique — c'est lui qui doit ouvrir cette fiche, pas une nouvelle
  carte d'accueil séparée. Deux ajouts pas encore dans `LocalProfile` : un
  petit avatar SVG par profil/machine (cohérent avec la direction « un peu
  débile assumé » de `GUI_REDESIGN_BRIEF.md` §6, et avec la contrainte déjà
  posée dans `DRAWING_CREATOR_CONCEPT.md`/`OP1_IMAGE_BIBLE.md` §8 : palette
  machine, canevas contraint, jamais un import externe non vérifié) ; et un
  résumé des scores/progression du module Exercices (déjà persistés
  localement, clé `op1-studio-exercise-progress-v1`, jamais envoyés hors de
  l'appareil) affiché sur cette fiche plutôt que seulement dans la fenêtre
  Exercices. Nécessite : étendre `LocalProfile`/`normalizeProfile`
  (`app/lib/profile.ts`) avec un champ avatar et une référence de lecture
  vers la progression Exercices, un nouveau contenu derrière le bouton
  Réglages (remplace la notice actuelle), et probablement un bouton par
  machine plutôt qu'un seul champ texte.
  **Dossier de travail réel confirmé le 14 août 2026** : l'utilisateur a un
  dossier `Music\OP-1\` sur sa machine (hors dépôt), déjà utilisé par un
  outil personnel séparé (« OP-1 Fun Collector », scraping op1.fun) — voir
  le `README.md` de ce dossier pour le détail. La structure de travail de
  l'app (`images/`, `patches/`, `sample-preflight/`, `samples/`, `tapes/`,
  `packs/`, `themes/`, `quarantine/`, `manifests/`, `content/`,
  `display-sorted/`, mêmes noms que les sous-dossiers déjà utilisés par
  `tools/*.py` dans `backups/` côté dépôt) y a été créée, plus une première
  vraie sauvegarde matérielle dans `backups/` (67 fichiers, ~269 Mo, SHA-256
  vérifié, `tools/backup_manifest.py`). Piège rencontré et déjà réglé :
  Windows ne distingue pas la casse des noms de dossier — un `firmware/`
  créé par erreur s'est glissé dans le `FIRMWARE/` déjà existant de
  l'utilisateur (sa propre convention `OFFICIEL/TRAVAIL/DOCUMENTATION/
  HACKS`) ; supprimé, la convention existante de l'utilisateur a été
  gardée telle quelle plutôt que d'imposer celle des outils.
  **Rangement du contenu existant (14 août 2026)** : les fichiers de
  l'outil personnel (« OP-1 Fun Collector ») regroupés dans
  `outils_op1_fun/` (5 fichiers, avant épars à la racine — `lancer.bat`
  continue de fonctionner, il change lui-même de dossier au démarrage) ;
  `PACKS_OP1_AVEC_SONS_PRESENTS/`, `PERCU/`, `SYNTH/`, `bibliotheque/`
  laissés à leur emplacement d'origine mais rendus visibles aussi sous
  `packs/`/`samples/` via des jonctions NTFS (`New-Item -ItemType
  Junction`) — même contenu, zéro copie, zéro octet en plus. `A_TRIER/`
  laissé tel quel (déjà son propre dossier « à trier »). Détail complet
  dans le `README.md` de ce dossier (hors dépôt). Pas cadré plus finement
  pour l'instant — à reprendre avec la même rigueur que le reste (schéma
  d'abord, UI ensuite, tests de round-trip du profil).
- **Cloud et service en ligne** : comptes, synchronisation, partage et
  commercialisation sont gelés hors périmètre. La priorité est un outil local
  fiable, installable et vérifiable ; aucune décision de service ne doit
  influencer le domaine matériel ou les formats locaux.
- **Dependance structurante** : le coeur Rust/Safe Change Engine reste le
  vrai chantier derriere l'installation Tauri et l'execution native. Les
  bridges Python servent au labo et aux fixtures, pas de coeur final cache.
  La commande Tauri `prepare_local_plan` est le premier adaptateur natif : elle
  valide les trois plans connus sans les executer.

L'audit detaille des garde-fous reels est conserve dans
[`TOOLS_SAFETY_AUDIT.md`](TOOLS_SAFETY_AUDIT.md). Il confirme notamment que
`device_transfer_plan.py execute/restore` est la seule surface d'ecriture
machine, et que l'association entre une sauvegarde et le volume cible doit
encore etre imposee par l'UI/coeur natif.

### Recalage des jalons

- **M1 Firmware** : socle local et Images livres ; flash et installation
  automatique restent explicitement hors périmètre. Le travail restant porte
  sur le contrôle du fichier, sa conservation locale et le guidage du
  déplacement manuel.
- **M2 Sauvegardes** : moteur de fichiers livre et teste sur hardware ;
  l'interface affiche encore une simulation et l'ejection native manque.
- **M3 Sons** : conversion, patches, index local et 24 pads livres ; la
  pre-ecoute des fichiers importes et le transfert utilisateur restent a fermer.
- **M4/M5 Studio** : coeur audio, projet v1 et trim focalise livres ;
  persistence des sources et import machine restent a fermer.
- **M4.5 Education** : prototype de fenetre seulement ; progression et
  verification de performance restent a construire.
- **M4.6 Visuel** : onglets, Escape et accessibilite de base livres ; le
  `SoundControlsPanel`, `FirmwareSubtabs`, `LocalProfilePanel`,
  `ExercisePanel`, `DocumentationPanel`, `BackupPanel`, `SoundsPanel`,
  `StudioModeHeader`, `StudioProjectToolbar`, `StudioTransportPanel` et
  `StudioTrackList` sont extraits ; `DisplayCreatorPanel` est livre dans
  Firmware > Graphismes de `app/page.tsx` sans changement de rendu. Le hub
  d'accueil par modules est maintenant livre ; le decoupage des autres ecrans
  reste a poursuivre. **Clavier Studio — état au 14 août 2026 matin** :
  après plusieurs allers-retours dans la même soirée, `StudioMachinePanel`
  est revenu à son rôle d'origine (rendu jouable uniquement, retour exact à
  la version commitée via `git checkout`) et l'éditeur de grille a été
  extrait dans `KeyboardEditor.tsx`, un composant séparé, **non monté nulle
  part pour l'instant** (mis de côté volontairement, pas supprimé). Le même
  `StudioMachinePanel` est maintenant affiché à deux endroits — fenêtre
  Studio et fenêtre Exercices (mode mélodie/accord) — plutôt qu'un clavier
  dupliqué. Les deux lisent la disposition via un nouveau module partagé,
  [`app/lib/keyboardLayout.ts`](../app/lib/keyboardLayout.ts)
  (`loadKeyboardLayout`, `sortKeyBlocks`, `layoutBounds`, constantes COLS/
  ROWS/notes communes), pour ne jamais diverger. L'écran « notes qui
  tombent » d'Exercices utilise ce même repère de colonnes que le clavier
  affiché juste en dessous : une note tombe dans la colonne exacte de sa
  touche, écran et clavier partageant le même `viewBox` horizontal. La
  section « Clavier MIDI construit » en fin de document décrit un état
  antérieur (64 colonnes, éditeur+clavier affichés ensemble) — toujours
  correcte pour la géométrie de `StudioMachinePanel` lui-même, mais ne
  mentionne pas encore le partage avec Exercices.

Le projet dispose aujourd'hui d'un prototype fonctionnel et de bridges locaux
testés pour firmware, samples, patches et préparation Tape. Les écrans sont
plus avancés que les transferts machine : les prochaines étapes donnent la
priorité au cœur projet/audio et au Safe Change Engine avant d'ajouter des
options visuelles.

Voir l'audit détaillé dans [`PROJECT_STATUS.md`](PROJECT_STATUS.md), la
version pas-à-pas sans jargon dans
[`FEUILLE_DE_ROUTE_SIMPLE.md`](FEUILLE_DE_ROUTE_SIMPLE.md), l'étude des
interfaces concurrentes section par section dans
[`ANALYSE_CONCURRENTS.md`](ANALYSE_CONCURRENTS.md), et la version complète
sans rien de coupé — faite pour être suivie par un agent IA sans
ambiguïté — dans [`ROADMAP_DE_L_ENFER.md`](ROADMAP_DE_L_ENFER.md).

## M0 — Fondations · terminé

- vision et périmètre OP‑1 original ;
- analyse du marché et modèle hybride ;
- base de connaissances et audit des outils ;
- politique de firmware et moteur de changements sûrs ;
- prototype web interactif ;
- licence, contribution et sécurité.

## M1 — Firmware Control Center · complexité L, risque élevé

**Etat : partiellement livré.** Inspection firmware, moteur de mods et build
hors machine sont valides. La détection réelle et une sauvegarde complète
vérifiée ont été validées sur un OP-1 original en mode Disk (`E:`). L'import
officiel reste à terminer dans le bridge local.

- monorepo React/TypeScript/Rust + coque Tauri ;
- détection en lecture seule des modes normal, Disk et TE‑boot ;
- lecture de version et inventaire de la machine ;
- sauvegarde complète minimale avec SHA‑256 ;
- catalogue officiel versionné sans redistribuer les binaires ;
- validation URL, CRC, LZMA/TAR et structure ;
- plan étape par étape : backup, validation, TE‑boot, copie, sync, éjection ;
- journal local et simulation complète sur fixtures ;
- matrice de tests Windows/macOS/Linux puis hardware-in-loop ;
- validation matérielle réalisée : deux snapshots de 67 fichiers, dernier
  snapshot de 282529116 octets, manifeste SHA-256 relu avec succès, sans
  écriture sur l'OP-1 ;
- éditeur d'images machine livré (`tools/display_bridge.py` + écran
  « Images ») : tri des 61 SVG `content/display/` par catégorie documentée
  et édition non destructive via patch JSON, voir
  [`LOCAL_TOOLS.md`](LOCAL_TOOLS.md#editeur-dimages-machine).

**Sortie :** une alpha qui guide une mise à jour officielle et refuse toute précondition ambiguë.

## M2 — Time Machine · complexité L

**Etat : interface et règles définies.** Le snapshot local et sa vérification
SHA-256 sont validés sur la machine. La copie vers l'OP-1, la restauration,
la déduplication et l'éjection contrôlée restent à finaliser. Le plan de
transfert et son exécution confirmée sont maintenant testés sur fixtures.

Les pistes Tape et Album sont couvertes par une sauvegarde locale vérifiée ; une
Time Capsule dédiée n'est pas prioritaire. Les samples restent dans la
Bibliothèque Sons, qui devient la priorité de ce jalon.

- snapshots horodatés et manifestes versionnés ;
- comparaison visuelle de deux états ;
- sauvegardes incrémentales et déduplication ;
- plan de restauration avec simulation ;
- reprise d’erreur et contrôle après écriture ;
- historique local compréhensible sans compte ;
- barre Storage/Usage avec seuil d'alerte coloré avant de bloquer une
  sauvegarde (comparatif dans [`ANALYSE_CONCURRENTS.md`](ANALYSE_CONCURRENTS.md)).

**Sortie :** la fonction récurrente qui rend l’app indispensable.

## M3 — Bibliothèque de sons · complexité L

Avancement : socle technique valide. FFmpeg, Rust/Cargo et `op-patch-util`
sont installables avec `tools/Install-OP1StudioTools.ps1`.
`sample_preflight.py` valide et classe les samples, et `patch_bridge.py`
produit un patch synthé de test sans modifier les sources.

**Etat : socle et interface livrés pour l'essentiel.** Index local avec
recherche/filtres/favoris (`SoundLibraryIndex`) et grille de 24 pads
(`SoundPadGrid`) existent déjà dans l'interface, cohérent avec la section
Sons de [`WINDOW_FUNCTIONS_SPEC.md`](WINDOW_FUNCTIONS_SPEC.md). La pré-écoute
des fichiers importés (bouton ▶, lecture via `Audio`/`URL.createObjectURL`)
était déjà en place — corrigé ici, cette ligne la donnait par erreur comme
manquante. **Tri de la bibliothèque : livré (14 août 2026)** — sélecteur nom/
durée/statut (un statut à corriger d'abord) et bouton « ★ Favoris » pour ne
garder que les favoris, appliqués aux deux colonnes. Seul le transfert
machine reste à terminer (voir M5.3).

- index local et import WAV/AIFF/FLAC/MP3/M4A/AAC/OGG/Opus ;
- **conversion automatique vers l'AIFF OP-1, avec contrôle durée, canaux,
  fréquence et profondeur : livrée côté conversion (M3.1 Phase B/C,
  `convertToOp1Audio` + bouton « Préparer le fichier » dans
  `SoundControlsPanel`) ; « avant transfert » reste ouvert, aucun transfert
  machine n'existe encore (voir M5.3) ;**
- **waveform, écoute (bouton ▶ sur chaque carte, déjà en place avant
  M3.1), trim (suggestion + application) et fondus : livrés.** Reste ouvert :
  application automatique du gain suggéré (affichage seul pour l'instant) ;
- **rendu 44,1 kHz / 16 bits : livré (M3.1 Phase B)** ;
- modes synth 6 s et drum 12 s ;
- **lecture de patches : livrée** (`readOp1PatchJson`/`isDrumPatch`/
  `drumMarkersInSeconds`, `app/lib/aiffPatchOracle.ts`). **Écriture** :
  décision déjà actée dans `TOOLING_AUDIT.md` de déléguer à `op-patch-util`
  via `tools/patch_bridge.py` plutôt que réimplémenter l'écriture du chunk
  `APPL` côté JS (voir la recette et les 3 implémentations recoupées dans
  `AUDIO_FILE_FORMAT_REFERENCE.md` §2, §5) — les « tests croisés » restent à
  faire côté `patch_bridge.py`, pas un chantier JS ;
- transfert par le Safe Change Engine ;
- **tableau de bibliothèque avec recherche, filtre par type, favoris et tri :
  livré (14 août 2026)** — tri nom/durée/statut, filtre favoris ;
- grille de pads fidèle à la disposition physique de l'OP-1 (réutilisée
  ensuite par M4.5) ;
- code couleur distinguant un son d'origine d'un son importé ;
- éditeur de synthèse qui **fabrique** un son (moteurs, ADSR, FX, LFO), pas
  seulement l'import de sample, avec contrôle de compatibilité qui refuse
  les valeurs hors plage machine avant export — idée notée le 13 août 2026,
  détaillée dans [`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md) ;
- **agent IA de rangement/création**, idée volontairement large notée le
  13 août 2026 dans [`PRODUCT_VISION.md`](PRODUCT_VISION.md) : classer/
  étiqueter la bibliothèque, proposer un rangement, générer des patches
  brouillons. Garde-fous déjà actés (propositions seulement, jamais
  d'écriture machine directe, local par défaut) — pas un jalon chiffré,
  reste au stade idée tant que le périmètre n'est pas resserré.

### M3.1 — Oracle audio, porté depuis EP-133 K.O. II · complexité M

Plan issu de l'évaluation du dépôt compagnon `EP-133-KO-II-Studio` (détail et
règles de sécurité dans
[`RAPPORT_REUTILISATION_EP133_POUR_OP1.md`](RAPPORT_REUTILISATION_EP133_POUR_OP1.md)) :
porter les **algorithmes** audio génériques, pas le modèle matériel EP-133
(slots, groupes A-D, SysEx, fréquences 26250/32000/46875 Hz — tout ça reste
propre à l'EP-133, à ne jamais brancher sur les racines OP-1).

- **Phase A — Oracle audio OP-1 : livrée (13 août 2026).** Portée depuis le
  fichier source réel (`src/core/audio/wavAnalysis.ts`, MIT, même auteur),
  pas seulement depuis sa description, dans
  [`app/lib/audioOracle.ts`](../app/lib/audioOracle.ts) :
  `analyzeWavBuffer`, `computeWaveformPeaks`, `detectSilenceTrim`,
  `suggestNormalizationGainDb`, `parseWavFormat`/`readSignedSample`
  partagés, plus `OP1_AUDIO_LIMITS`/`exceedsOp1Duration` (6 s synth/12 s
  drum, propres à ce projet). Lecture RIFF/WAVE directe, pas
  `AudioContext.decodeAudioData()` seul. 9 tests synthétiques dans
  [`tests/audio-oracle.test.mjs`](../tests/audio-oracle.test.mjs)
  (profondeurs 8/16/24/32 bits + float32, canaux, écrêtage exact, silence,
  limites de durée, fichier illisible) ; `npm test` build + fait tourner
  cette suite.
- **Phase C — branché dans `SoundControlsPanel` (13 août 2026), v1 minimale.**
  Sélection d'un WAV → analyse immédiate côté client (durée vs limite
  synth/drum du mode actif, fréquence, canaux, profondeur, crête et
  écrêtage, trim par silence suggéré, gain de normalisation suggéré).
  Affichage seulement : rien n'est coupé, converti ni transféré depuis ce
  panneau. Les fichiers non-WAV (AIFF, FLAC…) affichent un message clair au
  lieu d'un faux résultat — ils passent toujours par
  `tools/sample_preflight.py`.
- **AIFF + marqueurs de patch (13 août 2026).** L'OP-1 utilise l'AIFF, pas
  le WAV, pour ses patches et pistes — ajouté dans
  [`app/lib/aiffPatchOracle.ts`](../app/lib/aiffPatchOracle.ts) (code
  original, pas porté) : parseur AIFF big-endian (dont le flottant étendu 80
  bits du sample rate, vérifié contre l'exemple documenté d'`op-patch-util`),
  lecture du chunk `APPL`/`op-1`, et conversion des marqueurs `start`/`end`
  d'un patch drum (jusqu'à 24 sons différents dans un seul fichier) en
  secondes réelles. **Matérialisé visuellement** dans
  [`WaveformMarkers.tsx`](../app/components/WaveformMarkers.tsx) : forme
  d'onde réelle + ligne colorée et numérotée à chaque découpe, branché dans
  `SoundControlsPanel` (accepte maintenant WAV et AIFF, AIFF en priorité).
  7 tests dans
  [`tests/aiff-patch-oracle.test.mjs`](../tests/aiff-patch-oracle.test.mjs),
  dont un avec le JSON d'un vrai patch drum documenté. Trim par silence
  (`detectAiffSilenceTrim`) ajouté côté AIFF aussi (14 août 2026, même
  logique que le WAV, 2 tests de plus) — le préflight client couvre
  maintenant le format que l'OP-1 utilise réellement, pas seulement le WAV
  d'import. **Reste ouvert** : la conversion `start`/`end` suppose une
  échelle interne fixe de 12 s (§2.5 du rapport de format), non vérifiée sur
  matériel — à confirmer avant de s'en servir pour autre chose que de
  l'affichage. Branché dans `SoundLibraryIndex` (14 août 2026) : l'import
  d'un fichier y utilise maintenant le même oracle AIFF/WAV déterministe
  (repli `AudioContext.decodeAudioData` seulement pour les formats hors
  AIFF/WAV, ex. MP3/FLAC), avec les marqueurs de patch affichés sur la forme
  d'onde de chaque carte et un badge de type de patch (`drum`, `sampler`…)
  quand un chunk `APPL`/`op-1` est détecté ;
- **Phase B — Conversion OP-1 : livrée (14 août 2026).** Dans
  [`app/lib/audioConvert.ts`](../app/lib/audioConvert.ts) :
  `convertToOp1Audio(sourceBytes, options)` — extraction AIFF (priorité) ou
  WAV via les oracles existants, trim optionnel par sélection en secondes,
  repli de canaux (mono par défaut quel que soit l'entrée — c'est la cible
  documentée, pas un choix de confort), rééchantillonnage vers 44,1 kHz par
  interpolation linéaire, fondus entrée/sortie optionnels, encodage PCM 16
  bits avec dither TPDF **en AIFF par défaut** (`targetFormat: "wav"`
  disponible pour un usage hors machine). Jamais les cibles EP-133
  (26250/32000/46875 Hz) ; jamais d'écriture sur un volume OP-1 — produit un
  tampon en mémoire, rien d'autre. **Correction (14 août 2026, même
  chantier)** : la première version ne produisait que du WAV — repérée avant
  d'être utilisée, en relisant `AUDIO_FILE_FORMAT_REFERENCE.md` §1-2 :
  l'OP-1 lit l'AIFF pour `synth/user/*.aif`, `drum/user/*.aif` et les pistes
  Tape/Album, pas le WAV, donc un fichier « préparé » en WAV n'aurait pas été
  utilisable tel quel sur la machine. Corrigé en ajoutant un encodeur AIFF
  (`encodeAiffPcm16`, FORM/COMM/SSND big-endian) avec son propre encodeur du
  flottant étendu 80 bits du sample rate (`writeExtended80`, l'inverse exact
  du décodeur déjà dans `aiffPatchOracle.ts`), vérifié par un aller-retour :
  encoder puis reparser avec `parseAiffFormat` retombe bien sur 44100 Hz
  exactement. 7 tests dans
  [`tests/audio-convert.test.mjs`](../tests/audio-convert.test.mjs)
  (round-trip AIFF par défaut, round-trip WAV explicite, downmix
  stéréo→mono, rééchantillonnage avec durée préservée, trim, fondu, fichier
  illisible → `null`). **Reste ouvert** : interpolation linéaire moins
  fidèle qu'un sinc-resampler (`@alexanderolsen/libsamplerate-js`, utilisé
  côté EP-133) — upgrade possible mais pas prise ici, nécessite une
  dépendance en plus.
- **Phase C — Gestionnaire de samples (UI) : v1 branchée (14 août 2026).**
  Bouton « Préparer le fichier (AIFF mono 44,1 kHz/16 bits) » dans
  `SoundControlsPanel`, distinct de tout « transférer sur l'OP-1 » (qui
  n'existe pas encore) : case à cocher « appliquer le trim suggéré »
  (décochée par défaut — jamais appliqué seul), conversion locale via
  `convertToOp1Audio`, aperçu du résultat (format/durée/fréquence/canaux) et
  lien de téléchargement du fichier `.aif` produit (`URL.createObjectURL`,
  révoqué au changement de fichier ou au démontage). **Reste ouvert** : pas
  d'alerte d'écrêtage dédiée au fichier *converti* (seulement sur la source
  avant conversion) ; pas de gain de normalisation appliqué automatiquement,
  la valeur suggérée reste affichage seul ;
- **Phase D — Safe Change Engine** : rejoint M5.3, pas un chantier séparé —
  le plan de transfert `synth/user`/`drum/user` passe par les mêmes
  garde-fous (identité de volume, sauvegarde liée, confirmation explicite).

Phases A/B/C livrées (13-14 août 2026). Reste : Phase D quand M5.3 (transfert
réel vers l'OP-1) sera attaqué — pas avant, ça suppose du matériel branché
pour être vérifié.

## M4 — Studio · Tape & Album · complexité M/L

Avancement : dépassé par M5.2 ci-dessous, gardé ici pour l'historique du
périmètre. Ne pas lire ce paragraphe seul pour évaluer l'état du Studio —
le format projet v1, le piano-roll, le rendu offline et l'export Album sont
déjà livrés (voir M5.2). Ce qui reste vrai depuis ce jalon : la copie
machine complète (écriture réelle dans `tape/`) n'est toujours pas branchée
sur le pont local.

Le Studio propose deux modes : `Clone OP-1` pour travailler sans la machine et
`OP-1 MIDI` pour connecter l'appareil comme contrôleur et source de capture.

- lecture synchronisée des quatre pistes ;
- mute/solo, formes d’onde et repères ;
- export individuel ou groupé WAV/FLAC ;
- aperçu Album et détection des alias ;
- archivage du rendu avec le snapshot source.

## M4.5 — Éducation & disposition clavier · complexité M

**Avancement réel au 14 août 2026 matin**, largement au-delà du prototype
annoncé plus bas dans ce jalon : `ExercisePanel` a maintenant un écran
« notes qui tombent » façon Guitar Hero (SVG, vitesse réglable en BPM),
3 modes (Drumkit avec 4 pads, Mélodie avec gammes/arpège, Accord avec 5
suites), et le clavier joué est le **même composant** que celui du Studio
(`StudioMachinePanel`, prop `notesOnly`) — pas une copie, pour ne jamais
diverger. L'écran et le clavier partagent désormais le même repère de
colonnes ([`app/lib/keyboardLayout.ts`](../app/lib/keyboardLayout.ts)) :
une note tombe exactement au-dessus de sa touche. **Jugement note/timing et
progression livrés (14 août 2026)** : chaque pas est jugé une seule fois par
passage (réussi si toutes les notes cibles sont tenues au moment où le bloc
atteint la ligne de jeu), score en direct (réussis/total, précision, série,
meilleure série), et un record par exercice persisté en local
(`op1-studio-exercise-progress-v1`, jamais envoyé hors de l'appareil). Ce qui
suit reste la cible originale du jalon, une partie est donc déjà couverte :

- **disposition clavier ordinateur : livrée (14 août 2026)**, sans case à
  cocher AZERTY/QWERTY — `StudioMachinePanel` écoute `event.code` (position
  physique de la touche, pas le caractère produit), donc le même mappage
  fonctionne tel quel sur les deux dispositions. Corrige au passage un vrai
  bug trouvé en construisant ceci : cliquer une note sur le clavier affiché
  dans Exercices (mode Mélodie/Accord/Morceau) ne remontait pas vers le
  score — `StudioMachinePanel` a maintenant un callback `onPressedChange`
  pour ça, plus seulement le vrai MIDI entrant. Disposition des pads déjà
  calquée sur le mode Drum côté `SoundPadGrid` (pas encore réutilisée
  directement ici, drumkit garde sa propre grille 4 pads) ;
- exercices de finger drumming avec retour visuel et rythmique, inspirés du
  séquenceur Finger recréé par [`sampi/finger`](https://github.com/sampi/finger) ;
- **mode « apprendre un morceau » : livré (14 août 2026)** — import d'un
  fichier `.mid` (parseur Standard MIDI File original dans
  [`app/lib/midiFileImport.ts`](../app/lib/midiFileImport.ts), chunks
  `MThd`/`MTrk`, running status, changements de tempo, 5 tests dans
  [`tests/midi-file-import.test.mjs`](../tests/midi-file-import.test.mjs)),
  notes affichées comme un 4e mode « Morceau » sur le même écran/clavier que
  les autres, vitesse de lecture réglable en % (ralenti compris). **Boucle
  par section : livrée (14 août 2026)** — case « morceau entier » cochée par
  défaut (même comportement qu'avant) ; décochée, deux champs « début »/« fin »
  en secondes réelles du fichier (avant application de la vitesse)
  restreignent la boucle à un passage choisi, notes hors de la section
  filtrées avant même d'être placées sur l'écran de chute. **Reste ouvert** :
  toutes les pistes du fichier sont fusionnées en une seule performance, pas
  de choix de piste ;
- fonctionne en mode Clone OP-1 seul ou avec la machine connectée en entrée
  MIDI de contrôle ;
- fenêtre de travail dédiée « Exercices & Éducation », journal de progression
  local, aucune donnée envoyée hors de l'appareil ;
- trois entrées visibles dès l'ouverture (apprentissage structuré / leçons
  ciblées / morceaux), plutôt que cachées dans un menu.

**Touches d'effet : livré (14 août 2026).** Vérifié : T3 bascule
l'effet on/off sur la machine
([`SYNTH_DRUM_MODE_REFERENCE.md`](SYNTH_DRUM_MODE_REFERENCE.md) §1,
[`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §6). 5e mode « Effets »
dans `ExercisePanel.tsx` : un seul pad cible (« T3 · EFFET »), suites
on/off qui tombent comme les autres modes, même mécanique de jugement/score
que le reste (`EFFECT_NOTE`, une note MIDI sentinelle hors de toute plage
utilisée ailleurs, pour réutiliser le modèle de jugement existant sans le
dupliquer). Vérifié en direct dans le navigateur (exercice lancé, pad
cliqué, jugement et score corrects, aucune erreur console).

**Reste ouvert : niveaux plus difficiles par combos** — un mode « difficile »
qui demande plusieurs entrées simultanées (accord + pad Effet, ou tempo plus
rapide avec enchaînements), plutôt qu'une seule note/pad à la fois. Peut
maintenant s'appuyer sur le mode Effets livré ci-dessus pour la partie
« bouton d'effet » de la combinaison.

**Sortie :** un parcours d'apprentissage qui ne dépend pas de posséder la
machine pour s'entraîner, et qui rend la disposition clavier de l'OP-1
transparente pour un débutant.

## M4.6 — Chantier visuel & système de design · complexité M

Le style « machine OP-1 » (boutons, écran, bande magnétique) est déjà réussi
et cohérent. Ce jalon ne le refait pas : il le rend soutenable pour la suite
et l'étend proprement aux nouvelles fenêtres (Éducation, Documentation).

- extraire les valeurs répétées (tailles, espacements, couleurs) dans un
  jeu de tokens unique au lieu de les réécrire à chaque endroit ;
- découper `app/page.tsx` (plus de 1 200 lignes au 13 août 2026, en
  croissance malgré l'extraction déjà en cours — voir la liste de
  composants extraits sous « Recalage des jalons ») en composants par
  écran, sans changer le rendu visuel ;
- redessiner le clavier du clone pour refléter la vraie disposition de
  l'OP-1 (rangées colorées, zone batterie séparée de la zone synthé), requis
  pour que le module Éducation (M4.5) soit crédible ;
- remplacer toutes les formes d'onde décoratives par de vraies formes
  calculées depuis l'audio, dans tous les écrans concernés (Sons, Tape,
  Studio) ;
- créer les icônes d'application dans les tailles requises par Windows,
  macOS et Linux ;
- ajouter un premier écran d'accueil pour un nouvel utilisateur, au lieu
  d'ouvrir directement sur l'écran Firmware ;
- vérifier l'accessibilité : contraste suffisant, navigation complète au
  clavier, fermeture des fenêtres modales avec Échap ;
- préparer des captures d'écran propres pour le README et une future fiche
  de présentation ;
- écran d'accueil en grille de cartes par module avec badges de
  compatibilité (« sans machine » / « OP-1 requis »).

**Sortie :** une interface qui reste cohérente et facile à faire évoluer à
mesure que M4.5, M5 et les fenêtres suivantes s'ajoutent.

## M5 — Studio quatre pistes · complexité XL

Nouvelle cible produit : un éditeur interne professionnel, inspiré des
clones étudiés, avec une fenêtre de travail dédiée et non une bulle. Il doit
séparer le projet local, le moteur audio, le MIDI et l'import machine.

- projet local non destructif ;
- clips, découpe, déplacement, gain et fades ;
- rendu de quatre stems alignés, six minutes maximum ;
- plan d’import Tape après sauvegarde ;
- export du projet et de ses sources.
- fenêtre de travail dédiée avec transport, tempo, boucle et raccourcis ;
- capture MIDI OP-1 vers événements de projet ;
- grille piano-roll et quantification ;
- mixage local avant export Tape.

## M5.1 — Architecture professionnelle

- `Project` local versionné : tempo, pistes, clips, événements MIDI et sources ;
- `AudioEngine` isolé : lecture, gain, fades, rendu et pré-écoute ;
- `MidiEngine` isolé : détection, capture, horloge et sortie OP-1 ;
- `DeviceTransfer` isolé : sauvegarde, validation, copie, sync et éjection ;
- chaque outil s'ouvre dans une fenêtre dédiée, avec journal et état propre.

## M5.2 — Coeur projet et moteur audio

Avancement : format `op1-studio-project` v1 livré avec création, validation,
ouverture et enregistrement JSON depuis le Studio. Les clips conservent
maintenant la durée réelle des fichiers chargés et le transport suit l'horloge
audio maître. Le piano-roll est éditable, les événements MIDI sont rejoués
pendant le transport, la quantification 1/16 dépendante du BPM est livrée et
le rendu WAV offline applique gain, trim, mute/solo et fades, la vue globale
calcule les niveaux audio en 24 points par piste, les stems Tape sont
  exportables séparément et l'Album produit deux faces AIFF avec manifeste ; les
  références `source_refs` sont persistées et affichées comme à reconnecter au
  chargement ; le transfert machine reste à faire. Les types Web MIDI natifs
  de l'application sont maintenant stricts ; les types Cloudflare locaux
  déclarés dans `types/cloudflare-workers.d.ts` permettent à `tsc` global
  de passer sans modifier le runtime.

**Correction (14 août 2026)** : les exports « Stems » et « Album » imitaient
déjà les noms de fichiers réels de l'OP-1 (`track_N`, faces d'album) mais en
WAV stéréo, alors que `track_N.aif`/`side_a.aif`/`side_b.aif` sont de l'AIFF
**mono** 44,1 kHz/16 bits (`AUDIO_FILE_FORMAT_REFERENCE.md` §1, §3) — un
fichier ainsi nommé aurait semblé prêt à copier sur la machine sans l'être.
Repéré en revérifiant ce jalon après la même correction sur M3.1 (conversion
Sons), pas par un rapport utilisateur. Corrigé dans `app/page.tsx` :
`audioBufferToAiffMono` (downmix + `encodeAiffPcm16`, le même encodeur AIFF
que `app/lib/audioConvert.ts`, un seul endroit dans le dépôt qui écrit de
l'AIFF) remplace l'export WAV pour ces deux boutons ; noms de fichiers
alignés sur ceux du disque OP-1 (`track_1.aif`…`track_4.aif`,
`side_a.aif`/`side_b.aif`, au lieu de `album_face_a.wav`). Le bouton « Rendu
WAV » (mixdown générique d'écoute, pas un nom de fichier OP-1) reste
volontairement en WAV — rien à corriger là.

**Correction (14 août 2026)** : `Cannot close a closed AudioContext` —
erreur console réelle repérée en testant l'app en direct (capture
d'écrans pour `README.md`), pas un rapport utilisateur. L'effet qui calcule
les niveaux audio de la vue globale (24 points/piste) fermait
l'`AudioContext` deux fois : une fois dans son `.finally()` à la fin normale
du calcul, une deuxième fois dans le nettoyage de l'effet au changement de
fenêtre ou de `sources`. Corrigé avec un garde `closeOnce()` idempotent —
même `AudioContext` jamais fermé plus d'une fois, quel que soit l'ordre
entre la fin du calcul et le démontage.

- définir un format `Project` JSON versionné ;
- stocker sources, clips, événements MIDI, tempo et mixage ;
- calculer les waveforms depuis les fichiers, sans décorations ;
- implémenter trim, déplacement, gain, fades et rendu offline ;
- ajouter tests de round-trip projet et fixtures audio ;
- seulement ensuite relier la grille et les raccourcis clavier.

## M5.3 — Safe Change Engine machine

- identifier un volume par preuves combinées, jamais par son seul nom ; une
  empreinte structurelle est maintenant enregistrée dans les manifestes et
  comparée avant transfert ;
- créer et relire une sauvegarde avant écriture ;
- préparer un plan Tape/Sons avec liste exacte des fichiers ;
- copier vers un volume temporaire contrôlé, synchroniser, vérifier les hash ;
- exécuter les copies autorisées seulement après `--confirm`, sans suppression ;
- éjecter avec l'API système et afficher le résultat ;
- tester déconnexion, volume disparu et fichier partial.

Le premier garde-fou est livré sur fixtures. Les anciens manifestes sans
empreinte exacte ; les restaurations autorisent seulement les fichiers
manquants, jamais un fichier existant divergent. Les anciens manifestes sans
`deviceFingerprint` sont refusés et doivent être recréés.

## M6 — Service en ligne éventuel · gelé

Ce jalon n'est pas un objectif de développement actuel. Il restera vide tant
que les jalons locaux — Safe Change Engine, distribution desktop, tests
matériels et restauration — ne seront pas validés. Toute future étude devra
être une extension séparée, sans dépendance du produit local.

## M7 — Écosystème

- packs de sons avec manifestes et licences ;
- import manuel depuis services communautaires ;
- adaptateur OP‑1 Field séparé, uniquement lorsque le matériel sera disponible ;
- Labo expert firmware, isolé et opt-in ;
- API/plugin locale documentée ;
- traductions.

## M8 — Empaquetage & distribution desktop · complexité M

Le monorepo React/TypeScript/Rust et la coque Tauri existent déjà (M1). Ce
jalon rend l'application réellement installable, plutôt que lancée en mode
développeur.

- construire des installeurs pour Windows, macOS et Linux à partir de la
  même base Tauri ;
- brancher l'accès au volume USB de l'OP-1 et à la sortie audio directement
  depuis l'app installée, sans dépendre du navigateur (Web MIDI/USB) ;
- signer et notariser l'application sur chaque plateforme pour éviter les
  avertissements de sécurité au premier lancement ;
- vérifier que le Safe Change Engine (M5.3) fonctionne identiquement en
  mode installé et en mode développement.

**Sortie :** une version que quelqu'un en dehors du projet peut télécharger
et installer, sans lancer de commande.

## Documentation utilisateur française · en continu

Distincte de la documentation développeur (`docs/`) : un guide simplifié pour
un musicien non technique, tenu à jour au même rythme que les jalons livrés
plutôt qu'en une seule passe finale.

- démarrage rapide : brancher, première sauvegarde, premier son ;
- une page par espace livré (Firmware, Sauvegardes, Sons & patches, Studio,
  Exercices & Éducation) dès que l'espace correspondant sort du statut
  simulation ;
- FAQ des erreurs et messages de statut réels observés dans l'app ;
- accessible depuis la fenêtre « Documentation » de l'application, pas
  seulement dans le dépôt Git.

Premier jalon : voir [`GUIDE_UTILISATEUR.md`](GUIDE_UTILISATEUR.md).

## Premières issues techniques

| Issue | Taille | Dépendance |
|---|---:|---|
| Créer le monorepo interface/app/core | M | aucune |
| Définir `DeviceIdentity`, `DeviceMode`, `FirmwareRelease` | S | monorepo |
| Construire les fixtures Disk et TE‑boot | M | modèles |
| Scanner un volume en lecture seule | M | fixtures |
| Définir `BackupManifest` v1 | S | modèles |
| Copier + hacher une sauvegarde minimale | M | manifeste |
| Lire et valider l’enveloppe `.op1` sans extraction | M | fixtures firmware |
| Implémenter le `ChangePlan` firmware | M | scanner + backup |
| Relier le prototype au cœur via commandes typées | M | ChangePlan |
| Adaptateurs de sync/éjection par OS | L | ports stabilisés |

## Portes de qualité avant essai réel

1. aucune écriture possible sur une fixture non reconnue ;
2. toutes les traversées de chemin rejetées ;
3. panne injectée à chaque étape avec résultat récupérable ;
4. sauvegarde relue et vérifiée avant activation de TE‑boot ;
5. éjection native testée sur chaque OS ;
6. procédure relue face au guide officiel ;
7. bêta volontaire avec machine de test, jamais avec l’unique copie d’un morceau.

## Clavier MIDI construit

Le clavier Studio est construit dans une grille 64x16 puis rendu sous l'ecran
avec un SVG responsive. Le mode utilisation affiche uniquement le clavier
fabrique et charge ses blocs persistants. L'editeur de grille est conserve pour
maintenance, mais n'est pas monte dans cette interface et ne branche aucun
ecouteur clavier en fonctionnement normal.
