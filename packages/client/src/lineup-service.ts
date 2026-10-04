import type { Lineup } from '@dream-court/core';

export interface LineupSaveHandlers {
  /** 该请求仍是同阵容的最新请求时，用服务端返回值校正本地状态。 */
  onApplied?: (remoteLineup: Lineup) => void;
  /** 任何一次保存失败都会触发；界面据此展示同步错误。 */
  onError?: (error: unknown) => void;
}

export interface LineupSaveQueue {
  /**
   * 串行化同一阵容的保存请求：前一个请求完成（无论成败）后才发出下一个。
   * 返回的 Promise 在本次请求落定时 settle，供保存按钮展示反馈；
   * 已有更新的请求在排队时跳过应用较早的响应，避免本地状态回退。
   */
  enqueue(lineup: Lineup, handlers?: LineupSaveHandlers): Promise<void>;
  /** 该阵容当前排队或执行中的保存请求；没有时返回 undefined。 */
  pending(lineupId: string): Promise<void> | undefined;
}

export function createLineupSaveQueue(
  saveLineup: (lineup: Lineup) => Promise<Lineup>,
): LineupSaveQueue {
  const queues = new Map<string, Promise<void>>();
  const latestTokens = new Map<string, object>();

  return {
    enqueue(lineup, handlers) {
      const previous = queues.get(lineup.id) ?? Promise.resolve();
      const token = {};
      latestTokens.set(lineup.id, token);
      const request: Promise<void> = previous
        .catch(() => undefined)
        .then(() => saveLineup(lineup))
        .then((remoteLineup) => {
          if (latestTokens.get(lineup.id) !== token) return;
          handlers?.onApplied?.(remoteLineup);
        });
      queues.set(lineup.id, request);
      void request.catch((error: unknown) => {
        handlers?.onError?.(error);
      });
      // 请求落定后清掉在途记录，让对战发起方只在真正有未完成保存时等待。
      // 清理直接挂在请求本身的反应上，保证调用方 await 之后记录已被移除；
      // 后续请求已在排队时覆盖了记录，这里只在记录仍指向本请求时清理。
      const cleanup = () => {
        if (queues.get(lineup.id) === request) queues.delete(lineup.id);
      };
      void request.then(cleanup, cleanup);
      return request;
    },
    pending(lineupId) {
      return queues.get(lineupId);
    },
  };
}
