declare const MINI_API_BASE_URL: string;

export function validateApiBaseUrl(apiBaseUrl: string): void {
  if (apiBaseUrl && !/^https?:\/\//.test(apiBaseUrl)) {
    throw new Error('MINI_API_BASE_URL 必须是完整的 HTTP 或 HTTPS API 地址');
  }
}

export function getApiBaseUrl(): string {
  validateApiBaseUrl(MINI_API_BASE_URL);
  return MINI_API_BASE_URL;
}
