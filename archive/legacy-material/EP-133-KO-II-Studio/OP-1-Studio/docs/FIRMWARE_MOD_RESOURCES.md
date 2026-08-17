# Ressources pour les mods firmware — inventaire du 12 août 2026

Ce document complète [`FIRMWARE_LAB.md`](FIRMWARE_LAB.md) et
[`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md) avec des ressources
communautaires supplémentaires trouvées en fouillant l'organisation GitHub
[`op1hacks`](https://github.com/op1hacks) et son réseau. Rien ici n'est
téléchargé ni vendored dans le dépôt : ce sont des pistes sourcées, à
vérifier sur fixture avant toute intégration, comme le reste du labo.

## op1-glitter — modificateur de thème couleur (nouveau, non catalogué avant)

[`op1hacks/op1-glitter`](https://github.com/op1hacks/op1-glitter) (fork de
[`Nanobot567/op1-glitter`](https://github.com/Nanobot567/op1-glitter)),
licence non affichée sur le fork, outil Python testé sur machine réelle par
son auteur.

Fonctionnement documenté (`README.md` + `THEME_CREATION.md`) :

1. dépend de `op1repacker` (le même moteur déjà vendored dans
   `tools/vendor/op1repacker/`) ;
2. un thème est un fichier `theme.json` avec une clé `global` obligatoire et
   des clés optionnelles nommées comme un SVG de `content/display/` ;
3. chaque entrée associe soit une couleur hex à une autre couleur hex
   (remplacement global dans le fichier), soit l'ID d'un élément SVG à une
   couleur ou à un tableau `[attribut, couleur]` ;
4. le script réécrit les fichiers `content/display/*.svg` ciblés puis repack
   le firmware avec `op1repacker`.

C'est exactement le même mécanisme que `op1_gfx.patch_image_file` déjà
vendored chez nous (substitution de couleurs/éléments dans les SVG), mais
appliqué systématiquement à l'échelle d'un thème complet plutôt qu'à un seul
écran. **Piste concrète pour la suite de l'éditeur d'images (`tools/display_bridge.py`) :**
ajouter un mode "thème" qui génère un patch par fichier à partir d'une seule
table de correspondance couleur → couleur, réutilisable sur tous les écrans
d'un coup, au lieu d'éditer un SVG à la fois.

### Palette de couleurs réelle de la machine (correction sourcée)

`THEME_CREATION.md` liste les couleurs effectivement utilisées par le
firmware officiel — **information vérifiée par un outil qui les repeint
avec succès sur une machine réelle**, donc plus fiable qu'une estimation
visuelle :

| Couleur | Hex | Usage documenté |
|---|---|---|
| Encodeur vert | `#00ed95` | un des 4 encodeurs color-codés |
| Encodeur rouge | `#ff3a5d` | un des 4 encodeurs color-codés |
| Encodeur bleu | `#698eff` | un des 4 encodeurs color-codés |
| Encodeur blanc | `#dfd9ff` | 4e encodeur ; couleur aussi utilisée pour la plupart des éléments dynamiques (bande Tape, EQ aigus, texte qui change) |
| Blanc | `#ffffff` | — |
| Blanc "texte" | `#aeb1dc` | texte d'interface |
| Fond violet | `#9256d7` | fond d'écran |
| Bleu clair alternatif | `#4d9eff` | — |
| Violet foncé terne | `#383572` | — |

**Correction à faire remonter :** la machine a 4 encodeurs **bleu / vert /
blanc / rouge** — ce que le code de l'app a déjà correctement en dur dans
`MachineControls` (`app/page.tsx`, labels `BLEU`, `VERT`, `BLANC`, `ROUGE`).
Mais la palette CSS (`app/globals.css`, `--orange: #f26c38`) et le logo
(`docs/assets/op1-studio-mark.svg`) utilisent un **orange** à la place du
blanc pour le 4e encodeur — ce n'est pas la vraie couleur de la machine.
`docs/GUI_REDESIGN_BRIEF.md` section 2 a été mise à jour avec cette
correction ; le changement de code lui-même n'a pas été fait ici pour ne
pas toucher `app/globals.css` en même temps que le chantier de navigation
persistante en cours.

### Dictionnaire de codenames SVG (complète notre catégorisation)

`THEME_CREATION.md` documente le sens réel de plusieurs codenames internes
que `data/mods/catalog.json` et `tools/display_bridge.py` listaient jusqu'ici
comme non identifiés. Ces correspondances ont été intégrées dans
`tools/display_bridge.py` (confiance "high", source citée par fichier) :

| Fichier | Sens réel |
|---|---|
| `bode.svg` | effet CWO |
| `cls.svg` | moteur synthé Cluster |
| `drum2.svg` | éditeur de samples Drum |
| `ftwo.svg` | effet Nitro |
| `id.svg` | moteur synthé DNA |
| `lander.svg` | easter egg "Chop Lifter!" |
| `mllp.svg` | effet Punch |
| `ok.svg` | séquenceur Finger |
| `pd.svg` | moteur synthé Phase |
| `pls.svg` | moteur synthé Pulse |
| `ptch.svg` | effet Phone |
| `rymd.svg` | effet Spring (corrige une première hypothèse "modes principaux") |
| `simple.svg` | séquenceur Arpeggio |
| `slump.svg` | moteur synthé Voltage |
| `st.svg` | moteur synthé String |
| `t10.svg` | moteur synthé Digital |

Effet concret sur `python tools/display_bridge.py sort` : la part de SVG
"non identifié" tombe de 31/61 à 18/61 sur le firmware local déjà construit
(`backups/firmware-builds/OP1_op1_246_mods.op1`).

## Autres dépôts trouvés dans l'organisation op1hacks

- [`op1-fw-archive`](https://github.com/op1hacks/op1-fw-archive) : archive
  de quasiment toutes les versions de firmware OP-1 original — utile comme
  référence historique de version, jamais comme source à vendored (déjà la
  règle du projet : aucun binaire firmware dans Git).
- [`op1-field-fw-archive`](https://github.com/op1hacks/op1-field-fw-archive) :
  équivalent pour l'OP-1 Field — confirme que l'OP-1 Field reste hors cible
  actuelle (déjà noté dans `CONTEXT.md` et `ROADMAP.md`).
- [`op1aiff`](https://github.com/op1hacks/op1aiff) : décrit comme "OP-1
  Preset Tool" (pas seulement inspection comme supposé précédemment) — à
  ouvrir plus en détail avant de figer son usage prévu dans `TOOLING_SHORTLIST.md`.

## Ce qui reste hors périmètre

Comme toujours : aucune modification de `OP1_vdk.ldr`, aucun contournement
de chiffrement/OTP/ECC, aucune automatisation des touches TE-boot 7/8. Les
thèmes et mods graphiques listés ici touchent uniquement `content/display/`
et `content/audio/`, jamais le code principal du firmware.
