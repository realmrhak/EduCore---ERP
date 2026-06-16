import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: "/",
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      "Cache-Control": "no-store",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "esbuild",
    sourcemap: mode !== "production", // Enable sourcemaps in development only
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunk
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "vendor-ui": ["lucide-react", "framer-motion", "recharts"],
          // Form & utility libraries
          "vendor-utils": [
            "axios",
            "date-fns",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
  },
}));
