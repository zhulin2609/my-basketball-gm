// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  startTestApiServer,
  testApi,
  register,
  sql,
  testName,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';
let server: TestApiServer;
beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  window.location.hash = '';
  server = await startTestApiServer();
  vi.stubEnv('VITE_API_BASE_URL', server.baseUrl);
  vi.stubEnv('VITE_WEB_AUTH_ENABLED', 'true');
});
afterEach(async () => {
  cleanup();
  vi.unstubAllEnvs();
  await server.close();
});
async function openScanPanel() {
  const user = userEvent.setup();
  const { App } = await import('@/App');
  render(<App />);
  await user.click(screen.getByRole('button', { name: /登录|Sign in/i }));
  await user.click(
    screen.getByRole('button', { name: /小程序扫码登录|Sign in with the mini program/i }),
  );
}
function createdTicket() {
  const result = server.requests.find(
    (r) => r.method === 'POST' && r.path === '/api/v1/auth/web-login-tickets',
  )?.response as { ticket?: string } | undefined;
  if (!result?.ticket) throw new Error('未取得真实票据');
  return result.ticket;
}
describe('scan login panel → Spring Boot + PostgreSQL', () => {
  it('真实数据库领取失败后保持轮询，下次领取成功', async () => {
    const gate = server.pauseResponse('POST', '/api/v1/auth/web-login-tickets');
    await openScanPanel();
    await gate.arrived;
    const ticket = createdTicket();
    const digest = createHash('sha256').update(ticket).digest('hex');
    const suffix = testName();
    // sequence 的增长不随失败事务撤销，因此仅第一次消费发生真实数据库异常。
    sql(
      `CREATE SEQUENCE ${suffix}; CREATE FUNCTION ${suffix}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.ticket_digest = '${digest}' AND NEW.status = 'consumed' AND nextval('${suffix}') = 1 THEN RAISE EXCEPTION 'integration claim failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER ${suffix} BEFORE UPDATE ON web_login_tickets FOR EACH ROW EXECUTE FUNCTION ${suffix}();`,
    );
    try {
      const accountStorage = new Map<string, string>();
      const api = testApi(server.baseUrl, {
        getItem: (k) => accountStorage.get(k) ?? null,
        setItem: (k, v) => {
          accountStorage.set(k, v);
        },
        removeItem: (k) => {
          accountStorage.delete(k);
        },
      });
      await register(api);
      await api.confirmWebLoginTicket(ticket);
      gate.release();
      await vi.waitFor(
        () => {
          const claims = server.requests.filter((r) => r.path.endsWith('/claim'));
          expect(claims.map((r) => r.status)).toEqual([500, 200]);
        },
        { timeout: 20000 },
      );
      await screen.findByRole('heading', { name: /巅峰球员库|Peak player archive/i });
      expect(JSON.parse(localStorage.getItem('dream-court.auth-session.v1')!).user.id).toBe(
        api.readSession()?.user.id,
      );
    } finally {
      gate.release();
      sql(
        `DROP TRIGGER ${suffix} ON web_login_tickets; DROP FUNCTION ${suffix}(); DROP SEQUENCE ${suffix};`,
      );
    }
  });
  it('真实票据过期后显示结束状态，并可重新获取', async () => {
    const gate = server.pauseResponse('POST', '/api/v1/auth/web-login-tickets');
    await openScanPanel();
    await gate.arrived;
    const digest = createHash('sha256').update(createdTicket()).digest('hex');
    sql(
      `UPDATE web_login_tickets SET expires_at = now() - interval '1 second' WHERE ticket_digest = '${digest}'`,
    );
    gate.release();
    await screen.findByText(/二维码已过期|The QR code expired/i, undefined, { timeout: 20000 });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /重新获取二维码|Request a new QR code/i }));
    await screen.findByText(/等待小程序确认|Waiting for confirmation/i, undefined, {
      timeout: 20000,
    });
    expect(
      server.requests.filter(
        (r) => r.method === 'POST' && r.path === '/api/v1/auth/web-login-tickets',
      ),
    ).toHaveLength(2);
  });
});
