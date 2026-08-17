# Brief design — tête du site et Hub des outils

**Destinataire :** dessinateur / designer UI  
**Date :** 17 août 2026  
**Périmètre :** porte d’entrée Studio Hub, en-têtes OP‑1 Studio et EP‑133
Studio, boutons de navigation et états machine.

## 1. Idée générale

Le produit n’est pas une collection d’applications indépendantes. C’est un
atelier local avec une porte d’entrée unique :

```text
STUDIO HUB
  ├─ Fiche personnage + machines déclarées
  ├─ Coffre de l’atelier : sauvegarder / restaurer
  ├─ OP‑1 Studio
  └─ EP‑133 Studio
```

La fiche personnage et le dossier de travail appartiennent au Hub. Les studios
ne doivent pas redemander l’identité de l’utilisateur. Leur en-tête doit
indiquer la machine et le module actif, puis permettre de revenir au Hub.

## 2. Porte d’entrée : Studio Hub

### Écran d’accueil

Fonction : reconnaître l’utilisateur et l’orienter.

| Élément | Fonction | Niveau visuel |
|---|---|---|
| Logo Studio Hub | Identité du produit | fort, toujours visible |
| « Créer ma fiche personnage » | Première utilisation | bouton principal |
| « Ouvrir mes outils » | Utilisateur reconnu | bouton principal |
| Texte local / hors compte | Rassurer sur les données | information secondaire |

### Tableau des outils

Les cartes actuellement prévues dans le code sont :

| Carte | Ce qu’elle ouvre | Icône suggérée | Couleur |
|---|---|---|---|
| OP‑1 Studio | firmware, tape, sons, sauvegardes, images | synthé / quatre boutons | bleu |
| EP‑133 Studio | patterns, Song, sons, clone, MIDI | pads / boîte à rythmes | orange |
| Éditeur d’image | création d’écrans OP‑1 | image / grille de pixels | violet |
| Jeux & entraînement | Rhythm Hero et exercices EP‑133 | manette / cible rythmique | vert |
| Bibliothèque de sons | catalogue commun OP‑1/EP‑133, tags, favoris et préécoute | onde / note musicale | turquoise |

Ces cartes sont des portes d’accès, pas des boutons d’action technique. Elles
doivent avoir une seule action claire : « Ouvrir OP‑1 », « Ouvrir EP‑133 »,
« Ouvrir l’éditeur », « Ouvrir les jeux ».

La carte **Bibliothèque de sons** fait exception : elle descend vers la
ressource centrale du Hub. Son action principale est « Gérer les sons ». Elle
doit rendre visibles l’espace `shared/sounds`, le nombre de sons catalogués,
les filtres OP‑1/EP‑133 et les raccourcis vers les deux studios.

### Coffre de l’atelier

Le bouton « Gérer l’espace » ouvre la zone de sauvegarde centrale. Cette zone
doit être visuellement distincte des studios : elle agit sur les fichiers et
peut prendre plusieurs minutes.

Boutons à représenter :

- `Connecter` / `Changer` l’espace maître ;
- `OP‑1` ou `EP‑133` pour choisir la machine ;
- `Choisir la machine` pour sélectionner la source ;
- cases à cocher de catégories ;
- `Sauvegarder la sélection` ;
- `Choisir la cible` ;
- `Restaurer la sélection`.

Pendant une opération, afficher systématiquement :

- « Sauvegarde en cours… » ou « Restauration en cours… » ;
- fichiers traités / fichiers totaux ;
- pourcentage ;
- catégorie en cours ;
- avertissement : « Ne débranche pas la machine et garde cette fenêtre ouverte. »

## 3. OP‑1 Studio : rôle de chaque module

L’OP‑1 est l’atelier synthé. Son écran d’accueil actuel contient huit modules.

| Module | Fonction réelle | Machine obligatoire ? | Bouton principal |
|---|---|---:|---|
| Firmware | consulter le catalogue, préparer des actions contrôlées, sélectionner des mods | non pour la préparation | `Préparer` / `Vérifier` |
| Sauvegardes | préparer, vérifier et décrire un backup OP‑1 | oui pour l’opération machine | `Préparer une sauvegarde` |
| Sons | éditer un sample, waveform, trim, fondus, préparer un pack de sons | non pour préparer ; oui pour transférer | `Préparer le pack` puis `Préparer le transfert` |
| Studio | travailler Tape, pistes, mixage, trim, fondus, stems et Album | non en mode local ; MIDI pour jouer avec la machine | `Nouveau projet`, `Ouvrir`, `Enregistrer`, `Lecture` |
| Images | cataloguer les écrans et ouvrir l’éditeur pixel 320×160 | non pour l’édition locale | `Ouvrir l’éditeur pixel`, `Exporter le patch` |
| Services | consulter les outils locaux, sources et procédures | non | `Ouvrir` / `Consulter` |
| Exercices MIDI | exercices de clavier et retour MIDI | oui pour le retour matériel | `Démarrer l’exercice`, `Connecter MIDI` |
| Documentation | règles, procédures et limites de sécurité | non | liens de lecture, pas d’action destructive |

### En-tête OP‑1 recommandé

```text
[logo OP‑1]  OP‑1 STUDIO  /  [module actif]
             [Firmware] [Sauvegardes] [Sons] [Studio] [Images]
             [Services] [Documentation] [Exercices MIDI]
             [état pont local] [état MIDI] [HUB OUTILS]
```

