# Synthèse des études et travaux à engager

Cette synthèse transforme les audits, roadmaps, études d’anciens dépôts et
briefs produit en décisions utilisables. Elle complète le
[catalogue central](ETUDES_INDEX.md) ; elle ne remplace pas les rapports
détaillés.

## Décisions déjà prises

| Sujet | Décision | Conséquence |
|---|---|---|
| Identité utilisateur | Le Hub est l’unique fiche persistante | OP‑1 et EP‑133 reçoivent un contexte en lecture seule et ne recréent pas de profil |
| Organisation du dépôt | `main` est la branche canonique | Les anciennes branches et anciens dépôts servent de contexte, pas de chemin de développement |
| Éditeur d’image | Utiliser l’éditeur OP‑1 actuel | L’ancien éditeur SVG générique n’est pas recopié tel quel |
| Éditeur de samples | Utiliser l’éditeur OP‑1 actuel et l’analyse audio partagée | Les anciens prototypes restent des références, pas des doublons runtime |
| Audio | Centraliser l’analyse WAV dans `@studio-hub/audio-bridge` | Les contraintes propres à chaque machine restent dans les adaptateurs |
| Sauvegardes | Passer par le coffre Hub, manifeste, hash et checkpoint | Une écriture machine ne part jamais directement d’un simple bouton d’outil |
| Firmware | Séparer inspection, préparation et écriture | Toute modification réelle demande une confirmation, une relecture et un retour explicite |
| MIDI | Le Hub orchestre le transport et le PANIC | Les séquences internes restent à raccorder après le transport de base |
| Expérimental | Conserver, mais ne pas le présenter comme livré | Les paquets Phase 4 doivent gagner un consommateur et des tests avant promotion |

## Ce qui est réellement intégré

### Parcours produit

- Porte d’entrée Hub, fiche persistante et machines nommées.
- Déclaration EP‑133 64/128 Mo et workspace partagé.
- Huit accès outils : OP‑1, EP‑133, image, samples, services, sons,
  entraînement et synchronisation MIDI.
- Retour des studios vers le Hub avec contexte transmis et filtrage des
  messages.

### Outils

- Éditeur d’image OP‑1 avec aperçu et export local.
- Éditeur de samples OP‑1 avec analyse, conversion et export.
- Services/patchs OP‑1 en préparation et analyse contrôlées.
- Pattern/Song, sons/transferts et entraînement EP‑133 hors machine.
- Transport MIDI Start/Stop/horloge, notes courtes et PANIC validés en local
  et sur les sorties disponibles.

### Qualité et sécurité

- Typecheck, build, lint, tests de packages et scénarios Hub validés dans la
  dernière passe de code.
- Nettoyage ciblé du code mort réalisé ; aucun nettoyage automatique global
  n’est autorisé sur les modules pouvant être des points d’entrée externes.
- Les sauvegardes relisent la destination et vérifient taille/SHA‑256.
- Les validations logicielles et matérielles sont séparées dans les rapports.

## Ce qui reste prioritaire

### Porte A — Coffre local crédible, sans machine

**Objectif :** prouver le cycle complet sur un vrai dossier et un gros volume.

1. Sauvegarde complète OP‑1/EP‑133.
2. Sauvegarde sélective bandes, samples et projets.
3. Restauration vers une destination vide.
4. Comparaison manifeste, nombre de fichiers, taille et SHA‑256.
5. Reprise ou abandon propre après interruption.

**Terminé quand :** un rapport JSON reproductible prouve les trois cycles et
les erreurs partielles sont visibles dans l’interface.

### Porte B — Robustesse matériel

**Objectif :** distinguer une opération préparée d’une écriture réussie.

- OP‑1 Disk : fichier de test, hash, suppression, restauration, éjection et
  débranchement.
- OP‑1 `COM → T2 / CTRL` : note physique et absence d’écho.
- EP‑133 : capacité 64/128 Mo, écriture ciblée et relecture.
- Permissions refusées, câble retiré, volume différent et fichier corrompu.

**Terminé quand :** chaque scénario possède un résultat daté, un rapport et
un état de retour explicite.

### Porte C — Jeu synchronisé

**Objectif :** raccorder les séquences internes au transport déjà validé.

- Brancher le transport Hub aux séquenceurs OP‑1 et EP‑133.
- Garder le checkpoint avant séquence longue.
- Garder le bouton PANIC et l’arrêt d’urgence.
- Tester d’abord en simulation, puis sur les deux sorties réelles.

**Terminé quand :** Start, tempo, Stop et PANIC restent déterministes sans
boucle MIDI ni mélange entre sauvegarde et performance.

### Porte D — Promouvoir les paquets expérimentaux

Ordre recommandé :

1. `save-manager` derrière un cas réel du coffre Hub.
2. `shared-stores` derrière un contrat Hub ↔ studio déjà testé.
3. Un adaptateur `instrument-*` sur un écran OP‑1 ou EP‑133 concret.
4. Un paquet `game-*` sur une séance d’entraînement réellement exposée.
5. `midi-analysis` : soit une API et des tests, soit retrait du workspace.

Chaque promotion doit ajouter un consommateur runtime, un test et une entrée
dans la roadmap active. Sinon le paquet reste expérimental.

## Ce qui doit rester au parking

Ces idées sont conservées dans les études, mais ne doivent pas ralentir le
produit actuel :

- compte distant, cloud, paiement et catalogue communautaire ;
- cœur Rust/Tauri non construit ;
- mods firmware avancés et écriture firmware non validée ;
- anciens éditeurs génériques non raccordés ;
- outils externes étudiés mais sans gain immédiat démontré.

## Règle de décision pour les prochaines études

Avant d’ajouter un outil ou de recopier un ancien fichier, répondre à quatre
questions :

1. Quel écran utilisateur actuel l’utilise ?
2. Quel contrat machine ou Hub respecte-t-il ?
3. Quel test prouve qu’il fonctionne sans doublon ?
4. Est-ce une fonction livrée, une référence ou une expérimentation ?

Si une réponse manque, le document ou le code reste dans la catégorie
**à valider** et ne rejoint pas le chemin produit principal.

## Sources croisées

- [Roadmap active](ROADMAP_ACTIVE_2026-08-16.md)
- [Audit du code](../AUDIT_CODE_2026-08-16.md)
- [Audit du code mort](../AUDIT_CODE_MORT_2026-08-16.md)
- [Audit des doublons](AUDIT_DOUBLONS_ET_OPTIMISATION_2026-08-16.md)
- [Matrice d’intégration](../INTEGRATION_MATRIX_2026-08-16.md)
- [Analyse des manques d’outillage](TOOLING_GAP_ANALYSIS.md)
- [Audit de sécurité des outils](TOOLS_SAFETY_AUDIT.md)
- [État courant](../STATUS_CURRENT.md)
