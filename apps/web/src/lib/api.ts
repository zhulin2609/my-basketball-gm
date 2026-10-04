/**
 * Web 应用的 API 门面：公共端点来自 `@dream-court/client`，
 * Web 专属的社区与 AI 端点在这里追加，两者共用同一套传输与会话存储。
 */
import type {
  CommunityComment,
  CommunityPostDetail,
  CommunityPostSummary,
  PagedResponse,
} from '@/types/community';
import type { Lineup } from '@dream-court/core';
import { createRequestSender, type RequestSender } from '@dream-court/client';
import { api as clientApi, browserStorage, fetchHttp, isApiEnabled, ports } from '@/lib/runtime';

export { isApiEnabled };

export interface LlmCredential {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  apiKeyHint: string | null;
}

export interface LlmCredentialWrite {
  baseUrl: string;
  model: string;
  apiKey: string;
}

const webRequest: RequestSender = createRequestSender({
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '',
  http: fetchHttp,
  storage: browserStorage,
  clock: ports.clock,
});

export const api = {
  ...clientApi,
  getLlmCredential: () => webRequest<LlmCredential>('/llm-credentials'),
  saveLlmCredential: (credential: LlmCredentialWrite) =>
    webRequest<LlmCredential>('/llm-credentials', { method: 'PUT', body: credential }),
  deleteLlmCredential: async () => {
    await webRequest<void>('/llm-credentials', { method: 'DELETE' });
  },
  // 社区接口：三个只读 GET 允许匿名调用，写操作由服务端校验登录态。
  listCommunityPosts: (page: number, pageSize: number) =>
    webRequest<PagedResponse<CommunityPostSummary>>(
      `/forum/posts?page=${page}&pageSize=${pageSize}`,
    ),
  getCommunityPost: (id: string) => webRequest<CommunityPostDetail>(`/forum/posts/${id}`),
  listCommunityComments: (postId: string, page: number, pageSize: number) =>
    webRequest<PagedResponse<CommunityComment>>(
      `/forum/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`,
    ),
  shareLineup: (lineupId: string) =>
    webRequest<CommunityPostDetail>('/forum/posts', { method: 'POST', body: { lineupId } }),
  withdrawCommunityPost: (id: string) =>
    webRequest<void>(`/forum/posts/${id}`, { method: 'DELETE' }),
  addCommunityComment: (postId: string, content: string, parentId: string | null) =>
    webRequest<CommunityComment>(`/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: { content, parentId },
    }),
  deleteCommunityComment: (id: string) =>
    webRequest<void>(`/forum/comments/${id}`, { method: 'DELETE' }),
  copyCommunityPost: (id: string) =>
    webRequest<Lineup>(`/forum/posts/${id}/copy`, { method: 'POST' }),
};
