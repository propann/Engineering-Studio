"use client";

import React, { useState, useEffect, useRef } from "react";

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  role: "Producer" | "Sound Engineer" | "Musician" | "Lead Architect";
  content: string;
  timestamp: number;
  type: "text" | "patch_share" | "stem_share" | "timestamp_comment";
  payload?: {
    engine?: string;
    patch?: string;
    trackIndex?: number;
    audioTime?: string;
    bpm?: number;
  };
}

interface StudioCollabChatProps {
  currentEngine: string;
  currentPatch: string;
  onApplyPatch?: (engine: string, patch: string) => void;
  onApplyTrackStem?: (trackIndex: number) => void;
  onNotice?: (msg: string) => void;
  onClose: () => void;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    sender: "Alex Lead",
    avatar: "🎧",
    role: "Lead Architect",
    content: "Bienvenue dans le studio collaboratif ! Les 2 racks de 10 moteurs et le bus 4 pistes sont synchronisés.",
    timestamp: Date.now() - 3600000 * 2,
    type: "text",
  },
  {
    id: "m2",
    sender: "Elena Synth",
    avatar: "🎹",
    role: "Sound Engineer",
    content: "J&apos;ai préparé un lead acid avec l&apos;Open303 et une résonance boostée, essayez ce patch :",
    timestamp: Date.now() - 3600000,
    type: "patch_share",
    payload: {
      engine: "open303",
      patch: "Acid 303 Resonance Lead",
      bpm: 128,
    },
  },
  {
    id: "m3",
    sender: "Marc Beats",
    avatar: "🥁",
    role: "Musician",
    content: "J&apos;ai posé le beat 808 sur la Piste 1. On peut ajouter le solo de flûte Rings sur la Piste 2 !",
    timestamp: Date.now() - 1800000,
    type: "timestamp_comment",
    payload: {
      audioTime: "00:32",
      trackIndex: 1,
    },
  },
];

export function StudioCollabChat({
  currentEngine,
  currentPatch,
  onApplyPatch,
  onApplyTrackStem,
  onNotice,
  onClose,
}: StudioCollabChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem("op1_studio_chat_messages");
      return stored ? JSON.parse(stored) : DEFAULT_MESSAGES;
    } catch {
      return DEFAULT_MESSAGES;
    }
  });

  const [inputVal, setInputVal] = useState("");
  const [userName, setUserName] = useState("Moi (Producteur)");
  const [userRole, setUserRole] = useState<"Producer" | "Sound Engineer" | "Musician">("Producer");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveMessages = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    try {
      localStorage.setItem("op1_studio_chat_messages", JSON.stringify(newMsgs));
    } catch {}
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: userName.trim() || "Producteur",
      avatar: userRole === "Producer" ? "🎛️" : userRole === "Sound Engineer" ? "🎹" : "🥁",
      role: userRole,
      content: inputVal.trim(),
      timestamp: Date.now(),
      type: "text",
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    setInputVal("");
  };

  const handleShareCurrentPatch = () => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: userName.trim() || "Producteur",
      avatar: "✨",
      role: userRole,
      content: `J&apos;ai partagé mon réglage actif : [${currentEngine}] ${currentPatch}`,
      timestamp: Date.now(),
      type: "patch_share",
      payload: {
        engine: currentEngine,
        patch: currentPatch,
      },
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    onNotice?.(`Patch "${currentPatch}" partagé dans le chat !`);
  };

  return (
    <div
      className="studio-collab-chat-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "580px",
        maxHeight: "85vh",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Entête du Chat ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1e293b",
          paddingBottom: "12px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            💬
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                SALON DE COMMUNICATION STUDIO & PARTAGE AUDIO
              </h2>
              <span
                style={{
                  fontSize: "9px",
                  background: "rgba(0, 237, 149, 0.2)",
                  color: "#00ED95",
                  border: "1px solid #00ED95",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontWeight: 700,
                }}
              >
                ● 4 Connectés
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
              Échange de messages en direct, partage de presets 1-clic et commentaires audio horodatés
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleShareCurrentPatch}
            style={{
              padding: "6px 12px",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid #38bdf8",
              color: "#38bdf8",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📤 Partager mon Patch Actuel
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ── Corps des Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingRight: "6px",
          background: "#090d16",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #1e293b",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              gap: "10px",
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              {m.avatar}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "12px", color: "#ffffff" }}>{m.sender}</strong>
                  <span
                    style={{
                      fontSize: "9px",
                      background: "#1e293b",
                      color: "#94a3b8",
                      padding: "1px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    {m.role}
                  </span>
                </div>
                <span style={{ fontSize: "9.5px", color: "#64748b" }}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
                {m.content}
              </div>

              {/* Carte spéciale Patch partagé */}
              {m.type === "patch_share" && m.payload?.patch && (
                <div
                  style={{
                    marginTop: "6px",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#38bdf8" }}>
                      🎛️ {m.payload.patch}
                    </div>
                    <div style={{ fontSize: "9.5px", color: "#94a3b8" }}>
                      Moteur : {m.payload.engine} {m.payload.bpm ? `· ${m.payload.bpm} BPM` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (m.payload?.engine && m.payload?.patch) {
                        onApplyPatch?.(m.payload.engine, m.payload.patch);
                        onNotice?.(`Patch "${m.payload.patch}" chargé sur l'OP-1 !`);
                      }
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#38bdf8",
                      color: "#0f172a",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    ⚡ Charger ce Patch
                  </button>
                </div>
              )}

              {/* Carte commentaire horodaté */}
              {m.type === "timestamp_comment" && m.payload?.audioTime && (
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "10px",
                    color: "#f59e0b",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                    width: "fit-content",
                  }}
                >
                  ⏱️ Repère Audio : {m.payload.audioTime}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Formulaire d'envoi de Message ── */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "12px",
          background: "#0f172a",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid #1e293b",
        }}
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Écrire un message, partager une idée ou commenter le mix..."
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#ffffff",
            fontSize: "12px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            background: "linear-gradient(135deg, #38bdf8, #2563eb)",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 800,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Envoyer ➔
        </button>
      </form>
    </div>
  );
}
