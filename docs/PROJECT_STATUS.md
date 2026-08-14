# OP-1 Studio - analyse globale

Etat verifie le 13 aout 2026.

Point d'avancement apres integration du Display Editor : les outils locaux
sont plus avances que leur branchement dans l'interface. Le tableau de bord
detaille et les priorites corrigees sont dans [`ROADMAP.md`](ROADMAP.md).

La matrice detaillee des tests materiels est dans
[`HARDWARE_TESTS.md`](HARDWARE_TESTS.md). Le mode Disk est valide pour le
cycle sauvegarde, suppression/restauration et verification ; le mode normal
MIDI est detecte par Windows avec audio et deux ports MIDI. La capture d'une
note dans Chrome/Edge est reportee apres la refonte visuelle M4.6 ; le chantier
actif est documente dans [`NEXT_STEP.md`](NEXT_STEP.md).

Validation materielle du 12 aout 2026 : un OP-1 original en mode Disk a ete
detecte sur `E:`. Deux sauvegardes locales de test ont copie 67 fichiers ; le
dernier snapshot contient 282529116 octets et sa verification SHA-256 est
valide. Entre les deux lectures, `tape/track_1.aif`, `tape/track_2.aif` et
neuf presets sous `synth/user/` ont change. Aucune operation n'a ecrit sur la
machine. Un test delete/restore controle a ensuite supprime puis restaure
`synth/user/8.aif` depuis le snapshot : 88778 octets, SHA-256 valide, aucun
fichier `.partial` restant.

## Point du 13-14 août 2026 — deux agents en parallèle

Session longue avec deux agents actifs en même temps sur ce dépôt : Codex
(déjà présent, cf. `.openai/`) et Claude (moi, arrivé en cours de route).
Coordination purement asynchrone via les fichiers du dépôt — pas de canal
direct entre les deux agents, voir `CONTEXT.md`. Répartition réelle,
vérifiée par `git status` et lecture des fichiers, pas de mémoire seule :

**Côté Claude** — documentation machine puis code Sons/Studio/Exercices :
- Références techniques : [`TAPE_MODE_REFERENCE.md`](TAPE_MODE_REFERENCE.md),
  [`SYNTH_DRUM_MODE_REFERENCE.md`](SYNTH_DRUM_MODE_REFERENCE.md),
  [`AUDIO_FILE_FORMAT_REFERENCE.md`](AUDIO_FILE_FORMAT_REFERENCE.md) (formats
  patch/AIFF, vérifiés contre le code source de 3 implémentations
  communautaires, pas seulement leurs README).
- `app/lib/audioOracle.ts` (oracle WAV porté du dépôt compagnon EP-133 K.O.
  II, voir [`RAPPORT_REUTILISATION_EP133_POUR_OP1.md`](RAPPORT_REUTILISATION_EP133_POUR_OP1.md))
  et `app/lib/aiffPatchOracle.ts` (AIFF + marqueurs de patch, code original) —
  16 tests entre les deux (`tests/audio-oracle.test.mjs`,
  `tests/aiff-patch-oracle.test.mjs`), branchés dans `SoundControlsPanel`
  avec affichage des marqueurs dans `WaveformMarkers.tsx`.
- Fenêtre Sons réorganisée en deux colonnes (Son machine / Son ordinateur),
  5 catégories réelles au lieu de 2, grille 24 pads retirée de cette vue.
- `app/lib/keyboardLayout.ts` : module partagé qui évite que le clavier
  (`StudioMachinePanel`) et l'écran d'exercice divergent sur la disposition.
