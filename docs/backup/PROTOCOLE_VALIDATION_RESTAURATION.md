# Protocole — valider le chemin de restauration

Prêt à exécuter. Écrit le 2026-08-21, **non encore exécuté** : reporté à une
session avec le matériel sur l'établi.

## Pourquoi

La restauration est le seul code du dépôt qui **écrit sur le disque de
l'utilisateur**. Elle a un prévol, un point de retour horodaté et une détection
des fichiers déjà identiques, et de nombreux tests la couvrent — mais tous sur des
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

Dossier de sauvegarde → `_essai-coffre/espace`. Source → la référence. Les quatre
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

### Écriture sur l'OP-1 : validée le 2026-08-21

Le mécanisme écrire → vider le tampon → **relire depuis le périphérique** →
comparer les empreintes fonctionne sur le vrai matériel.

Protocole suivi, dans cet ordre :

1. Sauvegarde intégrale préalable — 66 fichiers, 270 Mo, comparés octet par
   octet, 0 divergence (`~/Sons-Machines/OP-1_2026-08-21`)
2. Vérification que la sauvegarde couvre bien les fichiers visés
3. Remontage en écriture, essai sur un fichier temporaire, puis retrait
4. Écriture d'une version différente de `synth/user/8.aif` (celle de la veille,
   **même taille, contenu différent** — le cas qu'une comparaison de tailles
   laisserait passer)
5. **Démontage et remontage** avant relecture, pour lire le périphérique et non
   le cache du noyau — sans cela, la vérification se contenterait de relire ce
   qu'on vient d'écrire en mémoire
6. Empreinte conforme ✅
7. Réécriture de la version d'origine, puis contrôle des 66 fichiers : 0
   divergence, machine rendue à son état initial

L'étape 5 est celle qu'on oublie. Une relecture immédiate passe par le cache et
ne prouve rien sur ce qui est réellement sur le support.

### Ce qui reste à valider

| | |
|---|---|
| Mécanisme d'écriture vérifiée, au niveau fichier | ✅ 2026-08-21 |
| L'OP-1 accepte le système de fichiers après écriture externe | ✅ 2026-08-21 |
| Chemin de restauration de l'application, par le navigateur | ⬜ |

L'OP-1 procède à un rapport à chaque déconnexion : elle réanalyse son support
et le signale. Après les écritures ci-dessus, ce rapport passe normalement —
confirmé par l'utilisateur. Écrire depuis Linux sur le volume FAT de la machine
ne la déroute donc pas et ne corrompt pas son système de fichiers.

C'est ce qui manquait pour que la vérification ait un sens côté instrument :
des empreintes conformes prouvent que les octets sont là, pas que la machine
sait encore s'en servir.

Prudence conservée : le disque se monte en lecture seule par défaut pendant
les essais, et toute écriture est précédée d'une sauvegarde vérifiée.

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
