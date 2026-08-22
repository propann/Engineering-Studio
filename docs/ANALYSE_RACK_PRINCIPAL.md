# Le rack principal, outil par outil

Analyse du 2026-08-22. **Aucun code n'a été déplacé** : ce document prépare une
décision, il ne l'applique pas.

Le rack principal est `apps/studio-hub/src/pages/ToolsHub.tsx`, **472 lignes au
moment de l'analyse**. Les numéros de ligne cités ci-dessous valent pour cet
état ; le fichier a été retravaillé le soir même (voir « Ce qui a été
appliqué »).
C'est la porte d'entrée de l'atelier : c'est de là qu'on ouvre les studios, le
rack audio, le coffre, le firmware, la documentation.

Chaque ligne ci-dessous vient d'une lecture du fichier cité, pas d'une
déduction tirée d'un nom.

---

## Ce qu'il faut savoir avant de lire les tableaux

Le rack rend **deux systèmes en parallèle**, et c'est l'origine de presque tout
ce qui suit.

| | |
|---|---|
| **Tableau `tools`** | 19 entrées avec métadonnées — `id`, `code`, `category`, `section`, `anchor` |
| **Cartes en dur** | 10 boutons `utility-card` écrits directement dans le JSX |

Les cartes en dur sont ce que l'on voit et ce par quoi on navigue. Le tableau,
lui, ne sert presque plus.

---

## Constat 1 — le tableau de 19 outils en affiche **un seul**

> Constat du 2026-08-22 au matin. La fusion du même jour l'a résolu : les
> cartes sont devenues des entrées, et le tableau en compte désormais 26.

`ToolsHub.tsx:110-111` filtre le tableau avant de le rendre :

```ts
const filteredTools = (activeSection === "all" ? tools : tools.filter(…))
  .filter(t => t.category !== "DOCUMENTATION" && t.category !== "SAUVEGARDE"
    && t.id !== "vault" && t.category !== "TRAINING LAB" && t.id !== "machine-test"
    && t.id !== "midi" && t.id !== "op-settings" && t.id !== "tape"
    && t.id !== "sounds" && t.id !== "sample" && t.id !== "library"
    && t.id !== "firmware" && t.id !== "services" && t.id !== "op1-backup"
    && t.id !== "pattern");
```

Trois catégories et douze identifiants exclus. **Il reste `image`.** Un seul
outil sur dix-neuf est rendu par ce chemin — les autres ont une carte en dur, et
l'exclusion évite le doublon.

Ce n'est pas un défaut en soi : c'est une migration inachevée. Le coût est que
dix-huit entrées de métadonnées sont maintenues sans être affichées.

## Constat 2 — les onglets de section n'existent pas

`:42` déclare quatre sections — `HUB CENTRAL`, `OP-1 STUDIO`, `EP-133 STUDIO`,
`TOUS LES OUTILS`. Vérifié :

- le tableau `sections` **n'est jamais rendu** ;
- `setActiveSection` **n'est jamais appelé** — une seule occurrence dans le
  fichier, sa déclaration ;
- `activeSection` vaut donc `"all"` en permanence.

Conséquence : le champ `section` porté par les **dix-neuf** outils est de la
donnée morte. Et si les onglets étaient rebranchés tels quels, « OP-1 STUDIO »
et « EP-133 STUDIO » afficheraient **zéro outil** — parce que le seul survivant
du filtre, `image`, est en section `hub`.

## Constat 3 — quatre modales ne peuvent pas s'ouvrir

Leur état est déclaré, leur rendu est écrit, leur **déclencheur n'existe pas**.
Compté dans le fichier : `setShowX(true)` apparaît zéro fois pour chacune.

| Modale | État | Rendue en | Déclencheur |
|---|---|---|---|
| `SaveModal` | `showSave` `:52` | `:322` | ❌ jamais |
| `SoundModal` | `showSound` | `:325` | ❌ jamais |
| `StudioModal` (op1) | `showOP1Studio` `:57` | `:326` | ❌ jamais |
| `StudioModal` (ep133) | `showEP133Studio` `:58` | `:327` | ❌ jamais |
| `TrainingModal` | `showTraining` | `:323` | ✅ carte « Apprendre » |
| `SettingsModal` | `showSettings` | `:324` | ✅ carte « Réglages » |

Les listes qui les alimentent — `saveTools`, `soundTools`, `op1StudioTools`,
`ep133StudioTools` — ne servent donc plus qu'à afficher un **nombre** sur une
carte. La carte « Son » annonce « 4 OUTILS » et ouvre `SoundEditorHub`, qui
n'est pas cette liste de quatre.

