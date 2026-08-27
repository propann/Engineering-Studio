# 🎛️ Spécifications & Référence Matérielle : OP-1 & EP-133 K.O. II

> **DOCUMENT DE RÉFÉRENCE ABSOLUE POUR TOUTE IA (GEMINI, CLAUDE, CODEX) ET DÉVELOPPEUR DU PROJET.**
> Ce document définit les spécifications physiques, logicielles, limites de mémoire, formats de fichiers et règles d'ergonomie pro pour les deux machines de référence de la suite **Engineering Studio**.

---

## 1. 🎹 TEENAGE ENGINEERING OP-1 (Original & Field Architecture)

### 1.1 Identité & Philosophie Matérielle
L'OP-1 est un synthétiseur / échantillonneur / magnétophone portable à 4 pistes virtuelles avec une interface axée sur la créativité sans retour arrière infini (philosophie bande magnétique / "commit to tape").

### 1.2 Spécifications Techniques & Limites Matérielles
* **Moteur d'enregistrement (Tape 4 Pistes)** :
  * 4 pistes audio indépendantes synchronisées.
  * Durée nominale : 6 minutes par piste à vitesse 1x (soit 24 minutes audio totales).
  * Format audio bande : **16-bit Linear PCM, 44.1 kHz, Stéréo** (fichier `track_1.aif` à `track_4.aif`).
  * Vitesse variable : 0.5x, 1x, 2x, lecture inversée (Reverse Playback) en temps réel.
  * Overdub direct sans latence perçue (enregistrement superposé avec tête d'effacement désactivable ou mixée).
* **Moteurs de Synthèse (10+ Moteurs)** :
  * *Digital, String, Cluster, Pulse, Phase, FM, DNA, DSynth, DrWave, Voltage, Iter (hidden engine)*.
  * 1 moteur d'échantillonnage de synthé (*Synth Sampler*) : 6 secondes max (12 secondes en vitesse 0.5x) avec bouclage et enveloppe AHDSR.
  * 1 moteur d'échantillonnage de batterie (*Drum Sampler*) : 1 fichier de 20 secondes max découpé en 24 tranches (slices) assignées aux 24 touches du clavier.
* **Architecture de Contrôle (4 Encodeurs Couleur)** :
  * Encodeur **Bleu** (T1 / Paramètre 1 / Pitch / Filtre Frq)
  * Encodeur **Vert** (T2 / Paramètre 2 / Timbre / Filtre Res)
  * Encodeur **Blanc** (T3 / Paramètre 3 / Morph / Pan / LFO Rate)
  * Encodeur **Orange** (T4 / Paramètre 4 / Decay / Level / LFO Depth)
  * *Règle absolue :* Chaque écran doit associer strictement ses 4 jauges/paramètres visuels à ces 4 couleurs distinctes.
* **Affichage Visuel (Écran OLED)** :
  * Résolution physique : **320 x 160 pixels**.
  * Rendu : Graphismes vectoriels dynamiques 2D à fort contraste (fond noir profond, animations mécaniques ludiques : bobines de bande qui tournent, vache synthé, boîte de vitesse, arbre, bonhomme).
* **Stockage & Formats de Fichiers** :
  * Système de fichiers monté via USB Disk Mode :
    * `/tape/` : `track_1.aif`, `track_2.aif`, `track_3.aif`, `track_4.aif`
    * `/synth/` : Patches `.aif` (avec métadonnées JSON encodées dans le chunk standard AIFF `APPL` tag `OP-1`)
    * `/drum/` : Kits `.aif` (avec les 24 points de découpe / start-stop dans le chunk `APPL`)
    * `/album/` : `side_a.aif`, `side_b.aif` (mix down stéréo du master).

---

## 2. 🥁 TEENAGE ENGINEERING EP-133 K.O. II

### 2.1 Identité & Philosophie Matérielle
L'EP-133 est un échantillonneur / séquenceur de poche ultra-rapide axé sur le finger drumming, les motifs hip-hop/électro et les effets live percutants (Punch-In FX).

### 2.2 Spécifications Techniques & Limites Matérielles
* **Mémoire & Échantillons (Contrainte Critique)** :
  * Mémoire totale disponible : **64 Mo strictement plafonnée**.
  * Nombre de slots d'échantillons : **999 emplacements** (numérotés `001` à `999`).
  * Format d'échantillonnage natif : **16-bit Linear PCM, 46.875 kHz ou 44.1 kHz, Mono / Stéréo**.
  * *Règle logicielle pro :* L'application DOIT afficher une jauge de mémoire temps réel en Mo et en % (ex: `42.3 Mo / 64 Mo`), et proposer un convertisseur automatique (downmix mono, trim silence, resample) pour préserver la RAM de la machine.
* **Polyphonie & Voix (Voice Budget)** :
  * **12 voix mono** ou **6 voix stéréo** au total.
  * Gestion dynamique du vol de voix (*Voice Stealing*) selon la priorité des pads.
* **Structure de Projet & Séquenceur** :
  * **4 Groupes** indépendants : **Groupe A, B, C, D** (pouvant chacun contenir une piste rythmique ou mélodique).
  * Jusqu'à **99 Projets**, **99 Motifs (Patterns)** par groupe, et **99 Scènes** par projet.
  * Longueur de motif : 1 à 99 mesures avec quantification fine (1/16, 1/32, Triplet, Swing variable 0-99%).
* **Contrôles Physiques & Tactiles** :
  * **12 Pads sensibles à la vélocité et à la pression** (Aftertouch / Continuous Pressure).
  * **Fader multifonction tactile** : assignable en direct au volume, pitch, cutoff filtre, départ d'effets, ou enveloppe.
  * **Effets Punch-In (Live OB-4 FX)** : Loopers, beat repeat, reverse, pitch shift, bitcrusher déclenchables en live sur les pads combinés.
* **Affichage Visuel (Écran Segmenté Vintage)** :
  * Écran rétroéclairé ambre/orange/blanc avec afficheurs 7-segments, icônes fixes rétro (symboles de groupes, métronome, volume, VU-mètre bargraph, cadran BPM).
* **Exportation / Sauvegarde** :
  * Fichiers `.ep133ppak` (archive binaire de projet packagée comprenant les 4 groupes, les métadonnées de patterns et les échantillons référencés).

---

## 3. 🎯 MATRICE DES ATTENTES DES MUSICIENS PROFESSIONNELS

| Fonctionnalité | Attente Pro OP-1 | Attente Pro EP-133 |
|---|---|---|
| **Écran & Réalisme** | Rendu OLED 320x160 authentique, aiguilles, bobines animées, color-coding exact 4 encodeurs. | Afficheur segmenté orange/blanc/rouge, bargraphs LED précis, feedback de fader fluide. |
| **Gestion des Sons** | Banque de patches avec tags (Lead, Bass, Pad, FX), découpe auto des kits drum 20s en 24 touches. | Gestionnaire des 64 Mo avec avertissement de saturation, conversion mono/stéréo en 1 clic. |
| **Export & Production** | Export Master WAV sans perte + Stems 4 pistes AIFF avec métadonnées OP-1 conformes. | Export MIDI multi-groupes (A/B/C/D) + Export audio des patterns en boucle parfaite. |
| **Synchronisation** | MIDI Clock ultra-stable (24 PPQN), reconnaissance Transport Start/Stop/Continue. | Sync tempo instantanée, routage MIDI channel dédié par groupe (ex: Grp A = Ch 1, B = Ch 2, etc.). |
| **Sauvegarde & Coffre** | Snapshots complets de la bande et des patches avec somme SHA-256 sans risque de brick. | Sauvegarde intégrale du pool d'échantillons et des 99 projets en format d'archive sécurisé. |

---

## 4. 🔀 DUO STUDIO : WORKFLOW COMBINÉ OP-1 + EP-133

La force unique de notre suite logicielle est de permettre la collaboration transparente entre les deux machines :

```
┌──────────────────────────────┐              ┌──────────────────────────────┐
│         OP-1 STUDIO          │              │        EP-133 STUDIO         │
│  (Mélodies, Synthés, Bandes) │              │    (Batteries, Grooves, FX)  │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               │  1. Export Stem / Bounce Piste              │  2. Import Échantillon (1-999)
               ▼                                             ▼
       ┌─────────────────────────────────────────────────────────────┐
       │              STUDIO HUB CENTRAL / RACK MODULAIRE            │
       │   - Master Clock MIDI partagée (Start/Stop, BPM Sync)       │
       │   - Passerelle Audio Drag & Drop (Tape → Pad / Pad → Tape) │
       │   - 15 Moteurs DSP à la demande (Eurorack / Dexed / Surge)  │
       │   - Coffre-fort de Sauvegarde & Vérification SHA-256        │
       └─────────────────────────────────────────────────────────────┘
```

1. **Passerelle Tape ➔ Pad :** Possibilité de sélectionner une boucle sur la bande OP-1 (points IN/OUT) et de l'envoyer directement dans un slot d'échantillon EP-133 (assigné à un pad du Groupe A/B/C/D).
2. **Passerelle Pattern ➔ Tape :** Possibilité d'enregistrer en direct le rendu du séquenceur EP-133 sur l'une des 4 pistes de la bande OP-1 en parfaite synchronisation temporelle.
3. **Synchronisation d'Orchestration MIDI :** Le transport du Hub pilote simultanément la tête de bande OP-1 et le séquenceur 4-groupes EP-133.
