import type { HttpPort, HttpRequest, HttpResponse } from './ports';

/**
 * 基于 fetch 的 HttpPort 参考实现，适用于浏览器与 Node 18+ 环境。
 * 其他平台（如小程序）提供自己的 HttpPort 实现，协议逻辑不受影响。
 */
export function createFetchHttpPort(): HttpPort {
  return {
    async send(request: HttpRequest): Promise<HttpResponse> {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        ...(request.body === undefined ? {} : { body: request.body }),
      });
      return { status: response.status, bodyText: await response.text() };
    },
  };
}
