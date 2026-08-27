"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  type CryptoIdentity,
  type ChatMessage,
  type ChatChannelId,
  type ChatAttachment,
  type ConnectedPeer,
  P2PCollabSession,
  getOrCreateCryptoIdentity,
} from "@studio-hub/p2p-collab";
import { readProfileName } from "../core/profile";

export interface ModuleChatP2PProps {
  channel?: ChatChannelId;
  enTiroir?: boolean;
  onSnippetReceived?: (snippet: string) => void;
}

const CHANNELS: { id: ChatChannelId; label: string; icon: string }[] = [
  { id: "general", label: "Général", icon: "💬" },
  { id: "stems", label: "Stems & Audio", icon: "🎚️" },
  { id: "live-jam", label: "Live Jam", icon: "⚡" },
  { id: "idees", label: "Idées & Setup", icon: "💡" },
  { id: "mix-master", label: "Mix & Master", icon: "🎛️" },
];

export function ModuleChatP2P({
  channel: initialChannel = "general",
  enTiroir = false,
  onSnippetReceived,
}: ModuleChatP2PProps) {
  const [activeChannel, setActiveChannel] = useState<ChatChannelId>(initialChannel);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [roomId, setRoomId] = useState("STUDIO-P2P-MAIN");
  const [peers, setPeers] = useState<ConnectedPeer[]>([]);
  const [identity, setIdentity] = useState<CryptoIdentity | null>(null);
  const [attachmentType, setAttachmentType] = useState<"none" | "strudel" | "preset">("none");
  const [attachmentCode, setAttachmentCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const sessionRef = useRef<P2PCollabSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialisation de l'identité et de la session P2P WebRTC
  useEffect(() => {
    const operatorName = readProfileName();
    const id = getOrCreateCryptoIdentity(operatorName);
    setIdentity(id);

    const session = new P2PCollabSession(roomId, id);
    sessionRef.current = session;

    session.onChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.attachment?.type === "strudel_code" && onSnippetReceived && typeof msg.attachment.payload === "string") {
        onSnippetReceived(msg.attachment.payload);
      }
    };

    session.onPeerJoined = (peer) => {
      setPeers((prev) => [...prev.filter((p) => p.id !== peer.id), peer]);
      setNotice(`🤝 Nouveau pair connecté : ${peer.identity.name} (${peer.identity.shortId})`);
      setTimeout(() => setNotice(null), 3000);
    };

    session.onPeerLeft = (peerId) => {
      setPeers((prev) => prev.filter((p) => p.id !== peerId));
    };

    session.start();

    // Message d'accueil initial local
    const welcomeMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      channel: "general",
      author: {
        publicKeyHex: "system",
        shortId: "SYSTEM",
        name: "Système P2P Collab",
        createdTimestamp: Date.now(),
      },
      text: `📡 Réseau P2P décentralisé initialisé (Room: ${roomId}). Zéro serveur externe — vos échanges audio, code Strudel et presets restent 100% locaux et chiffrés.`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);

    return () => {
      session.stop();
    };
  }, [roomId, onSnippetReceived]);

  // Auto-scroll sur les nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() && attachmentType === "none") return;
    if (!sessionRef.current || !identity) return;

    let attachment: ChatAttachment | undefined;
    if (attachmentType === "strudel" && attachmentCode.trim()) {
      attachment = {
        type: "strudel_code",
        title: "Extrait Strudel Live",
        payload: attachmentCode.trim(),
      };
    } else if (attachmentType === "preset" && attachmentCode.trim()) {
      attachment = {
        type: "synth_preset",
        title: "Preset Audio Rack",
        payload: attachmentCode.trim(),
      };
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      channel: activeChannel,
      author: identity,
      text: inputText.trim(),
      timestamp: Date.now(),
      attachment,
    };

    sessionRef.current.sendChatMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setAttachmentType("none");
    setAttachmentCode("");
  };

  const filteredMessages = messages.filter((m) => !m.channel || m.channel === activeChannel);

  return (
    <div
      className="module-chat-p2p-rack"
      style={{
        background: "var(--theme-bg-surface, #151d20)",
        border: "1.5px solid var(--theme-border, #2c3b40)",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        height: enTiroir ? "100%" : "480px",
        minHeight: "380px",
        color: "var(--theme-text-main, #edf2f7)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Header Organe Chat */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--theme-bg-base, #0e1314)",
          borderBottom: "1px solid var(--theme-border, #2c3b40)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📻</span>
          <div>
            <strong style={{ fontSize: "12px", letterSpacing: "0.5px", color: "var(--theme-accent, #00ed95)" }}>
              ORGAN DE CHAT P2P · RACK UNIT
            </strong>
            <div style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)" }}>
              {identity ? `${identity.name} [${identity.shortId}]` : "Opérateur"} • {peers.length} pair(s) en ligne
            </div>
          </div>
        </div>

        {/* Room Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ fontSize: "10px", fontWeight: 800, color: "var(--theme-text-muted, #94a3b8)" }}>
            ROOM :
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            style={{
              padding: "3px 6px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#38bdf8",
              fontSize: "11px",
              fontWeight: 800,
              fontFamily: "monospace",
              borderRadius: "4px",
              width: "120px",
            }}
          />
        </div>
      </div>

      {notice && (
        <div
          style={{
            padding: "4px 12px",
            background: "rgba(0, 237, 149, 0.15)",
            borderBottom: "1px solid var(--theme-accent, #00ed95)",
            fontSize: "11px",
            color: "var(--theme-accent, #00ed95)",
            fontWeight: 700,
          }}
        >
          {notice}
        </div>
      )}

      {/* Salons / Channels Tab Bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--theme-border, #2c3b40)",
          background: "var(--theme-bg-surface, #151d20)",
          padding: "4px 8px",
          gap: "4px",
          overflowX: "auto",
        }}
      >
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveChannel(c.id)}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: activeChannel === c.id ? 800 : 500,
              background: activeChannel === c.id ? "var(--theme-accent, #00ed95)" : "transparent",
              color: activeChannel === c.id ? "#000" : "var(--theme-text-muted, #94a3b8)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Messages List Area */}
      <div
        style={{
          flex: 1,
          padding: "12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "var(--theme-bg-base, #0e1314)",
        }}
      >
        {filteredMessages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--theme-text-muted, #94a3b8)", fontSize: "11px", margin: "auto" }}>
            Aucun message dans le salon #{activeChannel}. Tapez un message ou partagez du code Strudel !
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = identity && msg.author.publicKeyHex === identity.publicKeyHex;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: isMe ? "var(--theme-accent, #00ed95)" : "#38bdf8" }}>
                    {msg.author.name} [{msg.author.shortId}]
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--theme-text-muted, #64748b)" }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: isMe ? "#1e293b" : "#182226",
                    border: `1px solid ${isMe ? "#334155" : "#243238"}`,
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  {msg.text && <div>{msg.text}</div>}

                  {msg.attachment && (
                    <div
                      style={{
                        marginTop: "6px",
                        padding: "8px",
                        background: "#090d0e",
                        border: "1px solid #334155",
                        borderRadius: "4px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "#f59e0b" }}>
                          📦 {msg.attachment.title} ({msg.attachment.type})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof msg.attachment?.payload === "string") {
                              navigator.clipboard.writeText(msg.attachment.payload);
                              setNotice("📋 Code copié dans le presse-papier !");
                              setTimeout(() => setNotice(null), 2000);
                            }
                          }}
                          style={{
                            padding: "2px 6px",
                            fontSize: "9px",
                            fontWeight: 800,
                            background: "#334155",
                            color: "#fff",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          COPIER
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "var(--theme-accent, #00ed95)",
                          whiteSpace: "pre-wrap",
                          maxHeight: "120px",
                          overflowY: "auto",
                        }}
                      >
                        {String(msg.attachment.payload)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Sub-Drawer */}
      {attachmentType !== "none" && (
        <div
          style={{
            padding: "8px 12px",
            background: "#182226",
            borderTop: "1px solid var(--theme-border, #2c3b40)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#f59e0b" }}>
              📎 Pièce jointe : {attachmentType === "strudel" ? "Snippet Strudel Live-Code" : "Preset Audio"}
            </span>
            <button
              type="button"
              onClick={() => setAttachmentType("none")}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <textarea
            value={attachmentCode}
            onChange={(e) => setAttachmentCode(e.target.value)}
            placeholder={
              attachmentType === "strudel"
                ? `// Colle ton pattern Strudel ici...\ns("bd sd, hh*4").fast(1.2)`
                : `// Colle les paramètres de ton patch synthé ici...`
            }
            style={{
              width: "100%",
              height: "60px",
              background: "#090d0e",
              border: "1px solid #334155",
              color: "var(--theme-accent, #00ed95)",
              fontFamily: "monospace",
              fontSize: "11px",
              padding: "6px",
              borderRadius: "4px",
              resize: "none",
            }}
          />
        </div>
      )}

      {/* Input Row */}
      <div
        style={{
          padding: "8px 12px",
          background: "var(--theme-bg-surface, #151d20)",
          borderTop: "1px solid var(--theme-border, #2c3b40)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            type="button"
            title="Partager un snippet Strudel"
            onClick={() => setAttachmentType(attachmentType === "strudel" ? "none" : "strudel")}
            style={{
              padding: "6px 8px",
              background: attachmentType === "strudel" ? "#f59e0b" : "#1e293b",
              color: attachmentType === "strudel" ? "#000" : "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            💻 STRUDEL
          </button>
          <button
            type="button"
            title="Partager un preset synthé"
            onClick={() => setAttachmentType(attachmentType === "preset" ? "none" : "preset")}
            style={{
              padding: "6px 8px",
              background: attachmentType === "preset" ? "#38bdf8" : "#1e293b",
              color: attachmentType === "preset" ? "#000" : "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🎛️ PRESET
          </button>
        </div>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`Message dans #${activeChannel}...`}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "var(--theme-bg-base, #0e1314)",
            border: "1px solid var(--theme-border, #2c3b40)",
            color: "var(--theme-text-main, #edf2f7)",
            fontSize: "12px",
            borderRadius: "4px",
            outline: "none",
          }}
        />

        <button
          type="button"
          onClick={handleSendMessage}
          style={{
            padding: "8px 16px",
            background: "var(--theme-accent, #00ed95)",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ENVOYER
        </button>
      </div>
    </div>
  );
}

export default ModuleChatP2P;
