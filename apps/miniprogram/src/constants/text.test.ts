import { describe, expect, it } from 'vitest';
import { battleErrorMessage } from './text';

describe('对战失败提示', () => {
  it('平台确认断网时显示网络错误', () => {
    expect(battleErrorMessage('none')).toBe('网络错误，请稍后重试。');
  });

  it.each(['wifi', '2g', '3g', '4g', '5g', 'unknown', undefined])(
    '网络状态为 %s 时不将原因归为断网',
    (networkType) => {
      expect(battleErrorMessage(networkType)).toBe('暂时无法对战，请稍后重试。');
    },
  );
});
