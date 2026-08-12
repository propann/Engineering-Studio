# Prochaine etape

Le mode Disk est valide et le mode normal est detecte par Windows. Les tests
interactifs MIDI/audio sont reportes pour eviter de valider un flux dans une
interface qui va encore changer.

Le chantier actif devient l'integration de l'architecture des fenetres :

- barre d'outils persistante avec onglets Firmware, Sauvegardes, Sons, Studio,
  Exercices et Documentation ;
- fermeture uniforme des fenetres avec `Echap` et etat actif accessible ;
- refondre le visuel des fenetres sans bulles imbriquees ;
- faire de Firmware la fenetre complete qui absorbe Images via le sous-onglet
  Graphismes ;
- separer les ecrans Sauvegardes, Sons, Studio, Exercices et Documentation ;
- extraire les composants et tokens visuels reutilisables ;
- rendre la disposition Clone OP-1 plus lisible ;
- preparer les etats de connexion et les controles MIDI avant les tests live.

Ordre de travail confirme. Les premiers sous-jalons sont livres : hub
d'accueil, `SoundControlsPanel`, grille `SoundPadGrid`, trim Studio et contrat
`app/lib/localBridge.ts`. Les deux documents d'inventaire definissent desormais
les fonctions cibles de chaque fenetre.

Ordre de travail confirme :

1. retirer l'onglet Images de transition apres validation du sous-onglet Graphismes ;
2. decouper les autres ecrans de `app/page.tsx` sans toucher aux invariants DisplayEditor ;
3. construire l'index local Sons et brancher le preflight ;
4. connecter le contrat de bridge a l'execution native sans flash automatique ;
5. persister les sources Studio et reconnecter les fichiers locaux ;
6. reprendre les tests MIDI/audio dans Chrome ou Edge.

Apres cette refonte, reprendre la matrice MIDI : detection Web MIDI, capture
note-on/note-off, envoi vers l'OP-1, audio USB et exercice accompagne.
