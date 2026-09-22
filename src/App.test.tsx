// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('guest entry experience', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('opens the player archive instead of blocking visitors with the login form', async () => {
    const { App } = await import('@/App');

    render(<App />);

    expect(screen.getByRole('heading', { name: /巅峰球员库|Peak player archive/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /登录|Sign in/i })).toBeTruthy();
    expect(screen.queryByLabelText(/密码|Password/i)).toBeNull();
  });

  it('returns from sign-in to the guest player archive', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /登录|Sign in/i }));
    expect(screen.getByLabelText(/密码|Password/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /继续游客体验|Continue as guest/i }));

    expect(screen.getByRole('heading', { name: /巅峰球员库|Peak player archive/i })).toBeTruthy();
    expect(screen.queryByLabelText(/密码|Password/i)).toBeNull();
  });
});

describe('player list pagination', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('paginates the player archive grid', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');
    const { container } = render(<App />);

    expect(container.querySelectorAll('.player-card')).toHaveLength(12);
    expect(screen.getByRole('button', { name: /上一页|Previous/i })).toHaveProperty(
      'disabled',
      true,
    );
    expect(container.querySelector('.pagination span')?.textContent).toMatch(/第 1 \/|Page 1 of/);

    await user.click(screen.getByRole('button', { name: /下一页|Next/i }));

    expect(container.querySelectorAll('.player-card')).toHaveLength(12);
    expect(container.querySelector('.pagination span')?.textContent).toMatch(/第 2 \/|Page 2 of/);
    expect(screen.getByRole('button', { name: /上一页|Previous/i })).toHaveProperty(
      'disabled',
      false,
    );
  });

  it('returns to the first page when the player search changes', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: /下一页|Next/i }));
    expect(container.querySelector('.pagination span')?.textContent).toMatch(/第 2 \/|Page 2 of/);

    await user.type(screen.getByPlaceholderText(/搜索球员或打法|Search players/i), 'a');

    expect(container.querySelector('.pagination span')?.textContent).toMatch(/第 1 \/|Page 1 of/);
  });

  it('finds players by Chinese name and keeps the full name on one visual line', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: '中文' }));
    await user.type(screen.getByPlaceholderText(/搜索球员或打法|Search players/i), '乔丹');

    const playerNames = await screen.findAllByText('Michael Jordan(迈克尔·乔丹)');
    expect(playerNames[0].classList.contains('player-name')).toBe(true);
  });

  it('finds available roster players by Chinese name', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: '中文' }));
    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));
    await user.type(screen.getByLabelText(/搜索未加入的球员|Search players not already/i), '乔丹');

    const playerName = await screen.findByText('Michael Jordan(迈克尔·乔丹)');
    expect(playerName.classList.contains('player-name')).toBe(true);
  });

  it('locks public-player identity fields in the editor', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: '中文' }));
    const playerNames = await screen.findAllByText('Michael Jordan(迈克尔·乔丹)');
    await user.click(playerNames[0]);
    await user.click(screen.getByRole('button', { name: /编辑球员属性|Edit player attributes/i }));

    expect(screen.getByLabelText(/英文名|English name/i)).toHaveProperty('disabled', true);
    expect(screen.getByLabelText(/中文名|Chinese name/i)).toHaveProperty('disabled', true);
    expect(screen.getByLabelText(/缩写|Initials/i)).toHaveProperty('disabled', true);
    expect(screen.getByLabelText(/身高（英尺）|Height \(ft\)/i)).toHaveProperty('disabled', true);
    expect(screen.getByLabelText(/身高（英寸）|Height \(in\)/i)).toHaveProperty('disabled', true);
    expect(screen.getByLabelText(/体重（磅）|Weight \(lb\)/i)).toHaveProperty('disabled', true);
  });

  it('paginates the candidate players on the roster page', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));

    expect(container.querySelectorAll('.picker-player')).toHaveLength(9);
    expect(container.querySelector('.pagination span')?.textContent).toMatch(/第 1 \/|Page 1 of/);

    await user.click(screen.getByRole('button', { name: /下一页|Next/i }));

    expect(container.querySelectorAll('.picker-player')).toHaveLength(9);
    expect(container.querySelector('.pagination span')?.textContent).toMatch(/第 2 \/|Page 2 of/);
  });
});

describe('roster save feedback', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    // 指向不可达地址：游客模式的保存写入本地存储，不依赖服务端。
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:9/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('confirms a manual roster save', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));
    await user.click(screen.getByRole('button', { name: /^(保存|Save)$/i }));

    expect(await screen.findByRole('button', { name: /已保存|Saved/i })).toBeTruthy();
  });

  it('keeps pinyin composition local until the input method commits', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));
    const nameInput = screen.getByLabelText(/阵容名称|Roster name/i);
    expect(nameInput).toHaveProperty('value', expect.stringMatching(/.+/));

    fireEvent.compositionStart(nameInput);
    fireEvent.change(nameInput, { target: { value: "wu'gua" } });

    // 组合期间：输入框显示拼音，阵容状态（侧边栏）保持原名称。
    expect(nameInput).toHaveProperty('value', "wu'gua");
    expect(screen.queryByText("wu'gua")).toBeNull();
    expect(screen.getByText(/我的梦之队|My Dream Team/)).toBeTruthy();

    fireEvent.compositionEnd(nameInput, { target: { value: '无冠' } });
    fireEvent.change(nameInput, { target: { value: '无冠' } });

    // 组合结束后才写入阵容状态，侧边栏显示最终名称。
    expect(await screen.findByText('无冠')).toBeTruthy();
    expect(nameInput).toHaveProperty('value', '无冠');
  });
});

