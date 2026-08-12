# Pack d'outils — ce qui est exploité, ce qui ne l'est pas, et si ça vaut le coup

Analyse du 12 août 2026. Ne refait pas `TOOLING_AUDIT.md` (jugement détaillé
par outil) ni `tools/sources.yml` (registre machine-lisible) : ce document
croise leur contenu avec l'usage réel dans `tools/*.py` et `package.json`
pour répondre à une question simple — **qu'est-ce qu'on a sous la main et
qu'on n'utilise pas, et est-ce que ça mérite d'être branché ?**

Méthode : `grep` du nom de chaque outil audité dans `tools/*.py` pour voir
s'il est réellement appelé quelque part, plus lecture de `package.json`,
`worker/index.ts`, `db/schema.ts` et `src-tauri/src/main.rs` pour la partie
stack applicative.

## 1. Ce qui est déjà exploité

| Outil | Où | Preuve |
|---|---|---|
| `op1repacker` 0.2.6 | vendored dans `tools/vendor/op1repacker/`, appelé par `firmware_bridge.py` et `display_bridge.py` | unpack/repack/mods réellement exécutés sur OS 246 (`FIRMWARE_LAB.md`) |
| `op-patch-util` | installé via Cargo par `Install-OP1StudioTools.ps1`, appelé par `patch_bridge.py` | commandes `synth`/`drum` testées |
| FFmpeg | sidecar appelé par `sample_preflight.py` et `tape_bridge.py` | conversion mono 44,1 kHz/16 bits vérifiée |
| Dictionnaire de codenames `op1-glitter` (THEME_CREATION.md) | recopié en dur dans `display_bridge.py` | fait tomber le taux de SVG "non identifié" de 31/61 à 18/61 |

Le reste du mécanisme `op1-glitter` (thème global couleur → couleur) n'est
**pas** exploité : seule sa documentation a été pillée pour nommer nos SVG,
le moteur de thème lui-même reste à écrire (déjà noté "à construire" dans
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md)).

## 2. Outils audités, jamais appelés dans le code — verdict par outil

Tous les outils ci-dessous ont un audit complet dans `TOOLING_AUDIT.md` et
une entrée dans `tools/sources.yml`. Aucun n'apparaît dans un `grep` de
`tools/*.py`. Verdict : lesquels valent une vraie intégration maintenant,
lesquels restent corrects en référence pure.

| Outil | Pertinence à exploiter | Pourquoi |
|---|---|---|
| **`op1aiff`** | **Oui, prioritaire** | inspection AIFF/preset en lecture seule ; branché directement à la fonction "bibliothèque avec recherche/filtre" de Sons, encore marquée à construire dans `WINDOW_FUNCTIONS_SPEC.md`. Aucun risque : lecture seule, licence MIT. |
| **`op1svg`** | **Oui, prioritaire** | normalisation/validation SVG avant injection ; c'est exactement le garde-fou manquant pour la fonction "import d'un SVG arbitraire" classée expérimentale dans `FIRMWARE_LAB_FUNCTIONS.md`. Sans lui, cette fonction reste bloquée par manque de validation, pas par choix produit. |
| **`teoperator`** | Oui, en second | fixtures croisées pour vérifier que nos patches sont interprétés pareil qu'une autre implémentation (MIT, déjà recommandé comme référence de tests). Utile surtout au moment où `op-patch-util` sort de sa phase candidate. |
| **`opie`** | Non, plus nécessaire | son rôle (backup/restore) est déjà couvert et dépassé par `backup_manifest.py` + `device_transfer_plan.py`, qui ont en plus un manifeste par fichier qu'`opie` n'a pas. Le garder en référence historique suffit. |
| **`op1tools`** | Non, risque > apport | scripts Linux de montage/éjection ; `TOOLING_AUDIT.md` le marque déjà "à réécrire", et `device_inventory.py`/`device_transfer_plan.py` remplissent déjà ce rôle en plus sûr et multiplateforme. |
| **`OP-1Z-Sample-Manager`** | Non pour l'instant | GPL-3.0 compatible avec notre AGPL, mais son apport (gestion samples/tape) recoupe déjà `sample_preflight.py` et `tape_bridge.py`. À rouvrir seulement si un vrai manque concret apparaît. |
| **`op1REpackerGUI`** | Non, par design | déjà classé "référence UX uniquement" — le but n'est pas de l'intégrer mais de comparer nos écrans aux siens. Rien à changer ici. |
| **`OP-PatchStudio`** | Oui, mais visuel seulement | pas de code à reprendre (cible OP-XY), mais son ergonomie waveform/drum est la référence directe pour la grille de pads déjà construite (`SoundPadGrid`) — comparaison ponctuelle utile, pas une dépendance. |
| **`sampi/finger`** | Oui, quand M4.5 démarre | référence technique directe pour le futur module Exercices/Éducation (finger drumming) déjà cité dans `GUI_REDESIGN_BRIEF.md`. Pas pertinent tant que M4.5 n'a pas démarré. |
| **`connect-op1`** | Usage ponctuel seulement | l'identifiant USB `2367:0004` est déjà cité dans `ARCHITECTURE.md` comme un indice parmi d'autres, jamais une preuve seule — rien à exploiter de plus. |
| **`op1.fun.app`**, **`op1-patch-preview`** | Non | benchmarks UX déclarés comme tels ; aucune intégration prévue, aucune perte à les laisser en référence. |
| **`FL-OP1-controller-script`**, **`TOP-1`**, **`op1kenobi`** | Non pour l'instant | cités dans `TOOLING_SHORTLIST.md`/`LOCAL_TOOLS.md` comme pistes DAW/MIDI et références d'architecture ; pertinents seulement après le pont MIDI (`ROADMAP.md` M4.5+), pas avant. |
| **`op1-decryptor`**, **`op1dumps`**, **`OP-1 Note Quantization`**, **`op1emu`** | Non, à dessein | recherche/chiffrement/flash — hors périmètre produit, déjà marqués comme tels partout (`CONTEXT.md`, `TOOLING_AUDIT.md`). Ne pas rouvrir sans décision produit explicite. |

