# Prochaine etape

Le mode Disk est valide et le mode normal est detecte par Windows. Les tests
interactifs MIDI/audio sont reportes pour eviter de valider un flux dans une
interface qui va encore changer.

Le chantier actif devient M4.6 :

- barre d'outils persistante avec onglets Firmware, Sauvegardes, Sons, Studio,
  Exercices et Documentation ;
- refondre le visuel des fenetres sans bulles imbriquees ;
- separer les ecrans Firmware, Sauvegardes, Sons, Studio et Exercices ;
- extraire les composants et tokens visuels reutilisables ;
- rendre la disposition Clone OP-1 plus lisible ;
- preparer les etats de connexion et les controles MIDI avant les tests live.

Apres cette refonte, reprendre la matrice MIDI : detection Web MIDI, capture
note-on/note-off, envoi vers l'OP-1, audio USB et exercice accompagne.
