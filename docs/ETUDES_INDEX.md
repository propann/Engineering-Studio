# Catalogue central des études — Studio Hub

Ce document rassemble les études, audits, références, spécifications et
rapports produits au fil du projet. Les fichiers restent à leur emplacement
historique afin de conserver les liens et le contexte Git ; ce catalogue est
la vue de travail commune.

## Comment utiliser ce catalogue

Pour comprendre le produit actuel, lire dans cet ordre :

1. [Présentation produit](PRESENTATION_PRODUIT.md)
2. [Synthèse des décisions et travaux](SYNTHESE_DECISIONS_ET_TRAVAUX.md)
3. [Roadmap active](ROADMAP_ACTIVE_2026-08-16.md)
4. [État courant](../STATUS_CURRENT.md)
5. [Alignement roadmap/code](../ROADMAP_CODE_ALIGNMENT_2026-08-17.md)
6. La famille d'études correspondant au sujet travaillé

Les documents marqués **actuel** décrivent la direction à suivre. Les
documents **référence** donnent le matériau technique. Les documents
**historique** conservent les décisions et les pistes des agents précédents,
mais ne doivent pas être pris seuls comme état du produit.

## 1. Pilotage et source de vérité

- **Actuel** — [Présentation produit](PRESENTATION_PRODUIT.md)
- **Actuel** — [Roadmap active](ROADMAP_ACTIVE_2026-08-16.md)
- **Actuel** — [État courant logiciel et matériel](../STATUS_CURRENT.md)
- **Actuel** — [Feuille de route alignée au code](../ROADMAP_CODE_ALIGNMENT_2026-08-17.md)
- **Actuel** — [Index général](../INDEX.md)
- **Actuel** — [Stratégie Git](../BRANCHING_STRATEGY.md)
- **Référence** — [Journal de validation](VALIDATION_LOG_2026-08-16.md)
- **Référence** — [Validation matérielle du 17 août](HARDWARE_VALIDATION_2026-08-17.md)
- **Historique** — [Progression globale](../PROGRESS.md)
- **Historique** — [Statut technique détaillé](../STATUS.md)
- **Historique** — [Synchronisation d’équipe](../TEAM_SYNC.md)

## 2. Audits, études de dépôt et alignement

- [Audit du code](../AUDIT_CODE_2026-08-16.md)
- [Audit du code mort](../AUDIT_CODE_MORT_2026-08-16.md)
- [Audit des roadmaps](../AUDIT_ROADMAPS_2026-08-16.md)
- [Audit des anciens dossiers](AUDIT_ANCIENS_DOSSIERS_2026-08-16.md)
- [Audit du dépôt OP-1 cible](AUDIT_DEPOT_OP1_CIBLE_2026-08-16.md)
- [Audit des doublons et optimisation](AUDIT_DOUBLONS_ET_OPTIMISATION_2026-08-16.md)
- [Revue du travail des autres IA](AUDIT_TRAVAIL_AUTRES_IA_2026-08-16.md)
- [Audit des outils existants](TOOLING_AUDIT.md)
- [Analyse des manques d’outillage](TOOLING_GAP_ANALYSIS.md)
- [Analyse et optimisation globale](../ANALYSIS_AND_OPTIMIZATION.md)
- [Matrice d’intégration](../INTEGRATION_MATRIX_2026-08-16.md)
- [Rapport d’alignement Git](../GIT_ALIGNMENT_REPORT.md)

## 3. Vision produit, marché et expérience

- [Vision produit](PRODUCT_VISION.md)
- [Vision Adaptive Studio](../ADAPTIVE_STUDIO_VISION.md)
- [Présentation Hub et studios](PRESENTATION_PRODUIT.md)
- [Périmètre applicatif OP-1](APP_SCOPE.md)
- [Canal Hub ↔ studios](HUB_STUDIO_CHANNEL.md)
- [Concept de fiche utilisateur](USER_PROFILE_CONCEPT.md)
- [Modèle économique](BUSINESS_MODEL.md)
- [Analyse du marché](MARKET_ANALYSIS.md)
- [Analyse des concurrents](ANALYSE_CONCURRENTS.md)
- [Audit visuel concurrentiel](COMPETITOR_VISUAL_AUDIT.md)
- [Dossier de conception Hub et outils](dessin/00_INDEX.md)
- [Brief design Hub et outils](BRIEF_DESIGN_HUB_OUTILS.md)
- [Brief de refonte de l’interface](GUI_REDESIGN_BRIEF.md)
- [Guide utilisateur](GUIDE_UTILISATEUR.md)

## 4. Architecture commune, sauvegardes et permissions

- [Architecture technique](ARCHITECTURE.md)
- [Architecture du dépôt](../STATUS.md)
- [Permissions du workspace](WORKSPACE_PERMISSIONS.md)
- [Contenu local universel](CONTENT_LIBRARY.md)
- [Références de formats audio](AUDIO_FILE_FORMAT_REFERENCE.md)
- [Canal de synchronisation OP-1 / EP-133](MIDI_SYNC_OP1_EP133.md)
- [Recherche sur le clonage](CLONE_RESEARCH.md)
- [Rapport de réutilisation EP-133 pour OP-1](RAPPORT_REUTILISATION_EP133_POUR_OP1.md)

## 5. OP-1 : connaissances et comportements de la machine

