/**
 * soundEnginesData.ts — Moteurs audio du Rack & Banques de Patches d'Usine
 *
 * Contient la définition exhaustive des 15 moteurs audio du rack,
 * leurs catégories, et l'ensemble de leurs patches d'usine.
 */

export type EngineId =
  | "mi_plaits"
  | "mi_braids"
  | "mi_rings"
  | "mi_clouds"
  | "mi_elements"
  | "dexed_fm"
  | "surge_xt"
  | "zynaddsubfx"
  | "helm"
  | "fluidsynth"
  | "amsynth"
  | "amy_engine"
  | "pl_synth"
  | "open303"
  | "faust_dsp";

export interface EngineMeta {
  id: EngineId;
  name: string;
  label: string;
  category: "Eurorack" | "Synthèse FM" | "Wavetable" | "Synthèse Additive" | "Polyphonique" | "Échantillonneur" | "Analogique Moog" | "Chiptune 8-Bit" | "Acid Bassline" | "DSP Faust";
  type: string;
  tag: string;
  description: string;
}

export const RACK_ENGINES_METAS: EngineMeta[] = [
  { id: "mi_plaits", name: "Mutable Instruments Plaits", label: "MI Plaits", category: "Eurorack", type: "Eurorack Macro", tag: "Macro VA/FM/WT", description: "Synthèse macro modulaire : VA, FM, Wavetable, Formant, Speech, Chord" },
  { id: "mi_braids", name: "Mutable Instruments Braids", label: "MI Braids", category: "Eurorack", type: "Eurorack CS-80", tag: "Oscillateur CS-80", description: "Modélisation CS-80, tables d'ondes, voyelles et cloches métalliques" },
  { id: "mi_rings", name: "Mutable Instruments Rings", label: "MI Rings", category: "Eurorack", type: "Modal Physique", tag: "Résonateur Physique", description: "Résonateur modal acoustique : cordes, tubes, plaques métalliques" },
  { id: "mi_clouds", name: "Mutable Instruments Clouds", label: "MI Clouds", category: "Eurorack", type: "Granulaire", tag: "Texture Granulaire", description: "Processeur de textures granulaires, time-stretch, freeze et shimmer" },
  { id: "mi_elements", name: "Mutable Instruments Elements", label: "MI Elements", category: "Eurorack", type: "Synthèse Modale", tag: "Synthèse Modale", description: "Percussions physiques, excitation archet/frappe et corps résonant" },
  { id: "dexed_fm", name: "Dexed 6-Operator FM", label: "Dexed FM (DX7)", category: "Synthèse FM", type: "6-OP FM", tag: "DX7 6-OP Vintage", description: "Moteur de synthèse FM classique DX7 avec 32 algorithmes" },
  { id: "surge_xt", name: "Surge XT Wavetable", label: "Surge XT", category: "Wavetable", type: "Wavetable Hybride", tag: "Wavetable Hybride", description: "Synthétiseur hybride wavetable à morphing continu et double filtre" },
  { id: "zynaddsubfx", name: "ZynAddSubFX Additive", label: "ZynAddSubFX", category: "Synthèse Additive", type: "Additif & Pad", tag: "Synthèse Additive", description: "Générateur additif puissant avec harmoniques riches et filtres résonants" },
  { id: "helm", name: "Helm Visual Polyphonic", label: "Helm Poly", category: "Polyphonique", type: "Polyphonique VA", tag: "Cross-Modulation", description: "Synthétiseur polyphonique à modulation croisée et wobbles LFO" },
  { id: "fluidsynth", name: "FluidSynth SF2 Player", label: "FluidSynth SF2", category: "Échantillonneur", type: "SoundFont SF2", tag: "SoundFont 2", description: "Lecteur de banque sonore SF2 : piano acoustique, Rhodes, orgue, cordes" },
  { id: "amsynth", name: "amSynth Moog Analog", label: "amSynth Analog", category: "Analogique Moog", type: "Analog Moog", tag: "Soustractif Analog", description: "Émulation analogique soustractive chaude de type Minimoog" },
  { id: "amy_engine", name: "AMY Additive Synthesizer", label: "AMY Synth", category: "Synthèse Additive", type: "Additif Spectral", tag: "Harmoniques Additives", description: "Moteur additif spectral haute performance et chiptune expérimental" },
  { id: "pl_synth", name: "Picoloop 8-Bit Chiptune", label: "Picoloop 8-Bit", category: "Chiptune 8-Bit", type: "8-Bit Retro", tag: "GameBoy / NES", description: "Moteur rétro chiptune 8-bit avec bitcrush, duty cycle et arpège glitch" },
  { id: "open303", name: "Open303 Acid Bassline", label: "Open303 Bass", category: "Acid Bassline", type: "TB-303 Acid", tag: "TB-303 Acid", description: "Émulation légendaire de basse acid Roland TB-303 avec accent et résonance" },
  { id: "faust_dsp", name: "Faust DSP Wavefolder", label: "Faust DSP", category: "DSP Faust", type: "Faust DSP FX", tag: "Distorsion & Ringmod", description: "Algorithmes DSP Faust : wavefolding non-linéaire, ringmod et hyper-drive" },
];

