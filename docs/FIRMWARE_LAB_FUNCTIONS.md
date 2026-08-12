# Firmware — inventaire des fonctions cibles

Document d'organisation, pas de code. Rédigé le 12 août 2026 en réponse à un
objectif produit : faire de la fenêtre **Firmware** l'outil le plus complet
qui existe pour l'OP-1 original — tout ce qui est réellement éditable sur la
machine doit être accessible depuis cette seule fenêtre, dessins compris.
Aucune fonction listée ici n'est décidée comme "à coder maintenant" : c'est
une liste organisée pour préparer la discussion, cohérente avec l'existant
(`FIRMWARE_LAB.md`, `FIRMWARE_MOD_CATALOG.md`, `FIRMWARE_MOD_RESOURCES.md`,
`LOCAL_TOOLS.md`, `CONTEXT.md`) et avec la règle d'or du `README.md` : un plan
préparé n'est jamais présenté comme une écriture réussie sur la machine.

## Pourquoi la fusionner avec "Images"

Aujourd'hui la barre d'outils sépare **Firmware** (`editor`, mods + build) et
**Images** (`display`, édition des SVG d'écran). Les deux touchent le même
fichier `.op1` et le même moteur (`op1_gfx.patch_image_file`, utilisé aussi
bien par `gfx-cwo-*` et `gfx-tape-invert` que par l'éditeur d'images). Aucun
outil communautaire recensé dans `TOOLING_SHORTLIST.md` ne couvre en un seul
endroit le conteneur, la base de données, les graphismes et le thème complet :
`op1repacker` fait le conteneur et quelques mods, `op1REpackerGUI` ajoute une
interface mais pas de thème global, `op1-glitter` ne fait que le thème
couleur. Réunir les deux fenêtres sous **Firmware** est donc ce qui rendrait
l'outil réellement plus complet que chacune de ses références.

## Ce qui est réellement éditable dans un `.op1` (rappel factuel)

Source : `FIRMWARE_LAB.md`, observation reproductible sur OS 246.

| Zone du conteneur | Contenu | Éditable par l'app ? |
|---|---|---|
| `content/display/*.svg` (61 fichiers) | écrans, icônes, curseurs | oui — c'est le graphisme |
| `content/audio/*.raw` | sons d'usine | lecture ; remplacement classé expérimental |
| `op1.db` | état utilisateur | hors périmètre direct (généré par la machine) |
| `op1_factory.db` | presets et données d'usine | oui, via mods `iter`, `presets-iter`, `filter`, `subtle-fx` |
| `tape.db` | données Tape | hors périmètre (le module Studio gère Tape séparément) |
| `kerntable.db` | crénage de police | recherche seulement, aucune valeur produit identifiée |
| `OP1_vdk.ldr` | code principal, chiffré | exclu — recherche uniquement |
| `te-boot.ldr` | bootloader | exclu |

## A. Source & vérification (existe déjà)

| Fonction | État | Outil |
|---|---|---|
| Catalogue officiel avec lien de téléchargement direct | existe | `data/firmware/catalog.json` |
| Import d'un fichier `.op1` local | existe | UI `editor` |
| Vérification CRC / LZMA / TAR / marqueurs / SHA-256 | existe (bridge Python) | `tools/firmware_inspector.py` |
| Comparaison de deux fichiers `.op1` (officiel vs modifié) | à construire | — |
| Journal des vérifications passées (historique, pas juste une notice ponctuelle) | à construire | — |

## B. Moteur sonore & presets (`op1_factory.db`)

| Fonction | État | Risque |
|---|---|---|
| Activer Iter (moteur caché déjà présent en mémoire) | vérifié OS 246 | contrôlé |
| Activer Filter (effet caché) | vérifié OS 246 | contrôlé |
| Presets Iter (rendre le moteur exploitable) | vérifié OS 246 | contrôlé |
| Valeurs `subtle-fx` (points de départ moins agressifs) | vérifié OS 246 | contrôlé |
| Quantification par gammes | patch communautaire, non intégré | critique |
| Presets/samples d'usine personnalisés | candidat, fixtures nécessaires | élevé |
| Éditeur brut de `op1_factory.db` (accès libre aux tables) | recherche seulement | rouge — pas d'accès direct prévu dans l'UI |

## C. Graphismes & écran — reprend la fenêtre "Images" actuelle

| Fonction | État | Outil |
|---|---|---|
| Charger les SVG triés par catégorie/confiance | existe | `tools/display_bridge.py` + écran Images |
| Édition non destructive du code SVG avec aperçu en direct | existe | écran Images |
| Export d'un patch JSON par fichier (`op1_gfx.patch_image_file`) | existe | `display_bridge.py patch` |
| Légende des codenames SVG dans l'UI (`bode.svg` = CWO, `cls.svg` = Cluster, etc.) | à construire | table déjà intégrée dans `display_bridge.py`, pas encore affichée |
| Mode "thème" : une seule table couleur → couleur appliquée à tous les écrans d'un coup | à construire (piste sourcée `op1-glitter`) | à ajouter dans `display_bridge.py` |
| Palette réelle de la machine comme référence visuelle (vert `#00ed95`, rouge `#ff3a5d`, bleu `#698eff`, blanc `#dfd9ff`, fond `#9256d7`) | à construire | corrige aussi le bug orange/blanc noté dans `FIRMWARE_MOD_RESOURCES.md` |
| Variantes CWO (moose / cat / dog / wizard) comme choix exclusif avec aperçu comparatif côte à côte | partiel — actuellement des cases indépendantes, rien n'empêche d'en cocher plusieurs alors qu'elles ciblent la même ressource | à corriger dans l'UI le jour du chantier |
| Iter Lab | vérifié | contrôlé |
| Lost Art | partiel, fixture de repack encore manquante | contrôlé |
| Tape invert | vérifié en labo | contrôlé |
| Import d'un SVG arbitraire dessiné par l'utilisateur | expérimental (classé ainsi dans `CONTEXT.md`) | nécessite validation `op1svg` avant toute injection |

## D. Audio d'usine embarqué (`content/audio/*.raw`)

Distinct de la bibliothèque Sons (qui gère `synth/user` et `drum/user`, pas
le contenu d'usine).

| Fonction | État |
|---|---|
| Aperçu des `.raw` d'usine (lecture seule) | à construire, dépend d'`op1aiff` |
| Remplacement d'un son d'usine | classé expérimental dans `CONTEXT.md` |

## E. Plan de mods & build

| Fonction | État | Outil |
|---|---|---|
| Sélection multiple de mods avec vignette | existe | UI `editor`, `mod-grid` |
| Gestion explicite des exclusions (ex. CWO) dans le plan | à construire (aujourd'hui implicite dans la doc, pas dans l'UI) | — |
| Aperçu du diff de fichiers avant repack | à construire | — |
| Sauvegarde exigée avant build (case à cocher) | existe | UI `editor` |
| Build + manifeste SHA-256 | existe | `tools/firmware_bridge.py` |
| Marquage visible `UNOFFICIAL-MODIFIED` du résultat dans l'UI | à construire (déjà une règle documentée, pas encore affichée) | `FIRMWARE_LAB.md` |

## F. Transfert vers la machine (TE-boot)

| Fonction | État |
|---|---|
| Checklist manuelle TE-boot étape par étape intégrée à la fenêtre (pas seulement un lien externe) | à construire |
| Ouverture du gestionnaire de fichiers au bon moment | à construire |
| Confirmation utilisateur de fin d'installation, journalisée | à construire |

## G. Explicitement hors périmètre (à afficher comme tel, pas juste absent)

`OP1_vdk.ldr`, déchiffrement, OTP, ECC, flash, bootloader. Objectif d'afficher
une mention claire dans l'UI plutôt que de laisser croire à un oubli.

## Architecture interne (sous-onglets dans la fenêtre Firmware)

Le sous-onglet **Graphismes** est maintenant integre a la fenetre Firmware dans
l'UI. L'ancien onglet Images global a ete retire apres validation de cette
integration.

```text
Firmware
├── Source & vérification   (A)
├── Presets & moteurs       (B)
├── Graphismes               (C — remplace l'onglet "Images" séparé)
├── Audio d'usine            (D)
├── Plan & build             (E)
└── Transfert TE-boot        (F)
```

Point de vigilance pour plus tard (pas maintenant) : `GUI_REDESIGN_BRIEF.md`
§7bis signale qu'un chantier de navigation persistante touche déjà la même
zone de `app/page.tsx` — vérifier après cette fusion que l'onglet Images ne
casse pas silencieusement.

## Référence croisée

[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md) · [`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md) ·
[`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md) ·
[`FIRMWARE_SAFETY.md`](FIRMWARE_SAFETY.md) · [`LOCAL_TOOLS.md`](LOCAL_TOOLS.md) ·
[`TOOLING_SHORTLIST.md`](TOOLING_SHORTLIST.md)
