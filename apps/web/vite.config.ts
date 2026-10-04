import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Web 端 Vite 配置。`@` 指向 Web 源码；`@catalog` 读取后端资源目录中的
 * 球员中文名称 JSON（构建时打包进制品，运行时不访问后端目录）。
 * 共享包通过 npm workspaces 的 package exports 解析。
 */
export default defineConfig({
  // 以 `vite apps/web` 方式启动时项目根目录变为 apps/web；
  // 环境文件仍需从仓库根目录读取（.env.local 提供 VITE_API_BASE_URL）。
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@catalog': fileURLToPath(new URL('../../backend/src/main/resources', import.meta.url)),
    },
  },
});
