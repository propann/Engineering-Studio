# Mode Tape — référence de comportement pour les développeurs

Document créé le 13 août 2026. Portée : **OP‑1 original uniquement**. Objectif :
décrire simplement comment la bande 4 pistes de la machine se comporte
réellement (boutons, workflow, limites), pour que le clone Studio soit
construit en connaissance de cause — même si on choisit ensuite de s'en
écarter (souris, glisser-déposer libre). Ce document ne couvre pas l'aspect
business/monétisation, volontairement laissé de côté pour cette phase.

`docs/OP1_KNOWLEDGE_BASE.md` reste la référence pour le **format des
fichiers** (`tape/track_1.aif`…`track_4.aif`, durée, résolution). Ce document
couvre le **comportement d'usage** : ce que font les boutons et pourquoi la
bande n'est pas une timeline de DAW classique.

Sources : pages officielles `teenage.engineering/guides/op-1/original/*`
listées en fin de document, complétées par des résumés communautaires
(`teenagemanual.com`, `op1tips`) marqués comme tels. Rien de tout ça n'a
encore été rejoué sur le matériel de l'utilisateur (OP‑1 reçu dimanche 9 août
2026, ~1h de prise en main) : à confirmer avant de coder un comportement
précis.

## 1. Où se situe Tape parmi les modes de la machine

Quatre modes principaux, chacun avec sa touche et sa couleur dédiées :
**Synth**, **Drum**, **Tape**, **Mixer**. Tape enregistre/lit ; Mixer est
l'étage final qui combine les 4 pistes de Tape (niveau, pan, EQ, effet
master, drive) avant la sortie ou avant un mixdown Album. Les deux sont
liés mais distincts : ne pas mélanger leurs boutons dans une même vue.

## 2. Le modèle mental clé : une seule bande, quatre pistes

- **6 minutes au total, partagées par les 4 pistes** — pas 6 minutes par
  piste. 44,1 kHz / 16 bits en vitesse normale.
- Les 4 pistes avancent **ensemble sur la même position de tête de lecture**.
  Il n'y a pas de zoom ou de défilement indépendant par piste comme dans une
  DAW classique.
- Les opérations de coupe/jonction (Split/Splice) sont ancrées sur cette
  position de tête commune, pas sur un clip sélectionné librement à la
  souris.

## 3. Transport et sélection de piste

- `T1`–`T4` deviennent des sélecteurs de piste en mode Tape.
- `REC` + `PLAY` ensemble démarre l'enregistrement sur la piste
  sélectionnée ; niveau d'entrée réglé via l'encodeur orange.
- `STOP` arrête.
- Flèches gauche/droite : rembobinage / avance.
- `STOP` + flèche gauche = retour au début ; `STOP` + flèche droite = saut à
  la fin.

## 4. Enregistrement : overdub destructif par défaut

**« La bande fait toujours du overdub s'il y a déjà du contenu enregistré sur
la piste sélectionnée. »** C'est un comportement par défaut destructif, comme
une vraie bande analogique. Pour éviter d'écraser un take existant, il faut
d'abord le **LIFT** hors de l'emplacement visé.

## 5. LIFT / DROP — un tampon mémoire unique

