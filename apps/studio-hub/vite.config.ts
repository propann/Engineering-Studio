import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Port canonique : la fiche locale et les liens de retour du Hub y sont stockés.
  // strictPort évite de créer une nouvelle fiche sur un port de secours.
  server: { host: "127.0.0.1", port: 5179, strictPort: true },
});
