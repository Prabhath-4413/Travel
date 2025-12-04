import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react({ jsxImportSource: "react" })],
    server: {
      port: 5173,
      open: false,
      middlewareMode: false,
    },
    optimizeDeps: {
      exclude: ["html5-qrcode"],
      include: ["react", "react-dom"],
    },
    resolve: {
      alias: {},
    },
  };
});
