import { Button, NavigationBar, PageMeta, Text, View } from '@tarojs/components';
import type { ReactNode } from 'react';
import { initializeRuntime, useGuestRuntime } from '@/services/runtime';
import { errorMessage } from '@/constants/text';
import type { DataSnapshot, DataStore } from '@/services/data-store';

interface PageShellProps {
  title: string;
  children: ReactNode;
}

/** 页面外壳：导航、品牌与标题；不依赖数据源状态，认证页等在加载期间也保持挂载。 */
export function PageShell({ title, children }: PageShellProps) {
  return (
    <>
      <PageMeta rootBackgroundColor="#102b23">
        <NavigationBar title="My Basketball GM" frontColor="#ffffff" backgroundColor="#102b23" />
      </PageMeta>
      <View className="screen">
        <Text className="eyebrow">MY BASKETBALL GM</Text>
        <View className="title">{title}</View>
        {children}
      </View>
    </>
  );
}

interface ScreenProps {
  title: string;
  children: (store: DataStore, data: DataSnapshot) => ReactNode;
}

export function Screen({ title, children }: ScreenProps) {
  const runtime = useGuestRuntime();
  return (
    <PageShell title={title}>
      {runtime.status === 'loading' && <View className="notice">正在读取数据…</View>}
      {runtime.status === 'failed' && (
        <View>
          <View className="error">{errorMessage(runtime.error)}</View>
          <Button
            className="primary"
            onClick={() => {
              void initializeRuntime().catch((error: unknown) => console.error(error));
            }}
          >
            重新读取数据
          </Button>
        </View>
      )}
      {runtime.status === 'ready' && children(runtime.store, runtime.data)}
    </PageShell>
  );
}
