import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 4173
  },
  preview: {
    host: "0.0.0.0",
    port: 4173
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          routing: ["react-router-dom"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          data: ["axios", "@tanstack/react-query"],
          i18n: ["i18next", "react-i18next"],
          motion: ["framer-motion"],
          icons: ["lucide-react"],
          charts: ["recharts"],
          ui: ["clsx"]
        }
      }
    }
  }
});
