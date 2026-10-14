// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApiClient, createFetchHttpPort, type ApiClient } from './index';
import { startTestApiServer, type TestApiServer } from './testing/local-api-server';

const browserStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

let server: TestApiServer;
let api: ApiClient;

const session = {
  accessToken: 'token-1',
  tokenType: 'Bearer',
  expiresAt: '2026-10-14T12:00:00.000Z',
  user: { id: 'user-1', username: '球员甲', displayName: '球员甲', admin: false },
} as const;

beforeEach(async () => {
  localStorage.clear();
  server = await startTestApiServer();
  api = createApiClient({
    baseUrl: server.baseUrl,
    http: createFetchHttpPort(),
    storage: browserStorage,
    clock: () => new Date('2026-10-13T12:00:00.000Z'),
  });
});

afterEach(async () => {
  await server.close();
});

describe('wechat auth api', () => {
  it('交换微信 code 并返回未绑定凭证', async () => {
    server.respond('POST', '/api/v1/auth/wechat/exchange', async (request) => {
      expect(request.body).toEqual({ code: 'code-1' });
      return {
        status: 200,
        body: {
          status: 'confirmation_required',
          session: null,
          credentialToken: 'credential-1',
          credentialExpiresAt: '2026-10-13T12:10:00.000Z',
        },
      };
    });

    const result = await api.wechatExchange('code-1');
    expect(result.status).toBe('confirmation_required');
    expect(result.credentialToken).toBe('credential-1');
  });

  it('绑定已有账号并注册新账号', async () => {
    server.respond('POST', '/api/v1/auth/wechat/bind', async (request) => {
      expect(request.body).toEqual({
        credentialToken: 'credential-1',
        username: '球员甲',
        password: 'password-2026',
      });
      return { status: 200, body: session };
    });
    server.respond('POST', '/api/v1/auth/wechat/register', async (request) => {
      expect(request.body).toEqual({ credentialToken: 'credential-2', username: '球员乙' });
      return { status: 201, body: { session, newAccount: true } };
    });

    const bound = await api.wechatBind('credential-1', '球员甲', 'password-2026');
    expect(bound.accessToken).toBe('token-1');
    const registered = await api.wechatRegister('credential-2', '球员乙');
    expect(registered.newAccount).toBe(true);
  });

  it('读取当前账号的绑定状态并携带会话', async () => {
    api.saveSession(session);
    server.respond('GET', '/api/v1/auth/identities', async (request) => {
      return {
        status: 200,
        body: [{ provider: 'wechat', appid: 'appid-1', createdAt: '2026-10-13T12:00:00.000Z' }],
      };
    });

    const identities = await api.listIdentities();
    expect(identities).toHaveLength(1);
    expect(identities[0]?.provider).toBe('wechat');
    expect(server.requests[0]?.path).toBe('/api/v1/auth/identities');
  });
});

describe('web login ticket api', () => {
  it('创建票据、查询状态并领取会话', async () => {
    server.respond('POST', '/api/v1/auth/web-login-tickets', async (request) => {
      expect(request.body).toEqual({ browserBinding: 'binding-1' });
      return { status: 201, body: { ticket: 'ticket-1', expiresAt: '2026-10-13T12:05:00.000Z' } };
    });
    server.respond('GET', '/api/v1/auth/web-login-tickets/ticket-1', async (request) => {
      // 浏览器绑定值必须经请求头传递，不进入 URL。
      expect(request.headers['x-login-ticket-binding']).toBe('binding-1');
      expect(request.path).not.toContain('binding');
      return {
        status: 200,
        body: { status: 'approved', expiresAt: '2026-10-13T12:05:00.000Z' },
      };
    });
    server.respond('POST', '/api/v1/auth/web-login-tickets/ticket-1/claim', async (request) => {
      expect(request.body).toEqual({ browserBinding: 'binding-1' });
      return { status: 200, body: session };
    });

    const ticket = await api.createWebLoginTicket('binding-1');
    expect(ticket.ticket).toBe('ticket-1');
    const status = await api.webLoginTicketStatus('ticket-1', 'binding-1');
    expect(status.status).toBe('approved');
    const claimed = await api.claimWebLoginTicket('ticket-1', 'binding-1');
    expect(claimed.user.username).toBe('球员甲');
  });

  it('确认与拒绝请求不返回内容', async () => {
    api.saveSession(session);
    server.respond('POST', '/api/v1/auth/web-login-tickets/ticket-2/confirm', async () => ({
      status: 204,
    }));
    server.respond('POST', '/api/v1/auth/web-login-tickets/ticket-2/reject', async () => ({
      status: 204,
    }));

    await expect(api.confirmWebLoginTicket('ticket-2')).resolves.toBeUndefined();
    await expect(api.rejectWebLoginTicket('ticket-2')).resolves.toBeUndefined();
  });

  it('服务端错误透传状态码与结构化 code', async () => {
    server.respond('POST', '/api/v1/auth/web-login-tickets', async () => ({
      status: 429,
      body: { message: '操作太频繁，请稍后再试。', code: 'RATE_LIMITED' },
    }));

    await expect(api.createWebLoginTicket('binding-1')).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
    });
  });
});
