# Bibliothèque centrale de sons

## Rôle

La bibliothèque de sons est une ressource du Studio Hub, distincte des
sauvegardes machine. Elle donne un catalogue commun à l’OP‑1 et à l’EP‑133
sans créer une nouvelle fiche utilisateur ni envoyer les fichiers sur un
service distant.

## Dossier local

```text
<workspace>/
└── shared/
    └── sounds/
        ├── originals/    # imports conservés tels quels
        ├── prepared/     # fichiers validés/préparés par un studio
        ├── packs/        # ensembles prêts à transférer
        ├── quarantine/   # fichiers à vérifier
        └── manifest.json
```

Le manifeste `studio-hub.sound-library.v1` contient le chemin relatif, la
taille, l’empreinte SHA‑256, le type, les tags, les favoris, les cibles
(`op1`/`ep133`) et la date d’import. Un même SHA‑256 ne peut pas être importé
deux fois par l’interface.

## Raccords

- **Hub** : import audio, recherche, filtres, tags, favoris, préécoute,
  suppression contrôlée et raccourcis vers les deux studios.
- **OP‑1 Studio** : reçoit le handle `shared/sounds` avec le workspace Hub et
  indexe les fichiers audio pour sa bibliothèque, son waveform et son
  preflight existants.
- **EP‑133 Studio** : conserve `ep133/samples` pour les fichiers de la
  machine, mais explore `shared/sounds` comme bibliothèque personnelle
  centrale. Les deux zones ne sont donc pas confondues.

Les studios ne copient pas automatiquement un son vers le matériel. La
préparation et le transfert restent des actions explicites avec les contrôles
propres à chaque machine.

## Vérification

Le parcours navigateur couvre l’import d’un WAV, l’écriture du manifeste et
la détection d’un second import identique. Les validations globales restent :

```bash
npm run typecheck:all
npm run test:all
npm run build:all
npm run test:e2e:hub
```
