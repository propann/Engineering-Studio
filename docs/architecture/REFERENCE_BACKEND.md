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

Global, sur les 2 477 instructions instrumentées :

| | |
|---|---|
| Instructions | **70,4 %** |
| Branches | **62,0 %** |
| Fonctions | **64,2 %** |
| Lignes | **74,0 %** |

Par module, du plus sûr au plus exposé :

| Module | Fonctions | Instructions | Lecture |
|---|---|---|---|
| `packages/rack-bus` | **100 %** | 92,8 % | le fond de panier audio est le mieux tenu du dépôt |
| `packages/midi-bridge` | **100 %** | 96,6 % | couvert le 27 août — était à 7,7 % |
| `packages/midi-dispatch` | 94,4 % | 98,3 % | le répartiteur MIDI, solide |
| `core/audio/dsp.ts` | 100 % | 97,7 % | |
| `core/audio/reponseEq.ts` | 100 % | 97,2 % | |
| `core/profile.ts` | 100 % | 98,6 % | |
| `core/patchMeta.ts` | 100 % | 97,2 % | |
| `core/midi/controlMapping.ts` | 100 % | 100 % | |
| `core/audio/enveloppe.ts` | 91,7 % | 89,7 % | |
| `packages/audio-formats` | 87,8 % | 77,2 % | encodage AIFF/WAV, formats machine |
| `core/audio/effets.ts` | **100 %** | 99,4 % | couvert le 27 août — était à 38,3 % |
| `packages/musique` | **41,5 %** | 80,6 % | les composants React ne sont pas montés |
| `core/storage/directoryHandleStore.ts` | **40 %** | 57,1 % | |
| `packages/audio-bridge` | 43,5 % | 74,6 % | analyse WAV couverte ; le `logger` ne l'est pas |
| `packages/fs-handles` | 38,1 % | 45,3 % | permissions couvertes ; le magasin IndexedDB ne l'est pas |
| `op1-studio/app/lib/nativeStorage.ts` | **0 %** | 0 % | rien du tout |

---

## 3. Les zones sensibles

Classées par ce qu'on perd si elles se trompent, pas par leur pourcentage. Les
deux premières ont été traitées le 27 août ; elles restent ici avec ce qu'on en
a appris, parce que c'est ce qui sert au suivant.

### ~~`packages/midi-bridge`~~ — traité le 27 août, 7,7 % → **100 %**

Vingt-sept tests appellent le code et comparent aux octets de la spécification
MIDI 1.0, pas à l'implémentation. `PANIC` est vérifié canal par canal : les
seize canaux, All Notes Off **et** Reset All Controllers.

Chaque test a été validé par sabotage. L'un d'eux ne prouvait rien au premier
jet — il vérifiait le masque de canal avec la valeur 16, or `0x90 | 16` vaut
`0x90`, le bit étant déjà posé. Corrigé avec 32, qui transforme un note-on en
Control Change quand le masque manque.

### `packages/fs-handles` — 14,3 % → **38,1 %**, ce qui reste est hors de portée

Les trois fonctions de permission sont couvertes, sabotages compris : « prompt »
traité comme un refus, exception rattrapée, mode transmis sans substitution, et
les deux fonctions vérifiées comme ne s'appelant pas l'une l'autre — confondre
l'interrogation silencieuse et la demande de fenêtre a déjà coûté un « accès
refusé » au rechargement du coffre.

Ce qui reste non couvert est le magasin IndexedDB : lignes 42-48, 65, 71-77 et
88-94. Elles exigent un vrai IndexedDB, absent de l'environnement de test. Les
couvrir demanderait `fake-indexeddb` — une dépendance de plus, à décider.

Les chemins de repli, eux, sont prouvés : sans IndexedDB, `charger` rend `null`
et `oublier` ne jette pas. `sauver`, lui, laisse remonter l'erreur — asymétrie
volontaire mais qui n'était écrite nulle part, désormais constatée par un test.

### ~~`core/audio/effets.ts`~~ — traité le 27 août, 38,3 % → **100 % des lignes**

Les lignes 379-542 étaient `construireChaineEffets` en entier — la fonction qui
bâtit le graphe audio. Elle exige un `AudioContext`, ce qui l'avait mise hors de
portée ; un contexte factice suffit, et il existait déjà dans un fichier de test.
Il est désormais partagé dans `core/audio/contexteFactice.ts` : deux copies
divergeraient au premier nœud ajouté.

Les invariants verrouillés sont ceux que le code documente lui-même, dont le
plus important : **en mono, aucun `StereoPannerNode` n'est construit.** Le repli
mono d'un panneur vaut 0,5·(G+D), donc une prise à fond à gauche ressortirait
3 dB sous une prise centrée — l'équilibre du fichier exporté ne serait plus
celui qu'on entend en jouant.

Sont également tenus : la réinjection du délai qui ne boucle que sur la première
prise, l'amortissement de cette boucle, les quatre étages du phaser, et le fait
que l'égaliseur lise `BANDES_EQ` au lieu d'une liste recopiée.

### ~~`packages/audio-bridge`~~ — traité le 27 août, 23,3 % → **74,6 %**

Trente-cinq tests sur de vrais fichiers WAV, dont une partie encodés par
`audio-formats` — l'aller-retour vérifie au passage que les deux paquets
s'accordent sur la disposition de l'en-tête.

Deux tests ne prouvaient rien au premier jet, révélés par sabotage : un autre
garde rattrapait le cas. Un tampon de zéros est refusé même sans contrôle de
signature, parce que la marche des blocs n'y trouve aucun `data`. Il a fallu des
fichiers **bien formés sauf sur le point visé** pour isoler chaque règle.

Ce qui reste : `logger.ts`, d'où les 43,5 % de fonctions. C'est de la
journalisation, sans effet sur un fichier machine.

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

### Extraits Strudel — `core/strudel/extraits.ts`

```ts
lireExtraits(stockage?)                    // ne lève jamais ; [] si illisible
ecrireExtraits(extraits, stockage?)        // false si le stockage refuse
enregistrerExtrait(nom, code, liste, ...)  // remplace celui du même NOM
supprimerExtrait(id, liste)
trierExtraits(liste)                       // le plus récent d'abord
EXEMPLES                                   // aucun ne charge d'échantillon distant
```

Aucune fonction ne mute la liste reçue — muter l'état de React en place
empêcherait le rendu de se déclencher, et un test le vérifie. **Couvert par
vingt-trois tests exécutés.**

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
