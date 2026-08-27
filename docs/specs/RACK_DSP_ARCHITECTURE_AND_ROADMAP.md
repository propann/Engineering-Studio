# 🧠 Architecture du Rack DSP & Feuille de Route Multi-IA

> **AUDIT TECHNIQUE, MODULATION DSP À LA DEMANDE ET RÉPARTITION DES RÔLES POUR GEMINI, CLAUDE ET CODEX.**

---

## 1. 🔍 AUDIT DU CONCEPT DE "RACK AUDIO" & OPTIMISATION CPU

### 1.1 Le concept du Rack est-il pertinent ?
**Oui, le concept de Rack Modulaire est la meilleure architecture possible** pour un studio musical web pro. Il s'inspire directement du standard Eurorack physique et des DAW modulaires (Bitwig, VCV Rack, Ableton Rack) :
* Il sépare la génération sonore (moteurs de synthèse/samples) du traitement (effets, filtres, LFO) et du séquençage.
* Il permet d'alimenter indifféremment l'OP-1 (qui reçoit des samples/stems) et l'EP-133 (qui reçoit des one-shots sur ses pads).

### 1.2 Le problème actuel : Surcharge CPU potentielle
Actuellement, si tous les moteurs ou nœuds Web Audio sont instanciés en mémoire dès le démarrage, le navigateur consomme des cycles processeurs inutiles (AudioContext ticks, timers, LFO oscillateurs).

### 1.3 La Solution Pro : Le "Rack DSP Dynamique à la Demande" (*Lazy DSP Engine*)
Nous imposons la règle d'or d'économie CPU :
1. **Instanciation Paresseuse (*Lazy Loading*)** : Aucun nœud Web Audio (oscillateur, filtre biquad, convolver) n'est créé tant qu'un patch n'est pas sélectionné et qu'une note n'est pas jouée.
2. **Mise en Sommeil Automatique (*Dormant State*)** : Si un moteur ne reçoit aucun événement MIDI pendant plus de 30 secondes, sa chaîne audio est déconnectée du bus master et ses oscillateurs sont arrêtés.
3. **Suspension de l'AudioContext** : L'AudioContext passe en état `suspended` dès que le transport est stoppé et qu'aucune note n'est active, réduisant l'utilisation CPU à **0.0%**.
4. **Partage du Bus d'Effets Master** : Une seule instance des effets de réverbération à convolution et de délai est partagée via des départs auxiliaires (Aux Sends) plutôt que dupliquée par piste.

---

## 2. 🌐 LE STUDIO UNIFIÉ : MODE DUO OP-1 + EP-133

Pour répondre au besoin d'unifier les deux studios dans une même session de travail :

