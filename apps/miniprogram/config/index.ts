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
    compile: { include: [path.resolve(__dirname, '../../../packages')] },
    postcss: { pxtransform: { enable: true }, cssModules: { enable: false } },
  },
});
