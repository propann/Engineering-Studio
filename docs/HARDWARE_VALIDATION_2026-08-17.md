# Validation matérielle — OP‑1 et EP‑133 — 17 août 2026

Cette passe a été exécutée avec les deux machines connectées. Les opérations
ci-dessous sont séparées des tests navigateur et n’ont déclenché aucune écriture
sur les machines.

## Résultats

| Machine | Opération | Résultat | Écriture machine |
|---|---|---|---|
| EP‑133 | Scan du projet 09 | 32 pads, 32 sons | Non |
| EP‑133 | Inventaire de la bibliothèque | 532 sons, 58 758 778 octets utilisés | Non |
| OP‑1 | Inventaire du volume disque | 66 fichiers, 282 644 880 octets | Non |
| OP‑1 | Copie locale complète et manifeste | 66/66 fichiers vérifiés par SHA‑256 | Non |

## Inventaire OP‑1

- `tape` : 4 fichiers, 127 140 288 octets.
- `album` : 2 fichiers, 127 008 224 octets.
- `synth` : 41 fichiers, 12 107 856 octets.
- `drum` : 19 fichiers, 16 388 512 octets.
- Modèle identifié : `op-1-original`.
- Confiance de l’inventaire : élevée.

La copie locale est conservée temporairement dans
`/tmp/op1-backup-readonly-20260817/` avec son manifeste. Elle a été vérifiée
par `backup_manifest.py verify` et retournée `valid: true`.

## Artifacts EP‑133

Le contrôle central a produit localement :

- `hardware-reports/ep133-20260817T062941Z.json` ;
- l’artefact de lecture du projet 09 ;
- l’index de bibliothèque sonore.

Ces rapports matériels sont générés localement et ne sont pas ajoutés au dépôt
pour éviter de versionner les données personnelles des machines.

## Ce qui reste à valider

1. Sauvegarde OP‑1 sélective `tape`, `album`, `synth` et `drum`.
2. Restauration vers une destination vide puis comparaison complète.
3. Cycle interrompu et reprise contrôlée.
4. Éjection propre et débranchement simulé.
5. EP‑133 : confirmation séparée de la capacité 64/128 Mo.
6. Toute écriture machine ciblée, uniquement après checkpoint explicite.

## Commandes utilisées

```bash
npm run hardware:validate
python3 apps/op1-studio/tools/device_inventory.py /media/azoth/54FF-1FEE
python3 apps/op1-studio/tools/backup_manifest.py create ...
python3 apps/op1-studio/tools/backup_manifest.py verify ...
```

Le volume OP‑1 était monté en lecture seule pendant l’inventaire et la copie.
