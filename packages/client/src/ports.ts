/**
 * 应用注入的平台能力接口。client 不直接访问 localStorage、fetch、随机数或时钟，
 * 各客户端（Web、小程序）提供自己的实现，业务流程保持一致。
 */

/** 同步键值存储；Web 使用 localStorage，小程序使用 Taro 存储能力。 */
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** 原始 HTTP 传输；Web 用 fetch 实现，小程序用 Taro.request 实现。 */
export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface HttpResponse {
  status: number;
  bodyText: string;
}

export interface HttpPort {
  send(request: HttpRequest): Promise<HttpResponse>;
}

/** RFC 4122 标识符生成器；由应用提供平台安全的实现。 */
export type IdGenerator = () => string;

/** 当前时间；由应用提供，保证 core 与 client 可测试且无隐式时钟。 */
export type Clock = () => Date;

/** 比赛种子生成；Web 沿用与原实现一致的均匀分布公式。 */
export type RandomSeed = () => number;
