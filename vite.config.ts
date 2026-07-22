import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // 视图分包声明：所有页面放在 src/views 下，路由层通过
  //   import.meta.glob('../views/**/*.tsx')  （见 src/lib/menu.tsx）
  // 在编译期静态声明打包这些 tsx，使运行时能按后端返回的 component 值
  // （如 "system/tenant-user/index"）动态 import(`@/views/${component}`) 懒加载。
  // 新增页面只需放到 src/views/<component>.tsx 即可被自动打包，无需在此登记。
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
