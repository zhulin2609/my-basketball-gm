import Taro from '@tarojs/taro';
import type { HttpPort } from '@dream-court/client';

export const miniHttp: HttpPort = {
  async send(request) {
    const response = await Taro.request<string>({
      url: request.url,
      method: request.method,
      header: request.headers,
      data: request.body,
      dataType: 'text',
      responseType: 'text',
      timeout: 15000,
    });
    if (typeof response.data !== 'string') throw new Error('API 响应必须是文本');
    return { status: response.statusCode, bodyText: response.data };
  },
};
