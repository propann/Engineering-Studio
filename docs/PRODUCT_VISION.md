# Vision produit

## Promesse

OP‑1 Studio doit rendre les opérations ordinaires de l’OP‑1 original aussi rassurantes qu’un gestionnaire de photos : on voit ce qui existe, on prévisualise, on prépare une action, puis on peut revenir en arrière grâce à une sauvegarde vérifiée.

Le produit est une **application locale** : elle fonctionne hors ligne et ne demande ni compte ni abonnement pour contrôler la machine, sauvegarder son contenu, gérer les samples ou préparer des patches. Un service distant reste une extension éventuelle, jamais une dépendance.

## Utilisateurs visés

### Musicien qui veut protéger sa machine

Il connecte son OP‑1, obtient une vue claire des morceaux et sons, puis crée un instantané avant de libérer de la place ou de mettre à jour l’OS.

### Créateur de banques de sons

Il dépose des WAV, AIFF, FLAC ou MP3, écoute le résultat converti, ajuste la coupe et prépare des patches compatibles sans mémoriser les contraintes techniques.

### Producteur qui termine sur ordinateur

Il prévisualise les quatre pistes de bande, les exporte comme stems et archive l’état exact ayant servi au mix.

### Utilisateur avancé

Il inspecte les métadonnées, compare des sauvegardes et expérimente avec des outils libres. Les fonctions à risque vivent dans un espace expert explicitement séparé.

## Parcours principal

```mermaid
flowchart LR
    CONNECT["Connecter"] --> SCAN["Analyser en lecture seule"]
    SCAN --> SNAP["Créer un instantané"]
    SNAP --> PLAN["Préparer les changements"]
    PLAN --> REVIEW["Vérifier"]
    REVIEW --> APPLY["Appliquer et contrôler"]
```

À chaque étape, l’utilisateur sait quel volume est visé, combien de fichiers seront touchés, combien d’espace est requis et quelle solution de repli existe.

## Espaces de l’interface

| Vue | Contenu essentiel | Première version |
|---|---|---|
| Accueil | Machine détectée, mode, capacité, OS, alertes | Oui |
| Explorateur | Arborescence logique, recherche, écoute, métadonnées | Oui |
| Sauvegardes | Historique, taille, intégrité, comparaison, restauration | Oui |
| Sons & patches | Bibliothèque, waveform, trim, conversion, éditeur de patch simple et transfert | Oui |
| Tape | Quatre pistes synchronisées, lecture, export | Oui |
| Firmware | Version, catalogue officiel, assistant TE‑boot | Oui |
| Studio | Arrangement de quatre stems et rendu compatible | Après le socle |
| Exercices & Éducation | Disposition clavier configurable, finger drumming avec retour, apprentissage de morceaux (import MIDI) | Après le socle Studio |
| Documentation | Guide utilisateur français simplifié, FAQ, aide contextuelle | Première version (partielle) |
| Labo expert | Inspection/repack de firmware tiers | Expérimental, opt-in |
| Synchronisation | Historique distant, synchronisation et partage privé | Extension optionnelle |

## Ce que la v1 ne promet pas

- Modifier directement les bases internes `tape.db` ou `op1.db`.
- Transformer les séquences internes en projet DAW universel.
- Mettre à jour le firmware sans intervention physique ni validation de l’utilisateur.
- Distribuer les firmwares, manuels ou sons de Teenage Engineering.
- Prendre en charge l’OP‑1 Field par simple détection de nom ; il aura un adaptateur distinct.
- Héberger une place de marché ou aspirer automatiquement les catalogues communautaires.

## Critères de réussite de la première version

- Une sauvegarde complète peut être créée puis vérifiée sur Windows, macOS et Linux.
- Une restauration est précédée d’un plan lisible et refuse le mauvais volume.
- Les quatre fichiers de bande sont prévisualisables sans modifier la source.
- Un fichier audio courant peut être rendu conforme et copié dans une destination valide.
- L’assistant firmware n’accepte que la machine, le mode et le fichier attendus.
- Une coupure ou erreur laisse un journal compréhensible et ne masque jamais un résultat partiel.

## Principes de conception

1. **Le matériel donne les faits.** Les limites et dossiers sont observés lorsque possible, pas seulement codés en dur.
2. **Une action = un plan.** L’interface sépare préparation et exécution.
3. **L’audio reste écoutable.** Toute conversion importante offre un aperçu A/B.
4. **La prudence reste rapide.** Les sauvegardes peuvent être incrémentales, mais leur manifeste est complet.
5. **Les détails experts restent accessibles.** On explique les formats sans encombrer le parcours normal.
