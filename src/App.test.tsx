// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('guest entry experience', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
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
