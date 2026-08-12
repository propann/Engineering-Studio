# OP-1 Studio - analyse globale

Etat constate le 12 aout 2026.

## Ce qui fonctionne réellement

- Firmware : moteur `op1repacker` vendored, bridge de build par copie
  temporaire, mods selectionnes, manifeste SHA-256 et validation CRC/TAR/LZMA.
- Audio : FFmpeg installe, preflight WAV/AIFF, classement synth/drum, limites
  de duree et conversion mono 44,1 kHz / 16 bits.
- Patches : `op-patch-util` 1.1.0 installe, bridge synth/drum securise, test de
  creation de patch synth valide.
- Tape : bridge quatre pistes, conversion six minutes maximum, manifeste et
  sortie separee `tape/`, teste sur deux pistes de la sauvegarde.
- MIDI : detection Web MIDI OP-1, entree/sortie identifiees sur la machine,
  capture de notes et comptage dans le Studio.
- Interface : fenetres de travail larges pour Firmware, Sauvegardes,
  Bibliotheque Sons, Studio et Exercices MIDI.

## Ce qui reste une preparation ou une simulation

- aucune copie vers le volume OP-1 n'est encore declenchee par l'interface ;
- sauvegarde et restauration passent encore par des messages de statut ;
- l'editeur Studio n'a pas encore de projet persistant, clips, piano-roll,
  quantification, rendu synchronise ni vrais fades ;
- les formes d'onde du Studio sont decoratives et non calculees depuis l'audio ;
- la capture MIDI compte les notes, mais ne cree pas encore des evenements
  temporels rejouables ;
- Album, mixage et export final restent a brancher sur le moteur audio.

## Risques prioritaires

1. Confondre un plan prepare avec une operation machine reussie.
2. Ecrire sur le mauvais volume USB ou sans manifeste relu.
3. Perdre des fichiers sources pendant trim, conversion ou export.
4. Melanger les formats Tape, Album et patches utilisateur.
5. Laisser l'interface promettre une fonction que le bridge ne realise pas.

## Portes de sortie professionnelles

- une commande locale a un contrat JSON versionne ;
- chaque sortie a une empreinte et un manifeste lisible ;
- chaque ecriture machine est precedee d'une sauvegarde et suivie d'une
  verification/ejection ;
- chaque moteur audio peut etre teste sans machine sur fixtures ;
- aucun bouton d'import ne pretend terminer l'installation avant confirmation.

