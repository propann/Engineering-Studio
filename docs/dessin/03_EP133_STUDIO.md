# Direction artistique — EP‑133 Studio

## Rôle

EP‑133 Studio est l’atelier rythmique : patterns, Song, projets, sons,
clonage local, tests MIDI/SysEx et Rhythm Hero.

## Espaces visibles dans le code

| Espace | Usage | Principal |
|---|---|---|
| Accueil | orientation vers les outils | `Éditeur`, `Sons`, `Jeux`, `Test machine` |
| Éditeur complet | patterns A/B/C/D, scènes et Song | `Lecture`, `Commit`, `Enregistrer` |
| Rhythm Hero | exercice, niveau, style et tempo | `Jouer`, `MIDI`, `Lecture` |
| Sons | banque machine, samples locaux et synchronisation | `Connecter EP‑133`, `Synchroniser` |
| Test machine | observation MIDI/SysEx et groupes | `Connecter`, `Scanner`, `Envoyer` |
| Documentation | guides et procédures | lecture uniquement |

## En-tête EP‑133

```text
[EP‑133] EP‑133 STUDIO / [Accueil] [Éditeur] [Sons] [Jeux] [Test]
[Nom machine] [64/128 Mo]                    [MIDI] [HUB OUTILS]
```

`Accueil` retourne à l’accueil EP‑133. `HUB OUTILS` revient au Studio Hub.
Le nom déclaré et la capacité doivent rester visibles sans prendre la place du
transport musical.

## Éditeur

Deux niveaux :

1. barre fichier : `Nouveau`, `Ouvrir`, `Importer`, `Enregistrer`, `Exporter` ;
2. barre musicale : groupes A/B/C/D, `PATTERNS`, `SONG`, `Lecture`, `Boucle`,
   BPM, longueur, `Annuler`, `Rétablir`.

Les actions destructives (`Supprimer`, `Archiver`) doivent être visuellement
éloignées de `Enregistrer` et demander confirmation.

## Sons

Le cœur visuel est une banque :

- machine à gauche ou en haut ;
- bibliothèque locale séparée ;
- waveform et informations du sample ;
- capacité mémoire ;
- bouton de synchronisation clairement distinct de la prévisualisation.

États : `EP‑133 non connecté`, `EP‑133 connecté`, `bibliothèque à reconnecter`,
`synchronisation en cours`, `synchronisation terminée`.

## Rhythm Hero

Le jeu doit privilégier le rythme et la lisibilité :

- `ACCUEIL` et `HUB OUTILS` fixes ;
- niveau et BPM réglables ;
- style/exercice sélectionnable ;
- `MIDI` indépendant de `JOUER` ;
- `LECTURE` pour écouter, `JOUER` pour lancer la session ;
- état de session verrouillé pendant la partie.

## Test machine

Ce n’est pas un écran décoratif : il doit avoir une apparence d’instrumentation
technique. Afficher port, SysEx, journal, groupe actif et avertissement avant
tout envoi.
