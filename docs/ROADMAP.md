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
| Rack de moteurs, MIDI, effets | livrés et jouables sans machine branchée |
| Sauvegarde hors machine | validée à l'usage |
| Restauration **par l'application** vers une machine | 🔶 protocole prêt, jamais exécuté de bout en bout |
| Registre des pages | livré — 20 pages recensées avec provenance et portes |
| Design system deux thèmes | socle et composants communs livrés, migration des pages en cours |
| Strudel | 🔮 idée, rien de branché — voir §5 |

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

- vérifier le SHA réellement servi par Coolify après chaque poussée ;
- consigner l'écart quand il y en a un.

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

### Rack Strudel

**Statut : idée documentée, aucun code.** Vérifié le 2026-08-26 : aucune
dépendance, aucun composant, aucune route, et rien dans le Hub d'outils. La
seule trace dans le code est un commentaire de `packages/rack-bus/index.ts` qui
cite Strudel parmi les futurs clients du bus audio — le fond de panier est prêt
à l'accueillir, c'est tout.

À ne pas annoncer tant que ce n'est pas branché.

Ce qui est décidé quand le chantier s'ouvrira :

- un rack séparé, sans toucher au parcours de création OP-1 ;
- une fenêtre d'édition du code avec sauvegarde locale des extraits et des
  préréglages ;
- raccordement à l'entrée MIDI et au moteur audio du Hub, horloge maîtrisée ;
- exécution locale isolée, arrêt immédiat, aucune écriture machine par défaut ;
- export et compatibilité audio validés avant tout transfert matériel.

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
