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