describe('community rosters', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    // 指向不可达地址：社区数据只来自服务端，测试必须验证服务不可用时的界面行为。
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:9/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('shows the community entry in navigation when the API is enabled', async () => {
    const { App } = await import('@/App');

    render(<App />);

    expect(screen.getByRole('button', { name: /社区|Community/i })).toBeTruthy();
  });

  it('shows an error with retry when the community service is unreachable', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /社区|Community/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(
      /社区内容加载失败|Unable to load community content/i,
    );
    expect(screen.getByRole('button', { name: /重试|Retry/i })).toBeTruthy();
  });

  it('hides the share-to-community action from guests on the roster page', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));

    expect(screen.queryByRole('button', { name: /公开到社区|Share to community/i })).toBeNull();
  });
});

describe('player of the game', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    // 指向不可达地址：本地引擎在浏览器内完成模拟，不依赖服务端。
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:9/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('shows the player of the game after a local simulation', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: /梦幻对战|Dream Match/i }));
    await user.click(
      screen.getByRole('button', { name: /使用本地引擎模拟|Simulate with local engine/i }),
    );

    expect(await screen.findByText(/本场最佳球员|Player of the Game/i)).toBeTruthy();
    expect(container.querySelector('.pog-score strong')?.textContent).toMatch(/^\d+\.\d$/);
    expect(container.querySelector('.pog-stats')?.textContent).toMatch(/\d+ PTS/);
  });
});

describe('player ordering by overall rating', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    // 指向不可达地址：球员列表来自内置目录，不依赖服务端。
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:9/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  const expectDescending = (ovrs: number[]) => {
    expect(ovrs.length).toBeGreaterThan(1);
    for (let index = 1; index < ovrs.length; index += 1) {
      expect(ovrs[index - 1]).toBeGreaterThanOrEqual(ovrs[index]);
    }
  };

  it('sorts the player archive grid by overall rating descending', async () => {
    const { App } = await import('@/App');
    const { container } = render(<App />);

    const ovrs = [...container.querySelectorAll('.player-card strong')].map((el) =>
      Number(el.textContent?.replace('OVR', '')),
    );

    expectDescending(ovrs);
  });

  it('sorts the candidate players on the roster page by overall rating descending', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));

    const ovrs = [...container.querySelectorAll('.picker-player small')].map((el) =>
      Number(el.textContent?.match(/(\d+) OVR/)?.[1]),
    );

    expectDescending(ovrs);
  });
});

describe('hash routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    window.location.hash = '';
    // 指向不可达地址：hash 路由只决定渲染哪个视图，不依赖服务端响应。
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:9/api/v1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    window.location.hash = '';
  });

  it('restores the view from the URL hash on load', async () => {
    window.location.hash = '#/battle';
    const { App } = await import('@/App');

    render(<App />);

    expect(
      screen.getByRole('button', { name: /使用本地引擎模拟|Simulate with local engine/i }),
    ).toBeTruthy();
  });

  it('updates the URL hash when navigating', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));

    expect(window.location.hash).toBe('#/lineups');
  });

  it('follows hash changes from the browser back and forward buttons', async () => {
    const user = userEvent.setup();
    const { App } = await import('@/App');

    render(<App />);
    await user.click(screen.getByRole('button', { name: /我的阵容|My Roster/i }));
    expect(screen.getByLabelText(/阵容名称|Roster name/i)).toBeTruthy();

    window.location.hash = '#/players';
    fireEvent(window, new HashChangeEvent('hashchange'));

    expect(screen.getByRole('heading', { name: /巅峰球员库|Peak player archive/i })).toBeTruthy();
  });

  it('restores the shared post detail from the URL hash', async () => {
    window.location.hash = '#/community/post-1';
    const { App } = await import('@/App');

    render(<App />);

    expect((await screen.findByRole('alert')).textContent).toMatch(
      /社区内容加载失败|Unable to load community content/i,
    );
    expect(
      screen.getByRole('button', { name: /返回社区列表|Back to community list/i }),
    ).toBeTruthy();
  });

  it('falls back to the player archive when a guest opens a restricted view hash', async () => {
    window.location.hash = '#/ai-settings';
    const { App } = await import('@/App');

    render(<App />);

    expect(screen.getByRole('heading', { name: /巅峰球员库|Peak player archive/i })).toBeTruthy();
  });

  it('falls back to the player archive for an unknown hash', async () => {
    window.location.hash = '#/nonsense';
    const { App } = await import('@/App');

    render(<App />);

    expect(screen.getByRole('heading', { name: /巅峰球员库|Peak player archive/i })).toBeTruthy();
  });
});