## Constat 4 — un outil sans route

| Outil | Ce qui se passe |
|---|---|
| `library` — Bibliothèque sonore | `openTool` n'a **aucun cas** pour lui, et sa catégorie `OUTIL DU HUB` n'en déclenche pas non plus. Il retombe sur `setSelected(tool)` : une modale purement descriptive. |

C'est **exactement** le défaut que le code documente comme corrigé ailleurs.
`openTool` porte ce commentaire au cas `midi` :

> *Sans ce cas, l'entrée retombait sur `setSelected()` et n'ouvrait qu'une
> modale descriptive : le panneau `MidiSyncPanel` n'était jamais monté.*

Le même défaut est resté sur `library`. Il est doublement hors d'atteinte :
exclu du filtre `:111`, et sa seule autre apparition est dans `soundTools`, qui
alimente une modale qui ne s'ouvre jamais.

## Constat 5 — deux branches mortes dans le routage

`openTool` teste les identifiants dans l'ordre ; la première branche qui
correspond l'emporte. Deux outils sont nommés une seconde fois plus bas, dans
une branche que rien n'atteint :

| Outil | Ouvre réellement | Branche jamais atteinte |
|---|---|---|
| `op1-backup` | `backup-lab` | `studio-op1` |
| `tape` | `studio-op1` | `sound-editor` |

Un lecteur qui cherche « où va Tape » trouve `sound-editor` et se trompe.

## Constat 6 — `SoundLibraryPanel.tsx` n'est monté nulle part

263 lignes. Vérifié : **aucune mention** du composant hors de son propre
fichier, ni import statique, ni import dynamique, ni mention en chaîne.

C'est le même cas que le `SynthEngineDrawer` supprimé le 2026-08-21 : du code
qui décrit une fonction qu'il ne rend pas.

## Constat 7 — la carte du rack audio décrit des moteurs qui n'existent pas

`ToolsHub.tsx:247` annonce :

> Dexed FM (DX7), **Moog 24dB Ladder**, TB-303 Acid, NES 8-Bit Chiptune et
> **Karplus-Strong**.

Le rack en implémente **quinze**, et **ni « Moog 24dB Ladder » ni
« Karplus-Strong » n'en font partie**. Les quinze sont : `mi_plaits`,
`mi_braids`, `mi_rings`, `mi_clouds`, `mi_elements`, `dexed_fm`, `surge_xt`,
`zynaddsubfx`, `helm`, `fluidsynth`, `amsynth`, `amy_engine`, `pl_synth`,
`open303`, `faust_dsp`.

C'est mot pour mot le catalogue du `SynthEngineDrawer` supprimé — 389 lignes qui
décrivaient du son qu'elles ne produisaient pas. **Le code est parti, sa
promesse est restée dans le rack principal**, à la vue de tout le monde.

C'est la seule inexactitude de ce document qu'un visiteur voyait à l'écran.

> **Corrigé le 2026-08-22**, seul changement de code de cette analyse. Laisser
> sciemment une description fausse sur la page d'accueil des outils ne relevait
> pas d'une décision de réorganisation à prendre plus tard. Un test l'interdit
> désormais : la carte ne peut plus nommer « Moog », « Ladder » ni
> « Karplus ». Tout le reste de ce document est laissé en l'état.

---

## Les dix cartes, une par une

| Ligne | Carte | Ouvre | Description exacte ? |
|---|---|---|---|
| `:120` | 🎹 OP-1 Studio | `studio-op1` | ✅ |
| `:157` | 🥁 EP-133 Studio | `studio-ep133` | ✅ |
| `:192` | ⚙️ Firmware Lab & Compilateur | `firmware-gallery` | ⚠️ le titre annonce le compilateur, la carte ouvre la **galerie** ; `firmware-compiler` (486 l.) et `firmware-lab` (922 l.) sont d'autres pages |
| `:207` | 💾 Sauvegarde | `backup-lab` | ✅ SHA-256 et restauration : conforme |
| `:221` | 🎛️ Édition & Création de Son | `sound-patch-creator` | ✅ |
| `:236` | 🔌 Rack Plugins & Moteurs Audio | `audio-plugin-rack` | ❌ **constat 7** |
| `:253` | 🎵 Son | `SoundEditorHub` | ⚠️ affiche « 4 OUTILS » qui ne sont pas ce qu'elle ouvre |
| `:265` | ⚙️ Réglages | `SettingsModal` | ⚠️ « Synchronisation MIDI, tests de machine et diagnostic » — ne dit pas l'arpégiateur ni les 30 gammes |
| `:293` | 📖 Documentation | ancre `#hub-documentation` | ✅ |
| `:305` | 📚 Apprendre | `TrainingModal` | ✅ |

