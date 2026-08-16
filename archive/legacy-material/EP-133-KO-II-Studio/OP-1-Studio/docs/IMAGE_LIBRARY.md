# Bibliothèque d'images OP-1

## Objectif

La page **Images** utilise une bibliothèque locale pour explorer les SVG d'un
firmware ouvert, les afficher dans l'éditeur et préparer des variantes sans
écrire directement dans la machine.

## Organisation du coffre

Pour un dossier de travail configuré, l'application crée automatiquement les
dossiers nécessaires, notamment :

```text
images/
├── original/     # copies intactes des images importées
├── library/      # versions triées par display_bridge.py
├── workspace/    # travaux en cours
├── themes/       # thèmes préparés
├── exports/      # exports et patches
└── manifests/    # inventaires et empreintes SHA-256
```

L'initialisation est additive : elle crée les dossiers manquants et ne
supprime ni ne remplace les fichiers existants.

## Import d'un firmware déjà ouvert

Depuis la racine du projet :

```powershell
python tools/content_catalog.py import-display backups .cache/firmware/op1_246 --firmware op1_246
python tools/display_bridge.py sort --input .cache/firmware/op1_246 --output-dir backups/images/library/op1_246
```

L'import accepte soit le dossier du firmware, soit directement son dossier
`content/display`. Il copie les SVG vers :

```text
backups/images/original/op1_246/
```

Le fichier suivant conserve la liste et l'empreinte de chaque image :

```text
backups/images/manifests/op1_246-display.json
```

L'opération est idempotente : un second import constate les fichiers
identiques et ne les recopie pas. La source `.cache/firmware` n'est jamais
modifiée.

## Chargement dans l'application

- En application Tauri, la commande native `display_library_read` lit les SVG
  du coffre en lecture seule.
- En mode `npm run dev`, la route locale `/api/display-library` fournit le
  même contenu au navigateur.
- Si le navigateur n'a pas accès au coffre, le sélecteur manuel permet encore
  de charger un ou plusieurs SVG.

Le composant fusionne les fichiers importés avec ceux chargés manuellement,
les classe par catégorie et affiche leurs dimensions. Les profils atypiques
restent verrouillés pour les opérations de thème et d'export.

## Sécurité et périmètre

- Aucun envoi vers un service en ligne.
- Aucun flash firmware et aucune écriture directe sur l'OP-1.
- Les modifications sont conservées en mémoire jusqu'à l'export d'un patch.
- Les SVG sont limités à la bibliothèque `images/original` côté lecteur local.
- Les dimensions machine et le `viewBox` sont contrôlés avant l'édition pixel.

## Fichiers concernés

- `tools/content_catalog.py` : création du coffre et import des SVG.
- `tools/display_bridge.py` : tri et manifeste de catégorisation.
- `app/lib/nativeStorage.ts` : accès Tauri et fallback navigateur.
- `app/api/display-library/route.ts` : lecture locale en mode développement.
- `src-tauri/src/main.rs` : création des dossiers et lecture native.
- `app/page.tsx` : chargement automatique dans la page Images.
