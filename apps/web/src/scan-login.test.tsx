// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  startTestApiServer,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';

/**
 * 扫码登录面板的运行验证：真实 App、真实本地 HTTP 服务器、真实定时器。
 * 覆盖领取失败后的重试、过期终态与重新发起。
 */

const session = {
  accessToken: 'scan-token-1',
  tokenType: 'Bearer',
  expiresAt: '2099-10-14T12:00:00.000Z',
  user: { id: 'user-1', username: '球员甲', displayName: '球员甲', admin: false },
};

let server: TestApiServer;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  window.location.hash = '';
  server = await startTestApiServer();
  vi.stubEnv('VITE_API_BASE_URL', server.baseUrl);
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
  return user;
}

describe('scan login panel', () => {
  it('领取失败后保持轮询并在下一次领取成功', async () => {
    let claimAttempts = 0;
    server.respond('POST', '/api/v1/auth/web-login-tickets', async () => ({
      status: 201,
      body: { ticket: 'ticket-1', expiresAt: '2099-10-14T12:05:00.000Z' },
    }));
    server.respond('GET', '/api/v1/auth/web-login-tickets/ticket-1', async () => ({
      status: 200,
      body: { status: 'approved', expiresAt: '2099-10-14T12:05:00.000Z' },
    }));
    server.respond('POST', '/api/v1/auth/web-login-tickets/ticket-1/claim', async () => {
      claimAttempts += 1;
      if (claimAttempts === 1) return { status: 500, body: { message: 'upstream error' } };
      return { status: 200, body: session };
    });
    // 认证成功后的账号数据读取
    server.respond('GET', '/api/v1/players', async () => ({ status: 200, body: [] }));
    server.respond('GET', '/api/v1/lineups', async () => ({ status: 200, body: [] }));
    server.respond('GET', '/api/v1/simulations?limit=30&offset=0', async () => ({
      status: 200,
      body: [],
    }));

    await openScanPanel();

    // 轮询间隔 2 秒：第一次领取失败后保持等待，下一次轮询重试并登录成功。
    await screen.findByRole(
      'heading',
      { name: /巅峰球员库|Peak player archive/i },
      { timeout: 20000 },
    );
    expect(claimAttempts).toBeGreaterThanOrEqual(2);
  }, 30000);

  it('票据过期后显示明确结束状态，并可重新发起新的登录请求', async () => {
    let created = 0;
    server.respond('POST', '/api/v1/auth/web-login-tickets', async () => {
      created += 1;
      return {
        status: 201,
        body: { ticket: `ticket-${created}`, expiresAt: '2099-10-14T12:05:00.000Z' },
      };
    });
    server.respond('GET', '/api/v1/auth/web-login-tickets/ticket-1', async () => ({
      status: 200,
      body: { status: 'expired', expiresAt: '2026-10-14T12:05:00.000Z' },
    }));
    server.respond('GET', '/api/v1/auth/web-login-tickets/ticket-2', async () => ({
      status: 200,
      body: { status: 'pending', expiresAt: '2099-10-14T12:05:00.000Z' },
    }));

    await openScanPanel();

    await screen.findByText(/二维码已过期|The QR code expired/i, undefined, { timeout: 20000 });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /重新获取二维码|Request a new QR code/i }));
    await screen.findByText(/等待小程序确认|Waiting for confirmation/i, undefined, {
      timeout: 20000,
    });
    expect(created).toBe(2);
  }, 30000);
});