**Constat net :** sur toute la liste auditée, seuls deux outils sont des
angles morts réels — audités, jugés utiles, jamais branchés, et sans
dépendance bloquante — `op1aiff` et `op1svg`. Tout le reste est soit déjà
couvert par nos propres bridges, soit correctement laissé en référence par
choix, pas par oubli.

## 3. Notre propre stack logicielle — décision prise le 12 août : on garde, orienté service en ligne

Mise à jour suite à décision produit du 12 août 2026 : le projet part sur un
**service** — hébergé en ligne, avec une offre payante/location — en plus de
l'app locale. Ça referme la question laissée ouverte plus haut dans une
première version de ce document, et ça confirme que `worker/index.ts`,
`db/schema.ts`, `wrangler`, `@cloudflare/vite-plugin`, `drizzle-orm/kit` et
`examples/d1/` ne sont pas du poids mort de starter : c'est le socle
technique cohérent avec ce que `BUSINESS_MODEL.md` décrit déjà depuis le
départ sous le nom **Studio Cloud** (4–6 €/mois ou 35–49 €/an — historique
chiffré distant, synchronisation multi-ordinateur, partage privé) et avec le
jalon **M6 Studio Cloud** de `ROADMAP.md`. Personne n'improvise : la doc
business avait déjà prévu ce modèle hybride, seule la stack technique n'était
pas encore reliée dessus.

| Élément | État réel | Rôle dans le plan service |
|---|---|---|
| `worker/index.ts` | Worker Cloudflare fonctionnel, encore au stade boilerplate du starter | à devenir le point d'entrée de l'API Studio Cloud |
| `db/schema.ts` | vide | à remplir avec les tables du service (comptes, sauvegardes distantes chiffrées, catalogue de sons partagé) — voir point de vigilance ci-dessous |
| `wrangler`, `@cloudflare/vite-plugin`, `drizzle-orm`, `drizzle-kit` | installés, pas encore appelés depuis `app/` | corrects pour cette direction, à commencer à câbler |

**Point de vigilance qui reste vrai malgré la décision** : `ARCHITECTURE.md`
distingue toujours deux bases différentes — "bibliothèque : SQLite locale
pour l'index" (sur la machine de l'utilisateur, hors service) et la
synchronisation distante optionnelle. D1 (Cloudflare) est le bon choix pour
le **service** (comptes, sync, partage), mais ne doit pas devenir la seule
source de vérité pour l'index local de la bibliothèque Sons — sinon la
fonction "aucun compte nécessaire" de `APP_SCOPE.md`/`BUSINESS_MODEL.md`
("Ce qui ne doit pas être payant" : sauvegarde et restauration locales)
casse silencieusement le jour où quelqu'un branche l'UI dessus sans faire
attention. Les deux bases doivent rester séparées dans l'implémentation,
pas juste dans la doc.

