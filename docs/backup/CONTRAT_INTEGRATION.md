# Coffre — contrat d'intégration

Ce que le coffre expose, pour qui construit dessus : interface, nouvelle
machine, ou nouvel outil qui doit sauvegarder.

Trois personnes travaillent sur ce dépôt en parallèle. Ce document existe pour
que la logique et l'interface avancent sans se marcher dessus.

---

## Partage des rôles

| Terrain | Contenu |
|---|---|
| **Logique** | `scannerSource`, `prevolRestauration`, `creerPointDeRetour`, `transition`, `verifierSnapshot`, `categoriesIncompletes` — fonctions pures, exportées, testées |
| **Interface** | Badges de provenance, modes de densité, mise en page, `BackupLab.tsx` |

Les **libellés** ont changé de mains le 2026-08-21 : ils sont désormais
verrouillés par des tests, parce qu'ils portent une règle produit et pas
seulement une préférence de rédaction. Nommer le dossier de sauvegarde d'après
une machine, ou parler de « disque » pour l'EP-133 qui n'en a pas, sont des
erreurs de fond — pas de style.

La logique publie des **types et des fonctions pures**. L'interface les lit et
décide du rendu. Aucune fonction de logique ne produit de balisage.

---

## Ce qu'on peut consommer

Tout vient de `apps/studio-hub/src/VaultPanel.tsx`.

### Phases d'opération

```ts
export type PhaseOperation =
  | "idle"       // aucune opération en cours
  | "prepared"   // inventaire connu, rien d'écrit
  | "running"    // écriture en cours sur le disque
  | "complete"   // fichiers copiés et vérifiés un par un
  | "verified"   // contrôle a posteriori concluant
  | "partial"    // arrêt après au moins un fichier finalisé
  | "failed";    // arrêt sans aucun fichier finalisé
```

Les valeurs restent en anglais : elles apparaissent telles quelles dans le
rapport JSON téléchargé et dans `docs/ROADMAP.md`.

**`complete` n'est pas un succès.** Copier et vérifier chaque fichier ne prouve
pas que l'ensemble se relit. C'est une phase de passage : toute exécution qui
l'atteint se résout ensuite en `verified` ou `partial`.

Pour le rendu, un contrat existe déjà — inutile d'écrire un `switch` de plus :

```ts
libelleEtat(phase) → { texte: string; ton: "neutre" | "succes" | "alerte" | "erreur" }
```

Seule `verified` porte le ton `succes`. Un test le verrouille.

### Le drapeau qui compte

`EtatOperation.ecritureCommencee` est **orthogonal à la phase**. Il répond à une
question que la phase seule ne tranche pas : *le disque de l'utilisateur a-t-il
été touché ?*

Le cas qui l'impose : une restauration qui échoue **pendant** la création du
point de retour n'a finalisé aucun fichier — donc `failed` — alors qu'un dossier
à moitié rempli existe désormais dans la cible.

Une interface qui affiche « aucune modification » en se fiant à `failed` ment.

### Rapport

```ts
export type VaultReport = {
  operation: "backup" | "restore";
  phase?: PhaseOperation;
  fileCount: number;
  totalBytes: number;
  files: BackupFile[];
  ventilation?: { crees: number; remplaces: number; inchanges: number };
  echec?: {
    raison: string;
    fichierInterrompu?: string;
    fichiersPrevus: number;
    categoriesIncompletes: BackupCategory[];
    ecritureCommencee: boolean;
    snapshotSupprime?: boolean;
    pointDeRetour?: string | null;
  };
  // …
};
```

**Invariant** : `files` ne contient **que** les fichiers finalisés et vérifiés.
Jamais des intentions. C'est ce qui rend un rapport partiel exploitable — un
inventaire exact de ce qui est réellement sur le disque, avec chemin, taille et
empreinte.

`downloadReport` sérialise l'objet entier : tout champ ajouté au type se
retrouve dans le JSON sans autre modification.

---

## Ajouter une machine

Le contrat cible est défini dans `BACKUP_LAB_AUDIT_2026-08-20.md` :

```
identify()          → machine, modèle, numéro de série
plan(scope)         → fichiers, taille, actions, risques
snapshot(scope)     → contenu + manifeste + empreintes
verify(snapshot)    → manquants, modifiés, empreintes invalides
restorePlan(target) → créations, remplacements, conflits
restore(plan)       → point de retour, confirmation, écriture, relecture
```

Aujourd'hui, seul le chemin « dossier local » est implémenté. Les deux machines
s'y raccordent différemment :

| | OP-1 | EP-133 |
|---|---|---|
| Accès | mode disque, USB mass storage | **aucun mode disque** |
| Lecture | dossier monté, `scannerSource` | SysEx uniquement, `listMachineSounds()` |
| Catégories | `tape`, `album`, `drum`, `synth` | `projects`, `samples` |
| Validé sur matériel | lecture ✅ (66 fichiers, comparés octet par octet) | non |

Conséquence pour l'interface : **l'EP-133 ne peut pas être sauvegardée comme
l'OP-1.** Ses sons ne sortent que par SysEx, donc depuis le navigateur avec la
permission accordée. Proposer un « choisir un dossier » pour l'EP-133 serait
trompeur.

---

## Règle produit

> L'interface ne doit jamais laisser croire qu'une machine a été lue ou écrite
> quand l'application n'a fait qu'inspecter ou copier un dossier local.

Concrètement, quatre natures d'opération sont à distinguer et ne doivent jamais
être présentées de la même façon :

