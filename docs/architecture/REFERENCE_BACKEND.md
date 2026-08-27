# Référence du back-end

> **Rien n'est achevé.** Ce document ne dit pas ce qui est fini — il dit ce que
> chaque module offre, et jusqu'où c'est prouvé. C'est la différence qui compte
> pour construire une interface par-dessus : on peut s'appuyer sur du code
> exécuté par des tests, pas sur du code seulement écrit.

Mesures du **27 août 2026**, prises par `npx vitest run --coverage` et par
lecture des sources. Elles rouillent : la commande fait foi, pas cette page.

Feuille de route principale : [`../ROADMAP.md`](../ROADMAP.md).

---

## 1. Ce que « couvert » veut dire ici

Le dépôt a déjà une règle : *un test qui ne peut pas échouer ne prouve rien.*
Il en manquait une seconde, et elle explique la moitié des chiffres ci-dessous.

**Deux familles de tests coexistent :**

| Famille | Nombre de fichiers | Ce qu'elle prouve |
|---|---|---|
| Lecture du source en **texte** (`readFileSync` + `toContain`) | 17 | Qu'une chaîne est présente dans un fichier |
| **Import** du module, code réellement exécuté | 20 | Que le code fait ce qu'on attend |
| Les deux | 8 | — |

Les tests de la première famille sont utiles : ce sont eux qui interdisent un
sélecteur nu, une carte qui ment, une page sans porte. Mais ils **n'exécutent
rien**, donc ils n'apparaissent dans aucune couverture et ne disent rien du
comportement. Un module peut être entièrement cassé et les garder tous verts.

C'est pourquoi le tableau suivant compte les **fonctions exécutées**, pas les
fichiers de test.

---

## 2. L'état mesuré

Global, sur les 2 438 instructions instrumentées :

| | |
|---|---|
| Instructions | **60,3 %** |
| Branches | **55,2 %** |
| Fonctions | **58,7 %** |
| Lignes | **63,2 %** |

Par module, du plus sûr au plus exposé :

| Module | Fonctions | Instructions | Lecture |
|---|---|---|---|
| `packages/rack-bus` | **100 %** | 92,8 % | le fond de panier audio est le mieux tenu du dépôt |
| `packages/midi-dispatch` | 94,4 % | 98,3 % | le répartiteur MIDI, solide |
| `core/audio/dsp.ts` | 100 % | 97,7 % | |
| `core/audio/reponseEq.ts` | 100 % | 97,2 % | |
| `core/profile.ts` | 100 % | 98,6 % | |
| `core/patchMeta.ts` | 100 % | 97,2 % | |
| `core/midi/controlMapping.ts` | 100 % | 100 % | |
| `core/audio/enveloppe.ts` | 91,7 % | 89,7 % | |
| `packages/audio-formats` | 87,8 % | 77,2 % | encodage AIFF/WAV, formats machine |
| `core/audio/effets.ts` | 87,5 % | **38,3 %** | lignes 379-542 jamais exécutées |
| `packages/musique` | **41,5 %** | 80,6 % | les composants React ne sont pas montés |
| `core/storage/directoryHandleStore.ts` | **40 %** | 57,1 % | |
| `packages/audio-bridge` | **17,4 %** | 23,3 % | analyse WAV, formes d'onde, silence |
| `packages/fs-handles` | **14,3 %** | 22,6 % | permissions du système de fichiers |
| `packages/midi-bridge` | **7,7 %** | 25,9 % | construction des paquets MIDI |
| `op1-studio/app/lib/nativeStorage.ts` | **0 %** | 0 % | rien du tout |

---

## 3. Les quatre zones à surveiller

Classées par ce qu'on perd si elles se trompent, pas par leur pourcentage.

### `packages/fs-handles` — 14 % des fonctions

Cinq exports : `creerMagasinHandles`, `aLaPermission`, `demanderLaPermission`.
C'est ce qui décide si l'application a le droit de lire ou d'écrire dans un
dossier de l'utilisateur. Les lignes 42-48 et 54-94 ne sont jamais exécutées.

Une erreur ici ne se voit pas : elle affiche une bibliothèque vide sous un
espace annoncé « connecté », ou pire, croit avoir le droit d'écrire.

### `packages/midi-bridge` — 7,7 % des fonctions

Dix-neuf exports, dont `buildMidiNotePacket`, `buildMidiPanicPackets`,
`buildMidiRealtimePacket`, `buildMidiClockWindow`. C'est ce qui fabrique les
octets envoyés à une machine physique. Les lignes 39-118 et 154-188 ne sont
jamais exécutées.