### Conflit de licence à trancher avant d'aller plus loin

En vérifiant ce chantier, un vrai désaccord dans le dépôt : le fichier
`LICENSE` réel est **MIT**, et `NOTICE.md`/`BUSINESS_MODEL.md` le citent
correctement ("licence MIT" explicite dans les deux). Mais `README.md`
("Le code du depot est distribue sous **AGPL-3.0-only**") et
`package.json` (`"license": "AGPL-3.0-only"`) affichent l'inverse. C'est
directement pertinent maintenant : partir sur un service hébergé sous AGPL-3.0
imposerait de republier le code modifié du service à tout utilisateur réseau
(clause AGPL §13) — sous MIT (la licence réellement en vigueur via le fichier
`LICENSE`), aucune obligation de ce type. Tant que `README.md` et
`package.json` ne sont pas alignés sur le `LICENSE` réel, n'importe qui lisant
le dépôt (contributeur, investisseur, partenaire d'hébergement) reçoit un
signal contradictoire sur ce qu'il a le droit de faire. À corriger avant
toute communication publique sur l'offre payante — je ne l'ai pas changé
moi-même, c'est une décision légale, pas une correction de doc silencieuse.

## 4. Le vrai trou : le cœur Rust décrit dans l'architecture n'existe pas

`ARCHITECTURE.md` prévoit un "Domaine Rust" portant `DeviceIdentity`,
`DeviceSnapshot`, `ChangePlan`, `BackupManifest`, `AudioAsset`,
`FirmwareRelease`, `OperationJournal`. Dans le dépôt, `src-tauri/src/main.rs`
fait 30 lignes et expose une seule commande (`app_info`, qui renvoie des
infos statiques). Toute la logique qui devait vivre dans ce domaine Rust
(vérification CRC/LZMA/TAR, manifeste SHA-256, plan de transfert copy/skip)
existe aujourd'hui **en Python**, dans `tools/*.py` — ce qui fonctionne très
bien pour un labo local et des tests reproductibles, mais ne peut pas devenir
le cœur d'une application Tauri packagée (M8) sans être réécrit ou appelé en
sidecar.

C'est la seule vraie dépendance manquante qui bloque un jalon déjà écrit dans
`ROADMAP.md` (M5.3 Safe Change Engine, M8 Empaquetage) — plus urgent que
n'importe quel outil communautaire de la section 2. Pas une action à
entreprendre ici, juste le constat le plus important de cette analyse : ce
n'est pas un outil externe qui manque, c'est la couche que l'architecture
documentée promet et que rien ne construit encore.

## Résumé des priorités si on devait exploiter quelque chose ensuite

1. `op1aiff` et `op1svg` — faible risque, gain direct sur des fonctions déjà
   listées "à construire" (Sons, import SVG).
2. `worker/`, `db/`, `wrangler`, `drizzle-*` — décision prise (service en
   ligne, voir section 3) : à câbler pour Studio Cloud, en gardant l'index
   local séparé du compte/sync distant. Aligner `README.md` et
   `package.json` sur la licence MIT réelle (`LICENSE`) avant toute
   communication publique sur l'offre payante.
3. `teoperator` — quand `op-patch-util` sort du statut candidat.
4. `sampi/finger`, `FL-OP1-controller-script`, `TOP-1`, `op1kenobi` — seulement
   quand leurs jalons respectifs (M4.5 Éducation, pont MIDI/DAW) démarrent.
5. Cœur Rust (`src-tauri/`) — hors périmètre "outil à exploiter", mais c'est
   le vrai chantier derrière tout ce qui précède.

## Référence croisée

[`TOOLING_AUDIT.md`](TOOLING_AUDIT.md) · [`TOOLING_SHORTLIST.md`](TOOLING_SHORTLIST.md) ·
[`../tools/sources.yml`](../tools/sources.yml) · [`ARCHITECTURE.md`](ARCHITECTURE.md) ·
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) · [`WINDOW_FUNCTIONS_SPEC.md`](WINDOW_FUNCTIONS_SPEC.md)
