# Validation — Save/Load du Studio

## Problème corrigé

Le bouton `SAVE` du Studio complet réutilisait auparavant la sauvegarde des
exercices pédagogiques. Il ne conservait que le groupe visible et fermait
l'éditeur. Cette action ne représentait donc pas un véritable projet Studio.

## Fonctionnement actuel

- `NOUVEAU` prépare un projet vide avec les groupes A, B, C et D ;
- `SAVE` sérialise le projet complet dans la bibliothèque locale du navigateur ;
- un second `SAVE` met à jour le projet ouvert au lieu de créer un doublon ;
- le sélecteur et `OUVRIR` restaurent le projet choisi ;
- le menu `FICHIER` rassemble Nouveau, Ouvrir, Enregistrer, Enregistrer sous,
  Renommer, Dupliquer, Archiver, Restaurer, Supprimer et Exporter ;
- une confirmation protège le projet affiché avant `NOUVEAU` ou `OUVRIR` s'il
  contient des notes ;
- la sauvegarde `USER` de l'éditeur pédagogique reste indépendante.

## Données conservées

Le document musical utilise le contrat intermédiaire `ep.project.v1`. La
bibliothèque locale ajoute seulement un identifiant et une date de mise à jour.
Elle ne crée pas un nouveau format musical propriétaire.

La restauration conserve :

- nom et tempo ;
- notes des quatre groupes A–D ;
- position à 96 PPQN, pad et hauteur mélodique ;
- vélocité et durée ;
- modes ONE, KEYS et LEGATO ;
- informations de pad lues sur la machine lorsqu'elles sont disponibles.

## Vérification automatisée

`npm run test:exports` effectue un aller-retour mémoire : génération du document,
sauvegarde locale, rechargement, puis comparaison du tempo, des notes, des
groupes, des vélocités, des durées et des modes de pad — y compris désormais
scènes, Song et longueurs natives par pattern (voir ci-dessous).

## Audit du 12 août 2026 — cycle Save→quitter→rouvrir

Demandé par les deux audits externes (« un projet importé puis réouvert doit
être identique dans tous les fixtures ») avant d'ajouter quoi que ce soit
d'autre. Un bug réel trouvé et corrigé, pas une simple relecture de code :

**Bug** — `serializePattern` (`exporters.ts`) écrivait `note: target.note ?? 60`
pour CHAQUE frappe exportée, y compris une frappe ONE simple (pad-trigger,
sans hauteur mélodique, `note` normalement `undefined`). Au réimport,
`studioStateFromDocument` restaure fidèlement ce `60` comme une vraie note —
la frappe devient alors mélodique aux yeux du reste de l'application :

- `toggleEditorPlayback` bascule de `midi.sendPad(...)` vers
  `midi.sendNote(60, ...)` — **mauvais message MIDI envoyé à la machine**, dès
  la deuxième lecture d'un projet sauvegardé (jamais visible à la première,
  ce qui explique que ça soit passé inaperçu) ;
- lecture PCM locale (`machineSampleBank.play`) transpose audiblement le son
  si `rootNote` du pad diffère de 60 ;
- l'aperçu de pattern dans l'Arrangeur (`SongArranger`) classe le pattern
  comme mélodique au lieu de percussif.

**Correctif** — `note` n'est écrit dans le document `ep.project.v1` que si la
frappe en porte vraiment une (`...(target.note !== undefined ? { note: ... } : {})`),
jamais de valeur par défaut inventée. Rétrocompatible : un ancien document
qui contient déjà `note: 60` (écrit par l'ancien code buggé, ou un vrai
mode KEYS) continue de se lire exactement pareil, seul l'export cesse
d'inventer le champ.

**Vérifié** : deux assertions ajoutées à `tools/check-project-exports.mjs`
(export direct et aller-retour via `localStorage`), confirmées défaillantes
sur le code d'avant correctif (`60 !== undefined`) puis vertes après —
la régression est maintenant impossible à réintroduire silencieusement.

## Limites encore visibles

- l’import JSON/MIDI/archive et l’export MIDI/JSON/PPak sont disponibles ;
  l’export MIDI hors machine est vérifié par le navigateur, mais sa lecture
  sur un vrai projet machine reste à faire ;
- la bibliothèque est locale et son miroir workspace est best-effort : le test
  sur un vrai dossier partagé et gros volume reste ouvert ;
- l’archivage est réversible et couvert ; `Supprimer` reste une suppression
  définitive volontairement protégée par confirmation ;
- l’historique Annuler/Rétablir couvre désormais le pattern et la structure
  Song ; le MIDI matériel dans les deux sens reste à valider.
