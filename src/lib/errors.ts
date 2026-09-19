import type { TFunction } from 'i18next';
import { ApiError } from '@/lib/api';

// 后端按错误类别下发 code（方案见 docs/plans/current.md），前端按 code 映射到本地文案。
// 命中的敏感词等服务端细节不回显，所以这里刻意不使用后端返回的原始 message。
const COMMUNITY_ERROR_KEYS: Record<string, string> = {
  CONTENT_REJECTED: 'community.errorContentRejected',
  RATE_LIMITED: 'community.errorRateLimited',
  MODERATION_UNAVAILABLE: 'community.errorUnavailable',
  LINK_RESTRICTED: 'community.errorLinkRestricted',
};

/**
 * 社区写操作（公开阵容、发表评论）的错误文案。带 code 的错误按码映射；
 * 无 code 的错误保持既有行为，拼接后端 message 到对应的失败文案上。
 */
export function communityWriteError(t: TFunction, error: unknown, fallbackKey: string): string {
  if (error instanceof ApiError && error.code && COMMUNITY_ERROR_KEYS[error.code]) {
    return t(COMMUNITY_ERROR_KEYS[error.code]);
  }
  const message = error instanceof Error ? error.message : t('errors.unknown');
  return t(fallbackKey, { message });
}
