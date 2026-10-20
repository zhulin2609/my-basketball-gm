import { createServer, request as forward } from 'node:http';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { inject } from 'vitest';
import { createApiClient } from '../api';
import { createFetchHttpPort } from '../fetch-http';
import type { StoragePort } from '../ports';

declare module 'vitest' {
  export interface ProvidedContext {
    integration: { baseUrl: string; database: string; container: string };
  }
}

export function sql(query: string): string {
  const { database, container } = inject('integration');
  if (!/^stage4_frontend_\d+$/.test(database)) throw new Error('拒绝访问非独立测试数据库');
  return execFileSync(
    'docker',
    [
      'exec',
      container,
      'psql',
      '-X',
      '-U',
      'zhulin',
      '-d',
      database,
      '-v',
      'ON_ERROR_STOP=1',
      '-Atc',
      query,
    ],
    { encoding: 'utf8' },
  ).trim();
}

export function testName(): string {
  return `t${randomUUID().replace(/-/g, '').slice(0, 25)}`;
}
export const testPassword = 'integration-password-2026';
export async function register(api: ReturnType<typeof createApiClient>) {
  const session = await api.register({ username: testName(), password: testPassword });
  api.saveSession(session);
  return session;
}
export function testApi(baseUrl: string, storage: StoragePort) {
  return createApiClient({
    baseUrl,
    storage,
    http: createFetchHttpPort(),
    clock: () => new Date(),
  });
}

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
  status?: number;
  response?: unknown;
}
interface Gate {
  method: string;
  path: string;
  arrived(): void;
  wait: Promise<void>;
  release(): void;
}
export interface TestApiServer {
  baseUrl: string;
  requests: RecordedRequest[];
  pauseResponse(method: string, path: string): { arrived: Promise<void>; release(): void };
  waitForRequestCount(count: number, timeoutMs?: number): Promise<void>;
  close(): Promise<void>;
}

/** 透明转发真实 Spring Boot 响应；只允许延迟传输，不能提供或替换项目 API 内容。 */
export async function startTestApiServer(): Promise<TestApiServer> {
  const upstream = new URL(inject('integration').baseUrl);
  const requests: RecordedRequest[] = [];
  const gates: Gate[] = [];
  const releases: Array<() => void> = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const raw = Buffer.concat(chunks);
      const record: RecordedRequest = {
        method: request.method!,
        path: request.url!,
        body: raw.length ? JSON.parse(raw.toString()) : null,
        headers: Object.fromEntries(
          Object.entries(request.headers).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : (value ?? ''),
          ]),
        ),
      };
      requests.push(record);
      const index = gates.findIndex((g) => g.method === record.method && g.path === record.path);
      const gate = index < 0 ? undefined : gates.splice(index, 1)[0];
      const outgoing = forward(
        new URL(request.url!, upstream.origin),
        { method: request.method, headers: { ...request.headers, host: upstream.host } },
        (incoming) => {
          const body: Buffer[] = [];
          incoming.on('data', (chunk: Buffer) => body.push(chunk));
          incoming.on('end', () => {
            const bytes = Buffer.concat(body);
            record.status = incoming.statusCode;
            if (bytes.length && incoming.headers['content-type']?.includes('json'))
              record.response = JSON.parse(bytes.toString());
            const send = () => {
              response.writeHead(incoming.statusCode!, incoming.headers);
              response.end(bytes);
            };
            if (gate) {
              gate.arrived();
              void gate.wait.then(send);
            } else send();
          });
          incoming.on('error', (error) => response.destroy(error));
        },
      );
      outgoing.on('error', (error) => response.destroy(error));
      outgoing.end(raw);
    });
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('代理端口分配失败');
  return {
    baseUrl: `http://127.0.0.1:${address.port}/api/v1`,
    requests,
    pauseResponse(method, path) {
      let arrive!: () => void;
      let release!: () => void;
      const arrived = new Promise<void>((done) => {
        arrive = done;
      });
      const wait = new Promise<void>((done) => {
        release = done;
      });
      gates.push({ method, path, arrived: arrive, wait, release });
      releases.push(release);
      return { arrived, release };
    },
    async waitForRequestCount(count, timeoutMs = 5000) {
      const end = Date.now() + timeoutMs;
      while (requests.length < count) {
        if (Date.now() > end) throw new Error(`等待 ${count} 个请求超时`);
        await new Promise((done) => setTimeout(done, 10));
      }
    },
    async close() {
      releases.forEach((release) => release());
      server.closeAllConnections();
      await new Promise<void>((done) => server.close(() => done()));
    },
  };
}

/** PostgreSQL 故障注入限定为一个测试账号；真实异常由 Spring Boot 映射。 */
export function failLineupWrites(owner: string): () => void {
  const suffix = testName();
  sql(
    `CREATE FUNCTION ${suffix}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.owner_id = '${owner}'::uuid THEN RAISE EXCEPTION 'integration disk failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER ${suffix} BEFORE INSERT OR UPDATE ON lineups FOR EACH ROW EXECUTE FUNCTION ${suffix}();`,
  );
  return () => {
    sql(`DROP TRIGGER ${suffix} ON lineups; DROP FUNCTION ${suffix}();`);
  };
}