| | Ce que c'est |
|---|---|
| `local_snapshot` | copie dans l'espace de travail choisi |
| `machine_read` | lecture depuis une machine connectée |
| `machine_write` | écriture physique, toujours protégée |
| `restore_target` | dossier ou emplacement ciblé, jamais implicite |

`scannerSource` relève de `local_snapshot`. Il est en **lecture stricte** — un
test vérifie qu'il ne demande jamais `create: true`.

---

## Pièges déjà rencontrés

Ils sont documentés parce qu'ils se sont produits, pas par précaution.

### Déclarer dans le `try` ce dont le `catch` a besoin

Trois fois dans ce fichier. `pointDeRetour` en était le cas le plus visible : le
message d'erreur affirmait **toujours** que les originaux étaient dans
`_point-de-retour/`, y compris quand aucun n'avait été créé.

Une variable dont le `catch` a besoin se déclare **avant** le `try`.

### Masquer une fonction du module par une variable locale

Un tableau local nommé `manifestFiles` masquait la fonction homonyme. Dans le
`try` c'était le tableau, dans le `catch` — hors de portée — la fonction. Le
typecheck l'a signalé ; les deux collisions précédentes étaient passées.

### Un substitut qui ne se comporte pas comme l'original

Le premier faux système de fichiers des tests **jetait ce qu'on lui écrivait**.
`copyFile` relit la destination pour comparer les empreintes, donc cinq tests
signalaient une panne inexistante — et auraient pu conduire à « réparer » une
vérification d'intégrité parfaitement saine.

Un faux qui ne se comporte pas comme la chose qu'il remplace teste autre chose
que ce qu'on croit.

### Se fier au build plutôt qu'au typecheck

`npm run build` passe avec des erreurs de type : Vite transpile sans vérifier.
Seul `npm run typecheck` les voit. Un dépôt peut être rouge avec un build vert —
c'est arrivé une fois dans cette session.

---

## Tester

482 tests, sur des fonctions pures exportées et sur la structure du source.
Aucun test de rendu React.

```bash
npm test                 # local
npm run typecheck        # ne pas s'en dispenser
```

Le CI tourne sous **bun**, pas npm. Pour reproduire à l'identique :

```bash
docker run --rm -v "$PWD":/src -w /src oven/bun:1-alpine \
  sh -c "bun install --frozen-lockfile && bun run test"
```

### La règle qui compte

**Un test qui ne peut pas échouer ne prouve rien.** Chaque garde-fou ajouté ici
a été vérifié par sabotage : on casse volontairement le code, on vérifie que le
test concerné tombe — et qu'aucun autre ne tombe avec lui.

Exemples réels : neutraliser la comparaison d'empreintes fait tomber deux tests ;
traiter l'absence d'empreinte comme « inchangé » en fait tomber trois, dont
celui qui verrouille précisément cette prudence.

Un test écrit sans avoir été vu échouer au moins une fois n'a pas été écrit.

---

## Où en est le coffre

| | |
|---|---|
| Prévol avant restauration | ✅ |
| Point de retour horodaté | ✅ |
| Détail du scan par catégorie | ✅ |
| Machine à états | ✅ |
| Rapport d'échec exploitable | ✅ |
| Fichiers déjà identiques ignorés | ✅ |
| Test de copie interrompue | ✅ |
| Dossiers vides copiés et restaurés | ✅ 2026-08-21 |
| Reconnaissance du support machine | ✅ 2026-08-21 |
| Jauge de remplissage | ✅ 2026-08-21 |
| N'afficher que les machines déclarées | ✅ 2026-08-21 |
| Libellés en langage courant, sans jargon | ✅ 2026-08-21 |
| Le message de succès dit OÙ | ✅ 2026-08-21 |
| Badges, densité, modes Simple/Atelier | ⬜ interface |
| Écriture vérifiée sur l'OP-1, au niveau fichier | ✅ 2026-08-21 |
| L'OP-1 relit son support après écriture externe | ✅ 2026-08-21 |
| Restauration validée, cible dossier local | ⬜ protocole prêt, non exécuté |
| Restauration par l'application, de bout en bout | ⬜ |

**Ce qui est prouvé sur matériel** : écrire sur l'OP-1, vider le tampon,
démonter/remonter puis relire depuis le périphérique et comparer les empreintes.
Fait le 2026-08-21 sur `synth/user/8.aif`, avec un contenu de taille identique —
le cas qu'une comparaison de tailles laisserait passer. Machine rendue à son état
initial ensuite, 66 fichiers contrôlés, 0 divergence.

L'OP-1 fait un rapport à chaque déconnexion : elle réanalyse son support et le
signale. Après ces écritures, ce rapport passe normalement — écrire depuis Linux
sur son volume FAT ne la déroute pas.

**Ce qui ne l'est pas** : le chemin de restauration de l'application lui-même,
qui passe par le navigateur — `prevolRestauration`, le point de retour, la
boucle de `restoreBackup`. Ce qui est prouvé ci-dessus, c'est le mécanisme
qu'elle emploie, pas son orchestration.

Prudence conservée : le disque se monte en lecture seule par défaut, et toute
écriture est précédée d'une sauvegarde vérifiée.

Le protocole est écrit et prêt à dérouler :
[`PROTOCOLE_VALIDATION_RESTAURATION.md`](PROTOCOLE_VALIDATION_RESTAURATION.md).
Il se fait en deux niveaux — d'abord vers une **copie** du dossier récupéré de
l'OP-1 (66 fichiers, 270 Mo, aucun matériel requis), ensuite seulement vers la
machine. Les deux lignes ci-dessus restent distinctes pour cette raison : un
niveau A vert ne prouve rien sur l'écriture vers l'OP-1.
