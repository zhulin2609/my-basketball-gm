import Taro from '@tarojs/taro';
import { errorMessage } from '@/constants/text';

export function navigate(url: string): void {
  void Taro.navigateTo({ url })
    .catch((error: unknown) =>
      Taro.showModal({ title: '无法打开页面', content: errorMessage(error), showCancel: false }),
    )
    .catch((error: unknown) => {
      console.error(error);
    });
}