- Fenêtre Exercices reconstruite (écran « notes qui tombent », clavier
  aligné colonne par colonne avec l'écran, mode `notesOnly`).
- `app/lib/audioConvert.ts` (`convertToOp1Audio`) : trim/downmix/
  rééchantillonnage/fondus + bouton « Préparer le fichier » dans
  `SoundControlsPanel`. Boucle par section ajoutée au mode « Morceau »
  d'Exercices.
- Corrections de dérive documentaire trouvées en vérifiant plutôt qu'en
  supposant : commit `op1aiff` épinglé sur un dépôt vide (`tools/sources.yml`),
  plusieurs sections de `ROADMAP.md` qui décrivaient un état déjà dépassé,
  et deux vraies régressions du même type détectées avant usage, pas par un
  rapport utilisateur : la première version de `convertToOp1Audio` (Sons) et
  les exports Stems/Album du Studio (`app/page.tsx`) ne produisaient que du
  WAV, alors que l'OP-1 lit l'AIFF (mono, en plus, pour Stems/Album) pour ses
  samples et ses pistes. Les deux corrigés avec le même encodeur AIFF
  (`encodeAiffPcm16`, exporté depuis `app/lib/audioConvert.ts`, réutilisé tel
  quel dans `page.tsx` plutôt que dupliqué), vérifié par aller-retour via le
  parseur AIFF existant.

**Côté Codex** — d'après les fichiers qu'il a écrits, pas vérifié en détail
par Claude : éditeur pixel `Op1PixelEditor.tsx` pour les images firmware,
avec étude comparative de 6 éditeurs pixel open-source dans
[`PIXEL_EDITOR_ARCHITECTURE.md`](PIXEL_EDITOR_ARCHITECTURE.md) ; organisation
du coffre d'images ([`IMAGE_LIBRARY.md`](IMAGE_LIBRARY.md)) ; matrice des
modes de connexion USB de l'OP-1
([`OP1_CONNECTION_MODES.md`](OP1_CONNECTION_MODES.md)) ; route API
`app/api/display-library/route.ts` ; itérations sur les bridges Python
(`sample_preflight.py`, `device_transfer_plan.py`, `backup_manifest.py`,
`content_catalog.py`) et sur `src-tauri/src/main.rs`.

Les deux agents ont édité `app/globals.css` et `docs/ROADMAP.md` sans
collision constatée jusqu'ici (fichiers touchés à des horaires différents,
vérifié avant chaque édition). Rien de tout ça n'est committé — tout reste
dans l'arbre de travail au 14 août 2026 matin.

## Point du 18 août 2026 — MIDI validé en réel, clavier Studio recalé

Première session avec l'OP-1 réellement branché en mode `CTRL` et une
capture MIDI interactive de bout en bout. Détail complet dans
[`HARDWARE_TESTS.md`](HARDWARE_TESTS.md) ; résumé :

- bug bloquant corrigé (`navigator.requestMIDIAccess` appelé détaché,
  `Illegal invocation` avalé silencieusement par les `.catch` existants —
  le journal MIDI restait à 0 quel que soit le mode de la machine) ;
- notes du clavier construit recalées sur la vraie machine (F3 sur la
  première touche, pas C3) ;
- couleurs des 4 encodeurs T1-T4 corrigées (bleu/vert/blanc/orange, pas
  rouge) d'après une photo produit officielle, VOLUME distingué comme
  potentiomètre analogique séparé (pas de MIDI) ;
- icônes des boutons redessinées sur le diagramme officiel TE
  (`teenage.engineering/guides/op-1/original/layout`) ;
- procédure d'association étendue aux encodeurs (rotation et clic,
  auparavant seuls les boutons verts/rouges l'acceptaient) ;
- panneau de configuration simplifié : ne montre plus que les boutons non
  encore associés, journal MIDI réduit à une ligne ;
- une vingtaine de boutons/encodeurs réels associés avec leurs vraies
  valeurs CC/note mesurées (pas supposées) ; SHIFT, VOLUME et les boutons
  de navigation bande confirmés silencieux en mode `CTRL`.

Reste à faire, explicitement reporté par l'utilisateur : rattacher ces
associations apprises aux fonctions réelles du Studio (actuellement elles
ne pilotent que le retour visuel du clavier construit).

## Fonctionne reellement

