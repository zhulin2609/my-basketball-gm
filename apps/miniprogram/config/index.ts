import path from 'node:path';
import { defineConfig } from '@tarojs/cli';

export default defineConfig<'webpack5'>({
  projectName: 'my-basketball-gm',
  date: '2026-10-04',
  designWidth: 750,
  deviceRatio: { 750: 1 },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: { type: 'webpack5', prebundle: { enable: false } },
  plugins: ['@tarojs/plugin-platform-weapp'],
  alias: {
    '@': path.resolve(__dirname, '../src'),
    '@catalog': path.resolve(__dirname, '../../../backend/src/main/resources'),
    react: path.resolve(__dirname, '../node_modules/react'),
  },
  defineConstants: {
    MINI_API_BASE_URL: JSON.stringify(process.env.MINI_API_BASE_URL ?? ''),
  },
  mini: {
    // uuid 的 npm 产物含 ES2020 语法（??、?.），必须经 babel 转译为 ES5：
    // 微信真机调试检测到 ES6+ 语法会强制要求开启 ES6 转 ES5，而二次转译会破坏 Taro 运行时。
    // uuid 由 npm 提升安装在仓库根目录的 node_modules。
    compile: {
      include: [
        path.resolve(__dirname, '../../../packages'),
        path.resolve(__dirname, '../../../node_modules/uuid'),
      ],
    },
    postcss: { pxtransform: { enable: true }, cssModules: { enable: false } },
  },
});
