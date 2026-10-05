import Taro from '@tarojs/taro';
import { v4 } from 'uuid';

const identifiers: string[] = [];
let preparing: Promise<void> | undefined;

export function prepareIdentifiers(): Promise<void> {
  if (identifiers.length >= 4) return Promise.resolve();
  if (preparing) return preparing;
  const request = Taro.getRandomValues({ length: 64 }).then(({ randomValues }) => {
    const bytes = new Uint8Array(randomValues);
    if (bytes.length !== 64) throw new Error('平台随机数据长度错误');
    for (let offset = 0; offset < bytes.length; offset += 16) {
      identifiers.push(v4({ random: bytes.slice(offset, offset + 16) }));
    }
  });
  preparing = request;
  const cleanup = () => {
    preparing = undefined;
  };
  void request.then(cleanup, cleanup);
  return request;
}

export function createIdentifier(): string {
  const identifier = identifiers.shift();
  if (!identifier) throw new Error('创建数据前必须准备平台随机标识符');
  return identifier;
}
