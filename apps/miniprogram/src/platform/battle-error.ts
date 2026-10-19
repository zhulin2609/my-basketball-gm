import Taro from '@tarojs/taro';
import { battleErrorMessage } from '@/constants/text';

export async function getBattleErrorMessage(): Promise<string> {
  const networkType = await Taro.getNetworkType().then(
    (network) => network.networkType,
    () => undefined,
  );
  return battleErrorMessage(networkType);
}
