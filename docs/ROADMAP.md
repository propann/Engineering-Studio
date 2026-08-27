# Feuille de route — Engineering Studio

**C'est la feuille de route principale.** Toutes les autres sont des lots
spécialisés qui en dépendent, et chacune porte un en-tête qui pointe ici.

Date de révision : **2026-08-26** · branche de livraison : `main`

---

## 1. Qui décide de quoi

L'ordre compte. En cas de contradiction entre deux documents, celui du haut
gagne, et le document perdant doit être corrigé dans le même travail.

| Rang | Source | Ce qu'elle tranche |
|---|---|---|
| 1 | **Le code de `main`** | ce qui existe réellement |
| 2 | [`STATUS.md`](STATUS.md) | l'état de chaque domaine, prouvé ou non |
| 3 | [`TESTS_PHYSIQUES.md`](TESTS_PHYSIQUES.md) | ce que le matériel a confirmé |
| 4 | **cette page** | l'ordre de travail et les priorités |
| 5 | les lots spécialisés | le détail d'un chantier |
| 6 | `docs/archived/` | mémoire seulement — jamais une preuve |

**Règle de fraîcheur.** Aucun compte de tests figé ici : il pourrit au commit
suivant, et `packages/musique/documentation.test.ts` le refuse. Pour les
chiffres, la CI et `STATUS.md` font foi.

---

## 2. Où on en est

Le détail domaine par domaine est dans [`STATUS.md`](STATUS.md), qui est tenu à
jour et ne doit pas être recopié ici. Résumé en une ligne par axe :

| Axe | État |
|---|---|
| Hub, OP-1 Studio, EP-133 Studio | en service, déployés |
| Rack de moteurs, MIDI, effets | jouables sans machine branchée ; couverture inégale, voir [`architecture/REFERENCE_BACKEND.md`](architecture/REFERENCE_BACKEND.md) |
| Sauvegarde hors machine | validée à l'usage |
| Restauration **par l'application** vers une machine | 🔶 protocole prêt, jamais exécuté de bout en bout |
| Registre des pages | livré — 21 pages recensées avec provenance et portes |
| Design system deux thèmes | socle et composants communs livrés, migration des pages en cours |
| Rack Strudel | ✅ livré le 27 août — éditeur, exemples, extraits locaux, branché sur le moteur audio du Hub |

---

## 3. Les lots actifs

Trois responsables travaillent en parallèle sur `main`. Chacun a son ordre de
mission ; **greper avant d'implémenter** un point marqué « à faire », il peut
déjà exister.

### Lot Interface — [`design/UI_ROADMAP.md`](design/UI_ROADMAP.md)

Neuf phases `UI-00` → `UI-08`. Le socle des thèmes et les sept composants
fondamentaux sont livrés ; la migration des écrans est engagée. Les règles
d'implémentation sont obligatoires et vivent dans
[`design/UI_DEVELOPMENT_PLAYBOOK.md`](design/UI_DEVELOPMENT_PLAYBOOK.md), les
jetons dans [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md).

### Lot Registre — [`ORDRE_MISSION_CLAUDE.md`](ORDRE_MISSION_CLAUDE.md)

Recensement et classement de toutes les pages. Les sept points sont traités.
Reste **une décision produit** : le rattachement au Hub de trois pages
récupérables, constaté sans être tranché dans
[`RAPPORT_DOUBLONS_PAGES_2026-08-26.md`](RAPPORT_DOUBLONS_PAGES_2026-08-26.md).

### Lot Studios et jeu — [`ORDRE_MISSION_CODEX.md`](ORDRE_MISSION_CODEX.md)

Styles OP-1 dans le Hub, badges de provenance, retrait des faux services
distants, et une série de tests de bout en bout.

---

## 4. Les trois chantiers prioritaires

Dans cet ordre. Chacun bloque le suivant.

### P0 — Le déploiement suit `main`

