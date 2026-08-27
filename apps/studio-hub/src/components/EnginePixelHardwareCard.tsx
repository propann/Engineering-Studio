import React from "react";

export interface EnginePixelHardwareCardProps {
  engineId: string;
  engineName: string;
  engineCategory: string;
  params: Record<string, any>;
  onParamChange: (key: string, value: any) => void;
  onTriggerTestNote?: () => void;
}

export function EnginePixelHardwareCard({
  engineId,
  engineName,
  engineCategory,
  params,
  onParamChange,
  onTriggerTestNote,
}: EnginePixelHardwareCardProps) {
  const isMutable = engineId.startsWith("mi_");

  return (
    <div
      style={{
        background: isMutable ? "#23272a" : "#1a1e24",
        border: "2px solid",
        borderColor: isMutable ? "#5865f2" : "#ff5a1f",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "18px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* Header Faceplate */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px dashed #404b56",
          paddingBottom: "10px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              padding: "4px 8px",
              background: isMutable ? "#5865f2" : "#ff5a1f",
              color: "#fff",
              fontWeight: 900,
              fontSize: "11px",
              borderRadius: "3px",
              letterSpacing: "0.08em",
            }}
          >
            {isMutable ? "EURORACK MODULAR" : "HARDWARE SIM"}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#f8fafc", fontWeight: 900, letterSpacing: "0.05em" }}>
              {engineName.toUpperCase()}
            </h3>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{engineCategory}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onTriggerTestNote && (
            <button
              type="button"
              onClick={onTriggerTestNote}
              style={{
                padding: "6px 12px",
                background: "#00ed95",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                fontWeight: 900,
                fontSize: "11px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,237,149,0.4)",
              }}
            >
              ▶ TEST NOTE (C3)
            </button>
          )}
        </div>
      </div>

      {/* RENDERINGS PAR MOTEUR */}
      {engineId === "mi_plaits" && (
        <PlaitsPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "mi_braids" && (
        <BraidsPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "mi_rings" && (
        <RingsPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "mi_clouds" && (
        <CloudsPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "mi_elements" && (
        <ElementsPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "open303" && (
        <Open303PixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "dexed_fm" && (
        <DexedFmPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "surge_xt" && (
        <SurgeXtPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "pl_synth" && (
        <PlSynthPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "amsynth" && (
        <AmsynthPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "faust_dsp" && (
        <FaustDspPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "zynaddsubfx" && (
        <ZynAddSubFxPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "helm" && (
        <HelmPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "fluidsynth" && (
        <FluidSynthPixelFaceplate params={params} onParamChange={onParamChange} />
      )}

      {engineId === "amy_engine" && (
        <AmyEnginePixelFaceplate params={params} onParamChange={onParamChange} />
      )}
    </div>
  );
}

// ==========================================
// 1. MUTABLE INSTRUMENTS PLAITS (16 MODELS)
// ==========================================
function PlaitsPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  const models = [
    "V_ANALOG", "WAVESHAPE", "FM_2OP", "FORMANT", "HARMONIC", "WAVETABLE", "CHORD", "PARTICLE"
  ];
  const currentModel = params.plaitsEngine || "V_ANALOG";

  return (
    <div style={{ background: "#2a2f35", border: "2px solid #5a6578", borderRadius: "6px", padding: "14px" }}>
      {/* 8-LED Model Matrix & Display */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div style={{ background: "#181b1e", padding: "10px", borderRadius: "4px", border: "1px solid #3c4450" }}>
          <div style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 800, marginBottom: "6px" }}>
            LED MODEL SELECTOR [8 MODES]
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {models.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onParamChange("plaitsEngine", m)}
                style={{
                  padding: "4px 2px",
                  fontSize: "9px",
                  fontWeight: 900,
                  background: currentModel === m ? "#00ed95" : "#1e242b",
                  color: currentModel === m ? "#000" : "#94a3b8",
                  border: currentModel === m ? "1px solid #00ed95" : "1px solid #334155",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                {m.substring(0, 5)}
              </button>
            ))}
          </div>
        </div>

        {/* Jack Patchbay preview */}
        <div style={{ background: "#181b1e", padding: "10px", borderRadius: "4px", border: "1px solid #3c4450", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <JackSocket label="TRIG" active />
          <JackSocket label="V/OCT" active />
          <JackSocket label="TIMBRE" active />
          <JackSocket label="MORPH" active />
          <JackSocket label="OUT" active highlight />
        </div>
      </div>

      {/* Potentiometers Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <KnobControl label="HARMONICS" value={params.plaitsHarmonics ?? 50} min={0} max={100} onChange={(v) => onParamChange("plaitsHarmonics", v)} />
        <KnobControl label="TIMBRE" value={params.plaitsTimbre ?? 65} min={0} max={100} onChange={(v) => onParamChange("plaitsTimbre", v)} />
        <KnobControl label="MORPH" value={params.plaitsMorph ?? 50} min={0} max={100} onChange={(v) => onParamChange("plaitsMorph", v)} />
        <KnobControl label="DECAY" value={params.plaitsDecay ?? 70} min={0} max={100} onChange={(v) => onParamChange("plaitsDecay", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 2. MUTABLE INSTRUMENTS BRAIDS
// ==========================================
function BraidsPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#24292e", border: "2px solid #5a6578", borderRadius: "6px", padding: "14px" }}>
      {/* 14-Segment Green OLED Pixel Screen */}
      <div
        style={{
          background: "#051608",
          border: "2px solid #00ed95",
          borderRadius: "4px",
          padding: "10px 16px",
          textAlign: "center",
          marginBottom: "14px",
          boxShadow: "inset 0 0 10px rgba(0,237,149,0.3)",
        }}
      >
        <span style={{ fontSize: "10px", color: "#68d391", letterSpacing: "0.2em", display: "block" }}>
          BRAIDS DIGITAL MACRO OSC
        </span>
        <span style={{ fontSize: "20px", fontWeight: 900, color: "#00ed95", fontFamily: "monospace", letterSpacing: "0.15em" }}>
          {params.braidsModel || "CS-80 SAW"}
        </span>
      </div>

      {/* Knobs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
        <KnobControl label="COLOR" value={params.braidsColor ?? 50} min={0} max={100} onChange={(v) => onParamChange("braidsColor", v)} />
        <KnobControl label="TIMBRE" value={params.braidsTimbre ?? 75} min={0} max={100} onChange={(v) => onParamChange("braidsTimbre", v)} />
        <KnobControl label="BIT DEPTH" value={params.braidsBitDepth ?? 16} min={4} max={16} step={1} onChange={(v) => onParamChange("braidsBitDepth", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 3. MUTABLE INSTRUMENTS RINGS
// ==========================================
function RingsPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#2d3339", border: "2px solid #6b7280", borderRadius: "6px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 900, color: "#cbd5e1" }}>MODE RÉSONATEUR :</span>
          {["STRING", "MODAL", "MEMBRANE"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onParamChange("ringsResonatorMode", mode)}
              style={{
                padding: "3px 8px",
                fontSize: "10px",
                fontWeight: 900,
                background: params.ringsResonatorMode === mode ? "#f59e0b" : "#1e293b",
                color: params.ringsResonatorMode === mode ? "#000" : "#cbd5e1",
                border: "1px solid #475569",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <JackSocket label="STRUM" active />
          <JackSocket label="ODD" active />
          <JackSocket label="EVEN" active highlight />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
        <KnobControl label="DAMPING" value={params.ringsDamping ?? 50} min={0} max={100} onChange={(v) => onParamChange("ringsDamping", v)} />
        <KnobControl label="STRUCTURE" value={params.ringsStructure ?? 70} min={0} max={100} onChange={(v) => onParamChange("ringsStructure", v)} />
        <KnobControl label="BRIGHTNESS" value={params.ringsBrightness ?? 65} min={0} max={100} onChange={(v) => onParamChange("ringsBrightness", v)} />
        <KnobControl label="POSITION" value={params.ringsPosition ?? 50} min={0} max={100} onChange={(v) => onParamChange("ringsPosition", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 4. MUTABLE INSTRUMENTS CLOUDS
// ==========================================
function CloudsPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#252e38", border: "2px solid #38bdf8", borderRadius: "6px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 800 }}>GRAIN CLOUD CASCADE</span>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <JackSocket label="FREEZE" active />
          <JackSocket label="L-IN" active />
          <JackSocket label="L-OUT" active highlight />
          <JackSocket label="R-OUT" active highlight />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
        <KnobControl label="DENSITY" value={params.cloudsGranularDensity ?? 70} min={0} max={100} onChange={(v) => onParamChange("cloudsGranularDensity", v)} />
        <KnobControl label="PITCH SHIFT" value={params.cloudsPitchShift ?? 0} min={-24} max={24} step={1} onChange={(v) => onParamChange("cloudsPitchShift", v)} />
        <KnobControl label="TEXTURE" value={params.cloudsTexture ?? 60} min={0} max={100} onChange={(v) => onParamChange("cloudsTexture", v)} />
        <KnobControl label="REVERB" value={params.cloudsReverb ?? 75} min={0} max={100} onChange={(v) => onParamChange("cloudsReverb", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 5. MUTABLE INSTRUMENTS ELEMENTS
// ==========================================
function ElementsPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#2e2b36", border: "2px solid #c084fc", borderRadius: "6px", padding: "14px" }}>
      <div style={{ fontSize: "11px", color: "#c084fc", fontWeight: 800, marginBottom: "12px" }}>
        EXCITER SECTION (BOW / BLOW / STRIKE) & MODAL RESONATOR
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
        <KnobControl label="GEOMETRY" value={params.elementsGeometry ?? 50} min={0} max={100} onChange={(v) => onParamChange("elementsGeometry", v)} />
        <KnobControl label="BRIGHTNESS" value={params.elementsBrightness ?? 70} min={0} max={100} onChange={(v) => onParamChange("elementsBrightness", v)} />
        <KnobControl label="DAMPING" value={params.elementsDamping ?? 40} min={0} max={100} onChange={(v) => onParamChange("elementsDamping", v)} />
        <KnobControl label="STRIKE" value={params.elementsStrike ?? 80} min={0} max={100} onChange={(v) => onParamChange("elementsStrike", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 6. ROLAND TB-303 ACID BASS
// ==========================================
function Open303PixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#c5ccd6", border: "2px solid #8e99a8", borderRadius: "6px", padding: "14px", color: "#111" }}>
      {/* 303 Silver Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #8e99a8", paddingBottom: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "0.1em", color: "#000" }}>
          Transistor Bass TB-303
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800 }}>WAVE:</span>
          <button
            type="button"
            onClick={() => onParamChange("tb303Waveform", params.tb303Waveform === "square" ? "sawtooth" : "square")}
            style={{
              padding: "2px 8px",
              background: "#1e293b",
              color: "#00ed95",
              fontWeight: 900,
              fontSize: "10px",
              border: "1px solid #000",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            {params.tb303Waveform === "square" ? "⊓ SQUARE" : "∧ SAW"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="CUTOFF" value={params.tb303Cutoff ?? 1100} min={100} max={4000} step={10} unit="Hz" onChange={(v) => onParamChange("tb303Cutoff", v)} darkText />
        <KnobControl label="RESONANCE" value={params.tb303Reso ?? 16} min={1} max={30} step={0.5} onChange={(v) => onParamChange("tb303Reso", v)} darkText />
        <KnobControl label="ENV MOD" value={params.tb303EnvMod ?? 70} min={0} max={100} onChange={(v) => onParamChange("tb303EnvMod", v)} darkText />
        <KnobControl label="OVERDRIVE" value={params.tb303Drive ?? 60} min={0} max={100} onChange={(v) => onParamChange("tb303Drive", v)} darkText />
      </div>
    </div>
  );
}

// ==========================================
// 7. DEXED FM (YAMAHA DX7)
// ==========================================
function DexedFmPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#1f2937", border: "2px solid #10b981", borderRadius: "6px", padding: "14px" }}>
      <div
        style={{
          background: "#064e3b",
          border: "2px solid #34d399",
          borderRadius: "4px",
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 900, color: "#6ee7b7", fontFamily: "monospace" }}>
          DX7 6-OP ALGORITHM : #{params.dxAlgorithm || 5}
        </span>
        <span style={{ fontSize: "10px", color: "#a7f3d0" }}>FEEDBACK: {params.dxFeedback || 6}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="ALGORITHM" value={params.dxAlgorithm ?? 5} min={1} max={32} step={1} onChange={(v) => onParamChange("dxAlgorithm", v)} />
        <KnobControl label="OP1 RATIO" value={params.dxOp1Ratio ?? 1.0} min={0.5} max={8.0} step={0.1} onChange={(v) => onParamChange("dxOp1Ratio", v)} />
        <KnobControl label="OP2 RATIO" value={params.dxOp2Ratio ?? 2.0} min={0.5} max={8.0} step={0.1} onChange={(v) => onParamChange("dxOp2Ratio", v)} />
        <KnobControl label="FEEDBACK" value={params.dxFeedback ?? 6} min={0} max={7} step={1} onChange={(v) => onParamChange("dxFeedback", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 8. SURGE XT HYBRID
// ==========================================
function SurgeXtPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#22272e", border: "2px solid #f97316", borderRadius: "6px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", color: "#fb923c", fontWeight: 800 }}>WAVETABLE HYBRID OSCILLATOR</span>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>TABLE: {params.surgeWavetable || "Acid-Wav"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="MORPH" value={params.surgeMorph ?? 65} min={0} max={100} onChange={(v) => onParamChange("surgeMorph", v)} />
        <KnobControl label="CUTOFF" value={params.surgeCutoff ?? 3200} min={100} max={12000} step={50} unit="Hz" onChange={(v) => onParamChange("surgeCutoff", v)} />
        <KnobControl label="RESONANCE" value={params.surgeReso ?? 50} min={0} max={100} onChange={(v) => onParamChange("surgeReso", v)} />
        <KnobControl label="DRIVE" value={params.surgeDrive ?? 40} min={0} max={100} onChange={(v) => onParamChange("surgeDrive", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 9. PL_SYNTH (GAMEBOY / NES CHIPTUNE)
// ==========================================
function PlSynthPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#8b956d", border: "2px solid #4a5332", borderRadius: "6px", padding: "14px", color: "#1f2414" }}>
      {/* GameBoy Screen Bar */}
      <div
        style={{
          background: "#9bbc0f",
          border: "2px solid #0f380f",
          borderRadius: "4px",
          padding: "8px 12px",
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 900, color: "#0f380f", fontFamily: "monospace" }}>
          DMG-01 CHIPTUNE ENGINE • {params.plBitcrush ?? 4}-BIT LO-FI
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="BITCRUSH" value={params.plBitcrush ?? 4} min={2} max={16} step={1} unit="bit" onChange={(v) => onParamChange("plBitcrush", v)} darkText />
        <KnobControl label="SR DIVIDER" value={params.plSampleRateDiv ?? 2} min={1} max={16} step={1} onChange={(v) => onParamChange("plSampleRateDiv", v)} darkText />
        <KnobControl label="DUTY CYCLE" value={params.plDutyCycle ?? 50} min={12} max={75} step={12.5} unit="%" onChange={(v) => onParamChange("plDutyCycle", v)} darkText />
        <KnobControl label="GLITCH" value={params.plGlitch ?? 0} min={0} max={100} onChange={(v) => onParamChange("plGlitch", v)} darkText />
      </div>
    </div>
  );
}

// ==========================================
// 10. AMSYNTH (VINTAGE SUBTRACTIVE MOOG)
// ==========================================
function AmsynthPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#3b2314", border: "2px solid #b45309", borderRadius: "6px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 900 }}>DUAL VCO SUBTRACTIVE SYNTH</span>
        <span style={{ fontSize: "11px", color: "#d97706" }}>VCO: {params.amWave || "sawtooth"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="CUTOFF" value={params.amCutoff ?? 2500} min={100} max={8000} step={50} unit="Hz" onChange={(v) => onParamChange("amCutoff", v)} />
        <KnobControl label="RESONANCE" value={params.amReso ?? 60} min={0} max={100} onChange={(v) => onParamChange("amReso", v)} />
        <KnobControl label="LFO DEPTH" value={params.amLfoDepth ?? 30} min={0} max={100} onChange={(v) => onParamChange("amLfoDepth", v)} />
        <KnobControl label="DECAY" value={params.amDecay ?? 40} min={0} max={100} onChange={(v) => onParamChange("amDecay", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 11. FAUST DSP WAVEFOLDER
// ==========================================
function FaustDspPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#1e1e24", border: "2px solid #ec4899", borderRadius: "6px", padding: "14px" }}>
      <div style={{ fontSize: "12px", color: "#f472b6", fontWeight: 800, marginBottom: "12px" }}>
        FAUST COMPILED DSP WAVEFOLDER & MODULATION
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="FREQ MOD" value={params.faustFreqMod ?? 50} min={0} max={100} onChange={(v) => onParamChange("faustFreqMod", v)} />
        <KnobControl label="WAVE DRIVE" value={params.faustDrive ?? 60} min={0} max={100} onChange={(v) => onParamChange("faustDrive", v)} />
        <KnobControl label="FILTER" value={params.faustFilter ?? 3500} min={200} max={10000} step={50} unit="Hz" onChange={(v) => onParamChange("faustFilter", v)} />
        <KnobControl label="FEEDBACK" value={params.faustFeedback ?? 40} min={0} max={95} onChange={(v) => onParamChange("faustFeedback", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 12. ZYNADDSUBFX CELESTIAL
// ==========================================
function ZynAddSubFxPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#1e2433", border: "2px solid #60a5fa", borderRadius: "6px", padding: "14px" }}>
      <div style={{ fontSize: "12px", color: "#93c5fd", fontWeight: 800, marginBottom: "12px" }}>
        ZYNADDSUBFX COMPLEX HARMONIC & SUB BOOST
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="HARMONICS" value={params.zynHarmonics ?? 70} min={0} max={100} onChange={(v) => onParamChange("zynHarmonics", v)} />
        <KnobControl label="BANDWIDTH" value={params.zynBandwidth ?? 50} min={0} max={100} onChange={(v) => onParamChange("zynBandwidth", v)} />
        <KnobControl label="SUB BOOST" value={params.zynSubBoost ?? 60} min={0} max={100} onChange={(v) => onParamChange("zynSubBoost", v)} />
        <KnobControl label="REVERB SEND" value={params.zynReverbSend ?? 40} min={0} max={100} onChange={(v) => onParamChange("zynReverbSend", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 13. HELM MODULATION
// ==========================================
function HelmPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#27272a", border: "2px solid #a1a1aa", borderRadius: "6px", padding: "14px" }}>
      <div style={{ fontSize: "12px", color: "#e4e4e7", fontWeight: 800, marginBottom: "12px" }}>
        HELM CROSS-MODULATION & DUAL LFO
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="CROSSMOD" value={params.helmCrossmod ?? 50} min={0} max={100} onChange={(v) => onParamChange("helmCrossmod", v)} />
        <KnobControl label="CUTOFF" value={params.helmCutoff ?? 3000} min={100} max={8000} step={50} unit="Hz" onChange={(v) => onParamChange("helmCutoff", v)} />
        <KnobControl label="LFO SPEED" value={params.helmLfoSpeed ?? 4} min={0.5} max={20} step={0.5} unit="Hz" onChange={(v) => onParamChange("helmLfoSpeed", v)} />
        <KnobControl label="SUB OCTAVE" value={params.helmSubOct ?? 1} min={0} max={2} step={1} onChange={(v) => onParamChange("helmSubOct", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 14. FLUIDSYNTH SF2
// ==========================================
function FluidSynthPixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#1c1917", border: "2px solid #d97706", borderRadius: "6px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 800 }}>SOUNDFONT SF2 ENGINE</span>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>PRESET: {params.fluidPreset || "Acoustic Grand Piano"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="REVERB" value={params.fluidReverb ?? 40} min={0} max={100} onChange={(v) => onParamChange("fluidReverb", v)} />
        <KnobControl label="CHORUS" value={params.fluidChorus ?? 30} min={0} max={100} onChange={(v) => onParamChange("fluidChorus", v)} />
        <KnobControl label="VOLUME" value={params.fluidVolume ?? 80} min={0} max={100} onChange={(v) => onParamChange("fluidVolume", v)} />
        <KnobControl label="PAN" value={params.fluidPan ?? 0} min={-50} max={50} onChange={(v) => onParamChange("fluidPan", v)} />
      </div>
    </div>
  );
}

// ==========================================
// 15. AMY ENGINE (ADDITIVE / PARTIALS)
// ==========================================
function AmyEnginePixelFaceplate({ params, onParamChange }: { params: any; onParamChange: any }) {
  return (
    <div style={{ background: "#1f2421", border: "2px solid #14b8a6", borderRadius: "6px", padding: "14px" }}>
      <div style={{ fontSize: "12px", color: "#2dd4bf", fontWeight: 800, marginBottom: "12px" }}>
        AMY FIXED-POINT ADDITIVE SYNTH & BREAKPOINTS
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
        <KnobControl label="PARTIALS" value={params.amyPartials ?? 16} min={1} max={64} step={1} onChange={(v) => onParamChange("amyPartials", v)} />
        <KnobControl label="SPREAD" value={params.amySpread ?? 50} min={0} max={100} onChange={(v) => onParamChange("amySpread", v)} />
        <KnobControl label="SLOPE" value={params.amySlope ?? 40} min={0} max={100} onChange={(v) => onParamChange("amySlope", v)} />
        <KnobControl label="DECAY" value={params.amyDecay ?? 60} min={0} max={100} onChange={(v) => onParamChange("amyDecay", v)} />
      </div>
    </div>
  );
}

// ==========================================
// SHARED PIXEL ART CONTROLS & JACK SOCKETS
// ==========================================
function JackSocket({ label, active = false, highlight = false }: { label: string; active?: boolean; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: highlight ? "#00ed95" : active ? "#334155" : "#0f172a",
          border: "2px solid",
          borderColor: highlight ? "#000" : "#64748b",
          boxShadow: highlight ? "0 0 6px #00ed95" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#000" }} />
      </div>
      <span style={{ fontSize: "8px", fontWeight: 900, color: "#94a3b8" }}>{label}</span>
    </div>
  );
}

function KnobControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  darkText = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  darkText?: boolean;
}) {
  return (
    <div
      style={{
        background: darkText ? "rgba(0,0,0,0.08)" : "#0f1418",
        border: darkText ? "1px solid rgba(0,0,0,0.2)" : "1px solid #28333e",
        borderRadius: "4px",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: 900, color: darkText ? "#111" : "#94a3b8" }}>{label}</span>
        <span style={{ fontSize: "10px", fontWeight: 900, color: darkText ? "#000" : "#00ed95", fontFamily: "monospace" }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%",
          accentColor: darkText ? "#1e293b" : "#00ed95",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
