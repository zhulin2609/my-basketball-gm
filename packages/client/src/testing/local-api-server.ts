import { createServer, type Server, type ServerResponse, type IncomingMessage } from 'node:http';

/**
 * 测试专用的真实本地 HTTP 服务器：client 测试通过真实 fetch 走完整协议栈，
 * 服务器行为（延迟、状态码、响应体）是真实的 HTTP 语义，不使用 mock 传输。
 */

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
}

export interface HandlerResult {
  status: number;
  body?: unknown;
}

export type RequestHandler = (request: RecordedRequest) => Promise<HandlerResult>;

export interface TestApiServer {
  baseUrl: string;
  requests: RecordedRequest[];
  /** 注册某个方法加路径的处理器；未注册的请求返回 404。 */
  respond(method: string, path: string, handler: RequestHandler): void;
  /** 等待服务器累计收到 count 个请求，用于断言请求何时真正发出。 */
  waitForRequestCount(count: number, timeoutMs?: number): Promise<void>;
  close(): Promise<void>;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    request.on('data', (chunk: Buffer) => {
      data += chunk.toString('utf8');
    });
    request.on('end', () => resolve(data));
    request.on('error', reject);
  });
}

function writeResponse(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.end(body === undefined ? '' : JSON.stringify(body));
}

export function startTestApiServer(): Promise<TestApiServer> {
  const requests: RecordedRequest[] = [];
  const handlers = new Map<string, RequestHandler>();
  let waiters: Array<{ count: number; resolve: () => void }> = [];

  const server: Server = createServer((request, response) => {
    void (async () => {
      const rawBody = await readBody(request);
      const record: RecordedRequest = {
        method: request.method ?? 'GET',
        path: request.url ?? '/',
        body: rawBody ? (JSON.parse(rawBody) as unknown) : null,
      };
      requests.push(record);
      waiters = waiters.filter((waiter) => {
        if (requests.length >= waiter.count) {
          waiter.resolve();
          return false;
        }
        return true;
      });
      const handler = handlers.get(`${record.method} ${record.path}`);
      if (!handler) {
        writeResponse(response, 404, { message: `unexpected ${record.method} ${record.path}` });
        return;
      }
      const result = await handler(record);
      writeResponse(response, result.status, result.body);
    })().catch((error: unknown) => {
      writeResponse(response, 500, {
        message: error instanceof Error ? error.message : 'handler failure',
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('test api server failed to bind a tcp port'));
        return;
      }
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}/api/v1`,
        requests,
        respond(method, path, handler) {
          handlers.set(`${method} ${path}`, handler);
        },
        waitForRequestCount(count, timeoutMs = 2000) {
          if (requests.length >= count) return Promise.resolve();
          return new Promise((resolveWait, rejectWait) => {
            const timer = setTimeout(
              () => rejectWait(new Error(`timed out waiting for ${count} requests`)),
              timeoutMs,
            );
            waiters.push({
              count,
              resolve: () => {
                clearTimeout(timer);
                resolveWait();
              },
            });
          });
        },
        close() {
          return new Promise((resolveClose) => {
            server.close(() => resolveClose());
          });
        },
      });
    });
  });
}
