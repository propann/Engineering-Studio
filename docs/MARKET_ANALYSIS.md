# Analyse du marché

Dernière vérification : **11 août 2026**. Cette analyse porte d’abord sur l’OP‑1 original. Aucun chiffre public fiable de parc installé ou de ventes unitaires n’a été trouvé ; les conclusions sur la taille du marché restent donc des hypothèses à valider.

## Résumé

Le marché n’est pas vide, mais il est **fragmenté**. On trouve de bons outils pour les patches, d’autres pour les quatre pistes, des apps mobiles pour la sauvegarde, un service communautaire de sons et des utilitaires experts pour modifier le firmware. Nous n’avons pas identifié de produit multiplateforme réunissant :

1. sauvegarde complète et vérifiée ;
2. restauration avec simulation ;
3. gestion visuelle des sons et de Tape ;
4. parcours firmware officiel sécurisé ;
5. historique local/cloud cohérent ;
6. journal de toutes les écritures sur la machine.

Cette absence est une **inférence issue du périmètre étudié**, pas la preuve qu’aucun outil confidentiel n’existe.

## Paysage concurrentiel

| Offre | Plateforme | Force principale | Limite par rapport à notre vision |
|---|---|---|---|
| [Teenage Engineering](https://teenage.engineering/downloads/op-1/original) | Web + machine | Source officielle du guide et du firmware | Procédure manuelle, pas de coffre ni de bibliothèque unifiée |
| [op1.fun](https://op1.fun/) | Web + compagnon macOS | Grande bibliothèque communautaire, packs, écoute Web MIDI, drum builder, sauvegardes Tape | Centré contenu/communauté ; le site indique que les bandes illimitées sont réservées aux abonnés |
| [OP‑1Z Sample Manager](https://github.com/romangarms/OP-1Z-Sample-Manager) | Windows/macOS/Linux | Samples, conversion, Tape, backup/restore, open source | Application locale ; pas de service continu ni de parcours firmware officiel complet |
| [Manager for OP1](https://apps.apple.com/us/app/manager-for-op1/id1521159543) | iOS/iPadOS/macOS | Import/export des quatre pistes, mix stéréo, iCloud | Écosystème Apple et périmètre projet/Tape |
| Sync for OP‑1 | Android | Backup/restore, aperçu drum et lecteur quatre pistes | Mobile et périmètre limité ; visibilité commerciale réduite |
| [op‑patch‑util](https://github.com/AlexCharlton/op-patch-util) | CLI multiplateforme | Création et modification précise de patches | Outil technique, pas un gestionnaire de machine |
| [teoperator](https://github.com/schollz/teoperator) | CLI multiplateforme | Conversion de sons et création de kits | Outil technique, pas de sauvegarde ou firmware |
| [op1repacker](https://github.com/op1hacks/op1repacker) / [GUI](https://github.com/op1hacks/op1REpackerGUI) | Desktop | Contrôle expert du conteneur et mods firmware | Risque élevé, parcours non destiné au grand public |
| [OP‑PatchStudio](https://github.com/joseph-holland/op-patchstudio) | Web/PWA | Édition visuelle moderne de samples et waveforms | Orientation patch ; compatibilité OP‑1 à confirmer fonction par fonction |

## Intensité du besoin

| Problème | Gravité | Fréquence | Disposition probable à payer |
|---|---:|---:|---:|
| Perdre Tape, sons ou snapshots | Très forte | Faible mais redoutée | Forte pour une protection crédible |
| Sauvegarder et libérer de la place | Forte | Régulière | Moyenne à forte |
| Mettre à jour le firmware | Très forte | Très faible | Faible en abonnement isolé |
| Préparer et transférer des sons | Moyenne | Fréquente | Moyenne |
| Exporter/mixer quatre pistes | Moyenne | Fréquente pour les producteurs | Moyenne |
| Retrouver un ancien état | Forte | Régulière après usage | Forte si instantané automatique |
| Synchroniser plusieurs ordinateurs | Moyenne | Variable | Forte pour utilisateurs engagés |

### Conclusion produit

Le firmware est un excellent **point d’entrée de confiance**, mais un mauvais produit d’abonnement à lui seul : l’OS officiel 246 date de décembre 2022. La fonction qui crée une habitude est le **Time Machine de l’OP‑1** : dès que la machine passe en Disk mode, l’utilisateur peut créer un instantané, voir les différences, archiver Tape et retrouver une version antérieure.

## Positionnement proposé

> **OP‑1 Studio est le système d’exploitation de secours de votre OP‑1 : il protège chaque changement et réunit enfin firmware, fichiers, sons et morceaux.**

Trois preuves rendent cette promesse crédible :

- un plan exact avant chaque écriture ;
- une sauvegarde vérifiée avant chaque opération sensible ;
- un journal lisible qui permet de comprendre et reprendre une erreur.

## Fonction « indispensable »

Le moteur central n’est ni le lecteur audio ni le catalogue firmware. C’est le **Safe Change Engine** :

```mermaid
flowchart LR
    OBSERVE["Observer"] --> SNAPSHOT["Sauvegarder"]
    SNAPSHOT --> PLAN["Planifier"]
    PLAN --> APPLY["Appliquer"]
    APPLY --> VERIFY["Vérifier"]
    VERIFY --> HISTORY["Historiser"]
```

Il est réutilisé par : mise à jour officielle, restauration, transfert de patches, remplacement des pistes Tape, nettoyage et installation de packs. Une fois fiable, chaque nouveau module augmente la valeur du même socle au lieu d’ajouter un script isolé.

## Avantages défendables

- base de connaissances versionnée et testée sur plusieurs OS/firmwares ;
- fixtures de volumes et patches couvrant les cas limites ;
- historique d’instantanés compatible sans cloud ;
- UX de sécurité cohérente sur toutes les opérations ;
- architecture à adaptateurs permettant plus tard OP‑1 Field, OP‑Z ou d’autres machines ;
- confiance créée par un cœur auditable et open source.

Les formats connus et l’interface graphique sont copiables. La difficulté durable se trouve dans la matrice de compatibilité, les tests matériels, les récupérations d’erreur et la réputation de ne pas perdre les morceaux.

## Risques commerciaux

- L’OP‑1 original est un produit ancien avec un parc fini et mal mesuré.
- Un abonnement uniquement destiné à une machine peut subir une forte fatigue tarifaire.
- Le stockage cloud audio coûte plus cher que des métadonnées ou petits patches.
- Une erreur firmware peut détruire la confiance de toute la marque.
- L’usage des marques et du firmware doit rester descriptif et non affilié.
- Une application gratuite complète peut réduire la conversion si le service n’apporte pas une valeur récurrente claire.

## Réduction du risque

1. Construire d’abord le parcours firmware + sauvegarde locale minimale.
2. Tester le prototype avec 15 à 20 propriétaires d’OP‑1 original.
3. Mesurer le taux de seconde sauvegarde dans les 30 jours, pas seulement les inscriptions.
4. Tester trois offres sans encaisser : gratuit local, annuel cloud, soutien à vie.
5. Ouvrir une bêta matérielle limitée avec journal volontaire et expurgé.
6. Ajouter un second modèle de machine seulement après stabilité de l’adaptateur original.

## Indicateurs de validation

- temps médian entre connexion et première sauvegarde vérifiée ;
- part des utilisateurs qui effectuent une deuxième sauvegarde ;
- nombre d’opérations annulées avant écriture grâce au plan ;
- taux de restauration vérifiée ;
- coût cloud par utilisateur actif ;
- conversion après usage réel du coffre, pas avant ;
- incidents matériels critiques par version.

