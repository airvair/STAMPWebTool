import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import tailwindcss from "@tailwindcss/vite";

// Get the root directory (parent of config directory)
const rootDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/STAMPWebTool/",

  plugins: [
    react(),
    tailwindcss(),
    checker({
      typescript: true,
      overlay: {
        initialIsOpen: false,
        position: "tr",
        badgeStyle: "transform: translate(0, 0); top: 10px; right: 10px; z-index: 9999;",
        panelStyle: "width: calc(100vw - 20px); height: calc(100vh - 20px); margin: 10px; background: rgba(0, 0, 0, 0.9); border-radius: 8px; padding: 20px; color: white; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px; line-height: 1.5; overflow: auto; white-space: pre-wrap;"
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@components": path.resolve(rootDir, "src/components"),
      "@features": path.resolve(rootDir, "src/features"),
      "@hooks": path.resolve(rootDir, "src/hooks"),
      "@context": path.resolve(rootDir, "src/context"),
      "@services": path.resolve(rootDir, "src/services"),
      "@utils": path.resolve(rootDir, "src/utils"),
      "@types": path.resolve(rootDir, "src/types"),
      "@layouts": path.resolve(rootDir, "src/layouts"),
      "@pages": path.resolve(rootDir, "src/pages"),
      "@styles": path.resolve(rootDir, "src/styles"),
    },
  },
}));