- [Base de connaissances OP-1](OP1_KNOWLEDGE_BASE.md)
- [Bible firmware OP-1](OP1_FIRMWARE_BIBLE.md)
- [Bible des images OP-1](OP1_IMAGE_BIBLE.md)
- [Bibliothèque d’images](IMAGE_LIBRARY.md)
- [Modes de connexion](OP1_CONNECTION_MODES.md)
- [Référence Tape](TAPE_MODE_REFERENCE.md)
- [Référence Synth et Drum](SYNTH_DRUM_MODE_REFERENCE.md)
- [Référence des moteurs audio](SYNTH_ENGINES_REFERENCE.md)
- [Effets, LFO et séquenceurs](EFFECTS_LFO_SEQUENCERS_REFERENCE.md)
- [Shortlist des outils externes](TOOLING_SHORTLIST.md)
- [Outils locaux](LOCAL_TOOLS.md)

## 6. OP-1 : éditeurs et outils de création

- [Architecture de l’éditeur pixel](PIXEL_EDITOR_ARCHITECTURE.md)
- [Concept du créateur de dessin](DRAWING_CREATOR_CONCEPT.md)
- [Spécification de l’éditeur de patches](PATCH_EDITOR_SPEC.md)
- [Concept de l’éditeur de moteur](ENGINE_EDITOR_CONCEPT.md)
- [Inventaire des fonctions de fenêtres](WINDOW_FUNCTIONS_SPEC.md)
- [Pack d’outils et recommandations](TOOLING_GAP_ANALYSIS.md)
- [Sécurité des outils](TOOLS_SAFETY_AUDIT.md)

## 7. Firmware : recherche, fonctions et sécurité

- [Index du laboratoire firmware](FIRMWARE_LAB_INDEX.md)
- [Laboratoire firmware](FIRMWARE_LAB.md)
- [Fonctions ciblées](FIRMWARE_LAB_FUNCTIONS.md)
- [Page Firmware — roadmap](FIRMWARE_PAGE_ROADMAP.md)
- [Page Firmware — spécification UI](FIRMWARE_PAGE_UI_SPEC.md)
- [Conteneur firmware](FIRMWARE_CONTAINER_STUDY.md)
- [Catalogue des mods](FIRMWARE_MOD_CATALOG.md)
- [Ressources pour les mods](FIRMWARE_MOD_RESOURCES.md)
- [Politique de sécurité firmware](FIRMWARE_SAFETY.md)
- [Sources et références](SOURCES.md)

## 8. EP-133, MIDI et jeu à deux machines

- [Roadmap de connexion au Hub](../apps/ep133-studio/ROADMAP_CONNECT_TO_HUB.md)
- [Optimisation EP-133](../apps/ep133-studio/OPTIMIZATION_PLAN.md)
- [Validation matérielle EP-133](HARDWARE_VALIDATION_2026-08-16.md)
- [Validation matérielle OP‑1 / EP‑133 du 17 août](HARDWARE_VALIDATION_2026-08-17.md)
- [Runbook de validation matérielle](HARDWARE_VALIDATION_RUNBOOK.md)
- [Tests matériels](HARDWARE_TESTS.md)
- [Synchronisation OP-1 / EP-133](MIDI_SYNC_OP1_EP133.md)
- [Référence de clonage](CLONE_RESEARCH.md)
- **Archive détaillée** — [index documentaire EP-133](../archive/legacy-material/EP-133-KO-II-Studio/etude/00_INDEX.md)

## 9. Roadmaps et rapports historiques

Ces documents sont utiles pour retrouver les intentions et décisions
successives. Ils ne remplacent pas la roadmap active.

- [Master roadmap historique](../MASTER_ROADMAP.md)
- [Roadmap générale historique](ROADMAP.md)
- [Feuille de route simple OP-1](FEUILLE_DE_ROUTE_SIMPLE.md)
- [Roadmap de l’enfer](ROADMAP_DE_L_ENFER.md)
- [Prochaine étape](NEXT_STEP.md)
- [Phase 3 — rapport de clôture](../PHASE3_COMPLETION.md)
- [Phase 4 — statut final historique](../PHASE4_FINAL_STATUS.md)
- [Phase 4 — semaines 1–2](../PHASE4_WEEK1_COMPLETE.md)
- [Phase 4 — plan semaines 3–4](../PHASE4_WEEK3_PLAN.md)
- [Phase 4 — progression semaine 3](../PHASE4_WEEK3_PROGRESS.md)
- [Phase 4 — clôture semaines 3–4](../PHASE4_WEEK3_COMPLETE.md)
- [Phase 4 — clôture semaines 5–6](../PHASE4_WEEK5_COMPLETE.md)
- [Phase 4 — plan semaines 7–8](../PHASE4_WEEK7_PLAN.md)
- [Analyse globale OP-1](PROJECT_STATUS.md)

## 10. Matériel conservé dans l’archive

Les études anciennes, traductions, comptes rendus d’agents et prototypes
restent dans l’archive pour éviter de perdre du contexte :

- [Index de l’archive](../archive/legacy-material/README.md)
- [Index du projet EP-133 archivé](../archive/legacy-material/EP-133-KO-II-Studio/README.md)
- [Documentation EP-133 archivée](../archive/legacy-material/EP-133-KO-II-Studio/docs/BIBLIOTHEQUE_DOCUMENTAIRE.md)
- [Index de l’ancien écosystème](../archive/legacy-material/studio-ecosystem/DOCUMENTATION_INDEX.md)
- [Dossier études EP-133 archivé](../archive/legacy-material/EP-133-KO-II-Studio/etude/00_INDEX.md)

## Règle de maintenance

Toute nouvelle étude doit être ajoutée à la catégorie correspondante et
indiquer en tête son statut : **actuel**, **référence**, **à valider** ou
**historique**. Une décision qui devient produit doit ensuite être reportée
dans la roadmap active et dans l’état courant.
