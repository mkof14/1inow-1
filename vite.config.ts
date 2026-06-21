import path from "node:path";
import { fileURLToPath } from "node:url";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        const source = warning.exporter ?? warning.id ?? "";
        if (
          warning.code === "UNUSED_EXTERNAL_IMPORT" &&
          (source.includes("@tanstack/") ||
            warning.message.includes('external module "@tanstack/router-core'))
        ) {
          return;
        }
        defaultHandler(warning);
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("/react/") || id.includes("/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("/@tanstack/")) {
            return "vendor-tanstack";
          }
          if (id.includes("/@supabase/")) {
            return "vendor-supabase";
          }
          if (id.includes("/recharts/") || id.includes("/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("/html2canvas/")) {
            return "vendor-html2canvas";
          }
          if (id.includes("/jspdf/") || id.includes("/jspdf-autotable/")) {
            return "vendor-jspdf";
          }
          if (id.includes("/@ai-sdk/") || id.includes("/ai/")) {
            return "vendor-ai";
          }
          if (id.includes("/@radix-ui/") || id.includes("/lucide-react/")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
