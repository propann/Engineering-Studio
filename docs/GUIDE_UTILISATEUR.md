# Guide utilisateur — OP-1 Studio

> Ce guide s'adresse à un musicien, pas à un développeur. Pour la documentation
> technique, voir [`README.md`](../README.md) et le reste de `docs/`.
>
> **Statut : brouillon initial.** Une page n'est écrite en détail qu'une fois
> la fonctionnalité correspondante sortie du statut simulation — voir
> [`PROJECT_STATUS.md`](PROJECT_STATUS.md) pour savoir ce qui est réellement
> livré aujourd'hui.

## Avant de commencer

OP-1 Studio est un outil communautaire indépendant, sans lien avec Teenage
Engineering. Il ne remplace pas le guide officiel de l'OP-1 :
[teenage.engineering/guides/op-1/original](https://teenage.engineering/guides/op-1/original).

Prérequis techniques : Node.js, Python 3, et FFmpeg pour les outils audio.
L'installation détaillée reste dans [`README.md`](../README.md) le temps que
l'application desktop packagée existe (voir feuille de route, jalon M1).

## Ce que vous pouvez faire dès aujourd'hui

- **Explorer le catalogue firmware** : consulter les mods documentés et leur
  niveau de risque, sans que rien ne soit envoyé à la machine.
- **Préparer des samples** : passer des fichiers WAV/AIFF au format attendu
  par l'OP-1 (mono, 44,1 kHz, 16 bits) via les outils en ligne de commande.
- **Créer un patch de test** : générer un patch synthé ou drum dans un dossier
  séparé, à copier vous-même sur la machine.
- **Jouer avec le clone à l'écran** : utiliser le clavier de l'ordinateur ou
  un clavier MIDI pour jouer sur la surface OP-1 recréée dans le Studio.

## Ce qui n'est pas encore réel

Certains écrans montrent un plan ou une simulation, pas une opération déjà
effectuée sur votre machine : aucune sauvegarde ni copie automatique vers le
volume OP-1 n'est encore déclenchée par l'interface. Si un écran affiche un
message de statut sans avoir demandé votre volume et confirmé une écriture,
c'est une préparation, pas un résultat. Le détail exact de ce qui est simulé
est dans [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

## Questions fréquentes

*(à compléter au fur et à mesure des retours utilisateurs et des jalons
livrés — ne pas préremplir avec des réponses non vérifiées)*

## Pages à venir (une par espace, dès livraison réelle)

- [ ] Firmware — mise à jour guidée
- [ ] Sauvegardes — créer et vérifier une Time Capsule
- [ ] Sons & patches — importer, convertir, transférer
- [ ] Studio — Tape, Album, export
- [ ] Exercices & Éducation — disposition clavier, finger drumming, apprendre
      un morceau