Le Hub public sert un build antérieur aux derniers correctifs d'interface.
Tant que ce décalage existe, toute correction visuelle est invisible pour qui
n'a pas le dépôt, et aucune communication n'est possible : on enverrait les
visiteurs sur la version qu'on vient de corriger.

Le build porte désormais son commit dans le `<head>` de la page, et une
commande le compare à `origin/main` :

```
npm run deploiement
```

Elle sort en erreur tant que le déploiement est en retard, et se lit sans
exécuter le moindre script côté page — c'est ce qui manquait pour que l'écart
soit constatable autrement qu'en comparant des empreintes de feuilles CSS.

- relancer le déploiement depuis Coolify quand la commande signale un retard ;
- si l'écart revient, brancher un déclencheur : la marche à suivre est en fin
  de `.github/workflows/deploy.yml`.

### P1 — L'accueil parle à quelqu'un qui n'a pas de machine

La page s'ouvre sur les deux studios. C'est juste pour un propriétaire d'OP-1
ou d'EP-133, et muet pour tous les autres — alors que le rack de moteurs
fonctionne **sans aucune machine branchée**, et que c'est la seule chose qu'un
visiteur peut essayer immédiatement.

- équilibrer la hiérarchie de l'accueil (ticket `UI-201`) ;
- décider où vit l'avertissement d'écriture machine : il concerne la sauvegarde
  et la restauration, pas la synthèse.

### P2 — La restauration de bout en bout

Le seul domaine où le projet promet plus qu'il ne prouve. Le mécanisme
d'écriture est vérifié octet par octet ; son orchestration ne l'est pas.
Protocole dans
[`backup/PROTOCOLE_VALIDATION_RESTAURATION.md`](backup/PROTOCOLE_VALIDATION_RESTAURATION.md).

---

## 5. Le carnet — décidé, pas commencé

### ~~Rack Strudel~~ — livré le 27 août 2026

Ce n'est plus une idée. `pages/StrudelRack.tsx`, route `strudel-rack`, carte
dans le Hub, entrée au registre.

Ce qui était décidé a été tenu :

- **rack séparé**, sans toucher au parcours de création OP-1 ;
- **édition et sauvegarde locale** des extraits — la logique vit dans
  `core/strudel/extraits.ts`, hors du composant, pour être exécutée par des
  tests plutôt que devinée à la lecture ;
- **branché sur le moteur audio du Hub** : `setAudioContext(contexte())` est
  appelé AVANT `initStrudel`, sans quoi Strudel s'attacherait au sien et
  sortirait à côté du mixage. Un test verrouille cet ordre ;
- **exécution isolée, arrêt immédiat** : `hush()` coupe tout, le bouton n'est
  jamais désactivé — c'est le PANIC de ce rack — et quitter la page coupe
  aussi ;
- **aucune écriture machine**, vérifié par test.

**Aucun échantillon distant.** Strudel n'en charge pas par défaut et on ne lui
en ajoute pas : au navigateur, jouer un motif ne déclenche **aucune requête
sortante**, ce qui a été mesuré. Un test interdit aux exemples fournis
d'appeler `samples()`.

**Le paquet est sous AGPL-3.0**, et c'est ce qui a fait basculer la licence du
dépôt entier — voir [`../LICENSE`](../LICENSE) et la section Licence du README.

Ce qui reste ouvert : l'horloge de Strudel n'est pas encore asservie au
transport du Hub. Les deux partagent le contexte audio, pas le tempo.

### EP-133 par SysEx

Aucun mode disque n'existe : tout passe par SysEx. Les chantiers du module sont
dans [`../apps/ep133-studio/docs/ROADMAP.md`](../apps/ep133-studio/docs/ROADMAP.md)
et son raccordement dans
[`../apps/ep133-studio/ROADMAP_CONNECT_TO_HUB.md`](../apps/ep133-studio/ROADMAP_CONNECT_TO_HUB.md).

