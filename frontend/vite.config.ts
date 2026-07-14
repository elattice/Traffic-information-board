import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Go's embed package can only embed files below the package directory.
    // Emit the production UI next to the webui package so the following
    // Go build can include it in the server binary.
    outDir: "../backend/internal/webui/dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
