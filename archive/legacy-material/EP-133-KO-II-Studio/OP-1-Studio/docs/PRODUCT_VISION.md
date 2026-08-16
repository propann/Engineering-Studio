# Vision produit

## Promesse

OP‑1 Studio doit rendre les opérations ordinaires de l’OP‑1 original aussi rassurantes qu’un gestionnaire de photos : on voit ce qui existe, on prévisualise, on prépare une action, puis on peut revenir en arrière grâce à une sauvegarde vérifiée.

Le produit est une **application locale professionnelle** : elle fonctionne hors
ligne et ne demande ni compte, abonnement ou service distant pour contrôler la
machine, sauvegarder son contenu, gérer les samples ou préparer des patches.
Toute fonction en ligne est hors périmètre de la première version et ne pourra
être envisagée qu'après validation de la fiabilité du cœur local.

## Utilisateurs visés

### Musicien qui veut protéger sa machine

Il connecte son OP‑1, obtient une vue claire des morceaux et sons, puis crée un instantané avant de libérer de la place ou de préparer une mise à jour de l’OS.

### Créateur de banques de sons

Il dépose des WAV, AIFF, FLAC, MP3 ou autres formats courants, écoute le
résultat converti, ajuste la coupe, trie ses sons et prépare des fichiers
compatibles sans mémoriser les contraintes techniques.

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
| Firmware | Version, catalogue officiel et guide TE‑boot | Oui |
| Studio | Arrangement de quatre stems et rendu compatible | Après le socle |
| Exercices & Éducation | Disposition clavier configurable, finger drumming avec retour, apprentissage de morceaux (import MIDI) | Après le socle Studio |
| Documentation | Guide utilisateur français simplifié, FAQ, aide contextuelle | Première version (partielle) |
| Labo expert | Inspection/repack de firmware tiers | Expérimental, opt-in |
| Synchronisation | Historique distant, synchronisation et partage privé | Extension optionnelle |

## Idée notée — un agent IA qui aide à ranger, classer et créer

Idée posée le 13 août 2026, volontairement large : une IA connectée à
l'application qui aide sur les sons et la musique — classer/étiqueter la
bibliothèque, proposer un rangement, créer des patches, suggérer des
arrangements. Pas de périmètre fermé pour l'instant (« je sais pas... tout »
dans les mots de la demande), donc pas un jalon à chiffrer aujourd'hui — noté
ici pour que l'idée ne se perde pas, avec les garde-fous déjà actés dans ce
document et non négociables si elle se construit un jour :

- l'IA agit sur des **propositions** (classement suggéré, patch généré comme
  brouillon), jamais sur une écriture machine directe — même règle que
  n'importe quel autre bouton de l'app (« la règle d'or », `README.md`) ;
  un patch généré doit passer par le même contrôle de compatibilité que
  l'éditeur de synthèse noté dans `ENGINE_EDITOR_CONCEPT.md` ;
- reste **local par défaut** : voir « Ce que la v1 ne promet pas » ci-dessous
  et `BUSINESS_MODEL.md` sur ce qui doit rester gratuit et sans compte ; si
  l'IA a besoin d'un service distant, ça rejoint la discussion Cloud/M6 déjà
  gelée, pas une exception ;
- aucun classement ou renommage silencieux de fichiers utilisateur sans
  confirmation visible, cohérent avec le reste de la bibliothèque Sons.

## Ce que la v1 ne promet pas

- Modifier directement les bases internes `tape.db` ou `op1.db`.
- Transformer les séquences internes en projet DAW universel.
- Flasher ou installer automatiquement le firmware depuis l’application.
- Distribuer les firmwares, manuels ou sons de Teenage Engineering.
- Prendre en charge l’OP‑1 Field par simple détection de nom ; il aura un adaptateur distinct.
- Héberger une place de marché ou aspirer automatiquement les catalogues communautaires.

## Critères de réussite de la première version

- Une sauvegarde complète peut être créée puis vérifiée sur Windows, macOS et Linux.
- Une restauration est précédée d’un plan lisible et refuse le mauvais volume.
- Les quatre fichiers de bande sont prévisualisables sans modifier la source.
- Un fichier audio courant peut être rendu conforme et copié dans une destination valide.
- Le gestionnaire firmware conserve le bon fichier, vérifie son intégrité et
  guide son déplacement manuel sur le volume attendu.
- Une coupure ou erreur laisse un journal compréhensible et ne masque jamais un résultat partiel.

## Principes de conception

1. **Le matériel donne les faits.** Les limites et dossiers sont observés lorsque possible, pas seulement codés en dur.
2. **Une action = un plan.** L’interface sépare préparation et exécution.
3. **L’audio reste écoutable.** Toute conversion importante offre un aperçu A/B.
4. **La prudence reste rapide.** Les sauvegardes peuvent être incrémentales, mais leur manifeste est complet.
5. **Les détails experts restent accessibles.** On explique les formats sans encombrer le parcours normal.
