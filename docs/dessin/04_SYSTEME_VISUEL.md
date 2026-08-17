# Système visuel commun

## Hiérarchie des actions

| Niveau | Usage | Aspect |
|---|---|---|
| Principal | créer, préparer, enregistrer, jouer | plein, accent de l’application |
| Secondaire | ouvrir, importer, choisir, consulter | contour ou surface neutre |
| Connexion | workspace, MIDI, machine | badge + bouton d’état |
| Danger | supprimer, écraser, restaurer machine | alerte, confirmation obligatoire |

Une vue ne doit avoir qu’une action principale. Les menus regroupent les
actions secondaires.

## Accents proposés

- Hub : graphite chaud + cyan local ;
- OP‑1 : bleu électrique ;
- EP‑133 : orange/coral ;
- image : violet ;
- jeu : vert signal ;
- danger : rouge réservé aux conséquences réelles.

Ne pas colorer toute la page. L’accent sert à repérer l’action active, l’outil
actif ou la machine connectée.

## Icônes

Icônes nécessaires : Hub, machine, firmware, sauvegarde, sample, waveform,
image, Tape, jeu, MIDI, documentation, workspace, import, export, lecture,
stop, annuler, rétablir, verrou, alerte.

Style : ligne simple, même épaisseur, lisible à 16–20 px. Pas d’emoji dans les
barres critiques ; les emoji peuvent rester dans les cartes d’identité du Hub.

## États obligatoires

Chaque composant critique possède : normal, focus clavier, hover, désactivé,
connexion en cours, opération en cours, succès et erreur récupérable.

Texte recommandé :

- `EP‑133 requis` plutôt qu’un bouton désactivé sans raison ;
- `Connexion en cours…` ;
- `Sauvegarde en cours… 24 / 65 fichiers` ;
- `Préparation terminée — aucun transfert exécuté` ;
- `Erreur — réessayer`.

## Grille et responsive

- desktop : navigation horizontale stable, contenu en deux colonnes maximum ;
- fenêtre étroite : navigation défilante ou menu regroupé, jamais des boutons
  minuscules ;
- priorité tactile : zones de clic généreuses, surtout pads, lecture, stop,
  synchronisation et restauration ;
- focus clavier visible et contrastes conformes ;
- les compteurs et pourcentages ne doivent pas être portés uniquement par la
  couleur.

## Composants à produire

1. `AppHeader` avec produit, module, statut machine et retour Hub ;
2. `ToolCard` pour le Hub ;
3. `StatusBadge` pour MIDI, bridge, workspace et machine ;
4. `ActionButton` avec les quatre niveaux ;
5. `ProgressPanel` pour sauvegarde, restauration et transfert ;
6. `EmptyState` pour absence de profil, workspace, machine ou projet ;
7. `ConfirmDialog` pour suppression et écriture machine.