`Accueil` revient à la grille des modules OP‑1. `HUB OUTILS` ferme ou quitte
l’outil et revient au tableau du Hub. `Réglages` doit rester secondaire tant
qu’il n’ouvre pas une vraie page ; il ne doit pas avoir le même poids qu’un
module fonctionnel.

## 4. Éditeur de samples OP‑1

C’est un outil de préparation audio, pas encore un bouton de transfert direct.

Parcours visuel :

```text
Importer WAV/AIFF → analyser → visualiser → régler début/fin
→ fondus → préparer en AIFF OP‑1 → exporter ou ajouter au pack
```

Boutons :

- `Choisir un fichier` : entrée locale ;
- `Préparer le fichier` : conversion locale, sans modifier l’original ;
- `Télécharger le fichier préparé` : export ;
- `Préparer le pack` : sélection de plusieurs catégories ;
- `Préparer le transfert` : plan local, pas promesse d’écriture machine.

Le bouton de préparation doit être positif et créatif. Le transfert doit avoir
un style plus prudent, avec une notice claire sur la machine et la confirmation.

## 5. EP‑133 Studio : rôle de chaque espace

| Espace | Fonction réelle | Boutons principaux |
|---|---|---|
| Accueil | choisir entre jeu, éditeur, sons, documentation et test machine | `JEU`, `ÉDITEUR`, `SONS`, `DOCUMENTATION`, `TEST MACHINE`, `HUB OUTILS` |
| Éditeur complet | patterns A/B/C/D, pads, Song, scènes, projets et exports | `Nouveau`, `Ouvrir`, `Enregistrer`, `Importer`, `Lecture`, `Commit`, `Annuler`, `Rétablir` |
| Rhythm Hero | exercices, niveau, style, BPM, aperçu et jeu | `MIDI`, `Lecture`, `Jouer`, `Dupliquer` |
| Sons | banque machine, samples locaux, waveform, groupes et synchronisation | `Connecter EP‑133`, `Synchroniser`, `Prévisualiser`, `Importer` |
| Test machine | observer MIDI/SysEx, sélectionner un groupe, envoyer un message appris | `Connecter`, `Scanner`, `Sélectionner groupe`, `Envoyer` |
| Documentation | procédures et limites | lecture uniquement |

### En-tête EP‑133 recommandé

```text
[logo EP‑133]  EP‑133 STUDIO  /  [Accueil | Éditeur | Sons | Jeux | Test]
                 [machine déclarée] [64/128 Mo]
                 [MIDI déconnecté / MIDI ✓] [HUB OUTILS]
```

Dans l’éditeur, garder une seconde barre dédiée au travail musical :

```text
[ACCUEIL] [HUB OUTILS] [nom du projet]
[A] [B] [C] [D]   [PATTERNS] [SONG]
[Nouveau] [Ouvrir] [Enregistrer] [Importer]
[Lecture] [Boucle] [BPM] [Longueur]
```

Le bouton `HUB OUTILS` ne doit jamais être confondu avec `ACCUEIL` :
`ACCUEIL` revient à l’accueil EP‑133, `HUB OUTILS` revient au Studio Hub.

## 6. Système visuel des boutons

### Quatre niveaux seulement

1. **Principal** : créer, préparer, enregistrer, jouer. Une action dominante par écran.
2. **Secondaire** : ouvrir, choisir, importer, changer, consulter.
3. **Connexion** : MIDI, machine, workspace. Afficher l’état avant l’action.
4. **Danger** : supprimer, écraser, restaurer vers une machine. Couleur d’alerte,
   confirmation et description de la conséquence.

Ne pas créer un style différent pour chaque outil. Les différences OP‑1/EP‑133
doivent venir de la couleur d’accent et de l’icône, pas de règles de bouton
incompatibles.

### États obligatoires

Chaque bouton important doit avoir une version :

- normal ;
- survol/focus clavier ;
- désactivé avec raison visible ;
- machine absente ;
- connexion en cours ;
- opération en cours ;
- succès ;
- erreur récupérable.

Exemples de textes :

- `OP‑1 requis` plutôt qu’un bouton muet désactivé ;
- `Connecter EP‑133` puis `EP‑133 connecté ✓` ;
- `Sauvegarde en cours… 24 / 65 fichiers` ;
- `Préparation terminée — aucun transfert exécuté` ;
- `Erreur — réessayer`.

## 7. Hiérarchie à dessiner

Sur chaque écran, le designer doit pouvoir répondre à ces questions dans cet
ordre :

1. Dans quel produit suis-je : Hub, OP‑1 ou EP‑133 ?
2. Dans quel module suis-je : Sons, Studio, Sauvegardes, Jeu… ?
3. La machine est-elle connectée ?
4. Quelle est l’action principale ?
5. Cette action modifie-t-elle un fichier ou la machine ?
6. Où puis-je revenir : accueil du studio ou Hub ?

Si un écran nécessite plus de deux boutons principaux, il faut probablement
regrouper les actions secondaires dans une barre d’outils ou un menu.

## 8. Livrables demandés au dessinateur

- une proposition d’en-tête Hub ;
- une proposition d’en-tête OP‑1 ;
- une proposition d’en-tête EP‑133 ;
- la grille de cartes du Hub ;
- un jeu d’icônes cohérent pour machine, sauvegarde, son, image, jeu, MIDI et Hub ;
- les états connecté/déconnecté, occupé, succès et erreur ;
- une version desktop et une version fenêtre étroite ;
- les règles d’espacement, tailles de texte, contrastes et focus clavier.

Le designer ne doit pas redessiner un bouton pour chaque fonctionnalité : il
doit produire un petit système réutilisable par les trois applications.
