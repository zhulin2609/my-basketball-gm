// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClassicLineup, createStarterLineup } from '@dream-court/core';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dream-court.language.v1', 'zh-CN');
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', '');
  vi.stubEnv('VITE_WEB_AUTH_ENABLED', 'false');
  window.history.replaceState(null, '', '#/players');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

async function setup(emptySide?: 'home' | 'away', onlyHome = false) {
  const runtime = await import('@/lib/runtime');
  const now = new Date().toISOString();
  const home = createStarterLineup({ id: 'home', name: '主队阵容', description: '', now });
  const away = createClassicLineup({ id: 'away', name: '客队阵容', description: '', now });
  // 保存真实引擎生成的合法战报，验证后续失败不会污染已有历史。
  runtime.battleService.runLocal(home, away, runtime.listPlayers());
  if (emptySide === 'home') home.members = [];
  if (emptySide === 'away') away.members = [];
  if (!onlyHome) runtime.repositories.lineups.save(away);
  runtime.repositories.lineups.save(home);
  const before = runtime.repositories.simulations.list();
  const { App } = await import('@/App');
  const mounted = render(<App />);
  return { ...runtime, ...mounted, before, user: userEvent.setup() };
}

function expectBlocked(button: HTMLElement) {
  expect((button as HTMLButtonElement).disabled).toBe(true);
  const description = document.getElementById(button.getAttribute('aria-describedby') ?? '');
  expect(description?.textContent).toBeTruthy();
  return description;
}

describe('本地对战资格', () => {
  it('新建空阵容并选择为对手时阻止快捷对战，刷新后保留原有历史', async () => {
    const app = await setup();
    await app.user.click(screen.getByRole('button', { name: '+ 新建阵容' }));
    expect(screen.getByText('从球员库把球员加入这个阵容。')).toBeTruthy();
    await app.user.click(screen.getByRole('button', { name: '主队阵容5 人' }));
    const empty = app.repositories.lineups.list().find((lineup) => lineup.members.length === 0)!;
    await app.user.selectOptions(screen.getByRole('combobox', { name: '选择对手阵容' }), empty.id);
    const button = screen.getByRole('button', { name: '使用本地引擎对战 →' });
    expect(expectBlocked(button)?.textContent).toContain('客队「新建阵容」');
    await app.user.click(button);
    expect(window.location.hash).toBe('#/lineups');
    expect(app.repositories.simulations.list()).toEqual(app.before);
    app.unmount();
    vi.resetModules();
    const { App } = await import('@/App');
    const { repositories } = await import('@/lib/runtime');
    render(<App />);
    expect(repositories.simulations.list()).toEqual(app.before);
    expect(repositories.lineups.list().find((lineup) => lineup.id === empty.id)?.members).toEqual(
      [],
    );
  });

  it.each(['home', 'away'] as const)('空 %s 在两个入口均不可参赛', async (side) => {
    const app = await setup(side);
    await app.user.click(screen.getByRole('button', { name: /我的阵容/ }));
    const shortcut = screen.getByRole('button', { name: '使用本地引擎对战 →' });
    expect(expectBlocked(shortcut)?.textContent).toContain('5–15');
    await app.user.click(shortcut);
    await app.user.click(screen.getByRole('button', { name: /梦幻对战/ }));
    const battle = screen.getByRole('button', { name: '使用本地引擎模拟' });
    expect(expectBlocked(battle)?.textContent).toContain(
      side === 'home' ? '主队「主队阵容」' : '客队「客队阵容」',
    );
    await app.user.click(battle);
    expect(app.repositories.simulations.list()).toEqual(app.before);
  });

  it.each(['remove', 'starter'] as const)('编辑合格阵容后实时阻止比赛：%s', async (change) => {
    const app = await setup();
    await app.user.click(screen.getByRole('button', { name: /我的阵容/ }));
    expect(
      (screen.getByRole('button', { name: '使用本地引擎对战 →' }) as HTMLButtonElement).disabled,
    ).toBe(false);
    if (change === 'remove') {
      await app.user.click(screen.getAllByRole('button', { name: '×' })[0]);
    } else {
      await app.user.click(screen.getAllByRole('button', { name: '首发' })[0]);
    }
    expectBlocked(screen.getByRole('button', { name: '使用本地引擎对战 →' }));
    await app.user.click(screen.getByRole('button', { name: /梦幻对战/ }));
    expectBlocked(screen.getByRole('button', { name: '使用本地引擎模拟' }));
    expect(app.repositories.simulations.list()).toEqual(app.before);
  });

  it('切换当前阵容导致对手与自己相同时阻止快捷对战', async () => {
    const app = await setup();
    await app.user.click(screen.getByRole('button', { name: /我的阵容/ }));
    await app.user.selectOptions(screen.getByRole('combobox', { name: '选择对手阵容' }), 'away');
    await app.user.click(screen.getByRole('button', { name: '客队阵容5 人' }));
    const button = screen.getByRole('button', { name: '使用本地引擎对战 →' });
    expect(expectBlocked(button)?.textContent).toBe('请选择两套不同的阵容。');
    await app.user.click(button);
    expect(app.repositories.simulations.list()).toEqual(app.before);
  });

  it('没有对手时两个入口都提示选择有效阵容', async () => {
    const app = await setup(undefined, true);
    await app.user.click(screen.getByRole('button', { name: /我的阵容/ }));
    expect(
      expectBlocked(screen.getByRole('button', { name: '使用本地引擎对战 →' }))?.textContent,
    ).toContain('请选择有效阵容');
    await app.user.click(screen.getByRole('button', { name: /梦幻对战/ }));
    expectBlocked(screen.getByRole('button', { name: '使用本地引擎模拟' }));
    expect(app.repositories.simulations.list()).toEqual(app.before);
  });

  it('选择合格对手后恢复快捷对战并持久化真实战报', async () => {
    const app = await setup();
    await app.user.click(screen.getByRole('button', { name: /我的阵容/ }));
    const select = screen.getByRole('combobox', { name: '选择对手阵容' });
    await app.user.selectOptions(select, '');
    expectBlocked(screen.getByRole('button', { name: '使用本地引擎对战 →' }));
    await app.user.selectOptions(select, 'away');
    await app.user.click(screen.getByRole('button', { name: '使用本地引擎对战 →' }));
    expect(await screen.findByText('本场最佳球员')).toBeTruthy();
    const reports = app.repositories.simulations.list();
    expect(reports).toHaveLength(app.before.length + 1);
    for (const stats of [reports[0].homeStats, reports[0].awayStats]) {
      expect(stats).toHaveLength(5);
      expect(stats.reduce((sum, row) => sum + row.minutes, 0)).toBe(240);
    }
    app.unmount();
    vi.resetModules();
    const { App } = await import('@/App');
    const { repositories } = await import('@/lib/runtime');
    render(<App />);
    expect(repositories.simulations.list()).toEqual(reports);
  });

  it('英文模式说明不合格对手的原因', async () => {
    const app = await setup('away');
    await app.user.click(screen.getByRole('button', { name: 'EN' }));
    await app.user.click(screen.getByRole('button', { name: /My Roster/ }));
    const description = expectBlocked(
      screen.getByRole('button', { name: 'Play with local engine →' }),
    );
    expect(description?.textContent).toContain('Away "客队阵容"');
    expect(description?.textContent).toContain('5–15 players');
  });
});