## Les dix-neuf entrées du tableau

| Outil | Ouvre | Rendu par le filtre ? |
|---|---|---|
| `firmware` | `firmware-lab` (922 l.) | non — carte en dur |
| `op1-backup` | `backup-lab` (116 l.) | non — exclu |
| `sample` | `sound-editor` (1039 l.) | non — exclu |
| `tape` | `studio-op1` | non — exclu |
| **`image`** | `image-editor-op1` (1310 l.) | **oui — le seul** |
| `services` | `studio-op1` | non — exclu |
| `op1-exercise` | `exercises` (159 l.) | non — exclu |
| `op1-docs` | `doc-op1` (229 l.) | non — exclu |
| `pattern` | `studio-ep133` | non — exclu |
| `sounds` | `sound-editor` | non — exclu |
| `machine-test` | `studio-ep133` + `?hubTool=` | non — exclu |
| `rhythm` | `rhythm-hero` (124 l.) | non — exclu |
| `ep-docs` | `doc-ep133` (237 l.) | non — exclu |
| `documentation` | `documentation` (131 l.) | non — exclu |
| `op-settings` | `op1-settings` (264 l.) | non — exclu |
| `midi` | `midi-settings` (28 l. → `MidiSyncPanel`) | non — exclu |
| `library` | ❌ **rien** — modale descriptive | non — exclu |
| `vault` | `backup-lab` | non — exclu |
| `app-guide` | `documentation` | non — exclu |

Toutes les pages citées existent et ont été ouvertes pour vérifier leur taille.

---

## Ce qui a été appliqué le soir même

Décision prise après lecture de l'analyse : **nettoyer ce qui est inatteignable
maintenant, remettre la fusion des deux systèmes à après les essais physiques**
— le rack principal est la porte d'entrée, et le casser rendrait la machine
inaccessible pendant les tests matériel.

| Constat | Suite donnée |
|---|---|
| 3 — quatre modales sans déclencheur | **supprimées** avec leurs états et leurs trois listes. Rien n'indiquait qu'elles aient jamais été atteignables. |
| 4 — `library` sans route | **branché**. Voir ci-dessous. |
| 5 — deux branches mortes | **supprimées** ; le routage dit maintenant où vont vraiment `op1-backup` et `tape`. |
| 6 — `SoundLibraryPanel` orphelin | **monté**, dans une page à lui. |
| 7 — moteurs inventés sur la carte | **corrigé** (déjà noté plus haut). |
| Firmware, Réglages — descriptions tièdes | **corrigées** : la carte firmware ouvre la galerie et le dit ; les réglages annoncent l'arpégiateur. |
| 1 — le tableau n'affiche qu'un outil | inchangé, sauf `library` qui le rejoint. Attend la fusion. |
| 2 — onglets de section absents | inchangé. Attend la fusion. |

**77 lignes en moins** dans `ToolsHub.tsx`, aucun chemin vivant touché.

### Pourquoi `library` a été branché et non supprimé

La question se posait vraiment : le `SynthEngineDrawer` supprimé en août
décrivait du son qu'il ne produisait pas, et un panneau orphelin de 263 lignes
ressemble beaucoup à ça.

Vérification faite avant de décider — le panneau **fonctionne** : il importe des
fichiers, calcule leur empreinte SHA‑256, les écrit dans `shared/sounds/`, tient
un manifeste versionné (`studio-hub.sound-library.v1`), fait écouter, étiquette,
met en favori et déduplique. Rien de décoratif.

Le défaut n'était donc pas le panneau, mais son absence de porte. Il en a une :
`pages/SoundLibrary.tsx`, qui reprend de `BackupLab` le chargement prudent de
l'espace de travail — la poignée revient d'IndexedDB, **mais pas le droit de
lire**, et l'adopter sans vérifier afficherait une bibliothèque vide sous un
espace annoncé « connecté ».

### Un compteur qui mentait

La carte « Son » affichait « 4 OUTILS » — la taille d'une liste qui alimentait
une modale ne s'ouvrant jamais — et ouvrait `SoundEditorHub`, qui n'est pas ces
quatre outils. Elle dit maintenant « OUVRIR → », comme ce qu'elle fait.

---

## Ce que ça donne pour « accorder la machine globale »

Propositions numérotées, avec leur coût. **Aucune n'est appliquée** : la
décision revient à l'utilisateur.

