# Studio Hub

Studio Hub est l’atelier local qui réunit les outils OP‑1 et EP‑133 dans un
seul espace de travail. Le Hub conserve l’identité de l’utilisateur, les
machines déclarées, le dossier de travail et le coffre de sauvegardes ; les
studios restent responsables de leurs fonctions propres.

## Le produit en un regard

| Espace | Rôle |
| --- | --- |
| **Studio Hub** | Porte d’entrée, fiche persistante, inventaire des machines, espace partagé et coffre sélectif. |
| **OP‑1 Studio** | Tape & Album, sons, samples, images, services, patchs, firmware et exercices. |
| **EP‑133 Studio** | Sons, Pattern, Song, transferts, clone, documentation et entraînement Rhythm Hero. |
| **Synchronisation** | Transport MIDI commun, notes virtuelles, PANIC et relais contrôleur OP‑1 explicite. |

Le parcours prévu est :

```text
Landing → fiche Hub → page Outils → studio choisi → retour Hub
                         ├── coffre : sauvegarder / restaurer / sélectionner
                         └── MIDI : jouer OP‑1 et EP‑133 ensemble
```

La présentation fonctionnelle complète est dans
[docs/PRESENTATION_PRODUIT.md](docs/PRESENTATION_PRODUIT.md), et le dossier
destiné au design est dans [docs/dessin/00_INDEX.md](docs/dessin/00_INDEX.md).

## Démarrer localement

Pré-requis : Node.js 22+ et npm 10+.

```bash
npm ci
npm run dev:all
```

Points d’entrée locaux :

- Hub : <http://127.0.0.1:5179>
- OP‑1 Studio : <http://127.0.0.1:5175>
- EP‑133 Studio : <http://127.0.0.1:5177>

Le Hub est le point d’entrée recommandé : il ouvre les studios avec le profil,
la machine et l’espace de travail déclarés.

## Vérifier le dépôt

```bash
npm run typecheck:all
npm run build:all
npm run test:all
npm run lint:all
npm run test:e2e:hub
```

La validation matérielle reste séparée et prudente :

```bash
npm run hardware:validate
```

Les tests navigateur ne déclenchent pas d’écriture machine, de firmware, de
SysEx ou de transfert sans checkpoint et confirmation explicite.

## Organisation du dépôt

```text
apps/
  studio-hub/       portail, fiche, coffre et synchronisation
  op1-studio/       outils OP‑1
  ep133-studio/     outils EP‑133
packages/           contrats, audio, MIDI et utilitaires partagés
docs/               état courant, roadmaps, audits et dossier de design
archive/            matériel historique et prototypes conservés
e2e/ tools/         validations navigateur et matériel
```

Les packages expérimentaux sont conservés pour référence et évolution, mais
ne sont pas présentés comme des parcours produit validés tant qu’ils ne sont
pas raccordés à un écran et à un test utilisateur.

## État Git

`main` est la branche canonique du dépôt et contient la consolidation Hub,
OP‑1, EP‑133 et documentation. Les branches historiques restantes servent de
référence ; les nouvelles corrections doivent partir de `main`.

Pour comprendre les décisions et les prochaines portes :

- [État courant](STATUS_CURRENT.md)
- [Roadmap active](docs/ROADMAP_ACTIVE_2026-08-16.md)
- [Index documentaire](INDEX.md)
- [Alignement roadmap/code](ROADMAP_CODE_ALIGNMENT_2026-08-17.md)
- [Audit du code mort](AUDIT_CODE_MORT_2026-08-16.md)

## Licence et prudence

Consulter les fichiers `LICENSE` des applications et les notes de licence
associées avant toute redistribution. Les fonctionnalités de firmware,
transfert et écriture machine restent soumises à validation du matériel réel.
