/**
 * 非 2xx 响应的结构化错误。code 由后端按错误类别下发（例如 CONTENT_REJECTED），
 * 客户端据此映射到本地文案；没有 code 时保持展示后端 message 的既有行为。
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
