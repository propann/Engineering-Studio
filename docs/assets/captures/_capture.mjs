/**
 * Captures d'écran du Hub, par le protocole de débogage de Chromium.
 *
 * Le Hub n'a pas de routage par URL : la navigation passe par
 * `window.navigateMaquette(page)`. Un `--screenshot` simple ne peut donc
 * atteindre que l'accueil. On pilote le navigateur pour aller sur chaque vue.
 *
 * Sans dépendance : Node 22 a WebSocket en natif.
 */
const BASE = "http://127.0.0.1:9222";
const CIBLE = process.argv[2] ?? "http://localhost:3000/";
const VUES = JSON.parse(process.argv[3] ?? "[]");
const DOSSIER = process.argv[4] ?? ".";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function connecter() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch { await dormir(500); }
  }
  throw new Error("Chromium n'a pas ouvert son port de débogage.");
}

function client(url) {
  const ws = new WebSocket(url);
  let n = 0;
  const attente = new Map();
  const pret = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && attente.has(m.id)) {
      const { res, rej } = attente.get(m.id);
      attente.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    }
  };
  return {
    pret,
    envoyer: (method, params = {}, sessionId) =>
      new Promise((res, rej) => {
        const id = ++n;
        attente.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      }),
    fermer: () => ws.close(),
  };
}

const { writeFileSync } = await import("node:fs");
const c = client(await connecter());
await c.pret;

const { targetId } = await c.envoyer("Target.createTarget", { url: "about:blank" });
const { sessionId } = await c.envoyer("Target.attachToTarget", { targetId, flatten: true });
const cmd = (m, p) => c.envoyer(m, p, sessionId);

await cmd("Page.enable");
await cmd("Runtime.enable");
await cmd("Emulation.setDeviceMetricsOverride", {
  width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false,
});

await cmd("Page.navigate", { url: CIBLE });
await dormir(5000);

for (const { nom, page, avant, attente = 3000 } of VUES) {
  if (page) {
    await cmd("Runtime.evaluate", { expression: `window.navigateMaquette(${JSON.stringify(page)})` });
    await dormir(1500);
  }
  if (avant) {
    const r = await cmd("Runtime.evaluate", { expression: avant, awaitPromise: true });
    if (r.exceptionDetails) console.error(`  ⚠️ ${nom} : ${r.exceptionDetails.text}`);
  }
  await dormir(attente);
  const { data } = await cmd("Page.captureScreenshot", { format: "png" });
  const chemin = `${DOSSIER}/${nom}.png`;
  writeFileSync(chemin, Buffer.from(data, "base64"));
  console.log(`  ✅ ${nom}.png`);
}

c.fermer();
process.exit(0);
