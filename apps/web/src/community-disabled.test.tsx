// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeClassicLineup, makeStarterLineup } from '@/lib/presets';
import {
  register,
  startTestApiServer,
  testApi,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';

let server: TestApiServer;
beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  window.history.replaceState(null, '', '#/players');
  server = await startTestApiServer();
  vi.stubEnv('VITE_API_BASE_URL', server.baseUrl);
  vi.stubEnv('VITE_FORUM_ENABLED', undefined);
});
afterEach(async () => {
  cleanup();
  vi.unstubAllEnvs();
  await server.close();
});

describe('关闭社区与备案页脚', () => {
  it.each([undefined, 'false'])(
    '配置 %s 时隐藏游客入口并保留各页面中英文备案链接',
    async (flag) => {
      vi.stubEnv('VITE_FORUM_ENABLED', flag);
      const { App } = await import('@/App');
      const user = userEvent.setup();
      render(<App />);
      for (const locale of ['中文', 'EN']) {
        window.location.hash = '#/players';
        fireEvent(window, new HashChangeEvent('hashchange'));
        await user.click(screen.getByRole('button', { name: locale }));
        for (const hash of ['#/players', '#/lineups', '#/battle', '#/auth']) {
          window.location.hash = hash;
          fireEvent(window, new HashChangeEvent('hashchange'));
          const link = screen.getByRole('link', { name: '沪ICP备2026051556号-1' });
          expect(link.getAttribute('href')).toBe('https://beian.miit.gov.cn/');
          expect(link.getAttribute('target')).toBe('_blank');
          expect(link.getAttribute('rel')).toBe('noopener noreferrer');
          expect(link.closest('footer')).not.toBeNull();
          expect(screen.queryByRole('button', { name: /社区|Community/i })).toBeNull();
          expect(document.querySelector('.share-panel')).toBeNull();
        }
      }
      expect(server.requests.filter((request) => request.path.includes('/forum/'))).toEqual([]);
    },
  );

  it.each(['#/community', '#/community/existing-post'])(
    '首次打开及后续进入 %s 时替换地址，不请求社区',
    async (hash) => {
      window.history.replaceState(null, '', hash);
      const entries = window.history.length;
      const { App } = await import('@/App');
      render(<App />);
      expect(window.location.hash).toBe('#/players');
      expect(window.history.length).toBe(entries);
      expect(screen.getByRole('heading', { name: /巅峰球员库|Peak player archive/i })).toBeTruthy();
      window.history.replaceState(null, '', hash);
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(window.location.hash).toBe('#/players');
      expect(window.history.length).toBe(entries);
      expect(server.requests.filter((request) => request.path.includes('/forum/'))).toEqual([]);
    },
  );

  it.each([false, true])(
    '登录用户编辑公开状态为 %s 的真实阵容时隐藏全部社区操作',
    async (shared) => {
      const client = testApi(server.baseUrl, localStorage);
      await register(client);
      const lineup = await client.saveLineup(makeStarterLineup());
      await client.saveLineup(makeClassicLineup());
      // 使用真实发布接口建立已有公开阵容，前端开关保持关闭。
      if (shared) {
        const response = await fetch(`${server.baseUrl}/forum/posts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${client.readSession()!.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lineupId: lineup.id }),
        });
        expect(response.status).toBe(201);
      }
      const saved = (await client.listLineups()).find((item) => item.id === lineup.id)!;
      expect(Boolean(saved.sharedPostId)).toBe(shared);
      const start = server.requests.length;
      window.history.replaceState(null, '', '#/lineups');
      const { App } = await import('@/App');
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => {
        expect(
          server.requests
            .slice(start)
            .some((r) => r.path === '/api/v1/lineups' && r.status === 200),
        ).toBe(true);
      });
      await user.click(screen.getByRole('button', { name: '中文' }));
      await user.click(await screen.findByRole('button', { name: new RegExp(lineup.name) }));
      const name = await screen.findByLabelText('阵容名称');
      await waitFor(() => expect(name).toHaveProperty('value', lineup.name));
      expect(screen.queryByRole('button', { name: /社区|Community/i })).toBeNull();
      expect(document.querySelector('.share-panel')).toBeNull();
      expect(screen.queryByRole('button', { name: /查看帖子|View post/i })).toBeNull();
      await user.clear(name);
      await user.type(name, '关闭社区后保存');
      await user.click(screen.getByRole('button', { name: '保存' }));
      await screen.findByRole('button', { name: '已保存' });
      expect((await client.listLineups()).find((item) => item.id === lineup.id)?.name).toBe(
        '关闭社区后保存',
      );
      expect(server.requests.slice(start).filter((r) => r.path.includes('/forum/'))).toEqual([]);
    },
  );
});
