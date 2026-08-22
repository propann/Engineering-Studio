# Engineering Studio — documentation

Ce dossier décrit l’état réel du dépôt propann/Engineering-Studio.

## État synchronisé

Dernière synchronisation documentaire : **2026-08-22**, sur `main`. Les dernières fonctions OP‑1 livrées sont décrites dans [STATUS.md](STATUS.md) et [OP1_MANUAL_REFERENCE.md](OP1_MANUAL_REFERENCE.md) : quatre pistes, écran tactile, bibliothèque de samples sauvegardés et persistance locale après actualisation.

## À lire en premier

1. [Vue d’ensemble du projet](PROJECT_AUDIT_2026-08-20.md)
2. [Architecture actuelle](architecture/ARCHITECTURE_CURRENT.md)
3. [Démarrage local](guides/QUICK_START.md)
4. [Déploiement Coolify](../DEPLOIEMENT.md)
5. [Données d’un nouvel utilisateur](guides/NEW_USER_DATA_MODEL.md)
6. [État et prochaines étapes](STATUS.md)
7. [Recherche moteurs audio et intégration du Rack](architecture/AUDIO_ENGINE_RESEARCH_AND_RACK_INTEGRATION_2026-08-20.md)
8. [**Tests physiques**](TESTS_PHYSIQUES.md) — ce que les tests automatiques
   ne peuvent pas prouver : matériel branché, oreilles, ou les deux
9. [**Analyse du rack principal**](ANALYSE_RACK_PRINCIPAL.md) — les vingt-neuf
   entrées de la porte d'entrée, outil par outil : ce qu'elles promettent, ce
   qu'elles ouvrent, et ce qui ne s'ouvre plus

## Organisation

| Dossier | Contenu |
|---|---|
| architecture/ | Structure technique et flux entre modules |
| guides/ | Installation, déploiement et méthodes de travail |
| specs/ | Spécifications fonctionnelles ciblées |
| archived/ | Documents historiques, non contractuels |

## Règle de vérité

Le code présent dans apps/, packages/ et les scripts racine fait foi.
Les anciens rapports dans docs/archived/ servent de mémoire et ne doivent
pas être utilisés pour déclarer une fonction terminée sans vérification du
code et d’un parcours utilisateur.

