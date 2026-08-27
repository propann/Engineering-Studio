import { describe, expect, it } from "vitest";
import { exportStudioKeyFile, getOrCreateCryptoIdentity, importStudioKeyFile } from "./cryptoIdentity";
import { P2PCollabSession } from "./p2pEngine";

describe("P2P Collaboration & Zero-Knowledge Identity", () => {
  it("generates and formats zero-knowledge cryptographic identity", async () => {
    const identity = await getOrCreateCryptoIdentity("Alex Producer", "robot");
    expect(identity.name).toBe("Alex Producer");
    expect(identity.publicKeyHex.startsWith("04")).toBe(true);
    expect(identity.shortId.startsWith("STUDIO-")).toBe(true);
  });

  it("exports and imports studio key files reliably", async () => {
    const original = await getOrCreateCryptoIdentity("Key Master", "synth");
    const exportedKey = exportStudioKeyFile(original);
    expect(exportedKey).toContain("SIG-");
    expect(exportedKey).toContain("Key Master");

    const imported = importStudioKeyFile(exportedKey);
    expect(imported.name).toBe("Key Master");
    expect(imported.shortId).toBe(original.shortId);
    expect(imported.publicKeyHex).toBe(original.publicKeyHex);
  });

  it("handles P2P session setup and message creation", async () => {
    const session = new P2PCollabSession("JAM-ROOM-42");
    const id = await session.init("Enzo");
    expect(session.getRoomId()).toBe("JAM-ROOM-42");
    expect(session.getIdentity()?.name).toBe("Enzo");

    let receivedMsg: any = null;
    const unsub = session.on("CHAT_MESSAGE", (packet) => {
      receivedMsg = packet.payload;
    });

    session.sendChatMessage("Let's add 909 kicks on beat 1!");
    unsub();
  });

  it("handles PING and PONG packet handling correctly", async () => {
    const session = new P2PCollabSession("PING-ROOM");
    await session.init("Tester");

    let pongReceived: any = null;
    session.on("PONG", (packet) => {
      pongReceived = packet.payload;
    });

    session.send("PING", { timestamp: Date.now() });
    expect(session.getRoomId()).toBe("PING-ROOM");
  });
});