- Firmware : moteur `op1repacker` vendored, bridge de build par copie temporaire, mods selectionnes, manifeste SHA-256 et validation CRC/TAR/LZMA.
- Editeur d'images machine : `tools/display_bridge.py` deballe en lecture seule, trie les 61 SVG `content/display/` par categorie documentee (confiance haute/moyenne/basse selon la source) et ecrit un manifeste. L'ecran "Images" charge ces SVG localement, permet une edition non destructive et exporte un patch JSON compatible `op1_gfx.patch_image_file` ; aucune ecriture firmware automatique.
- Audio : FFmpeg, preflight WAV/AIFF, classement synth/drum, limites de duree et conversion mono 44,1 kHz / 16 bits.
- Patches : `op-patch-util` 1.1.0 et bridge synth/drum securise.
- Tape : bridge quatre pistes, conversion six minutes maximum, manifeste et sortie separee `tape/`.
- Projet Studio : format JSON `op1-studio-project` v1, creation, validation, enregistrement et rechargement du mixage, des clips et des evenements MIDI.
- Studio audio : quatre pistes, transport commun, position audio maitre, gain, trim de fin, fade-in et fade-out non destructifs.
- MIDI : détection Web MIDI OP-1, entrée/sortie identifiées, décodage note-on/note-off isolé dans `app/lib/midi.ts`, capture temporelle, piano-roll éditable et relecture MIDI programmée. Capture Chrome validée en réel le 18 août 2026 (voir `HARDWARE_TESTS.md`) : bug `requestMIDIAccess` détaché corrigé, notes et CC de la plupart des boutons/encodeurs mesurés sur le matériel, procédure d'association (dont le clic distinct des encodeurs) opérationnelle. Reste à faire : rattacher ces associations aux fonctions réelles du Studio.
- Clone : clavier ordinateur, touches visuelles, synthese locale de secours, sortie MIDI OP-1 et ecoute audio USB quand le navigateur expose l'interface.
- Clone Studio lateral : panneau retractable avec ecrans issus de la bibliotheque display,
  touches colorees sur les notes MIDI recues et commandes d'ecran marquees comme reperes
  MIDI a confirmer sur le materiel.
- Interface : fenetres de travail larges et barre d'outils persistante pour Firmware, Sauvegardes, Bibliotheque Sons, Studio, Exercices et Documentation.

## Reste a construire

- aucune copie, sauvegarde ou restauration n'est declenchee par l'interface ;
  l'execution des copies, le Safe Change Engine et l'ejection controlee restent a construire ;
- les manifestes de sauvegarde portent maintenant une empreinte structurelle du
  volume ; un transfert refuse une sauvegarde provenant d'un autre volume ;
- le decoupage complet de `app/page.tsx` et l'accueil par modules restent a faire ;
- l'index Sons et les 24 pads existent dans l'interface ; la pre-ecoute des fichiers
  importes et le transfert machine restent a fermer ;
- edition avancee du piano-roll ;
- reconnexion manuelle des sources audio locales à partir des références persistées ;
- transfert machine et écriture finale dans `tape/` ;
- Safe Change Engine : identification du volume, hash apres copie et ejection native ;
- module Exercices complet avec progression et import MIDI.

## Qualite connue

- `npm test`, le build, `npx tsc --noEmit` et les 39 tests Python passent ;
- le lint passe avec 19 avertissements non bloquants, principalement du code
  Studio ancien ou non utilise ;
- les types Cloudflare utilises par `db/` et `worker/` sont declares dans
  `types/cloudflare-workers.d.ts`, sans modifier le runtime.

## Limites connues

- Les fichiers audio choisis dans le navigateur restent des références locales. Un projet persiste désormais `source_refs` avec le chemin affiché et le statut `reconnect`; la re-sélection manuelle est requise pour réactiver une URL audio après réouverture.
- Le clone ne reproduit pas le moteur sonore interne de l'OP-1. Il fournit une synthese de controle ; le son reel vient de l'OP-1 via MIDI et audio USB lorsqu'ils sont disponibles.
- Les boutons de transfert affichent un plan prepare tant que le bridge natif et le volume autorise ne sont pas actifs.
- L'OP-1 Field est reporte jusqu'a disponibilite du materiel de test.

## Risques prioritaires

1. Confondre un plan prepare avec une operation machine reussie.
2. Ecrire sur le mauvais volume USB ou sans manifeste relu.
3. Perdre des fichiers sources pendant trim, conversion ou export.
4. Melanger Tape, Album et patches utilisateur.
5. Laisser l'interface promettre une fonction que le bridge ne realise pas.

## Portes de sortie professionnelles

- chaque commande locale a un contrat JSON versionne ;
- chaque sortie importante a une empreinte et un manifeste lisible ;
- chaque ecriture machine est precedee d'une sauvegarde et suivie d'une verification/ejection ;
- chaque moteur audio peut etre teste sans machine sur fixtures ;
- aucun bouton d'import ne pretend terminer l'installation avant confirmation.
