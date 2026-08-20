import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "studio-hub-vite-client-bundled-dev-compat",
      enforce: "post",
      transform(code, id) {
        // Vite 8.2.1 leaves this internal client macro unresolved in the
        // browser, which stops React before the Hub can render. Keep the
        // workaround scoped to the dev client; production builds are
        // unaffected and can remove it when Vite replaces the macro itself.
        if (id.includes("/vite/dist/client/client.mjs")) {
          return code.replace(/__BUNDLED_DEV__/g, "false");
        }
        return undefined;
      },
    },
  ],
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(import.meta.dirname, "../../packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(import.meta.dirname, "../../packages/audio-bridge/index.ts"),
    },
  },
  // Port: développement sur 3000
  server: { host: "0.0.0.0", port: 3000, strictPort: false },
});
