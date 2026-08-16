# Validation matérielle — EP‑133 — 16 août 2026

## Périmètre

Validation de l’EP‑133 connecté sur Linux. Les lectures sont sans écriture ; un
test d’écriture a ensuite été effectué uniquement sur P09 après confirmation.

## Détection

- USB : `Teenage Engineering EP-133` — VID:PID `2367:8020`.
- MIDI : `EP-133 MIDI 1` — port ALSA `28:0`.
- Audio : périphérique, sink stéréo et source stéréo EP‑133 visibles.
- Identité SysEx : Teenage Engineering, famille `32`, membre `1`.

## Lectures réussies

- Projet P01 : 32 pads, groupes A/B/C/D, 32 sons référencés.
- Bibliothèque globale : 532 sons, 58,76 Mo annoncés par la machine.
- Projets P01 à P09 : lus et clonés localement dans `/tmp` ; aucun échec de
  lecture projet.
- Checkpoint P09 : `/tmp/ep133-hardware-checkpoint/checkpoints/P09-avant-20260816T073315Z.tar`
  — 72 192 octets — SHA‑256
  `5ccab4283ec73f10d7c539bf68b9be98a754b3bf5136517b3fe4b47291967781`.
- Comparaison hors ligne : 66 membres avant/après, taille inchangée ; la
  modification `patterns/a01` n’a été faite que dans le buffer de test.
- Écriture de test P09 : checkpoint frais, compilation, écriture, relecture
  octet à octet et `reload_project` réussis.
- Contrôle post-écriture : P09 relu à 72 192 octets, 32 pads, 32 sons, groupes
  A/B/C/D ; aucun membre supplémentaire ou supprimé.
- Checkpoint avant écriture :
  `/tmp/ep133-hardware-checkpoint/checkpoints/P09-avant-20260816T073610Z.tar`
  — SHA‑256 `5ccab4283ec73f10d7c539bf68b9be98a7547b3fe4b47291967781`.
- Checkpoint post-écriture :
  `/tmp/ep133-hardware-checkpoint-after-write/checkpoints/P09-avant-20260816T073631Z.tar`
  — SHA‑256 `972bb0110df03f2726435674a5fadd97e150af79d73fb163f5b2436b712f1693`.

## État du clone local

L’inventaire des métadonnées sonores est complet. Le téléchargement audio
complet a été interrompu volontairement après 61/532 sons car il était estimé
à environ 16 minutes supplémentaires ; le manifeste reste partiel et ne doit
pas être présenté comme une sauvegarde complète.

## Règle pour la suite

Le test P09 est validé. Les autres slots et les sons restent inchangés ; toute
nouvelle écriture exige son propre checkpoint et une confirmation explicite.

## Pont local

Le pont `tools/local_clone_bridge.py` a ensuite été lancé avec le venv
`/tmp/ep133-scan-venv` sur `http://127.0.0.1:8765`, vers
`/home/azoth/Musique/OP-133`. Les routes `/health`, `/clone/status`,
`/projects/list` et `/projects/read?slot=9` ont répondu ; l’application voit
les 9 projets et relit P09 à 72 192 octets. Aucun endpoint POST n’a été appelé.

## Dernière passe lecture seule — 16 août, 16:21 UTC

- USB/MIDI/audio : OP‑1 et EP‑133 détectés simultanément ; ports ALSA
  `OP-1 MIDI 1` (`hw:4,0,0`) et `EP-133 MIDI 1` (`hw:3,0,0`).
- EP‑133 P09 relu sans écriture : 32 pads, 32 sons.
- Bibliothèque EP‑133 relue sans écriture : 532 sons, 58,76 Mo.
- Le validateur central produit désormais des étapes `skipped` explicites si
  une machine disparaît avant un scan, au lieu d’exposer un traceback Python
  trompeur.
- Cette passe confirme les ports disponibles ; le démarrage/arrêt réel depuis
  le Hub et la mesure d’horloge reçue par les deux machines restent la
  prochaine étape, séparée de toute écriture de projet.