1. **Vue "Duo Session" (Option d'affichage Split/Stack)** :
   * Permet d'afficher la bande 4 pistes OP-1 en haut et la matrice 12 pads / 4 groupes EP-133 en bas.
2. **Bouton d'Appel Rapide Inter-Studios** :
   * Depuis OP-1 Studio : Un bouton *"Envoyer boucle vers EP-133"* découpe la région sélectionnée entre IN et OUT et l'injecte dans le slot d'échantillon sélectionné sur l'EP-133.
   * Depuis EP-133 Studio : Un bouton *"Bouncer groupe vers Piste OP-1"* enregistre le pattern actif du groupe sélectionné sur la piste 1, 2, 3 ou 4 de l'OP-1.
3. **Horloge & Transport Centralisé** :
   * Une barre de transport unique coordonne la lecture de la bande et le déclenchement des patterns EP-133 sur le même métronome 24 PPQN.

---

## 3. 📋 RÉPARTITION DES TÂCHES & FEUILLES DE ROUTE INDIVIDUELLES

Chaque IA dispose d'un périmètre d'intervention clair et autonome pour éviter tout conflit de code :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIRECTEUR DE PROJET                               │
│                   (Stratégie, Règles & Architecture)                        │
└──────────────┬──────────────────────────────┬───────────────────────────────┘
               │                              │
               ▼                              ▼                              ▼
    ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
    │     🤖 GEMINI        │      │      🎨 CLAUDE       │      │      ⚙️ CODEX        │
    │ Lead Systèmes & DSP  │      │  Lead UX & Affichage │      │  Lead Logique & Test │
    └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

---

### 🚀 FEUILLE DE ROUTE 1 : GEMINI (Lead Architect & Full-Stack Audio Engine)
**Mission principale :** Moteurs audio temps réel, orchestration DSP, passerelles inter-studios et sécurité des données.

* [ ] **Tâche G1 — Moteur DSP à la demande (*Lazy DSP Engine*) :**
  * Refactorer `AudioPluginRack.tsx` et `op1SynthEngine.ts` pour détruire/déconnecter les nœuds inactifs et suspendre l'AudioContext à l'arrêt.
* [ ] **Tâche G2 — Passerelle Audio & MIDI Inter-Studios :**
  * Implémenter le pont mémoire `packages/audio-bridge` pour transférer des buffers audio entre la bande OP-1 et les slots EP-133 sans ré-encodage disque.
* [ ] **Tâche G3 — Horloge Master MIDI ultra-stable :**
  * Garantir une horloge 24 PPQN basée sur `audioContext.currentTime` avec dérive inférieure à 1ms.
* [ ] **Tâche G4 — Gestionnaire de Mémoire 64 Mo EP-133 :**
  * Implémenter le calcul en temps réel de l'empreinte mémoire exacte des échantillons chargés et l'algorithme d'optimisation (downmix mono / silence trim).

---

### 🎨 FEUILLE DE ROUTE 2 : CLAUDE (Lead Designer & Real-time Display Specialist)
**Mission principale :** Réalisme visuel de l'écran OLED OP-1 et LCD EP-133, cohérence ergonomique et fluidité des animations.

* [ ] **Tâche C1 — Moteur d'Affichage OLED OP-1 Haute Fidélité :**
  * Rendre l'écran 320x160 authentique : graphismes vectoriels rétro-futuristes, bobines de bande qui tournent avec vitesse proportionnelle au tempo, aiguilles et indicateurs aux couleurs exactes des encodeurs (Bleu, Vert, Blanc, Orange).
* [ ] **Tâche C2 — Moteur d'Affichage LCD EP-133 K.O. II :**
  * Créer le rendu d'écran segmenté ambre/orange avec police 7-segments réaliste, icônes vintage (métronome, bargraphs LED, numéros de groupe A/B/C/D).
* [ ] **Tâche C3 — Console Unifiée "Duo Studio" :**
  * Concevoir l'interface de navigation permettant de basculer instantanément entre Studio OP-1, Studio EP-133 ou d'afficher la vue combinée "Duo Studio".
* [ ] **Tâche C4 — Raccordement des Pages Orphelines :**
  * Intégrer harmonieusement dans les tiroirs d'outils les modules d'apprentissage (Guitar Hero / Finger Drumming), éditeur de pixels OP-1 et le labo de sauvegarde.

---

### ⚙️ FEUILLE DE ROUTE 3 : CODEX (Lead Logic, File Formats & Test Automation)
**Mission principale :** Encodage/décodage de fichiers propriétaires, intégrité des données (SHA-256) et automatisation des tests.

* [ ] **Tâche X1 — Parseur / Encodeur AIFF OP-1 APPL Chunk :**
  * Écrire le module de lecture et d'écriture strict des métadonnées OP-1 dans les fichiers `.aif` (points de boucle synthé, découpage des 24 tranches de drum kit).
* [ ] **Tâche X2 — Module d'Archive Projet `.ep133ppak` :**
  * Valider l'empaquetage binaire des projets EP-133 incluant la structure des 4 groupes, les patterns et les échantillons audio.
* [ ] **Tâche X3 — Coffre-fort de Sauvegarde & Vérification SHA-256 :**
  * Renforcer le système de snapshot avec calcul d'empreinte cryptographique pour garantir qu'aucun fichier corrompu n'est transféré.
* [ ] **Tâche X4 — Suite de Tests Automatisés E2E & Unitaires :**
  * Compléter les tests dans `/tests` et les packages pour valider la synchronisation MIDI, la fidélité de conversion audio et la persistance locale.

---

## 4. 🔒 RÈGLES DE COLLABORATION ENTRE LES IA

1. **Contrats stricts aux frontières :** Tout échange de données entre modules doit passer par des types TypeScript déclarés dans `packages/` ou `src/core/types/`.
2. **Zéro régression sur le build :** Chaque modification doit valider `npm run typecheck` et `npm run test` sans aucune erreur.
3. **Pas de code fantôme :** Tout composant ou bouton ajouté doit être 100% relié à une action réelle (pas de `console.log("TODO")` ou d'interface sans effet).
