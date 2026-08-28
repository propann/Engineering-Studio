# Engineering Studio — documentation

Ce dossier décrit l’état réel du dépôt propann/Engineering-Studio.

## État synchronisé

Dernière synchronisation documentaire : **2026-08-28**, sur `main`. Les dernières fonctions livrées sont décrites dans [STATUS.md](STATUS.md), [AUDIO_RACK_ROADMAP.md](../AUDIO_RACK_ROADMAP.md) et [ROADMAP.md](ROADMAP.md) : 20 moteurs audio (2 Racks de 10), Carte de Contrôle globale (`StudioEngineControlMatrix`), Espace Git & Versions (`StudioGitWorkspace`), Salon de Chat Collaboratif (`StudioCollabChat`) et refonte haute fidélité du clavier tactile OP-1.

## À lire en premier

**Commencer par la [feuille de route principale](ROADMAP.md)** : elle dit qui décide
de quoi, quels lots sont actifs et dans quel ordre travailler. Toutes les autres
feuilles de route en dépendent.

1. [Vue d’ensemble du projet](PROJECT_AUDIT_2026-08-20.md)
2. [Architecture actuelle](architecture/ARCHITECTURE_CURRENT.md)
3. [Démarrage local](guides/QUICK_START.md)
4. [Déploiement Coolify](../DEPLOIEMENT.md)
5. [Données d’un nouvel utilisateur](guides/NEW_USER_DATA_MODEL.md)
6. [État et prochaines étapes](STATUS.md)
7. [Recherche moteurs audio et intégration du Rack](architecture/AUDIO_ENGINE_RESEARCH_AND_RACK_INTEGRATION_2026-08-20.md)
8. [**Spécifications Matérielles OP-1 & EP-133**](specs/HARDWARE_REFERENCE_OP1_EP133.md) — limites mémoire (64 Mo EP-133), moteurs synthé, pistes bande, formats AIFF APPL & PPAK
9. [**Architecture Rack DSP & Feuille de Route Multi-IA**](specs/RACK_DSP_ARCHITECTURE_AND_ROADMAP.md) — modulation CPU à la demande, mode Duo Studio et missions pour Gemini, Claude et Codex
10. [**Direction du Projet & Nouvelles Intégrations**](specs/DIRECTION_PROJET_ET_INTEGRATIONS.md) — vision stratégique, intégrations matérielles (SysEx EP-133, WebUSB/Serial, CNC E-Stop), live coding Strudel, DSP WASM et Music-Git P2P
11. [**Tests physiques**](TESTS_PHYSIQUES.md) — ce que les tests automatiques
   ne peuvent pas prouver : matériel branché, oreilles, ou les deux
12. [**Analyse du rack principal**](ANALYSE_RACK_PRINCIPAL.md) — les vingt-neuf
   entrées de la porte d'entrée, outil par outil : ce qu'elles promettent, ce
   qu'elles ouvrent, et ce qui ne s'ouvre plus
10. [**Feuille de route UI**](design/UI_ROADMAP.md) — ordre d'exécution,
    dépendances, critères d'acceptation et Definition of Done
11. [**Manuel de développement UI**](design/UI_DEVELOPMENT_PLAYBOOK.md) —
    règles obligatoires pour les développeurs et agents IA
12. [**Gabarit de spécification d'écran**](design/UI_PAGE_SPEC_TEMPLATE.md) —
    contrat à remplir avant toute refonte ou nouvel écran

## Travaux en cours — août 2026

Ces documents gouvernent le chantier actuel. Ils étaient absents de cet index,
ce qui les rendait introuvables autrement qu'en fouillant `docs/`.

- [**Audit sectoriel**](AUDIT_SECTORIEL_2026-08-26.md) — l'état secteur par
  secteur, la règle de provenance MACHINE/LOCAL/PROFIL/DÉMO/NON VÉRIFIÉ, et
  les six points P0 avant de déclarer le produit stable
- [Ordre de mission — Claude](ORDRE_MISSION_CLAUDE.md) — registre des pages
- [Ordre de mission — Codex](ORDRE_MISSION_CODEX.md)
- [**Rapport des doublons — pages prioritaires**](RAPPORT_DOUBLONS_PAGES_2026-08-26.md)
  — les quatre pages à trancher, et pourquoi **aucune** ne justifie une
  suppression de code

## Organisation

| Dossier | Contenu |
|---|---|
| architecture/ | Structure technique, flux entre modules, et référence du back-end |
| audits/ | Constats datés, preuves et priorités de correction |
| design/ | Design system, feuille de route et règles d'implémentation UI |
| guides/ | Installation, déploiement et méthodes de travail |
| specs/ | Spécifications fonctionnelles ciblées |
| archived/ | Documents historiques, non contractuels |

## Règle de vérité

Le code présent dans apps/, packages/ et les scripts racine fait foi.
Les anciens rapports dans docs/archived/ servent de mémoire et ne doivent
pas être utilisés pour déclarer une fonction terminée sans vérification du
code et d’un parcours utilisateur.
