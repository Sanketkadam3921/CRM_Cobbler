import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 3002, // frontend dev port
    proxy: {
      "/api": {
        target: "http://localhost:3001", // backend
        changeOrigin: true,
        secure: false,
      },
      "/render-api": {
        target: "https://crm-cobbler.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
