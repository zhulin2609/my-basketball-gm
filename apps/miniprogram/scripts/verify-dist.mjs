// 小程序生产构建的产物校验：MINI_API_BASE_URL 必须提供且实际写入构建产物。
// 防止缺地址的包静默产出，直到真机运行时才报错。
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const apiBaseUrl = process.env.MINI_API_BASE_URL ?? '';

if (!apiBaseUrl) {
  console.error(
    '生产构建必须提供 MINI_API_BASE_URL，例如：\n' +
      '  MINI_API_BASE_URL=http://<局域网或正式地址>/api/v1 npm run build:weapp',
  );
  process.exit(1);
}

const distDir = path.join(root, 'dist');
const candidates = [];
for (const entry of readdirSync(distDir, { withFileTypes: true, recursive: true })) {
  if (entry.isFile() && entry.name.endsWith('.js')) {
    candidates.push(path.join(entry.parentPath ?? entry.path, entry.name));
  }
}

const found = candidates.some((file) => readFileSync(file, 'utf8').includes(apiBaseUrl));
if (!found) {
  console.error(
    `构建产物中没有找到 MINI_API_BASE_URL（${apiBaseUrl}）。` +
      '请检查 apps/miniprogram/config/index.ts 的 defineConstants 注入是否仍然生效。',
  );
  process.exit(1);
}
console.log(`dist 已包含 API 地址：${apiBaseUrl}`);
