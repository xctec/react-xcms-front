import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // 开发期将 /api 转发到真实后端，避免浏览器跨域
      "/api": {
        target: "http://localhost:12000",
        changeOrigin: true,
      },
    },
  },
});