---

## 6. Ce qu'on ne déclare pas fait

Cette liste est un atout, pas une gêne. Elle est ce qui rend le reste crédible.

- la restauration orchestrée par l'application vers une machine ;
- Strudel ;
- un mode disque EP-133 ;
- l'écoute critique complète des trois racks, consignée essai par essai dans
  [`TESTS_PHYSIQUES.md`](TESTS_PHYSIQUES.md).

**La règle de test du dépôt :** *un test qui ne peut pas échouer ne prouve
rien.* Chaque garde-fou est vérifié par sabotage — on casse le code
volontairement, on vérifie que le bon test tombe, et qu'aucun autre ne tombe
avec lui.

**Et sa jumelle :** *un test qui n'exécute rien ne prouve rien du comportement.*
Dix-sept fichiers de test sur cinquante-sept lisent le source en texte plutôt
que d'appeler le code. C'est utile — ce sont eux qui interdisent un sélecteur
nu ou une carte qui ment — mais ça n'apparaît dans aucune couverture. Le détail
est dans [`architecture/REFERENCE_BACKEND.md`](architecture/REFERENCE_BACKEND.md).

---

## 7. La carte des documents

| Document | Ce qu'il porte |
|---|---|
| [`STATUS.md`](STATUS.md) | l'état courant, domaine par domaine |
| [`TESTS_PHYSIQUES.md`](TESTS_PHYSIQUES.md) | ce que le matériel a confirmé |
| [`design/UI_ROADMAP.md`](design/UI_ROADMAP.md) | les phases d'interface et leurs critères |
| [`design/UI_DEVELOPMENT_PLAYBOOK.md`](design/UI_DEVELOPMENT_PLAYBOOK.md) | les règles obligatoires d'implémentation |
| [`design/UI_PAGE_SPEC_TEMPLATE.md`](design/UI_PAGE_SPEC_TEMPLATE.md) | la trame à remplir avant une refonte d'écran |
| [`../AUDIO_RACK_ROADMAP.md`](../AUDIO_RACK_ROADMAP.md) | le plan détaillé du rack audio |
| [`../MODULES_STATUS.md`](../MODULES_STATUS.md) | l'état module par module du rack |
| [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | la structure technique |
| [`architecture/REFERENCE_BACKEND.md`](architecture/REFERENCE_BACKEND.md) | ce que chaque module offre, et jusqu'où c'est prouvé |
| [`guides/STARTUP_GUIDE.md`](guides/STARTUP_GUIDE.md) | l'installation |
| [`WORKFLOW.md`](WORKFLOW.md) | la méthode de travail |
| [`INDEX.md`](INDEX.md) | l'entrée de toute la documentation |

**Remplacés.** [`guides/DESIGN_IMPROVEMENTS_TODO.md`](guides/DESIGN_IMPROVEMENTS_TODO.md)
et [`guides/CODE_CLEANUP_PLAN.md`](guides/CODE_CLEANUP_PLAN.md) datent d'avant le
design system. Ils restent pour mémoire ; le travail d'interface se pilote
depuis `design/UI_ROADMAP.md`.

**Archive.** Le journal des phases 1 à 6, tenu jusqu'au 26 août 2026, est dans
[`archived/ROADMAP_PHASES_2026-08.md`](archived/ROADMAP_PHASES_2026-08.md). Il
dit ce qui était vrai le jour de chaque entrée, et ne prouve rien sur le
présent.

---

## 8. Comment on écrit ici

Une entrée de cette page nomme **qui**, **quoi**, **ce qui bloque** et **comment
on saura que c'est fini**. Le détail va dans le lot correspondant, pas ici :
cette page doit rester lisible d'une traite.

Une fonction est terminée seulement si son état réel est visible dans
l'interface, son parcours est testable dans le Hub, la CI est verte, et sa
documentation décrit exactement ses limites.
