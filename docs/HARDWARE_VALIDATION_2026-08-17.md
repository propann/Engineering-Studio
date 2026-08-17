# Validation matérielle — OP‑1 et EP‑133 — 17 août 2026

Cette passe a été exécutée avec les deux machines connectées. Les opérations
ci-dessous sont séparées des tests navigateur et n’ont déclenché aucune écriture
sur les machines.

## Résultats

| Machine | Opération | Résultat | Écriture machine |
|---|---|---|---|
| EP‑133 | Scan du projet 09 | 32 pads, 32 sons | Non |
| EP‑133 | Inventaire de la bibliothèque | 532 sons, 58 758 778 octets utilisés | Non |
| EP‑133 | Capacité déclarée | 64 Mo, selon le propriétaire de la machine | Non |
| EP‑133 | Vérification locale de la jauge 64 Mo | Cibles et calcul de capacité validés | Non |
| OP‑1 | Inventaire du volume disque | 66 fichiers, 282 644 880 octets | Non |
| OP‑1 | Copie locale complète et manifeste | 66/66 fichiers vérifiés par SHA‑256 | Non |
| OP‑1 | Sauvegarde sélective `tape` + `synth/user` | 45 fichiers, 139 248 144 octets vérifiés | Non |
| OP‑1 | Restauration vers un dossier local vide | 45/45 fichiers vérifiés par SHA‑256 | Non |
| OP‑1 | Plan de transfert contre la machine | 45 fichiers déjà identiques, 0 copie proposée | Non |
| OP‑1 | Démontage propre du volume | Réussi | Non |

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

1. Sauvegarde sélective incluant aussi `album` et `drum` dans le parcours Hub.
2. Restauration contrôlée vers la machine après checkpoint explicite.
3. Cycle interrompu et reprise contrôlée.
4. Débranchement physique après éjection.
5. EP‑133 : conserver cette machine à 64 Mo ; ne jamais la traiter comme un
   modèle 128 Mo sans nouvelle déclaration explicite.
6. Toute autre écriture machine ciblée, uniquement après checkpoint explicite.

## Commandes utilisées

```bash
npm run hardware:validate
python3 apps/op1-studio/tools/device_inventory.py /media/azoth/54FF-1FEE
python3 apps/op1-studio/tools/backup_manifest.py create ...
python3 apps/op1-studio/tools/backup_manifest.py verify ...
```

Le volume OP‑1 était monté en lecture seule pendant l’inventaire et la copie.
Le clone EP‑133 est également lecture seule ; l’inventaire des 532 sons est
déjà validé par le scanner central. Une copie complète de chaque son n’est pas
nécessaire pour valider la capacité déclarée et n’a pas été poursuivie afin de
ne pas prolonger inutilement la session matérielle.
