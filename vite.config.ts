import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // 👇 change this to the folder you chose in the Deployments panel
  //     KEEP the leading and trailing slashes.
  base: mode === "development" ? "/" : "/wp-react-app/",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
}));
