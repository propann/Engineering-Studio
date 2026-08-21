# Protocole — valider le chemin de restauration

Prêt à exécuter. Écrit le 2026-08-21, **non encore exécuté** : reporté à une
session avec le matériel sur l'établi.

## Pourquoi

La restauration est le seul code du dépôt qui **écrit sur le disque de
l'utilisateur**. Elle a un prévol, un point de retour horodaté et une détection
des fichiers déjà identiques, et 205 tests la couvrent — mais tous sur des
systèmes de fichiers factices. Elle n'a jamais touché un vrai fichier.

## Deux niveaux, à ne pas confondre

| Niveau | Ce que ça prouve | Matériel |
|---|---|---|
| **A — dossier local** | la logique tient sur 270 Mo réels | aucun |
| **B — machine** | l'écriture vers l'OP-1 aboutit | OP-1 en mode disque |

Le niveau A se fait sans rien brancher, avec `~/Sons-Machines/OP-1_2026-08-20`
comme source (66 fichiers, 270 Mo, récupérés et comparés octet par octet le
2026-08-20). **Le faire d'abord** : il élimine les défauts de logique avant
qu'ils ne s'expriment sur du matériel.

---

## Niveau A — cible dossier local

### Préparation

```bash
R=~/Sons-Machines/OP-1_2026-08-20
E=~/Sons-Machines/_essai-coffre
rm -rf "$E"; mkdir -p "$E/espace" "$E/cible"
(cd "$R" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$E/reference-empreintes.txt"
cp -a "$R"/. "$E/cible/"
diff -r "$R" "$E/cible" && echo "copie conforme"
(cd "$E/cible" && find . -type f -printf '%T@ %p\n' | sort -k2) > "$E/horodatages-avant.txt"
```

**La référence n'est jamais une cible.** Elle sert de source et d'étalon.

### Manche 1 — sauvegarder

Espace maître → `_essai-coffre/espace`. Source → la référence. Les quatre
catégories (album 2, drum 19, synth 41, tape 4).

Attendu : 66 fichiers, 270 Mo.

Vérifier : le manifeste liste 66 entrées **avec empreintes** — `copyFile` rend
`{ size, sha256 }` et `VaultPanel.tsx:748` le verse au manifeste ; chaque
empreinte correspond au `sha256sum` calculé indépendamment ; la référence est
inchangée.

### Manche 2 — restaurer vers une copie identique

Cible → `_essai-coffre/cible`. Toutes les catégories.

Attendu, dans la boîte de confirmation :

```
0 fichier(s) créé(s) · 0 remplacé(s) · 66 déjà identique(s), ignoré(s)
Aucun fichier existant ne sera écrasé.
```

**C'est la manche qui compte.** Elle prouve sur des données réelles ce que
`prevolRestauration` (VaultPanel.tsx:445) promet : sans elle, restaurer une
seule catégorie recopierait les 270 Mo entiers et gonflerait le point de retour
d'autant de doublons.

Vérifier : `_point-de-retour/` **absent** ; aucun horodatage modifié ;
`diff -r` avec la référence vide. Zéro octet écrit.

> Le prévol lit et hache toute la cible — dont deux fichiers `tape` de 122 Mo —
> **sans barre de progression**. Un temps mort de plusieurs secondes est normal.

### Manche 3 — un seul fichier divergent

Modifier un octet d'un fichier de `cible/synth/`, relancer la même restauration.

Attendu : `1 remplacé(s)`, l'aperçu nomme ce fichier, point de retour annoncé.

Vérifier : `_point-de-retour/<horodatage>/` contient **exactement un fichier**,
la version modifiée ; le fichier de la cible est redevenu conforme ; **les 65
autres ont un horodatage inchangé**.

### Nettoyage

```bash
rm -rf ~/Sons-Machines/_essai-coffre   # la référence reste
```

---

## Niveau B — cible machine

**Jamais tenté.** À n'aborder qu'après un niveau A entièrement vert.

Le disque de l'OP-1 se monte en lecture seule pendant les essais,
délibérément — le monter en écriture est le premier geste, et le dernier
réversible. Sauvegarder la machine **avant** toute écriture vers elle.

---

## Ce qui peut casser

Prédit à l'avance : un échec ici est un résultat, pas un contretemps.

1. **La manche 2 annonce 66 remplacements au lieu de 66 identiques.** Le
   manifeste n'aurait pas d'empreintes exploitables. `prevolRestauration:445`
   retombe alors délibérément sur « à remplacer » — prudent, mais la détection
   n'aurait servi à rien. *Écarté par lecture du code le 2026-08-21 ; à
   reconfirmer à l'exécution.*
2. **Lenteur du prévol** — voir l'encadré de la manche 2.
3. **Permission redemandée** entre le choix de la cible et l'écriture.
4. **Point de retour à 0 fichier** alors que des remplacements sont annoncés :
   ce serait exactement le défaut que `creerPointDeRetour:487` prétend gérer.

## Si un correctif s'impose

Un test qui **échoue d'abord** sur le défaut constaté, puis le correctif. Un
test qui ne peut pas échouer ne prouve rien.

## Formulation, à ne pas relâcher

Restaurer vers un dossier local **n'est pas** restaurer vers un OP-1. Un
niveau A vert se note « validé sur données réelles, cible dossier local » et
laisse « écriture vers la machine » à ⬜. Le contrat suit cette distinction ;
la brouiller viderait la colonne de son sens.
