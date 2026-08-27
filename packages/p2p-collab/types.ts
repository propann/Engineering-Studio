/**
 * types.ts — Types pour la collaboration Peer-to-Peer & Live Jam (WebRTC + Zero-Knowledge)
 */

export interface CryptoIdentity {
  publicKeyHex: string;
  shortId: string; // e.g. "STUDIO-9F4B"
  name: string;
  avatar?: string;
  createdTimestamp: number;
}

export interface StudioKeyExport {
  version: "1.0";
  identity: CryptoIdentity;
  signature: string;
  exportedAt: number;
}

export type ChatChannelId = "general" | "stems" | "mix-master" | "live-jam" | "idees";

export interface ChatAttachment {
  type: "stem_audio" | "midi_pattern" | "synth_preset" | "strudel_code";
  title: string;
  payload: unknown;
}

export type P2PMessageType =
  | "PEER_JOIN"
  | "PEER_LEAVE"
  | "CHAT_MESSAGE"
  | "LIVE_MIDI"
  | "TRANSPORT_SYNC"
  | "COMMIT_ANNOUNCE"
  | "COMMIT_REQUEST"
  | "COMMIT_PAYLOAD"
  | "BLOB_REQUEST"
  | "BLOB_PAYLOAD"
  | "HEARTBEAT"
  | "PING"
  | "PONG";

export interface PingPacketPayload {
  timestamp: number;
  targetPeerKey?: string;
}

export interface ChatMessage {
  id: string;
  channel?: ChatChannelId;
  author: CryptoIdentity;
  text: string;
  timestamp: number;
  attachment?: ChatAttachment;
  timelineMarker?: {
    bar: number;
    beat: number;
    trackName?: string;
  };
}

export interface LiveMidiEvent {
  senderId: string;
  note: number;
  velocity: number;
  channel: number;
  type: "note_on" | "note_off" | "cc" | "pitch_bend";
  timestamp: number;
}

export interface TransportSyncEvent {
  senderId: string;
  action: "play" | "pause" | "stop" | "tempo" | "seek";
  currentBar: number;
  currentBeat: number;
  bpm: number;
  timestamp: number;
}

export interface P2PPacket<T = unknown> {
  type: P2PMessageType;
  sender: CryptoIdentity;
  roomId: string;
  payload: T;
  signature?: string;
  timestamp: number;
}

export interface ConnectedPeer {
  id: string;
  identity: CryptoIdentity;
  latencyMs: number;
  lastSeen: number;
  isHost: boolean;
}
