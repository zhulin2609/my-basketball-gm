import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { StoragePort } from '@dream-court/client';

export interface DiskStorage {
  storage: StoragePort;
  file: string;
}

// 数据真实写入仓库内已忽略的目录，文件路径用于验证读取失败与恢复。
export function createDiskStorage(): DiskStorage {
  const parent = path.resolve('.cache/miniprogram-tests');
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(path.join(parent, 'workspace-'));
  const file = path.join(directory, 'storage.json');
  const read = (): Record<string, string> =>
    existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>) : {};
  return {
    file,
    storage: {
      getItem: (key) => read()[key] ?? null,
      setItem: (key, value) => writeFileSync(file, JSON.stringify({ ...read(), [key]: value })),
      removeItem(key) {
        const data = read();
        delete data[key];
        writeFileSync(file, JSON.stringify(data));
      },
    },
  };
}
