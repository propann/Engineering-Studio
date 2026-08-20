import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(__dirname, "packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(__dirname, "packages/audio-bridge/index.ts"),
      "@studio-hub/core": path.resolve(__dirname, "apps/studio-hub/src/core"),
    },
  },
  test: {
    // Uniquement studio-hub : apps/ep133-studio a sa propre configuration
    // vitest et ses propres suites, qu'il ne faut pas embarquer ici.
    include: ["apps/studio-hub/**/*.{test,spec}.{ts,tsx}"],
    environment: "node",
    coverage: { provider: "v8", reporter: ["text", "json"] },
  },
});
