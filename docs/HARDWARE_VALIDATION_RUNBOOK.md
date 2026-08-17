# Runbook de validation matérielle centralisée

La commande racine regroupe les contrôles EP‑133 existants dans un rapport
JSON local. Elle est en lecture seule par défaut et range les sorties dans
`hardware-reports/`, ignoré par Git.

Contrairement à l’OP‑1, l’EP‑133 n’expose pas de volume « Disk mode ». Son
USB‑C sert au MIDI/SysEx, au firmware et au transfert via EP Sample Tool. Les
projets sont donc lus ou écrits par le bridge `epsysex`, jamais par un chemin de
volume inventé.

## Lecture seule complète

Depuis la racine du dépôt :

```bash
npm run hardware:validate -- \
  --python /tmp/ep133-scan-venv/bin/python \
  --project 9 \
  --bridge-url http://127.0.0.1:8765
```

Le rapport contient la détection Linux, le projet scanné, l’inventaire de la
bibliothèque sonore et l’état des routes `/health`, `/clone/status` et
`/projects/list` du bridge. Les artefacts détaillés sont conservés à côté du
rapport local.

Si aucune EP‑133 n’est connectée, le validateur s’arrête après la détection,
marque les scans projet/bibliothèque comme `skipped` et ne produit pas de
traceback trompeur. Le rapport retourne alors `ok: false` avec la raison
`EP-133 absente`; le code de sortie 2 signifie « validation matérielle non
réalisée », pas une écriture effectuée ni une corruption du projet.

## Écriture contrôlée

Une écriture doit toujours être demandée séparément et fournir le slot ainsi
qu’une confirmation explicite :

```bash
npm run hardware:validate -- \
  --python /tmp/ep133-scan-venv/bin/python \
  --project 9 \
  --write-slot 9 \
  --confirm-write
```

Le runner délègue alors à `send_project_to_machine.py` via MIDI/SysEx. L’outil
prend le checkpoint, compile, écrit, relit octet par octet et active le slot.
Sans `--confirm-write`, la commande refuse de démarrer.

## Ordre recommandé

1. lancer le contrôle lecture seule ;
2. vérifier le rapport et le checkpoint ;
3. confirmer explicitement un slot brouillon ;
4. relire le slot et conserver le rapport ;
5. arrêter le bridge quand la session est terminée.
