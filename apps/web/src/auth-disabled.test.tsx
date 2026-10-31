// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_WORKSPACE_KEY, SESSION_STORAGE_KEY } from '@dream-court/client';
import {
  register,
  sql,
  startTestApiServer,
  testApi,
  testName,
  testPassword,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';
import { makeClassicLineup, makeStarterLineup } from '@/lib/presets';
import { useHashRoute } from '@/lib/hash-route';

let server: TestApiServer;

beforeEach(async () => {
  localStorage.clear();
  localStorage.setItem('dream-court.language.v1', 'zh-CN');
  vi.resetModules();
  window.history.replaceState(null, '', '#/players');
  server = await startTestApiServer();
  vi.stubEnv('VITE_API_BASE_URL', server.baseUrl);
  vi.stubEnv('VITE_WEB_AUTH_ENABLED', undefined);
  vi.stubEnv('VITE_FORUM_ENABLED', undefined);
});

afterEach(async () => {
  cleanup();
  vi.unstubAllEnvs();
  await server.close();
});

function openHash(hash: string) {
  act(() => {
    window.location.hash = hash;
    fireEvent(window, new HashChangeEvent('hashchange'));
  });
}

function expectNoAuthEntry() {
  expect(screen.queryByRole('button', { name: /登录|注册|Sign in|Register/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /保存当前进度|Save current progress/i })).toBeNull();
  expect(screen.queryByLabelText(/^(密码|Password)$/i)).toBeNull();
  expect(document.querySelector('.auth-card')).toBeNull();
}

function expectNoAuthRequests(start = 0) {
  expect(
    server.requests
      .slice(start)
      .filter((request) =>
        /^\/api\/v1\/auth\/(login|register|web-login-tickets)(\/|$)/.test(request.path),
      ),
  ).toEqual([]);
}

describe('Web 认证入口默认关闭', () => {
  it.each([undefined, 'false'])(
    '配置 %s 时，中英文各页面及已有游客进度均不提供认证入口',
    async (flag) => {
      vi.stubEnv('VITE_WEB_AUTH_ENABLED', flag);
      const { App } = await import('@/App');
      const { repositories } = await import('@/lib/runtime');
      repositories.lineups.save(makeStarterLineup());
      const user = userEvent.setup();
      render(<App />);
      for (const locale of ['中文', 'EN']) {
        await user.click(screen.getByRole('button', { name: locale }));
        for (const hash of ['#/players', '#/lineups', '#/battle']) {
          openHash(hash);
          expectNoAuthEntry();
          const notice = screen.getByText(/当前浏览器|this browser/).closest('aside');
          expect(notice?.getAttribute('role')).toBe('status');
          expect(notice?.textContent).not.toMatch(/注册|登录|Sign in|register/);
          expect(screen.getByRole('link', { name: '沪ICP备2026051556号-1' })).toBeTruthy();
        }
      }
      expect(server.requests).toEqual([]);
    },
  );

  it.each(['#/auth', '#auth', '#/auth/register', '#/auth/scan'])(
    '首次打开、重新挂载和后续导航到 %s 均替换为球员库',
    async (hash) => {
      window.history.replaceState(null, '', hash);
      const entries = window.history.length;
      const { App } = await import('@/App');
      const first = render(<App />);
      expectNoAuthEntry();
      expect(window.location.hash).toBe('#/players');
      expect(window.history.length).toBe(entries);
      expect(screen.getByRole('heading', { name: '巅峰球员库' })).toBeTruthy();
      first.unmount();
      window.history.replaceState(null, '', hash);
      render(<App />);
      expectNoAuthEntry();
      expect(window.location.hash).toBe('#/players');
      openHash(hash);
      expectNoAuthEntry();
      expect(window.location.hash).toBe('#/players');
      expectNoAuthRequests();
    },
  );

  it('内部导航与真实 history 前进、后退均不能恢复认证路由', async () => {
    window.history.replaceState(null, '', '#/players');
    window.history.pushState(null, '', '#/auth');
    window.history.pushState(null, '', '#/lineups');
    const views: string[] = [];
    const { result } = renderHook(() => {
      const route = useHashRoute(false, false);
      views.push(route[0].view);
      return route;
    });
    await act(async () => window.history.back());
    await waitFor(() => expect(window.location.hash).toBe('#/players'));
    await act(async () => window.history.forward());
    await waitFor(() => expect(result.current[0].view).toBe('lineups'));
    const entries = window.history.length;
    act(() => result.current[1]({ view: 'auth' }));
    expect(result.current[0].view).toBe('players');
    expect(window.location.hash).toBe('#/players');
    expect(window.history.length).toBe(entries);
    expect(views).not.toContain('auth');
  });

  it('URL 与 localStorage 中的开关值不能开启认证入口', async () => {
    localStorage.setItem('VITE_WEB_AUTH_ENABLED', 'true');
    window.history.replaceState(null, '', '?VITE_WEB_AUTH_ENABLED=true#/auth');
    const { App } = await import('@/App');
    render(<App />);
    expectNoAuthEntry();
    expect(window.location.hash).toBe('#/players');
    expectNoAuthRequests();
  });

  it('保留游客球员修改、阵容保存和规则战报，重新挂载后恢复', async () => {
    const { App } = await import('@/App');
    const { repositories } = await import('@/lib/runtime');
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(screen.getByRole('button', { name: '编辑球员属性' }));
    const bio = screen.getByLabelText('简介');
    await user.clear(bio);
    await user.type(bio, '本地球员修改');
    await user.click(screen.getByRole('button', { name: '保存球员' }));
    expect(await screen.findByText('本地球员修改')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /我的阵容/ }));
    const name = screen.getByLabelText('阵容名称');
    await user.clear(name);
    await user.type(name, '游客阵容持久化');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(await screen.findByRole('button', { name: '已保存' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /梦幻对战/ }));
    await user.click(screen.getByRole('button', { name: /使用本地引擎模拟/ }));
    expect(await screen.findByText('本场最佳球员')).toBeTruthy();
    const workspace = repositories.workspace.load();
    expect(workspace.players.some((player) => player.bio === '本地球员修改')).toBe(true);
    expect(workspace.lineups.some((lineup) => lineup.name === '游客阵容持久化')).toBe(true);
    expect(workspace.simulations).toHaveLength(1);
    first.unmount();
    vi.resetModules();
    const { App: ReloadedApp } = await import('@/App');
    const { repositories: reloaded } = await import('@/lib/runtime');
    render(<ReloadedApp />);
    expect(reloaded.workspace.load()).toEqual(workspace);
    expect(await screen.findByText('本场最佳球员')).toBeTruthy();
    expectNoAuthEntry();
    expect(server.requests).toEqual([]);
  });

  it('真实有效会话继续读取、保存账号阵容，退出后恢复原游客数据', async () => {
    const { App } = await import('@/App');
    const { repositories } = await import('@/lib/runtime');
    repositories.lineups.save({ ...makeStarterLineup(), name: '原游客阵容' });
    const guestBefore = localStorage.getItem(GUEST_WORKSPACE_KEY);
    const client = testApi(server.baseUrl, localStorage);
    const session = await register(client);
    const remote = await client.saveLineup({ ...makeStarterLineup(), name: '原账号阵容' });
    await client.saveLineup(makeClassicLineup());
    const start = server.requests.length;
    const user = userEvent.setup();
    const first = render(<App />);
    expect(await screen.findByText(session.user.username)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AI 设置' })).toBeTruthy();
    openHash('#/auth');
    expect(window.location.hash).toBe('#/players');
    expect(document.querySelector('.auth-card')).toBeNull();
    await user.click(screen.getByRole('button', { name: /我的阵容/ }));
    await user.click(await screen.findByRole('button', { name: /原账号阵容/ }));
    const name = screen.getByLabelText('阵容名称');
    await user.clear(name);
    await user.type(name, '账号保存验证');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await screen.findByRole('button', { name: '已保存' });
    expect((await client.listLineups()).find((lineup) => lineup.id === remote.id)?.name).toBe(
      '账号保存验证',
    );
    expect(localStorage.getItem(GUEST_WORKSPACE_KEY)).toBe(guestBefore);
    await user.click(screen.getByRole('button', { name: '退出登录' }));
    expectNoAuthEntry();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(GUEST_WORKSPACE_KEY)).toBe(guestBefore);
    openHash('#/lineups');
    expect(screen.getByText('原游客阵容')).toBeTruthy();
    expect(screen.queryByText('账号保存验证')).toBeNull();
    first.unmount();
    render(<App />);
    expectNoAuthEntry();
    expect(screen.getByText('原游客阵容')).toBeTruthy();
    expectNoAuthRequests(start);
    client.saveSession(session);
    expect((await client.listLineups()).find((lineup) => lineup.id === remote.id)?.name).toBe(
      '账号保存验证',
    );
  });

  it('真实服务端拒绝已删除测试账号的会话后，不进入认证页面', async () => {
    const client = testApi(server.baseUrl, localStorage);
    const session = await register(client);
    sql(`DELETE FROM users WHERE id = '${session.user.id}'::uuid`);
    const start = server.requests.length;
    const { App } = await import('@/App');
    render(<App />);
    await waitFor(() => expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull());
    await screen.findByText('当前是游客模式');
    await waitFor(() =>
      expect(server.requests.find((request) => request.path.endsWith('/auth/me'))?.status).toBe(
        401,
      ),
    );
    openHash('#/auth');
    expectNoAuthEntry();
    expect(window.location.hash).toBe('#/players');
    expectNoAuthRequests(start);
  });

  it('单独开启社区时，游客可读取真实帖子但无认证、复制或评论写入入口', async () => {
    vi.stubEnv('VITE_FORUM_ENABLED', 'true');
    const { App } = await import('@/App');
    const { api } = await import('@/lib/api');
    await register(api);
    const lineup = await api.saveLineup(makeStarterLineup());
    const post = await api.shareLineup(lineup.id);
    api.clearSession();
    const start = server.requests.length;
    window.history.replaceState(null, '', `#/community/${post.id}`);
    render(<App />);
    expect(await screen.findByRole('heading', { name: lineup.name })).toBeTruthy();
    await screen.findByText('还没有评论。');
    expectNoAuthEntry();
    expect(screen.queryByText('登录后可以评论和复制阵容。')).toBeNull();
    expect(screen.queryByRole('button', { name: '复制到我的阵容' })).toBeNull();
    expect(screen.queryByPlaceholderText('写下你的看法…')).toBeNull();
    expect(server.requests.slice(start).every((request) => request.method === 'GET')).toBe(true);
    expectNoAuthRequests(start);
  });
});

describe('Web 认证入口显式开启的真实接口回归', () => {
  it.each(['login', 'register'] as const)('%s 表单仍通过真实 API 完成认证', async (mode) => {
    vi.stubEnv('VITE_WEB_AUTH_ENABLED', 'true');
    const client = testApi(server.baseUrl, localStorage);
    const username = mode === 'login' ? (await register(client)).user.username : testName();
    client.clearSession();
    const start = server.requests.length;
    const { App } = await import('@/App');
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '登录 / 注册' }));
    if (mode === 'register') await user.click(screen.getByRole('button', { name: '创建账号' }));
    await user.type(screen.getByLabelText('用户名'), username);
    await user.type(screen.getByLabelText('密码', { exact: true }), testPassword);
    await user.click(
      screen.getByRole('button', { name: mode === 'login' ? '登录' : '注册并登录' }),
    );
    await screen.findByText(username);
    expect(window.location.hash).toBe('#/players');
    expect(
      server.requests.slice(start).find((request) => request.path === `/api/v1/auth/${mode}`)
        ?.status,
    ).toBe(mode === 'login' ? 200 : 201);
    expect(client.readSession()?.user.username).toBe(username);
  });
});
