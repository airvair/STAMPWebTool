import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";   // <-- make sure this is installed

export default defineConfig(({ mode }) => ({
  // return value ⬆ is now an **object expression**, not a function body
  base: mode === "development" ? "/" : "/wp-react-app/",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
}));
