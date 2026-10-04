import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// 根级 vitest 配置：core 与 client 的测试跑 node 环境，Web 测试按文件内注释使用 jsdom。
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
      '@catalog': fileURLToPath(new URL('./backend/src/main/resources', import.meta.url)),
    },
  },
  test: {
    include: [
      'apps/web/src/**/*.test.{ts,tsx}',
      'packages/core/src/**/*.test.ts',
      'packages/client/src/**/*.test.ts',
    ],
  },
});
