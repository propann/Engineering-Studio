import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
          return code.replaceAll("__BUNDLED_DEV__", "false");
        }
        return undefined;
      },
    },
  ],
  // Port canonique : la fiche locale et les liens de retour du Hub y sont stockés.
  // strictPort évite de créer une nouvelle fiche sur un port de secours.
  server: { host: "127.0.0.1", port: 5179, strictPort: true },
});
