// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { ApiError } from '@/lib/api';
import { communityWriteError } from '@/lib/errors';

describe('communityWriteError', () => {
  it('maps moderation codes to localized copy without echoing the server message', () => {
    const cases: Array<[string, string]> = [
      ['CONTENT_REJECTED', 'community.errorContentRejected'],
      ['RATE_LIMITED', 'community.errorRateLimited'],
      ['MODERATION_UNAVAILABLE', 'community.errorUnavailable'],
      ['LINK_RESTRICTED', 'community.errorLinkRestricted'],
    ];
    for (const [code, key] of cases) {
      const error = new ApiError('server raw message', 422, code);
      const rendered = communityWriteError(i18n.t, error, 'community.commentFailed');
      expect(rendered).toBe(i18n.t(key));
      expect(rendered).not.toContain('server raw message');
    }
  });

  it('keeps the server message when the error carries no code', () => {
    const error = new ApiError('阵容包含自定义球员或编辑过的公共球员', 422, null);
    const rendered = communityWriteError(i18n.t, error, 'community.shareFailed');
    expect(rendered).toContain('阵容包含自定义球员或编辑过的公共球员');
  });

  it('falls back to the message for plain errors and unrecognized codes', () => {
    expect(communityWriteError(i18n.t, new Error('网络中断'), 'community.commentFailed')).toContain(
      '网络中断',
    );
    const unknownCode = new ApiError('whatever happened', 500, 'SOMETHING_NEW');
    expect(communityWriteError(i18n.t, unknownCode, 'community.commentFailed')).toContain(
      'whatever happened',
    );
  });

  it('uses the unknown-error copy for non-error values', () => {
    expect(communityWriteError(i18n.t, 'oops', 'community.commentFailed')).toContain(
      i18n.t('errors.unknown'),
    );
  });
});