Le `PANIC` — l'arrêt d'urgence de toutes les notes — est dans cette zone.

### `core/audio/effets.ts` — 38 % des instructions

Les lignes 379-542 ne sont jamais exécutées, soit un tiers du fichier. Les
effets traversent le rendu hors ligne : un échantillon fabriqué porte ce que
ces lignes calculent, et il finit dans un fichier écrit sur une machine.

### `packages/audio-bridge` — 17 % des fonctions

`analyzeWavBuffer`, `computeWaveformPeaks`, `detectSilenceTrim`,
`suggestNormalizationGainDb`. C'est l'analyse qui alimente l'affichage de la
forme d'onde et les suggestions de découpe. Une erreur produit un affichage
faux — donc une découpe fausse.

---

## 4. Ce sur quoi une interface peut s'appuyer

C'est la raison d'être de ce document : savoir quoi appeler sans relire 80 000
lignes. Les modules sont réellement implémentés — aucun `TODO`, aucun stub,
aucune fonction vide dans tout le back-end.

### Transport et horloge — `@studio-hub/rack-bus`

```ts
transport(): Transport            // état courant
reglerBpm(bpm: number)            // borné par bornerBpm, BPM_MIN..BPM_MAX
reglerMarche(marche: boolean)
sAbonnerTransport(auditeur)       // rend une fonction de désabonnement
contexte()                        // AudioContext partagé
```

Tout outil qui produit du son se branche ici et hérite du mixage et de la
synchro. Il ne fabrique pas son contexte. **100 % des fonctions couvertes.**

### Répartition MIDI — `@studio-hub/midi-dispatch`

```ts
sAbonner(auditeur: AuditeurMidi)  // rend une fonction de désabonnement
sAbonnerEtat(auditeur)
sorties()                         // les sorties disponibles
```

Aucune page n'écrit `onmidimessage` : un test l'interdit. **94 % couvert.**

### Gammes, arpège, séquenceur — `@studio-hub/musique`

`GAMMES`, `FAMILLES`, `DIVISIONS`, `dureeMs`, `coupureGateMs`, `bpmSain`.
La logique est très couverte (80 %) ; les **composants React** du paquet
— `Arpegiateur.tsx`, `SelecteurGamme.tsx`, `Sequenceur.tsx` — sont à **0 %**,
faute d'environnement DOM dans la configuration de test.

### Formats machine — `@studio-hub/audio-formats`

`encodeAiffPcm16`, `encodeWavPcm16`, `convertToOp1Audio`, `parseAiffFormat`,
`getAiffMetadata`, validation de pack OP-1. Quarante-cinq exports, 88 % des
fonctions couvertes. C'est le module le mieux tenu de ceux qui touchent au
fichier machine.

### Analyse audio — `@studio-hub/audio-bridge`

`parseWavHeader`, `analyzeWavBuffer`, `computeWaveformPeaks`,
`detectSilenceTrim`, `suggestNormalizationGainDb`. Implémenté, **peu prouvé**
(17 % des fonctions). À utiliser en sachant qu'une régression ici ne fera
tomber aucun test.

### Permissions et poignées — `@studio-hub/fs-handles`

`creerMagasinHandles`, `aLaPermission`, `demanderLaPermission`. Le motif à
respecter est établi et vérifié dans `ModuleBibliotheque` : **la poignée revient
d'IndexedDB, mais pas le droit de lire.** Toujours revérifier la permission
avant d'adopter une poignée.

---

## 5. Ce que ce document ne couvre pas

- **Les deux studios.** `apps/op1-studio` et `apps/ep133-studio` ont leurs
  propres suites, hors de cette configuration vitest. Leur couverture n'est pas
  mesurée ici.
- **Le comportement des composants React.** Aucun n'est monté par les tests de
  ce projet ; les rares chiffres qui apparaissent viennent d'imports indirects.
- **Le matériel.** Aucune couverture ne prouve ce qu'une machine fait du
  fichier qu'on lui écrit. C'est le rôle de
  [`../TESTS_PHYSIQUES.md`](../TESTS_PHYSIQUES.md).

---

## 6. Refaire la mesure

```bash
npx vitest run --coverage
```

Les pourcentages de cette page datent du 27 août 2026. S'ils ne correspondent
plus, c'est la commande qui a raison.
