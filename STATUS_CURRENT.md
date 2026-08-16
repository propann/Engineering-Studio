# État courant — Studio Hub

**Recalage :** 16 août 2026 · **Branche :** `integration/studio-hub`

Ce fichier sépare l’état logiciel reproductible des validations matérielles.
La [roadmap active](docs/ROADMAP_ACTIVE_2026-08-16.md) reste la source de
priorités ; les rapports `STATUS.md`, `PROGRESS.md` et `TEAM_SYNC.md` sont
historiques.

## Livré et vérifié sans machine

- Portail Hub : fiche persistante, plusieurs machines nommées, EP‑133 64/128
  Mo, workspace local et coffre sélectif.
- Hub → OP‑1/EP‑133 : profil, workspace, transport Start/Stop/BPM et routage
  virtuel note/PANIC, avec filtrage origine, fenêtre source et schéma ; relais
  contrôleur OP‑1 explicitement activable, sans écho vers la sortie source.
- Cache partagé : enveloppe `studio-hub.cache.v1` commune pour profil et
  machine, avec compatibilité de lecture de l’ancien format.
- Workspace : reconnexion, permissions `read/readwrite`, volumes retirés et
  reprise après rechargement documentés dans `docs/WORKSPACE_PERMISSIONS.md`.
- Coffre : chaque copie est relue depuis sa destination et comparée par
  taille/SHA‑256 avant de valider le snapshot ou la restauration.
- Outils : OP‑1 image, samples, services/patchs ; EP‑133 sons, Pattern/Song,
  documentation et entraînement.
- Doublons : l’analyse WAV commune est centralisée dans
  `@studio-hub/audio-bridge` ; les différences OP‑1/EP‑133 restent dans leurs
  adaptateurs locaux. Le détail de l’inventaire est dans
  `docs/AUDIT_DOUBLONS_ET_OPTIMISATION_2026-08-16.md`.
- Tests : 14 scénarios E2E Hub, 20 tests unitaires MIDI, typecheck global,
  lint OP‑1, builds Hub/OP‑1/EP‑133 et `npm ci --dry-run`.

## Validations matérielles à considérer séparément

- La campagne EP‑133 lecture/écriture ciblée et les essais OP‑1 documentés
  dans `docs/HARDWARE_TESTS.md` et `docs/VALIDATION_LOG_2026-08-16.md` ne
  sont pas rejoués par les tests navigateur.
- Dernière détection réelle simultanée : OP‑1 et EP‑133 visibles en USB, MIDI
  et audio ; la lecture EP‑133 P09 et l’inventaire de 532 sons passent encore
  en lecture seule. Une séquence test Hub a aussi envoyé plusieurs notes,
  note-off, Start, horloge et Stop aux deux sorties sans modifier de projet.
- Le transport réel de base OP‑1/EP‑133 est maintenant confirmé : Chromium a
  envoyé Start, horloge 24 PPQN, Stop, plusieurs notes, leurs relâchements et
  PANIC aux deux sorties. Le relais contrôleur est couvert par E2E avec entrée
  simulée, mais l’OP‑1 était en mode classique pendant la passe matérielle.
  Restent à confirmer : test physique `COM → T2 / CTRL`, raccord des séquences internes,
  gros volume de sauvegarde, permissions FSA,
  débranchement/éjection et écriture complète contrôlée.

## Prochaines portes

1. Tester le coffre sur un vrai dossier et un volume important.
2. Documenter les refus de permission, câble retiré, volume différent et
   fichier corrompu.
3. Raccorder les séquences internes des studios au transport déjà validé,
   avec arrêt d’urgence et checkpoint avant toute séquence longue.
4. Revoir puis fusionner la PR d’intégration après ces contrôles.

## Règle de sécurité

Aucun test navigateur ne déclenche d’écriture machine, de firmware, de SysEx
ou de transfert de fichiers vers un appareil. Toute écriture réelle doit
passer par un checkpoint, un plan lisible, une confirmation explicite et une
relecture vérifiée.
