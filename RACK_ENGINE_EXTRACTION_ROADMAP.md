# FEUILLE DE ROUTE DE L'EXTRACTION DES MOTEURS AUDIO ET INTEGRATION RACK

Ce document définit la feuille de route technique pour l'analyse, l'extraction des paramètres DSP et l'intégration continue des **15 Moteurs Audio** (Eurorack Mutable Instruments & Open Source GitHub) dans la Suite Studio Hub EP-133 & OP-1.

---

## 1. VISION ARCHITECTURAL DU RACK SOFTWARE

L'objectif est d'offrir une suite de synthèse complète, professionnelle et monopage pour les instruments Teenage Engineering OP-1 et EP-133 K.O. II :

```
[ STUDIO HUB RACK SOFTWARE ]
         │
         ├── ► [ SIDEBAR GAUCHE ] : Arborescence avec Accordéon des 15 Moteurs & Patches Droulants
         │
         ├── ► [ DÉTECTION MIDI / PC ] : Entrées Web MIDI (OP-1/EP-133/USB) & Clavier PC Temps Réel
         │
         ├── ► [ CANVAS OLED OSCILLOSCOPE ] : Rendu dynamique temps réel des formes d'onde
         │
         └── ► [ CADRE DE CONTRÔLE DÉDIÉ ] : Interfaces complètes d'extraction de paramètres par Moteur
```

---

## 2. ETAT DE L'EXTRACTION DES 15 MOTEURS AUDIO

### A. SUITE EURORACK MUTABLE INSTRUMENTS (OPEN SOURCE C++)

| Moteur Audio | Type / Architecture | Paramètres Extaits & Mappés | Nombre de Patches USINE |
| :--- | :--- | :--- | :---: |
| **MUTABLE PLAITS** | Macro-Oscillateur 16 Moteurs | Dual Engine, Harmonics, Timbre, Morph, Decay Envelope | **6 Patches** |
| **MUTABLE BRAIDS** | Macro-Synthèse 33 Modèles | Model Select, Color, Timbre, Bit Depth (4-16 bit) | **5 Patches** |
| **MUTABLE RINGS** | Modélisation Physique & Résonateur | Resonator Mode, Damping, Structure, Brightness, Position, Polyphonie | **5 Patches** |
| **MUTABLE CLOUDS** | Synthétiseur de Texture Granulaire | Granular Density, Pitch Shift, Texture, Position, Feedback, Reverb | **5 Patches** |
| **MUTABLE ELEMENTS** | Modélisation Physique Modale | Geometry, Brightness, Damping, Pitch Tune, Exciter, Strike Force | **5 Patches** |

### B. MOTEURS OPEN SOURCE GITHUB (GIT AUDIO SUITE)

| Moteur Audio | Type / Architecture | Paramètres Extaits & Mappés | Nombre de Patches USINE |
| :--- | :--- | :--- | :---: |
| **DEXED FM** | Émulation FM Yamaha DX7 6-Op | Algorithme (1-32), Carrier/Modulator Ratios, Feedback, Attack/Decay | **5 Patches** |
| **SURGE XT** | Synthétiseur Wavetable Hybride | Wavetable Scan, Morph Position, Cutoff, Reso, Sub Osc, Drive Boost | **5 Patches** |
| **ZYNADDSUBFX** | Moteur Additif & Nappes Pad | Harmonics Count, Bandwidth, Sub Boost, Filter Type, Reso, Reverb Send | **5 Patches** |
| **HELM SYNTH** | Synthétiseur Polyphonique Modulé | Crossmod, Filter Cutoff, LFO Speed, Sub Octave, Reverb Wet | **5 Patches** |
| **FLUIDSYNTH SF2** | Lecteur d'Échantillons SoundFont | Preset SF2, Reverb Level, Chorus Depth, Master Volume, Stereo Pan | **5 Patches** |
| **AMSYNTH** | Synthétiseur Analogique Dual VCO | Waveform Principal/Sub, Filter Cutoff, Resonance, LFO Depth, Decay | **5 Patches** |
| **AMY C/JS** | Synthèse Additive Fixe C/JS | Partial Count, Spectral Slope, Partial Spread, Feedback, Chiptune Noise | **5 Patches** |
| **PL_SYNTH** | Tracker Chiptune 8-Bit | Bitcrush Depth, Sample Rate Divide, Arp Speed, Duty Cycle, Glitch FX | **5 Patches** |
| **OPEN303 ACID** | Émulation Roland TB-303 Acid | Waveform Saw/Square, Cutoff, Reso, Env Mod, Decay, Tuning, Accent | **5 Patches** |
| **FAUST DSP NODE** | DSP Compilé WebAudio Node | Freq Modulation, DSP Filter, Gain Boost, DSP Feedback, Wavefolder Drive | **5 Patches** |

---

## 3. PLAN D'ACTION TECHNIQUE & AMÉLIORATION DU MOTEUR WEBAUDIO

1. **Isolation des Listeners (Anti-Interruption)** :
   - Migration des gestionnaires de claviers et événements Web MIDI vers un `ref` de paramètres (`paramsRef.current`) afin que les réglages en direct ne réinitialisent jamais l'AudioContext ni n'interrompent la note jouée.
2. **Expansion de la Banque de Patches (75+ Patches Usine)** :
   - Chaque moteur intègre au moins 5 patches haut de gamme couvrant les sonorités Lead, Bass, Pad, Keys, Bell, Acid, Percussion et FX.
3. **Moteur Audio Multi-Synthèse Rendu Web Audio API** :
   - Implémentation complète de chaînes de filtres Biquad, oscillateurs FM doubles, générateurs de bruit granulaire, bitcrushers, résonateurs à boucle de délai et filtres suiveurs d'enveloppe pour **100% des 15 moteurs**.
4. **Compatibilité Exportation OP-1 / EP-133** :
   - Tous les presets créés ou édités s'exportent au format JSON structuré directement consommables par les convertisseurs de banque OP-1 Drum/Synth et EP-133 Sample Map.