export const RACK_ENGINE_IDS: EngineId[] = RACK_ENGINES_METAS.map((m) => m.id);

export interface PatchMeta {
  id: string;
  name: string;
  engine: EngineId;
  category: string;
  description: string;
}

export const FACTORY_PATCHES_BY_ENGINE: Record<EngineId, PatchMeta[]> = {
  mi_plaits: [
    { id: "pl1", name: "Virtual Analog Saw Lead", engine: "mi_plaits", category: "Lead", description: "Lead en dents de scie VA brillant" },
    { id: "pl2", name: "2-OP Glass FM Bell", engine: "mi_plaits", category: "Bell", description: "Cloche FM cristalline 2 opérateurs" },
    { id: "pl3", name: "Wavetable 3D Sweep", engine: "mi_plaits", category: "Pad", description: "Nappe évolutive à balayage wavetable" },
    { id: "pl4", name: "Granular Cloud Burst", engine: "mi_plaits", category: "FX", description: "Nuage granulaire texturé et spatial" },
    { id: "pl5", name: "Formant Speech Vox", engine: "mi_plaits", category: "Vocal", description: "Synthèse de voyelles et formants parlés" },
    { id: "pl6", name: "4-Voice Synth Chord", engine: "mi_plaits", category: "Chord", description: "Accord polyphonique 4 voix modulaire" },
  ],
  mi_braids: [
    { id: "br1", name: "CS-80 Brass Lead", engine: "mi_braids", category: "Brass", description: "Cuivres chaleureux type Yamaha CS-80" },
    { id: "br2", name: "Wavetable Scan Wav", engine: "mi_braids", category: "Synth", description: "Tables d'ondes numériques animées" },
    { id: "br3", name: "Vowel Formant Choir", engine: "mi_braids", category: "Vocal", description: "Chœur polyphonique de formants" },
    { id: "br4", name: "Metallic Bell Strike", engine: "mi_braids", category: "Perc", description: "Percussion métallique inharmonique" },
    { id: "br5", name: "Sub Harmonic Pulse", engine: "mi_braids", category: "Bass", description: "Basse sub-harmonique puissante" },
  ],
  mi_rings: [
    { id: "ri1", name: "Modal Acoustic String", engine: "mi_rings", category: "Pluck", description: "Corde pincée par modélisation physique" },
    { id: "ri2", name: "Sympathetic Tube Flute", engine: "mi_rings", category: "Wind", description: "Tube résonant à air et flûte modale" },
    { id: "ri3", name: "Inharmonic Steel Plate", engine: "mi_rings", category: "Bell", description: "Plaque d'acier résonante et gong" },
    { id: "ri4", name: "Damped Nylon Guitar", engine: "mi_rings", category: "Pluck", description: "Guitare acoustique amortie douce" },
    { id: "ri5", name: "Resonant Glass Glocken", engine: "mi_rings", category: "Bell", description: "Glockenspiel de verre résonant" },
  ],
  mi_clouds: [
    { id: "cl1", name: "Granular Ether Cloud", engine: "mi_clouds", category: "Pad", description: "Nuage éthéré de grains flottants" },
    { id: "cl2", name: "Time Stretch Glitch", engine: "mi_clouds", category: "FX", description: "Éclatement temporel et glitch audio" },
    { id: "cl3", name: "Ambient Freeze Reverb", engine: "mi_clouds", category: "Ambient", description: "Gèle infini de réverbération texturée" },
    { id: "cl4", name: "Sub Pitch Shifter Drone", engine: "mi_clouds", category: "Drone", description: "Drone subharmonique pitch-shifté" },
    { id: "cl5", name: "Shimmer Octave Up", engine: "mi_clouds", category: "Lead", description: "Shimmer aérien avec octave supérieure" },
  ],
  mi_elements: [
    { id: "el1", name: "Percussive Strike Modal", engine: "mi_elements", category: "Perc", description: "Frappe percussive modale" },
    { id: "el2", name: "Resonant Bowed Metal", engine: "mi_elements", category: "Pluck", description: "Archet frotté sur métal résonant" },
    { id: "el3", name: "Tribal Wood Block", engine: "mi_elements", category: "Perc", description: "Bloc de bois percussif résonant" },
    { id: "el4", name: "Etheric Chime Choir", engine: "mi_elements", category: "Pad", description: "Carillon éthérique et cloches modales" },
    { id: "el5", name: "Sub Impact Shell", engine: "mi_elements", category: "Bass", description: "Impact de membrane grave résonante" },
  ],
  dexed_fm: [
    { id: "dx1", name: "80s DX7 Electric Piano", engine: "dexed_fm", category: "Keys", description: "Piano électrique FM classique des années 80" },
    { id: "dx2", name: "Solid FM Bass", engine: "dexed_fm", category: "Bass", description: "Basse FM percutante et ronde" },
    { id: "dx3", name: "Glass Mallet Bell", engine: "dexed_fm", category: "Bell", description: "Maillet de verre et cloches FM" },
    { id: "dx4", name: "FM Brass Horns", engine: "dexed_fm", category: "Brass", description: "Section de cuivres FM brillantes" },
    { id: "dx5", name: "Harpsichord FM Digital", engine: "dexed_fm", category: "Keys", description: "Clavecin numérique FM tranchant" },
  ],
  surge_xt: [
    { id: "su1", name: "Acid Wavetable Lead", engine: "surge_xt", category: "Lead", description: "Lead wavetable incisif à double filtre" },
    { id: "su2", name: "Digital Vector Pad", engine: "surge_xt", category: "Pad", description: "Nappe vectorielle hybride morphing" },
    { id: "su3", name: "Digital Bell Table", engine: "surge_xt", category: "Bell", description: "Cloches numériques spectrales" },
    { id: "su4", name: "Formant Vocal Choir", engine: "surge_xt", category: "Vocal", description: "Chœur vocal à tables de formants" },
    { id: "su5", name: "Overdriven Sub Bass", engine: "surge_xt", category: "Bass", description: "Basse sub saturée et compressée" },
  ],
  zynaddsubfx: [
    { id: "zy1", name: "Celestial Organ Pad", engine: "zynaddsubfx", category: "Pad", description: "Nappe d'orgue céleste harmonique" },
    { id: "zy2", name: "Additive Synth Solo", engine: "zynaddsubfx", category: "Lead", description: "Lead additif pur et harmoniques riches" },
    { id: "zy3", name: "Sub harmonic Pipe Organ", engine: "zynaddsubfx", category: "Keys", description: "Grand orgue à tuyaux sub-harmonique" },
    { id: "zy4", name: "Resonant Notch Sweep", engine: "zynaddsubfx", category: "FX", description: "Balayage de filtre notch résonant" },
    { id: "zy5", name: "Warm Analog Brass", engine: "zynaddsubfx", category: "Brass", description: "Cuivres additifs chauds et expressifs" },
  ],
  helm: [
    { id: "he1", name: "Crossmod Pulse Lead", engine: "helm", category: "Lead", description: "Lead à modulation croisée agressive" },
    { id: "he2", name: "Deep Sub Bass", engine: "helm", category: "Bass", description: "Sub-bass polyphonique profond" },
    { id: "he3", name: "LFO Wobble Synth", engine: "helm", category: "Lead", description: "Wobble modulé par LFO dynamique" },
    { id: "he4", name: "Space Ambient Reverb", engine: "helm", category: "Pad", description: "Espace infini et réverbération spatiale" },
    { id: "he5", name: "Aggressive Saw Stab", engine: "helm", category: "Stab", description: "Stab en dents de scie percutant" },
  ],
  fluidsynth: [
    { id: "fl1", name: "Concert Grand Piano SF2", engine: "fluidsynth", category: "Piano", description: "Grand piano de concert acoustique SF2" },
    { id: "fl2", name: "Stage Rhodes EP SF2", engine: "fluidsynth", category: "Keys", description: "Rhodes vintage à micros magnétiques" },
    { id: "fl3", name: "Cathedral Pipe Organ SF2", engine: "fluidsynth", category: "Organ", description: "Orgue de cathédrale grandiose SF2" },
    { id: "fl4", name: "Symphonic Strings SF2", engine: "fluidsynth", category: "Strings", description: "Ensemble de cordes symphoniques" },
    { id: "fl5", name: "Wide Stereo Rhodes SF2", engine: "fluidsynth", category: "Keys", description: "Rhodes panoramique stéréo élargi" },
  ],
  amsynth: [
    { id: "am1", name: "Moog Sawtooth Lead", engine: "amsynth", category: "Lead", description: "Lead soustractif analogique chaud Minimoog" },
    { id: "am2", name: "Analog Square Bass", engine: "amsynth", category: "Bass", description: "Basse carrée analogique ronde et percutante" },
    { id: "am3", name: "Vibrato Sine Solo", engine: "amsynth", category: "Lead", description: "Solo sinusoïdal expressif avec vibrato" },
    { id: "am4", name: "Fat Dual VCO Pluck", engine: "amsynth", category: "Pluck", description: "Pluck puissant à double oscillateur VCO" },
    { id: "am5", name: "Resonant Triangle Lead", engine: "amsynth", category: "Lead", description: "Lead triangulaire filtré 24dB/oct" },
  ],
  amy_engine: [
    { id: "amy1", name: "Additive Spectral Bell", engine: "amy_engine", category: "Bell", description: "Cloche spectrale aux partiels additifs" },
    { id: "amy2", name: "Subharmonic Sine Pad", engine: "amy_engine", category: "Pad", description: "Nappe de sinus subharmoniques purs" },
    { id: "amy3", name: "Dense 64-Partial Organ", engine: "amy_engine", category: "Organ", description: "Orgue additif à 64 partiels indépendants" },
    { id: "amy4", name: "Chiptune Noise Pulse", engine: "amy_engine", category: "Retro", description: "Impulsion bruitée rétro chiptune" },
    { id: "amy5", name: "Glassy Additive Sweep", engine: "amy_engine", category: "Lead", description: "Balayage additif soyeux et brillant" },
  ],
  pl_synth: [
    { id: "pls1", name: "GameBoy 8-Bit Lead", engine: "pl_synth", category: "Retro", description: "Lead carré authentique GameBoy DMG-01" },
    { id: "pls2", name: "NES Square Chiptune", engine: "pl_synth", category: "Retro", description: "Onde carrée NES 2A03 vintage" },
    { id: "pls3", name: "Low-Bit Glitch Monster", engine: "pl_synth", category: "FX", description: "Bitcrush destructif et glitch arcade" },
    { id: "pls4", name: "Commodore 64 Arp Bass", engine: "pl_synth", category: "Bass", description: "Basse arpégée SID 6581 classique" },
    { id: "pls5", name: "Retro Arcade Coin FX", engine: "pl_synth", category: "FX", description: "Effet sonore de pièce de monnaie arcade" },
  ],
  open303: [
    { id: "ac1", name: "Acid 303 Resonance Lead", engine: "open303", category: "Acid", description: "Lead acid Roland TB-303 à forte résonance" },
    { id: "ac2", name: "Square Acid Sub Bass", engine: "open303", category: "Acid", description: "Basse acid onde carrée avec accent" },
    { id: "ac3", name: "Screaming Acid Lead", engine: "open303", category: "Acid", description: "Lead acid hurlant avec filtre saturé" },
    { id: "ac4", name: "Low-Pass Acid Pulse", engine: "open303", category: "Acid", description: "Pulsation acid filtrée passe-bas sombre" },
    { id: "ac5", name: "High-Octane Accent Lead", engine: "open303", category: "Acid", description: "Lead acid survitaminé aux accents vifs" },
  ],
  faust_dsp: [
    { id: "fa1", name: "Faust Wavefolder Distortion", engine: "faust_dsp", category: "FX", description: "Distorsion par repliement d'onde non-linéaire" },
    { id: "fa2", name: "Resonant DSP Ringmod", engine: "faust_dsp", category: "FX", description: "Modulation en anneau Faust haute fidélité" },
    { id: "fa3", name: "Hyper Drive Wavefolder", engine: "faust_dsp", category: "Lead", description: "Lead ultra-harmonique saturé par wavefolder" },
    { id: "fa4", name: "Low-Pass DSP Sub Drive", engine: "faust_dsp", category: "Bass", description: "Basse sub entraînée par DSP Faust dynamique" },
    { id: "fa5", name: "Feedback Distortion Swarm", engine: "faust_dsp", category: "FX", description: "Essaim d'harmoniques et feedback contrôlé" },
  ],
};

/** Renvoie les patches d'un moteur donné avec description garantie. */
export function getPatchesForEngine(engine: string): (PatchMeta & { description: string })[] {
  const patches = FACTORY_PATCHES_BY_ENGINE[engine as EngineId] ?? FACTORY_PATCHES_BY_ENGINE.mi_plaits;
  return patches.map((p) => ({
    ...p,
    description: p.description || `${p.category} preset · ${p.name}`,
  }));
}

/** Renvoie les métadonnées d'un moteur donné. */
export function getEngineMeta(engine: string): EngineMeta | undefined {
  return RACK_ENGINES_METAS.find((m) => m.id === engine);
}
