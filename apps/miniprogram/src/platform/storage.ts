import Taro from '@tarojs/taro';
import type { StoragePort } from '@dream-court/client';

export const miniStorage: StoragePort = {
  getItem(key) {
    if (!Taro.getStorageInfoSync().keys.includes(key)) return null;
    const value = Taro.getStorageSync<unknown>(key);
    if (typeof value !== 'string') throw new Error(`存储数据格式错误：${key}`);
    return value;
  },
  setItem: (key, value) => Taro.setStorageSync(key, value),
  removeItem: (key) => Taro.removeStorageSync(key),
};
