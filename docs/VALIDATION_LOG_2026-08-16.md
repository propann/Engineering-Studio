# Journal de validation — 16 août 2026

Branche : `integration/studio-hub`  
Dépôt : `propann/OP-1-Studio`  
Validation initiale : aucune machine OP‑1 ou EP‑133 connectée

> Mise à jour matérielle : une EP‑133 est maintenant connectée. Les résultats
> détaillés sont dans [le rapport matériel](HARDWARE_VALIDATION_2026-08-16.md).

## Résultats

| Commande | Résultat |
|---|---|
| `npm run typecheck:all` | ✅ Tous les workspaces passent |
| `npm run test:all` | ✅ Tous les tests des workspaces actifs passent ; le workspace MIDI vide/non consommé a été retiré |
| `npm run build:all` | ✅ Hub, OP‑1 Studio et EP‑133 Studio passent |
| `npm run lint:all` | ✅ Aucun avertissement lint OP‑1 |
| `npm run test:e2e:hub` | ✅ 11 scénarios, 11 ouvertures d’outils |
| `git diff --check` | ✅ Aucun espace ou conflit de patch détecté |
| `npm run hardware:validate -- --python /tmp/ep133-scan-venv/bin/python --project 9` | ✅ Rapport centralisé lecture seule : P09, 532 sons, bridge local OK |

## Parcours E2E couverts

- fiche persistante → Hub des 7 outils après rechargement ;
- fiche persistante → réouverture d’un nouveau contexte navigateur sans recréation ;
- transmission des cibles OP‑1/EP‑133 (`hubTool`) ;
- réception par le Hub d’un événement EP‑133 versionné et filtré par origine/fenêtre, avec compteurs projets, samples et entraînement ;
- réception par le Hub d’un événement OP‑1 versionné et filtré par origine/fenêtre, avec compteurs projets et samples ;
- Pattern & Song EP‑133 : ouverture d’une démo, export MIDI vérifié par en-tête `MThd`, sauvegarde locale, archivage puis restauration réversible, passage en vue SONG et rechargement depuis la bibliothèque ;
- Rhythm Hero EP‑133 : démarrage d’une vraie séance locale, compte à rebours, frappe sur pad, score, journal d’entraînement et progression remontée au Hub ;
- coffre local : sauvegarde `tape` sélective, compteur Hub, restauration, progression par fichiers/octets et téléchargement des rapports JSON ;
- sample OP‑1 : import WAV, analyse puis préparation AIFF locale ;
- image OP‑1 : export SVG local, et services firmware/patchs sans machine ;
- sons EP‑133 : transfert démo préparé puis retiré avant confirmation, avec zéro appel d’écriture au bridge ; documentation OP‑1 ouverte hors machine.

## Validation matérielle ajoutée

- EP‑133 détectée en USB, MIDI et audio ; identité SysEx confirmée.
- P01 lu en lecture seule : 32 pads et 32 sons.
- Bibliothèque sonore inventoriée : 532 sons / 58,76 Mo.
- P01 à P09 lus ; checkpoint P09 créé et hashé localement.
- Une écriture de test ciblée a été effectuée sur P09 après confirmation,
  avec checkpoint frais, relecture octet à octet et activation vérifiée.

## Limites assumées

- Le coffre utilise une arborescence simulée dans le test navigateur ; le test
  sur vrai dossier et gros volume reste à faire.
- Le bridge EP‑133 `127.0.0.1:8765` n’est pas démarré pendant cette validation ; les erreurs proxy attendues ne bloquent pas les écrans hors machine.
- Aucune suppression ni restauration n’a été effectuée ; seule l’écriture de
  test explicitement confirmée sur P09 a été réalisée.
- La suite centralisée `tools/hardware_validation.py` refuse une écriture sans
  `--confirm-write` et produit les rapports locaux ignorés par Git.
- L’écriture matérielle EP‑133 et le test du coffre sur vrai gros volume
  restent dans la roadmap active.