### 1. Corriger la description du rack audio — *quelques minutes, aucun risque*

La seule erreur visible à l'écran. Remplacer les cinq moteurs inventés par ce
que le rack contient réellement.

Un test peut le verrouiller, sur le modèle de celui qui garde les comptes de
gammes : la carte ne doit nommer que des moteurs présents dans
`EnginePluginType`. Sans ce verrou, la description repartira en périmé au
prochain moteur ajouté ou retiré.

### 2. Brancher `library`, ou le retirer — *petit, à décider*

Deux issues honnêtes, et une seule à choisir :

- lui donner une route vers la page qui contient `SoundLibraryPanel`… mais
  **aucune page ne le monte** (constat 6). Il faudrait donc d'abord décider où
  ce panneau vit ;
- ou retirer l'entrée `library` et le panneau, comme on a retiré le
  `SynthEngineDrawer`.

**Ne pas laisser en l'état** : une entrée qui ouvre une modale décrivant une
fonction inatteignable est pire qu'une entrée absente.

### 3. Supprimer les quatre modales inatteignables — *moyen, mécanique*

`SaveModal`, `SoundModal` et les deux `StudioModal` avec leurs états et leurs
listes. Environ 90 lignes. Attention : `soundTools.length` et
`saveTools.length` alimentent l'affichage de deux cartes — les listes doivent
survivre à la suppression des modales, ou les cartes perdre leur compteur.

### 4. Trancher sur les onglets de section — *petit, mais une décision produit*

Soit les rendre — et alors remettre des outils dans le filtre, sinon deux
onglets sur quatre sont vides — soit retirer `sections`, `activeSection` et le
champ `section` des dix-neuf outils.

L'état actuel est le pire des deux : la donnée est maintenue et rien ne
l'affiche.

### 5. Fusionner les deux systèmes — ✅ **fait le 2026-08-22**

Le seul chantier qui réglait la cause plutôt que les symptômes.

Chaque carte est devenue une entrée du tableau ; le tableau est la source
unique. Ce qui distinguait les neuf cartes écrites à la main tient en quatre
champs : `action` (ce que fait un clic), `couleur`, `compteurDe`, et `image` —
la photo de machine étant la seule chose que le rendu piloté par données ne
savait pas faire.

Ce qui a disparu **de lui-même**, sans être corrigé un par un :

- le filtre à quatorze exclusions, qui n'existait que pour éviter le doublon
  entre les deux systèmes ;
- la cascade de quinze `if` d'`openTool`, et avec elle toute possibilité de
  branche morte — l'action est portée par l'outil, il n'y a plus d'ordre à
  respecter ;
- deux fonctions, `machineTool` et `hubTool`, définies et jamais appelées, que
  la fusion a mises à nu.

Ce qui devient possible : **les onglets de section**, déclarés depuis le début
et jamais rendus. Ils affichent maintenant HUB 8, OP-1 5, EP-133 2, TOUS 15 —
aucune section vide, parce que chaque outil porte enfin la sienne.

Et un détail visible : quatre cartes affichaient « 243 », la version du
firmware OP-1. `chip` était le **repli** pour tout visuel non reconnu, et
`grid` n'avait pas de rendu. Le repli est neutre désormais, et « 243 » ne
reste que sur les deux cartes firmware, où il veut dire quelque chose.

**Reste ouvert, et rendu visible par la fusion** : deux cartes mènent au
firmware — la galerie et le Lab, vers deux pages différentes. La duplication
existait, cachée dans les deux systèmes. C'est une question produit, pas
technique.

### 6. Aligner deux descriptions tièdes — *quelques minutes*

- « Firmware Lab & Compilateur » ouvre la **galerie**, pas le compilateur.
- « Réglages » ne mentionne ni l'arpégiateur ni les 30 gammes, qui vivent
  pourtant derrière.

---

## Ce qui va bien, et qu'il ne faut pas casser

Le rack principal **fonctionne**. Les dix cartes ouvrent ce qu'elles annoncent,
à une exception près, et les vingt-trois pages du hub sont atteignables. Les
constats ci-dessus portent sur de la matière morte et des promesses périmées,
pas sur des chemins cassés.

La page `OrphanPages.tsx` mérite d'être signalée comme une bonne idée : elle
liste les vingt-trois pages avec leur cible de projet. C'est l'inventaire que
cette analyse aurait aimé trouver au départ — et le seul endroit du dépôt où le
rack audio est nommé pour ce qu'il est : « Rack audio partagé ».