- `LIFT` (flèche haut) retire le take de la piste sélectionnée sous la tête
  et le stocke dans **un seul buffer mémoire partagé** (pas une pile
  d'historique).
- `DROP` replace ce buffer à la position actuelle de la tête. On peut
  appuyer sur `DROP` plusieurs fois de suite pour coller plusieurs copies ;
  la bande avance à chaque collage jusqu'à la fin du take déposé.
- `SHIFT` + `LIFT` lève **les 4 pistes en même temps** — utilisé en
  communauté pour déplacer tout un arrangement d'un bloc, ou pour faire un
  mixdown rapide (lift des 4 pistes puis drop dans le sampler drum = mono
  mixdown instantané, technique de « ping-pong »).
- `LIFT` sans `DROP` sert aussi à **supprimer** un take.

## 6. SPLIT / SPLICE — couper et joindre

- `SPLIT` coupe la bande à la position de la tête, sur la piste
  sélectionnée.
- `SHIFT` + `SPLIT` **joint** le take le plus proche de part et d'autre du
  point actif.
- `SHIFT` + `TAPE` ouvre une fonction d'effacement dédiée (erase).

## 7. Déplacer un take sans passer par LIFT/DROP

`SHIFT` + encodeur bleu fait glisser un take le long de sa piste
(repositionnement fin, sans passer par le buffer mémoire).

## 8. Vitesse de bande (varispeed)

- Encodeur blanc = vitesse de la bande, modifiable à tout instant, **y
  compris pendant l'enregistrement**.
- `SHIFT` + encodeur blanc = pas fixes (valeurs prédéfinies) au lieu d'une
  variation continue.
- Comme une vraie bande analogique : la vitesse change le pitch **et** la
  qualité perçue (plus rapide = meilleure qualité apparente).

## 9. Lecture inversée et Tape Tricks

- `SHIFT` + `PLAY`, ou la touche Reverse des Tape Tricks, inverse la
  lecture.
- En mode Tape, les touches de sons `1`–`8` deviennent des **Tape Tricks**
  en direct : Loop In / Loop Out / Loop Toggle, Break (pause la bande en
  gardant le timing de la boucle), Chop (répétitions calées sur le tempo),
  Memo 1 / Memo 2 (mémoriser puis rappeler un réglage instantanément).

## 10. Mixer — l'étage en aval de Tape

D'après un résumé secondaire (à vérifier sur le manuel officiel avant
implémentation) : niveau par piste (0–99) via un encodeur dédié par piste,
pan accessible via `SHIFT` + le même encodeur. Après sommation stéréo des 4
pistes : EQ trois bandes (grave/médium/aigu + intensité), un effet master
stéréo (bibliothèque partagée avec les effets synth/drum), puis un étage
Master Out avec balance et drive (le drive resserre l'écart entre niveaux
hauts et bas, avec un réglage de « release » pour l'effet de pompage).

Point déjà noté dans `OP1_KNOWLEDGE_BASE.md` et confirmé ici : **un export
individuel `track_N.aif` ne contient aucun de ces traitements Mixer.** Le son
« final » tel qu'entendu sur la machine ne se reconstruit pas en sommant les
4 fichiers bruts — il faut soit rejouer via Album, soit accepter que le clone
propose son propre mixage.

## 11. Export réel (rappel)

- Disk mode → `tape/track_1.aif` à `track_4.aif`, un fichier par piste, sans
  mix/EQ/effet master/drive.
- Album = mixdown réel des 4 pistes + traitements Mixer, exporté séparément
  (faces A/B, alias `sideA.aif`/`SideA.aif` à détecter).

## 12. Où en est le clone Studio par rapport à ce modèle

| Concept machine | État dans le code | Repère |
|---|---|---|
| Bande unique de 360 s partagée par 4 pistes | **existe** | `TAPE_DURATION = 360` dans `StudioTapeEditor.tsx`, `StudioTapeScreen.tsx`, `StudioTrackList.tsx` |
| Déplacement d'un clip à la souris, n'importe où | **existe, et va au-delà du hardware** | `StudioTrackList.tsx` (drag), `StudioTapeEditor.tsx` — la machine ne permet qu'un glissement fin via `SHIFT`+encodeur ou un LIFT/DROP explicite ; différence assumée et voulue |
| Overdub destructif par défaut à l'enregistrement | **absent** | aucune mention « overdub » dans `app/` |
| LIFT / DROP (buffer mémoire unique, y compris sur les 4 pistes via `SHIFT`+LIFT) | **absent** | aucune référence dans `app/`, `tools/` |
| SPLIT / `SHIFT`+SPLIT (couper/joindre à la position de tête) | **absent** — remplacé par le trim/fade non destructif actuel | `StudioTapeEditor.tsx` (trim), pas de coupe/jonction |
| Vitesse de bande (varispeed) | **partiel** | libellé « vitesse bande (`tapecurrspeed`) » affiché dans `StudioTapeEditor.tsx`, comportement audio à confirmer |
| Lecture inversée | **partiel** | état `reversed` dans `app/page.tsx` / `StudioTransportPanel.tsx`, effet visuel RTL posé ; comportement audio réel à confirmer |
| Tape Tricks (Loop/Break/Chop/Memo) | **absent** | — |
| Écran Mixer distinct (niveau + pan + EQ + drive, en aval de Tape) | **absent comme mode séparé** | le gain par piste existe déjà dans Studio, pas d'EQ/drive/effet master |

## 13. Recommandation (documentation seulement, aucun code touché ici)

- Garder le mode souris actuel comme mode d'édition « libre » assumé — c'est
  un différenciateur produit explicitement voulu, pas une approximation à
  corriger.
- Quand on codera, traiter LIFT/DROP, overdub par défaut et SPLIT/SPLICE
  comme des **fonctionnalités à ajouter en plus** du glisser-déposer actuel,
  pas comme un remplacement : elles servent des workflows précis (bounce,
  ping-pong mixdown, split au point de tête) que la souris seule ne
  reproduit pas facilement.
- Ne pas commencer par Mixer/EQ/Drive : c'est un étage de production avancé,
  cohérent avec la feuille de route qui classe déjà Studio « cœur livré »
  mais laisse l'édition avancée à construire.
- Avant d'implémenter un comportement précis (overdub, lift/drop, vitesse de
  bande), le vérifier sur le matériel réel de l'utilisateur — aucune des
  sources ci-dessous n'a encore été testée sur cette machine.

## 14. Sources

Officielles (Teenage Engineering) :

- [Tape mode](https://teenage.engineering/guides/op-1/original/tape-mode)
- [Mixer](https://teenage.engineering/guides/op-1/original/mixer)
- [Main modes](https://teenage.engineering/guides/op-1/original/main-modes)
- [Song rendering and connectivity](https://teenage.engineering/guides/op-1/original/song-rendering-and-connectivity)

Communautaires, non vérifiées sur notre matériel — à confirmer avant
implémentation :

- [teenagemanual.com — move or shift tape tracks](https://www.teenagemanual.com/op-1/answers/move-or-shift-tape-tracks)
- [`op1tips` (ratbag98)](https://github.com/ratbag98/op1tips) — digest du fil « Tips and Tricks » d'op-forums.
