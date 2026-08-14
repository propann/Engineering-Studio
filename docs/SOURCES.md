# Sources et références

Dernière vérification : **11 août 2026**. Les liens officiels priment pour les procédures utilisateur. Les sources communautaires éclairent les formats et l’interopérabilité, mais leurs affirmations doivent être testées.

## Teenage Engineering — sources officielles

- [Guide de l’OP‑1 original](https://teenage.engineering/guides/op-1/original) — navigation générale et manuel courant.
- [Téléchargements de l’OP‑1 original](https://teenage.engineering/downloads/op-1/original) — firmwares officiels et notes de version.
- [TE‑boot](https://teenage.engineering/guides/op-1/original/te-boot) — mise à jour, test, reset et formatage.
- [Song rendering and connectivity](https://teenage.engineering/guides/op-1/original/song-rendering-and-connectivity) — Disk mode, sauvegarde/restauration, Album, MIDI.
- [Synthesizer mode](https://teenage.engineering/guides/op-1/original/synthesizer-mode) — sampler, sons utilisateur, snapshots et fichiers AIFF.
- [Drum mode](https://teenage.engineering/guides/op-1/original/drum-mode) — sampler drum et import AIFF.
- [Tape mode](https://teenage.engineering/guides/op-1/original/tape-mode) — quatre pistes, durée, résolution et exports.
- [Mixer](https://teenage.engineering/guides/op-1/original/mixer) — niveau/pan par piste, EQ, effet master et drive en aval de Tape.
- [Main modes](https://teenage.engineering/guides/op-1/original/main-modes) — Synth, Drum, Tape, Mixer et leurs raccourcis Shift.
- [Recording external sources](https://teenage.engineering/guides/op-1/original/recording-external-sources) — line, micro, radio, USB audio et resampling.
- [Sequencers](https://teenage.engineering/guides/op-1/original/sequencers) — séquenceurs et limites documentées.
- [Ancien manuel officiel PDF](https://teenage.engineering/_img/54b7f9bf8681400300255cab_original.pdf) — référence historique, non redistribuée ici.
- [Firmware officiel OP‑1 OS 246](https://teenage.engineering/_software/op-1/op1_246.op1) — lien de téléchargement éditeur, non committé.

## Formats, interopérabilité et outils libres

- [`op1-fw-archive`](https://github.com/op1hacks/op1-fw-archive) — historique communautaire des firmwares ; binaires non redistribués.
- [`op1-docs`](https://github.com/sualk/op1-docs) et [documentation op1hacks](https://github.com/op1hacks/docs) — format du conteneur et recherche firmware.
- [`op1repacker`](https://github.com/op1hacks/op1repacker) — unpack/repack et avertissements associés.
- [`op1REpackerGUI`](https://github.com/op1hacks/op1REpackerGUI) — interface communautaire et flux expert.
- [`opie`](https://github.com/op1hacks/opie) — ancien gestionnaire de sauvegardes et presets.
- [`teoperator`](https://github.com/schollz/teoperator) — génération de patches synth/drum.
- [`op-patch-util`](https://github.com/AlexCharlton/op-patch-util) — utilitaire Rust de patches.
- [`op1tools`](https://github.com/blattm/op1tools) — scripts Linux de fichiers et sauvegarde.
- [`OP-1Z-Sample-Manager`](https://github.com/romangarms/OP-1Z-Sample-Manager) et son [wiki](https://github.com/romangarms/OP-1Z-Sample-Manager/wiki/App-Functions) — gestion samples/tape/backup.
- [`OP-PatchStudio`](https://github.com/joseph-holland/op-patchstudio) — éditeur visuel de patches dans le navigateur.
- [`connect-op1`](https://github.com/jidagraphy/connect-op1) — expérimentation WebUSB et VID/PID.
- [`op1aiff`](https://github.com/op1hacks/op1aiff) — inspection/création de presets AIFF.
- [`op1svg`](https://github.com/op1hacks/op1svg) — SVG adaptés aux ressources de l’OP‑1.
- [op1.fun](https://op1.fun/) — bibliothèque communautaire de patches et outils web.
- [`op1-patch-preview`](https://github.com/dustMason/op1-patch-preview) — prévisualisation jouable de patches dans le navigateur.
- [`finger` (sampi)](https://github.com/sampi/finger) — séquenceur Finger OP‑1/OP‑Z recréé en Web MIDI API ; référence pour le module Éducation.
- [`marctdt/op-1-ableton-live-control-surface`](https://github.com/marctdt/op-1-ableton-live-control-surface) — fork communautaire actif du control surface Ableton Live (le dépôt officiel Teenage Engineering est archivé).
- [`op1emu`](https://github.com/op1emu) — projet en cours d'émulateur logiciel OP‑1 ; veille uniquement, non intégré.

## Web, application native et marché

- [File System Access API — Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) — accès aux fichiers/dossiers après autorisation utilisateur.
- [WebUSB Community Group Report](https://wicg.github.io/webusb/) — sécurité, classes protégées et limites d’accès USB depuis le web.
- [Tauri 2 — développement](https://v2.tauri.app/develop/) — communication entre interface web et cœur natif.
- [Manager for OP1 — App Store](https://apps.apple.com/us/app/manager-for-op1/id1521159543) — gestion de projets quatre pistes sur l’écosystème Apple.

## Politique documentaire

Le dépôt conserve des résumés factuels, URL et métadonnées. Le script [`../scripts/fetch-official-docs.sh`](../scripts/fetch-official-docs.sh) télécharge les pages officielles dans un cache ignoré par Git pour consultation personnelle. Avant une release, chaque règle critique doit référencer une source et un test.
