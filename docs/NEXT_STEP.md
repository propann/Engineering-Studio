# Prochaine etape

Le mode Disk est valide et le mode normal est detecte par Windows. Les tests
interactifs MIDI/audio sont reportes pour eviter de valider un flux dans une
interface qui va encore changer.

Le chantier actif devient M4.6 :

- barre d'outils persistante avec onglets Firmware, Sauvegardes, Sons, Studio,
  Exercices et Documentation ;
- fermeture uniforme des fenetres avec `Echap` et etat actif accessible ;
- refondre le visuel des fenetres sans bulles imbriquees ;
- separer les ecrans Firmware, Sauvegardes, Sons, Studio et Exercices ;
- extraire les composants et tokens visuels reutilisables ;
- rendre la disposition Clone OP-1 plus lisible ;
- preparer les etats de connexion et les controles MIDI avant les tests live.

Ordre de travail confirme. Le premier sous-jalon du decoupage est livre : les
controles audio sont maintenant dans `app/components/SoundControlsPanel.tsx`.

Ordre de travail confirme :

1. decouper `app/page.tsx` en composants sans toucher a DisplayEditor ;
2. construire l'accueil par modules ;
3. ajouter la grille Sons de 24 pads et son composant reutilisable ;
4. simplifier le trim Studio ;
5. connecter les boutons de sauvegarde/transfert a un bridge local borne ;
6. reprendre les tests MIDI/audio dans Chrome ou Edge.

Apres cette refonte, reprendre la matrice MIDI : detection Web MIDI, capture
note-on/note-off, envoi vers l'OP-1, audio USB et exercice accompagne.
