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
  virtuel note/PANIC, avec filtrage origine, fenêtre source et schéma.
- Cache partagé : enveloppe `studio-hub.cache.v1` commune pour profil et
  machine, avec compatibilité de lecture de l’ancien format.
- Coffre : chaque copie est relue depuis sa destination et comparée par
  taille/SHA‑256 avant de valider le snapshot ou la restauration.
- Outils : OP‑1 image, samples, services/patchs ; EP‑133 sons, Pattern/Song,
  documentation et entraînement.
- Tests : 13 scénarios E2E Hub, 17 tests unitaires MIDI, typecheck global,
  lint OP‑1, builds Hub/OP‑1/EP‑133 et `npm ci --dry-run`.

## Validations matérielles à considérer séparément

- La campagne EP‑133 lecture/écriture ciblée et les essais OP‑1 documentés
  dans `docs/HARDWARE_TESTS.md` et `docs/VALIDATION_LOG_2026-08-16.md` ne
  sont pas rejoués par les tests navigateur.
- Restent à confirmer sur machine : paire OP‑1/EP‑133 synchronisée, gros
  volume de sauvegarde, permissions FSA, débranchement/éjection et écriture
  complète contrôlée.

## Prochaines portes

1. Tester le coffre sur un vrai dossier et un volume important.
2. Documenter les refus de permission, câble retiré, volume différent et
   fichier corrompu.
3. Valider tempo + Start/Stop sur les deux machines avant tout routage réel
   de séquences.
4. Revoir puis fusionner la PR d’intégration après ces contrôles.

## Règle de sécurité

Aucun test navigateur ne déclenche d’écriture machine, de firmware, de SysEx
ou de transfert de fichiers vers un appareil. Toute écriture réelle doit
passer par un checkpoint, un plan lisible, une confirmation explicite et une
relecture vérifiée.
