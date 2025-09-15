import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 3002, // frontend dev port
    proxy: {
      "/api": "http://localhost:3001", // local backend
      "/render-api": "https://crm-cobbler.onrender.com", // deployed Render backend
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
