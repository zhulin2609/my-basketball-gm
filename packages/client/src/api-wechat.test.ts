// @vitest-environment jsdom
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ApiClient } from './api';
import {
  startTestApiServer,
  testApi,
  testName,
  testPassword,
  register,
  type TestApiServer,
} from './testing/local-api-server';

let server: TestApiServer;
let api: ApiClient;
beforeEach(async () => {
  localStorage.clear();
  server = await startTestApiServer();
  api = testApi(server.baseUrl, localStorage);
});
afterEach(async () => {
  await server.close();
});
async function credential() {
  const result = await api.wechatExchange(randomUUID());
  if (!result.credentialToken) throw new Error('未获得身份凭证');
  return result.credentialToken;
}
describe('wechat auth api → Spring Boot + PostgreSQL', () => {
  it('交换微信 code 并返回未绑定凭证', async () => {
    const code = randomUUID();
    const result = await api.wechatExchange(code);
    expect(result.status).toBe('confirmation_required');
    expect(result.credentialToken).toBeTruthy();
    expect(server.requests[0]?.body).toEqual({ code });
  });
  it('绑定已有账号并注册新账号', async () => {
    const existing = await register(api);
    const bound = await api.wechatBind(await credential(), existing.user.username!, testPassword);
    expect(bound.user.id).toBe(existing.user.id);
    const registered = await api.wechatRegister(await credential(), testName());
    expect(registered.newAccount).toBe(true);
    expect(registered.session.user.id).not.toBe(existing.user.id);
  });
  it('读取当前账号绑定状态并携带会话', async () => {
    const result = await api.wechatRegister(await credential(), testName());
    api.saveSession(result.session);
    expect(await api.listIdentities()).toMatchObject([
      { provider: 'wechat', appid: 'integration-app' },
    ]);
    expect(server.requests.at(-1)?.headers.authorization).toBe(
      `Bearer ${result.session.accessToken}`,
    );
  });
});
describe('web login ticket api → Spring Boot + PostgreSQL', () => {
  it('创建票据、查询状态并领取会话', async () => {
    const session = await register(api);
    const binding = randomUUID();
    const ticket = await api.createWebLoginTicket(binding);
    await api.confirmWebLoginTicket(ticket.ticket);
    expect((await api.webLoginTicketStatus(ticket.ticket, binding)).status).toBe('approved');
    const request = server.requests.at(-1)!;
    expect(request.headers['x-login-ticket-binding']).toBe(binding);
    expect(request.path).not.toContain(binding);
    const claimed = await api.claimWebLoginTicket(ticket.ticket, binding);
    expect(claimed.user.id).toBe(session.user.id);
    expect(server.requests.at(-1)?.body).toEqual({ browserBinding: binding });
  });
  it('确认与拒绝请求不返回内容', async () => {
    await register(api);
    const binding = randomUUID();
    const approved = await api.createWebLoginTicket(binding);
    const rejected = await api.createWebLoginTicket(binding);
    await expect(api.confirmWebLoginTicket(approved.ticket)).resolves.toBeUndefined();
    await expect(api.rejectWebLoginTicket(rejected.ticket)).resolves.toBeUndefined();
    expect(server.requests.slice(-2).map((r) => r.status)).toEqual([204, 204]);
  });
  it('服务端限流透传状态码与结构化 code', async () => {
    const binding = randomUUID();
    await api.createWebLoginTicket(binding);
    await api.createWebLoginTicket(binding);
    await expect(api.createWebLoginTicket(binding)).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
    });
  });
});
