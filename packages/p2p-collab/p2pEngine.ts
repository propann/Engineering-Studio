/**
 * p2pEngine.ts — Moteur de Connexion & Échange Temps Réel Peer-to-Peer
 */

import { getOrCreateCryptoIdentity } from "./cryptoIdentity";
import type {
  ChatMessage,
  ConnectedPeer,
  CryptoIdentity,
  LiveMidiEvent,
  P2PMessageType,
  P2PPacket,
  TransportSyncEvent,
} from "./types";

export type PacketHandler<T = any> = (packet: P2PPacket<T>) => void;

export class P2PCollabSession {
  private roomId: string;
  private identity: CryptoIdentity | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private peerMap: Map<string, ConnectedPeer> = new Map();
  private packetListeners: Map<P2PMessageType, Set<PacketHandler>> = new Map();
  private isConnected: boolean = false;
  private heartbeatInterval: any = null;

  constructor(roomId: string) {
    this.roomId = roomId.trim().toUpperCase() || "STUDIO-MAIN";
  }

  async init(customName?: string, customAvatar?: string): Promise<CryptoIdentity> {
    this.identity = await getOrCreateCryptoIdentity(customName, customAvatar);
    return this.identity;
  }

  getRoomId(): string {
    return this.roomId;
  }

  getIdentity(): CryptoIdentity | null {
    return this.identity;
  }

  getConnectedPeers(): ConnectedPeer[] {
    return Array.from(this.peerMap.values());
  }

  /**
   * Rejoint la salle P2P
   */
  async join(): Promise<void> {
    if (!this.identity) {
      await this.init();
    }
    if (this.isConnected) return;

    if (typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel(`engineering-studio-p2p-${this.roomId}`);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingRaw(event.data);
      };
    }

    this.isConnected = true;

    // Annonce d'arrivée
    this.send("PEER_JOIN", {
      joinedAt: Date.now(),
    });

    // Heartbeat & Ping régulier (toutes les 3 secondes)
    this.heartbeatInterval = setInterval(() => {
      this.send("HEARTBEAT", { ping: Date.now() });
      this.send("PING", { timestamp: Date.now() });
      this.cleanupStalePeers();
    }, 3000);
  }

  /**
   * Quitte la salle
   */
  leave(): void {
    if (!this.isConnected) return;
    this.send("PEER_LEAVE", { leftAt: Date.now() });
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isConnected = false;
    this.peerMap.clear();
  }

  /**
   * Envoi d'un paquet typé sur le canal P2P
   */
  send<T = unknown>(type: P2PMessageType, payload: T): void {
    if (!this.identity || !this.isConnected) return;
    const packet: P2PPacket<T> = {
      type,
      sender: this.identity,
      roomId: this.roomId,
      payload,
      timestamp: Date.now(),
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(packet);
    }
  }

  /**
   * Envoi d'un message de chat avec horodatage musical
   */
  sendChatMessage(text: string, timelineMarker?: { bar: number; beat: number; trackName?: string }): void {
    if (!this.identity) return;
    const msg: ChatMessage = {
      id: "msg-" + Math.random().toString(36).slice(2, 9),
      author: this.identity,
      text: text.trim(),
      timestamp: Date.now(),
      timelineMarker,
    };
    this.send("CHAT_MESSAGE", msg);
  }

  /**
   * Envoi d'une note MIDI en direct (Live Jam)
   */
  sendLiveMidi(event: Omit<LiveMidiEvent, "senderId" | "timestamp">): void {
    if (!this.identity) return;
    const liveEvent: LiveMidiEvent = {
      ...event,
      senderId: this.identity.publicKeyHex,
      timestamp: Date.now(),
    };
    this.send("LIVE_MIDI", liveEvent);
  }

  /**
   * Synchronisation du transport (Play/Pause/Tempo)
   */
  sendTransportSync(event: Omit<TransportSyncEvent, "senderId" | "timestamp">): void {
    if (!this.identity) return;
    const transportEvent: TransportSyncEvent = {
      ...event,
      senderId: this.identity.publicKeyHex,
      timestamp: Date.now(),
    };
    this.send("TRANSPORT_SYNC", transportEvent);
  }

  /**
   * Inscription aux messages entrants
   */
  on<T = any>(type: P2PMessageType, handler: PacketHandler<T>): () => void {
    if (!this.packetListeners.has(type)) {
      this.packetListeners.set(type, new Set());
    }
    const set = this.packetListeners.get(type)!;
    set.add(handler as PacketHandler);
    return () => set.delete(handler as PacketHandler);
  }

  private handleIncomingRaw(packet: P2PPacket): void {
    if (!packet || packet.roomId !== this.roomId) return;
    if (this.identity && packet.sender.publicKeyHex === this.identity.publicKeyHex) {
      // Ignorer ses propres échos
      return;
    }

    // Mise à jour de la table des pairs connectés
    const peerKey = packet.sender.publicKeyHex;
    const existing = this.peerMap.get(peerKey);
    const latency = packet.timestamp ? Math.max(1, Date.now() - packet.timestamp) : 10;

    if (existing) {
      existing.lastSeen = Date.now();
      existing.latencyMs = latency;
      existing.identity = packet.sender;
    } else {
      this.peerMap.set(peerKey, {
        id: peerKey,
        identity: packet.sender,
        latencyMs: latency,
        lastSeen: Date.now(),
        isHost: false,
      });
    }

    // Réponse automatique au PING
    if (packet.type === "PING") {
      const payload = packet.payload as { timestamp?: number };
      this.send("PONG", {
        timestamp: payload?.timestamp || packet.timestamp,
        targetPeerKey: packet.sender.publicKeyHex,
      });
    }

    // Traitement du PONG pour mesurer le Round-Trip Time
    if (packet.type === "PONG") {
      const payload = packet.payload as { timestamp?: number; targetPeerKey?: string };
      if (payload?.timestamp) {
        const rtt = Math.max(1, Date.now() - payload.timestamp);
        if (existing) {
          existing.latencyMs = Math.round(rtt / 2);
        }
      }
    }

    if (packet.type === "PEER_LEAVE") {
      this.peerMap.delete(peerKey);
    }

    // Déclenchement des écouteurs
    const handlers = this.packetListeners.get(packet.type);
    if (handlers) {
      for (const h of handlers) {
        try {
          h(packet);
        } catch {
          // protection
        }
      }
    }
  }

  private cleanupStalePeers(): void {
    const now = Date.now();
    for (const [key, peer] of this.peerMap.entries()) {
      if (now - peer.lastSeen > 12000) {
        this.peerMap.delete(key);
      }
    }
  }
}
