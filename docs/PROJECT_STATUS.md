# OP-1 Studio - analyse globale

Etat verifie le 12 aout 2026.

La matrice detaillee des tests materiels est dans
[`HARDWARE_TESTS.md`](HARDWARE_TESTS.md). Le mode Disk est valide pour le
cycle sauvegarde, suppression/restauration et verification ; le mode normal
MIDI reste le prochain jalon.

Validation materielle du 12 aout 2026 : un OP-1 original en mode Disk a ete
detecte sur `E:`. Deux sauvegardes locales de test ont copie 67 fichiers ; le
dernier snapshot contient 282529116 octets et sa verification SHA-256 est
valide. Entre les deux lectures, `tape/track_1.aif`, `tape/track_2.aif` et
neuf presets sous `synth/user/` ont change. Aucune operation n'a ecrit sur la
machine. Un test delete/restore controle a ensuite supprime puis restaure
`synth/user/8.aif` depuis le snapshot : 88778 octets, SHA-256 valide, aucun
fichier `.partial` restant.

## Fonctionne reellement

- Firmware : moteur `op1repacker` vendored, bridge de build par copie temporaire, mods selectionnes, manifeste SHA-256 et validation CRC/TAR/LZMA.
- Audio : FFmpeg, preflight WAV/AIFF, classement synth/drum, limites de duree et conversion mono 44,1 kHz / 16 bits.
- Patches : `op-patch-util` 1.1.0 et bridge synth/drum securise.
- Tape : bridge quatre pistes, conversion six minutes maximum, manifeste et sortie separee `tape/`.
- Projet Studio : format JSON `op1-studio-project` v1, creation, validation, enregistrement et rechargement du mixage, des clips et des evenements MIDI.
- Studio audio : quatre pistes, transport commun, position audio maitre, gain, trim de fin, fade-in et fade-out non destructifs.
- MIDI : detection Web MIDI OP-1, entree/sortie identifiees, capture temporelle note-on/note-off, piano-roll editable et relecture MIDI programmee.
- Clone : clavier ordinateur, touches visuelles, synthese locale de secours, sortie MIDI OP-1 et ecoute audio USB quand le navigateur expose l'interface.
- Interface : fenetres de travail larges pour Firmware, Sauvegardes, Bibliotheque Sons, Studio et Exercices MIDI.

## Reste a construire

- aucune copie vers le volume OP-1 n'est declenchee par l'interface ;
- sauvegarde et restauration machine ne sont pas encore declenchees par l'interface ;
- edition avancee du piano-roll ;
- rechargement des sources audio depuis leurs chemins locaux ;
- transfert machine et écriture finale dans `tape/` ;
- Safe Change Engine : identification du volume, hash apres copie et ejection native ;
- module Exercices complet avec progression et import MIDI.

## Limites connues

- Les fichiers audio choisis dans le navigateur restent des references locales. Un projet recharge ses noms et reglages, mais les sources doivent etre re-selectionnees si elles ont change de dossier.
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
