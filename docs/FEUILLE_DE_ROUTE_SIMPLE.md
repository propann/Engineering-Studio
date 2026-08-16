# Feuille de route simple — OP-1 Studio

> **DOCUMENT HISTORIQUE — détail OP‑1.** Pour l’état actuel du Hub, de l’OP‑1
> et de l’EP‑133, consulter [`ROADMAP_ACTIVE_2026-08-16.md`](ROADMAP_ACTIVE_2026-08-16.md).
> Cette feuille reste utile comme parcours pédagogique et ne remplace pas la
> roadmap active.

Écrite pour qu'on puisse la suivre sans être développeur. Chaque ligne est une
case à cocher. On ne saute pas une phase pour aller à la suivante : l'ordre
existe pour une raison (surtout la Phase 1, qui protège la machine).

Le document technique détaillé reste [`ROADMAP.md`](ROADMAP.md). Celui-ci en
est la version « pas à pas », sans jargon.

---

## Ce qui est déjà fait (ne pas refaire)

- [x] L'appli sait lire un fichier firmware `.op1` et vérifier qu'il n'est pas
      abîmé.
- [x] L'appli sait préparer des mods firmware déjà connus (sans les installer).
- [x] L'appli sait préparer un son (WAV/AIFF) au bon format pour l'OP-1.
- [x] L'appli sait créer un patch de test (son + réglages) dans un dossier à
      part.
- [x] L'appli détecte l'OP-1 branché en MIDI (le voir, pas encore lui écrire).
- [x] Il y a un clavier à l'écran qu'on peut jouer avec le clavier de
      l'ordinateur ou un clavier MIDI.
- [x] Le style visuel « machine OP-1 » (boutons, écran, bande) existe déjà et
      est joli.

---

## PHASE 1 — Rendre la machine sûre à toucher

**Pourquoi en premier :** tant que cette phase n'est pas finie, l'appli ne
doit JAMAIS écrire sur la vraie machine. Toutes les autres phases en
dépendent.

- [ ] Reconnaître à coup sûr le volume USB de l'OP-1 (pas juste par son nom,
      qui peut être trompeur).
- [ ] Faire une vraie copie de sauvegarde complète de la machine (pas une
      simulation), avec une empreinte numérique pour vérifier qu'elle est
      complète.
- [ ] Relire cette sauvegarde et confirmer qu'elle est utilisable avant de
      continuer.
- [ ] Préparer un plan écrit et lisible de ce qui va être copié ou changé
      (quels fichiers, combien, où) avant de le faire.
- [ ] Copier réellement vers la machine, puis vérifier que la copie est
      identique (comparaison d'empreintes).
- [ ] Éjecter la machine proprement avec les commandes du système
      d'exploitation.
- [ ] Tester ce qui se passe si : le câble se débranche en cours de route, le
      volume disparaît, ou un fichier est à moitié copié. Dans tous les cas,
      l'appli doit pouvoir se rattraper sans abîmer les données.
- [ ] Refaire ces tests sur Windows, macOS et Linux.

---

## PHASE 2 — Rendre les sons et les patches réels

- [ ] Créer une liste locale de tous les sons déjà importés (un index qu'on
      peut chercher).
- [ ] Dessiner la vraie forme d'onde de chaque son (pas un dessin décoratif).
- [ ] Pouvoir écouter, découper et régler le volume d'un son avant de le
      valider.
- [ ] Pouvoir écrire et relire un patch (nom, catégorie, réglages) avec des
      tests qui comparent le résultat à d'autres outils connus.
- [ ] Envoyer un patch fini vers la machine, mais seulement via la Phase 1
      (jamais de raccourci direct).

---

## PHASE 3 — Rendre les sauvegardes réelles (Time Capsule)

- [ ] Créer un instantané daté à chaque sauvegarde, avec une fiche qui dit ce
      qu'il contient.
- [ ] Pouvoir comparer deux instantanés côte à côte (qu'est-ce qui a changé).
- [ ] Ne copier que ce qui a changé depuis la dernière fois (pour aller plus
      vite et prendre moins de place).
- [ ] Avant de restaurer, montrer un plan clair et demander confirmation.
- [ ] Garder un historique compréhensible, sans obliger à créer un compte.

---

## PHASE 4 — Rendre le Studio (Tape & Album) réel

- [ ] Sauvegarder un projet Studio qui garde tout : pistes, découpes, réglages
      (déjà commencé, à finir).
- [ ] Lire les quatre pistes en même temps, bien synchronisées.
- [ ] Découper, déplacer, régler le volume et ajouter des fondus sur chaque
      piste.
- [ ] Produire un rendu final propre (jusqu'à 6 minutes, comme la vraie
      machine).
- [ ] Exporter les pistes en WAV ou FLAC, une par une ou toutes ensemble.
- [ ] Préparer l'aperçu de l'Album (les faces) avant tout envoi vers la
      machine.
- [ ] Envoyer vers la machine uniquement via la Phase 1.

---

## PHASE 5 — Apprendre à jouer (le nouveau module Éducation)

- [ ] Permettre de choisir la disposition du clavier de l'ordinateur (AZERTY
      ou QWERTY), pour que les touches tombent au bon endroit.
- [ ] Recréer à l'écran la disposition exacte des pads de batterie de l'OP-1
      (mode Drum), pas juste un clavier de piano générique.
- [ ] Créer des exercices de « finger drumming » : un rythme à jouer, un
      retour visuel immédiat si c'est juste ou faux, possibilité de ralentir.
- [ ] Créer un mode « apprendre un morceau » : on importe un fichier MIDI, les
      touches à jouer s'allument à l'avance, on peut mettre en boucle un
      passage difficile.
- [ ] Faire en sorte que ce module marche même sans avoir l'OP-1 sous la main
      (clone à l'écran) et encore mieux avec la machine branchée en
      contrôleur.
- [ ] Garder tout l'historique d'entraînement en local, rien n'est envoyé
      ailleurs.

---

## PHASE 6 — Le chantier visuel (répondre à « c'est beaucoup de travail ? »)

Oui, c'est un vrai chantier à part entière. Voici tout ce qu'il contient :

- [ ] Sortir toutes les valeurs qui reviennent tout le temps (tailles de
      texte, espacements, couleurs) dans une liste unique, au lieu de les
      réécrire à chaque endroit. Ça évite les incohérences visuelles quand on
      ajoute un nouvel écran.
- [ ] Découper le gros fichier d'interface actuel (près de 700 lignes dans un
      seul fichier) en plusieurs petits fichiers, un par écran. Ça ne change
      rien pour l'utilisateur, mais ça évite que ça devienne un chantier
      ingérable au fil des ajouts.
- [ ] Redessiner le clavier du clone pour qu'il ressemble vraiment au clavier
      de l'OP-1 (les couleurs par rangée, la zone batterie séparée de la zone
      synthé), surtout pour que le module Éducation soit crédible.
