// @vitest-environment jsdom

import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it } from 'vitest';
import i18n from '@/i18n';
import { PasswordInput } from '@/components/PasswordInput';

beforeEach(async () => {
  await i18n.changeLanguage('zh-CN');
});
afterEach(cleanup);

it('切换明文保留输入、焦点和选区，且不提交表单', async () => {
  let submits = 0;
  function Form() {
    const [value, setValue] = useState('');
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submits += 1;
        }}
      >
        <PasswordInput label="密码" value={value} onChange={setValue} />
      </form>
    );
  }
  render(<Form />);
  const user = userEvent.setup();
  const input = screen.getByLabelText<HTMLInputElement>('密码');
  await user.type(input, 'correct-password');
  input.setSelectionRange(2, 7);
  expect(input.type).toBe('password');
  await user.click(screen.getByRole('button', { name: '显示密码' }));
  expect(input.type).toBe('text');
  expect(input.value).toBe('correct-password');
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
  await user.click(screen.getByRole('button', { name: '隐藏密码' }));
  expect(input.type).toBe('password');
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
  expect(submits).toBe(0);
});

it('键盘可以操作显示按钮，禁用时禁止修改和切换', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <PasswordInput
      label="密码"
      value="saved"
      onChange={() => {
        throw new Error('不应修改');
      }}
    />,
  );
  await user.tab();
  await user.tab();
  const button = screen.getByRole('button', { name: '显示密码' });
  expect(document.activeElement).toBe(button);
  await user.keyboard('{Enter}');
  expect(screen.getByLabelText('密码')).toHaveProperty('type', 'text');
  expect(document.activeElement).toBe(button);
  rerender(
    <PasswordInput
      label="密码"
      value="saved"
      disabled
      onChange={() => {
        throw new Error('不应修改');
      }}
    />,
  );
  await user.click(button);
  expect(screen.getByLabelText('密码')).toHaveProperty('disabled', true);
  expect(button).toHaveProperty('disabled', true);
  expect(screen.getByLabelText('密码')).toHaveProperty('type', 'text');
});

it('错误关联输入框，切换表单重新隐藏密码', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <PasswordInput
      key="login"
      label="密码"
      value="saved"
      error="用户名或密码错误"
      onChange={() => {}}
    />,
  );
  const input = screen.getByLabelText('密码');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
  await user.click(screen.getByRole('button', { name: '显示密码' }));
  rerender(<PasswordInput key="register" label="密码" value="saved" onChange={() => {}} />);
  expect(screen.getByLabelText('密码')).toHaveProperty('type', 'password');
  expect(screen.getByLabelText('密码').getAttribute('aria-invalid')).toBe('false');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('英文界面提供显示和隐藏按钮名称', async () => {
  await i18n.changeLanguage('en');
  const user = userEvent.setup();
  render(<PasswordInput label="Password" value="" onChange={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
});
