import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Tauri 期望固定的端口与严格的 CSP 设置
export default defineConfig({
  plugins: [vue()],
  // Tauri 在开发模式下通过内置的 IP 访问
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5174,
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  // 为 Tauri 生产构建关闭源码映射以减小体积
  build: {
    target: "es2021",
    minify: "esbuild",
  },
});
