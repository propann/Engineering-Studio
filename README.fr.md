# Engineering Studio 🎛️ (Français)

Un atelier **local-first** pour les machines de Teenage Engineering (OP-1, OP-1 field, EP-133 K.O. II) et la synthèse modulaire Eurorack. Sauvegardes vérifiées, transferts MIDI, édition de samples, et un rack de synthèse temps réel qui joue du son **sans qu'aucune machine physique ne soit branchée**.

---

## 🌐 Liens & Adresse Provisoire
- **Hub Public Provisoire :** [https://engineering-studio.duckdns.org](https://engineering-studio.duckdns.org)
- **Dépôt GitHub :** [https://github.com/propann/Engineering-Studio](https://github.com/propann/Engineering-Studio)

---

## 🎹 20 Moteurs Audio (2 Racks de 10) & Carte de Contrôle Globale

### 🔹 Rack 1 : Synthèse Modulaire, FM & Modélisation Acoustique
1. **Mutable Instruments Plaits (12HP)** : Matrice 8 modèles (Virtual Analog, Waveshaping, 2-OP FM, Formant, Harmonic, Wavetable, Chord, Particle).
2. **Mutable Instruments Braids (16HP)** : Macro-oscillateur avec écran OLED vert 14 segments, réglages Color, Timbre et Bitdepth.
3. **Mutable Instruments Rings (14HP)** : Résonateur physique (String, Modal, Membrane) avec contrôles Damping, Structure et Brightness.
4. **Mutable Instruments Clouds (18HP)** : Synthétiseur granulaire à texture avec densité, transposition de pitch et réverbération spatiale.
5. **Mutable Instruments Elements (34HP)** : Excitateur modal (Bow/Blow/Strike) avec contrôles Geometry et Brightness.
6. **Roland TB-303 Acid Bass** : Filtre à échelle de diodes avec formes d'onde Carré/Dent de scie et Accentuation overdrive.
7. **Dexed FM (Yamaha DX7)** : Synthèse FM 6 opérateurs avec 32 algorithmes et réglage des ratios d'opérateurs.
8. **Surge XT Hybrid** : Oscillateur à tables d'ondes avec morphing 3D, double filtrage et saturation.
9. **pl_synth DMG-01** : Moteur chiptune GameBoy / NES avec Bitcrush, diviseur de taux d'échantillonnage et glitch.
10. **amsynth** : Synthétiseur soustractif analogique vintage avec double VCO et profondeur LFO.

### 🔹 Rack 2 : Rythmiques, SoundFonts SF2, DSP Faust & Extensions
11. **FluidSynth SoundFont SF2** : Lecteur SoundFont multitimbral (Grand Piano, Rhodes, Orgue Hammond, Strings).
12. **ZynAddSubFX** : Synthèse additive et spectrale céleste avec 64 partiels configurables.
13. **Helm Polyphonic Synth** : Synthèse hybride par modulation croisée et résonateur de formants.
14. **AMY Engine (ESP32-Audio)** : Moteur en virgule fixe avec oscillateurs additifs et tables Junox.
15. **Faust DSP Wavefolder** : Algorithmes compilés JIT avec wavefolding et rétroaction non-linéaire.
16. **DrumSampler 909/808/Acoustic** : Boîte à rythmes complète (Kick, Snare, Hi-Hat, Clap, Tom, Rimshot).
17. **Wavetable Morphing Synth** : Morphing 3D à travers des tables d'ondes analogiques, métalliques et vocales.
18. **Granular Texture Cloud** : Nuage granulaire en temps réel avec dispersion temporelle et pitch shifting.
19. **Karplus-Strong String Pluck** : Modélisation physique de cordes pincées, guitare et harpe.
20. **Phase Distortion CZ Synth** : Synthèse par distorsion de phase inspirée de la gamme Casio CZ.

---

## 🎛️ Carte de Contrôle & Matrice de Modulation
- **4 Encodeurs Couleur Globaux :** Bleu (Pitch/Mod 1), Vert (Morph/Mod 2), Blanc (Cutoff/Timbre), Orange (Resonance/Drive).
- **Modulations SHIFT :** Accès direct aux micro-réglages de timbre, saturation et panoramique dynamique.
- **Enveloppe ADSR & Filtre 24dB :** Visualisation dynamique de la courbe avec réglage des pentes linéaires/exponentielles.
- **LFO Universel :** Synchronisation au BPM avec routage multi-cibles.

---

## 🐙 Espace Git & Gestion de Versions Studio
- **Branches Studio :** Gestion de branches de travail (`main`, `collab`, `remix`).
- **Commits & Historique :** Création de révisions horodatées avec métadonnées d'auteur, message et rollback en un clic.
- **Format Unifié `.op1proj` :** Sauvegarde et restauration complète de la session (4 pistes, moteurs, presets, volume, tempo).
- **Galerie de Créations Partagées :** Chargement instantané de templates et productions créées par la communauté.

---

## 💬 Salon de Chat Collaboratif
- **Communication Studio Temps Réel :** Échange de messages entre créateurs.
- **Repères Audio Horodatés :** Insertion de marqueurs audio temporels dans la conversation.
- **Partage Direct de Presets & Stems :** Application immédiate des patchs partagés sur le moteur actif.

---

## 💻 Live Coding Strudel
Accédez au studio de live coding algorithmique `/strudel` avec des presets musicaux prêts à l'emploi :
- **Chicago Deep House**
- **Berlin Industrial Techno**
- **Nordic Ambient Drone**
- **Neo-Soul Rhyme**
- **Warp Records IDM**
- **Cyberpunk Synthwave**

---

## 🛠️ Installation et Démarrage

```bash
npm install
npm run dev
npm run build
```
