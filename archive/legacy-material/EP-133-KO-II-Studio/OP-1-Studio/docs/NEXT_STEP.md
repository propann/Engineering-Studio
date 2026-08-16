# Prochaine etape

Le mode Disk est valide et le mode normal est detecte par Windows. Les tests
interactifs MIDI sont faits (18 aout 2026, voir `HARDWARE_TESTS.md` et
`PROJECT_STATUS.md`) : capture reelle, bug `requestMIDIAccess` corrige,
notes/CC mesures sur le materiel. L'audio interactif (sortie USB) reste a
valider.

Le chantier actif devient le branchement progressif des plans locaux au pont
Tauri, tout en conservant les garde-fous de lecture seule et de confirmation :

- barre d'outils persistante avec onglets Firmware, Sauvegardes, Sons, Studio,
  Exercices et Documentation ;
- fermeture uniforme des fenetres avec `Echap` et etat actif accessible ;
- refondre le visuel des fenetres sans bulles imbriquees ;
- faire de Firmware la fenetre complete qui absorbe Images via le sous-onglet
  Graphismes ;
- separer les ecrans Sauvegardes, Sons, Studio, Exercices et Documentation ;
- extraire les composants et tokens visuels reutilisables ;
- rendre la disposition Clone OP-1 plus lisible ;
- preparer les etats de connexion et les controles MIDI avant les tests live ;
- faire retourner aux plans UI la reponse validee par `prepare_local_plan` quand
  l'application tourne sous Tauri.

Ordre de travail confirme. Les premiers sous-jalons sont livres : hub
d'accueil, `SoundControlsPanel`, grille `SoundPadGrid`, trim Studio et contrat
`app/lib/localBridge.ts`. Les deux documents d'inventaire definissent desormais
les fonctions cibles de chaque fenetre.

Ordre de travail confirme :

1. decouper les autres ecrans de `app/page.tsx` sans toucher aux invariants DisplayEditor ;
2. installer/auditer `op1aiff` et `op1svg`, absents du depot actuel, avant tout branchement ;
3. construire le createur de dessin original dans Firmware > Graphismes apres validation SVG ;
4. brancher l'interface native/Tauri au `profile.json` du coffre ; lecture et
   écriture atomique avec repli navigateur sont maintenant livrées ;
5. connecter les plans Firmware/Sauvegardes/Sons au pont natif, sans flash
   automatique ; validation Tauri livrée, exécution et éjection encore dans le
   Safe Change Engine ;
6. construire le Safe Change Engine sur fixtures : identité du volume, plan,
   copie temporaire, hash après copie et reprise récupérable ;
7. persister les sources Studio et reconnecter les fichiers locaux ;
8. ~~reprendre les tests MIDI/audio dans Chrome ou Edge~~ — fait pour le MIDI
   (18 aout 2026) ; reste l'audio interactif et le rattachement des
   associations apprises aux fonctions reelles du Studio.

Apres cette refonte, reprendre la matrice MIDI restante : audio USB et
exercice accompagne (detection Web MIDI, capture note-on/note-off et envoi
vers l'OP-1 sont valides, voir `HARDWARE_TESTS.md` du 18 aout 2026).
