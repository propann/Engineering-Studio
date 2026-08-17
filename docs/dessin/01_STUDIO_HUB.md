# Direction artistique — Studio Hub

## Rôle

Studio Hub est la porte d’entrée unique. Il reconnaît l’utilisateur, conserve
sa fiche, déclare ses machines, ouvre les studios et gère le coffre local.

## Écrans à dessiner

### 1. Landing

Message : « Un atelier pour toutes tes machines. »

- première visite : `Créer ma fiche personnage` ;
- visite reconnue : `Ouvrir mes outils` ;
- sous-texte rassurant : local, hors compte, fichiers sur l’ordinateur.

### 2. Fiche personnage

Champs : nom, présentation, avatar, machines déclarées, capacité EP‑133,
workspace maître.

Actions :

- `Ajouter un OP‑1` ;
- `Ajouter un EP‑133` ;
- `Choisir un dossier` ;
- `Enregistrer la fiche` ;
- `Annuler` uniquement quand une fiche existe déjà.

La fiche doit ressembler à un atelier personnel, pas à un formulaire de compte.

### 3. Tableau des outils

Cartes principales :

| Carte | Promesse courte | Accent |
|---|---|---|
| OP‑1 Studio | sons, Tape, firmware, images, sauvegardes | bleu électrique |
| EP‑133 Studio | beats, Song, samples, MIDI, entraînement | orange pad |
| Éditeur d’image | écrans OP‑1 320×160 | violet pixel |
| Jeux & entraînement | Rhythm Hero | vert signal |

Chaque carte n’a qu’un bouton : `Ouvrir OP‑1`, `Ouvrir EP‑133`, `Ouvrir
l’éditeur`, `Ouvrir les jeux`.

### 4. Coffre de l’atelier

La zone coffre doit avoir une apparence plus sérieuse et plus calme que les
cartes créatives. Elle traite les fichiers et peut prendre plusieurs minutes.

Ordre de lecture :

1. espace maître connecté ou non ;
2. machine choisie ;
3. source ;
4. catégories cochées ;
5. action de sauvegarde/restauration ;
6. progression et résultat.

Boutons : `Connecter`, `Changer`, `Choisir la machine`, `Sauvegarder la
sélection`, `Choisir la cible`, `Restaurer la sélection`.

Catégories à représenter : `Tape`, `Album`, `Drum`, `Synth`, `Projects`,
`Samples`, selon la machine.

Pendant le travail :

```text
SAUVEGARDE EN COURS…
24 / 65 fichiers                         37 %
Copie de samples/synth/user/...
Ne débranche pas la machine.
```

## En-tête Hub

```text
[STUDIO HUB]       [Bienvenue, Nom]        [Ma fiche]
----------------------------------------------------------
[HUB DES OUTILS]   [OP‑1] [EP‑133] [ÉDITEUR] [JEUX]
----------------------------------------------------------
                 [COFFRE DE L’ATELIER]
```

Le Hub ne doit pas afficher une fausse connexion cloud. Le vocabulaire doit
rester `local`, `workspace`, `snapshot`, `restaurer`, `machine`.

## États

- aucun profil : accent découverte ;
- profil reconnu : message de retour personnalisé ;
- aucun workspace : carte coffre en attente ;
- workspace prêt : badge local actif ;
- opération en cours : interface verrouillée, progression visible ;
- erreur : cause + action de reprise, jamais un simple voyant rouge.
