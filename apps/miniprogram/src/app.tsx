import { useLaunch, useDidShow } from '@tarojs/taro';
import type { PropsWithChildren } from 'react';
import { initializeRuntime, refreshRuntime } from '@/services/runtime';
import './app.css';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 初始化错误由各页面的运行状态展示，Promise 同时保持失败状态。
    void initializeRuntime().catch((error: unknown) => console.error(error));
  });
  useDidShow(() => refreshRuntime());
  return children;
}

export default App;
