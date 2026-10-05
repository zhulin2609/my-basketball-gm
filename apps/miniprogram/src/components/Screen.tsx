import { Button, Text, View } from '@tarojs/components';
import type { ReactNode } from 'react';
import { initializeRuntime, useGuestRuntime } from '@/services/runtime';
import { errorMessage } from '@/constants/text';
import type { GuestSnapshot, GuestStore } from '@/services/guest-store';

interface ScreenProps {
  title: string;
  children: (store: GuestStore, data: GuestSnapshot) => ReactNode;
}

export function Screen({ title, children }: ScreenProps) {
  const runtime = useGuestRuntime();
  return (
    <View className="screen">
      <Text className="eyebrow">MY BASKETBALL GM</Text>
      <View className="title">{title}</View>
      {runtime.status === 'loading' && <View className="notice">正在读取游客工作区…</View>}
      {runtime.status === 'failed' && (
        <View>
          <View className="error">{errorMessage(runtime.error)}</View>
          <Button
            className="primary"
            onClick={() => {
              void initializeRuntime().catch((error: unknown) => console.error(error));
            }}
          >
            重新读取游客工作区
          </Button>
        </View>
      )}
      {runtime.status === 'ready' && children(runtime.store, runtime.data)}
    </View>
  );
}
