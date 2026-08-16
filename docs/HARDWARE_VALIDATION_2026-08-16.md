# Validation matérielle — EP‑133 — 16 août 2026

## Périmètre

Validation lecture seule de l’EP‑133 connecté sur Linux. Aucun projet, son ou
réglage n’a été écrit ou supprimé sur la machine.

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

## État du clone local

L’inventaire des métadonnées sonores est complet. Le téléchargement audio
complet a été interrompu volontairement après 61/532 sons car il était estimé
à environ 16 minutes supplémentaires ; le manifeste reste partiel et ne doit
pas être présenté comme une sauvegarde complète.

## Étape suivante sous contrôle

Une écriture de test sur P09 peut être préparée avec le checkpoint ci-dessus,
mais elle reste désactivée tant que le slot et l’autorisation d’écriture ne
sont pas confirmés explicitement. La commande prévue est documentée dans
`apps/ep133-studio/tools/send_project_to_machine.py` et exige `--confirm`.
