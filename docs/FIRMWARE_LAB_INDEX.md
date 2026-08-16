# Laboratoire firmware — index central

Ce dossier de référence réunit le matériel utile au bidouillage **documenté,
réversible et local** de l’OP‑1 et de l’EP‑133. Les sources historiques ont été
comparées au dépôt actuel pour éviter les copies concurrentes.

La copie complète des anciens projets est conservée dans
[`../archive/legacy-material`](../archive/legacy-material) comme archive de
référence, séparée du code actif.

Le contrôle des éléments oubliés est détaillé dans
[`AUDIT_ANCIENS_DOSSIERS_2026-08-16.md`](./AUDIT_ANCIENS_DOSSIERS_2026-08-16.md).

## Où trouver quoi ?

| Domaine | Emplacement canonique | Contenu |
| --- | --- | --- |
| OP‑1 conteneur firmware | [`apps/op1-studio/docs/FIRMWARE_LAB.md`](../apps/op1-studio/docs/FIRMWARE_LAB.md) | format `.op1`, CRC, LZMA, TAR, te‑boot et procédure sûre |
| OP‑1 mods et ressources | [`apps/op1-studio/docs/FIRMWARE_MOD_CATALOG.md`](../apps/op1-studio/docs/FIRMWARE_MOD_CATALOG.md) et [`FIRMWARE_MOD_RESOURCES.md`](../apps/op1-studio/docs/FIRMWARE_MOD_RESOURCES.md) | catalogue, thèmes, patches graphiques et limites |
| OP‑1 outils | [`apps/op1-studio/tools/firmware_inspector.py`](../apps/op1-studio/tools/firmware_inspector.py), [`firmware_bridge.py`](../apps/op1-studio/tools/firmware_bridge.py), [`patch_bridge.py`](../apps/op1-studio/tools/patch_bridge.py) | inspection, préparation et contrôle local |
| OP‑1 données | [`apps/op1-studio/data/firmware`](../apps/op1-studio/data/firmware), [`data/mods`](../apps/op1-studio/data/mods) | catalogues et observations reproductibles |
| OP‑1 repacker isolé | [`apps/op1-studio/tools/vendor/op1repacker`](../apps/op1-studio/tools/vendor/op1repacker) | moteur de laboratoire et patches de fixture |
| EP‑133 protocoles | [`apps/ep133-studio/docs/REFERENCE_SYSEX_EP133.md`](../apps/ep133-studio/docs/REFERENCE_SYSEX_EP133.md), [`ETUDE_SYSEX_CONTROLE_EP133.md`](../apps/ep133-studio/docs/ETUDE_SYSEX_CONTROLE_EP133.md) | SysEx, MIDI et commandes étudiées |
| EP‑133 clonage matériel | [`apps/ep133-studio/docs/CLONAGE_COMPLET_MACHINE.md`](../apps/ep133-studio/docs/CLONAGE_COMPLET_MACHINE.md), [`FICHE_MACHINE_EP133.md`](../apps/ep133-studio/docs/FICHE_MACHINE_EP133.md) | miroir machine, sauvegarde, restauration et validation |
| EP‑133 études firmware/mods | [`apps/ep133-studio/etude/codex`](../apps/ep133-studio/etude/codex) | catalogue, formats et modifications hardware étudiées |
| Profil/vault local | [`apps/op1-studio/tools/profile_bridge.py`](../apps/op1-studio/tools/profile_bridge.py) | lecture/écriture atomique du `profile.json` du coffre |

## Matériel récupéré des anciens projets

- Les documents OP‑1, outils firmware, catalogues et ressources de
  `EP-133-KO-II-Studio/OP-1-Studio` étaient déjà présents dans
  `apps/op1-studio` et ont été conservés à leur emplacement canonique.
- Les études EP‑133 de l’ancien projet étaient déjà présentes dans
  `apps/ep133-studio`.
- Les éléments manquants `profile_bridge.py` et son test ont été copiés dans
  `apps/op1-studio`.
- Aucun fichier `.op1`, dump propriétaire, binaire de firmware ou contenu de
  `node_modules`/`dist` n’est ajouté au dépôt.

## Règles du labo

1. Toujours travailler sur une copie locale et conserver le firmware original.
2. Vérifier CRC, taille, chemins, marqueurs et manifeste avant toute sortie.
3. Ne jamais écrire directement sur le volume te‑boot depuis l’application.
4. Marquer toute reconstruction comme `UNOFFICIAL-MODIFIED`.
5. Garder les essais matériels et les résultats de validation séparés des
   données de production.

## Sources historiques consultées

- `/home/azoth/EP-133-KO-II-Studio`
- `/home/azoth/studio-ecosystem`
- `/home/azoth/Musique/Teenage/op1`
- `/home/azoth/Musique/Teenage/ep133`