- [ ] Remplacer toutes les fausses formes d'onde décoratives par de vraies
      formes d'onde calculées à partir du son.
- [ ] Créer les icônes de l'application dans toutes les tailles nécessaires
      pour Windows, macOS et Linux (aujourd'hui il n'existe qu'un seul logo
      simple).
- [ ] Ajouter un premier écran d'accueil pour un nouvel utilisateur qui ne
      connaît pas l'appli (aujourd'hui, on tombe directement dans l'écran
      Firmware, ce qui peut faire peur).
- [ ] Vérifier que les nouvelles fenêtres (Éducation, Documentation) gardent
      bien le même style que les fenêtres existantes.
- [ ] Vérifier l'accessibilité : contraste des couleurs suffisant, possibilité
      de tout faire au clavier, fermeture des fenêtres avec la touche Échap.
- [ ] Préparer des captures d'écran propres pour le README et une future
      fiche de présentation de l'appli.

---

## PHASE 7 — Emballer l'application (la rendre installable)

- [ ] Construire la version installable pour Windows, macOS et Linux (via
      Tauri, déjà commencé dans le dépôt).
- [ ] Faire fonctionner l'accès au volume USB de l'OP-1 et à la sortie audio
      directement depuis l'application installée, sans passer par un
      navigateur.
- [ ] Signer l'application pour chaque système, pour éviter les
      avertissements de sécurité au premier lancement.

---

## PHASE 8 — Documentation française pour les utilisateurs

- [ ] Écrire une page « démarrage rapide » : brancher, premier son, première
      sauvegarde.
- [ ] Écrire une page par écran, mais seulement une fois que l'écran fait
      vraiment ce qu'il promet (pas avant, pour ne pas mentir).
- [ ] Ajouter une FAQ des messages d'erreur qu'on voit vraiment dans l'appli.
- [ ] Rendre ce guide accessible directement depuis la fenêtre Documentation
      de l'appli, pas seulement sur GitHub.

(Le brouillon existe déjà : [`GUIDE_UTILISATEUR.md`](GUIDE_UTILISATEUR.md).)

---

## PHASE 9 — Plus tard (pas urgent)

- [ ] Sauvegarde en ligne chiffrée et synchronisation entre plusieurs
      ordinateurs (payant, optionnel).
- [ ] Packs de sons communautaires avec licences claires.
- [ ] Adaptateur pour l'OP-1 Field (machine différente, projet séparé).
- [ ] Suivre de loin le projet d'émulateur logiciel OP-1 (`op1emu`) — trop tôt
      et pas légal à intégrer aujourd'hui, juste à surveiller.

---

## Comment utiliser ce document

1. On travaille une phase à la fois, dans l'ordre.
2. On ne coche une case que quand c'est vraiment fini et testé, pas juste
   commencé.
3. Si une case bloque parce qu'elle dépend d'une autre, on le note en
   commentaire juste en dessous plutôt que de la sauter.
