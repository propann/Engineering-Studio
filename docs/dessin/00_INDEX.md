# Dossier dessin — Studio Hub

Ce dossier est le brief visuel de référence pour la porte d’entrée et les deux
applications. Il décrit ce que l’utilisateur doit comprendre, les boutons à
dessiner et les états à prévoir avant de produire les écrans définitifs.

## Documents

1. [Studio Hub](01_STUDIO_HUB.md) — porte d’entrée, fiche, cartes et coffre.
2. [OP‑1 Studio](02_OP1_STUDIO.md) — firmware, sons, images, Tape, sauvegardes.
3. [EP‑133 Studio](03_EP133_STUDIO.md) — patterns, Song, sons, Rhythm Hero, MIDI.
4. [Système visuel commun](04_SYSTEME_VISUEL.md) — couleurs, boutons, états, icônes.
5. [Étude concurrentielle](05_ETUDE_CONCURRENCE.md) — références officielles et décisions.
6. [Livrables rapides](06_QUICK_WINS.md) — ce qui peut être sorti rapidement sans refaire le produit.

## Règle de conception

Le Hub est l’identité et le coffre. OP‑1 et EP‑133 sont les ateliers. Le
dessin doit donc toujours rendre visibles :

```text
où suis-je ? → quelle machine ? → quel module ? → machine connectée ?
→ quelle action principale ? → puis-je revenir au Hub ?
```

## Source technique consultée

- Hub : `apps/studio-hub/src/App.tsx`, `apps/studio-hub/src/VaultPanel.tsx`
- OP‑1 : `apps/op1-studio/app/page.tsx`, `app/components/HomeHub.tsx`
- EP‑133 : `apps/ep133-studio/src/App.tsx`, `src/pages/HomePage.tsx`,
  `src/components/editor/EditorToolbar.tsx`
- brief général : `docs/BRIEF_DESIGN_HUB_OUTILS.md`

## Ce que le dossier ne décide pas

Il ne remplace pas la validation de l’ergonomie avec des utilisateurs et ne
promet pas une écriture machine qui n’est pas encore validée par le hardware.
