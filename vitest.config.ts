import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(__dirname, "packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(__dirname, "packages/audio-bridge/index.ts"),
      "@studio-hub/fs-handles": path.resolve(__dirname, "packages/fs-handles/index.ts"),
      "@studio-hub/audio-formats": path.resolve(__dirname, "packages/audio-formats/index.ts"),
      "@studio-hub/midi-dispatch": path.resolve(__dirname, "packages/midi-dispatch/index.ts"),
      "@studio-hub/musique": path.resolve(__dirname, "packages/musique/index.ts"),
      "@studio-hub/core": path.resolve(__dirname, "apps/studio-hub/src/core"),
    },
  },
  test: {
    // studio-hub et les paquets partages. apps/ep133-studio et apps/op1-studio
    // ont leurs propres configurations vitest et leurs propres suites, qu'il ne
    // faut pas embarquer ici.
    //
    // `packages/` compte : ces modules servent les trois applications, et
    // l'analyse de format binaire qu'ils portent n'echoue pas bruyamment quand
    // elle se trompe — elle rend du bruit.
    include: [
      "apps/studio-hub/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
    ],
    environment: "node",
    coverage: { provider: "v8", reporter: ["text", "json"] },
  },
});
