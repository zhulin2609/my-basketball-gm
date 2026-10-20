import { useCallback, useEffect, useState } from 'react';

export type RouteView = 'players' | 'lineups' | 'battle' | 'community' | 'ai-settings' | 'auth';

export interface HashRoute {
  view: RouteView;
  postId: string | null;
}

const ROUTE_VIEWS: readonly RouteView[] = [
  'players',
  'lineups',
  'battle',
  'community',
  'ai-settings',
  'auth',
];

// 无法识别的 hash 回退到球员库首页，避免被篡改的 URL 渲染出空白页。
export function parseHashRoute(hash: string): HashRoute {
  const segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, postId] = segments;
  if (head === 'community' && postId) return { view: 'community', postId };
  if (ROUTE_VIEWS.includes(head as RouteView)) return { view: head as RouteView, postId: null };
  return { view: 'players', postId: null };
}

export function routeToHash(route: HashRoute): string {
  return route.view === 'community' && route.postId
    ? `#/community/${route.postId}`
    : `#/${route.view}`;
}

function sameRoute(a: HashRoute, b: HashRoute): boolean {
  return a.view === b.view && a.postId === b.postId;
}

function availableRoute(route: HashRoute, communityEnabled: boolean): HashRoute {
  return route.view === 'community' && !communityEnabled
    ? { view: 'players', postId: null }
    : route;
}

// 视图状态以 URL hash 为准：刷新后停留在当前页面，前进/后退按钮可用，帖子详情有可分享的链接。
export function useHashRoute(
  communityEnabled: boolean,
): [HashRoute, (next: { view: RouteView; postId?: string | null }) => void] {
  const [route, setRoute] = useState<HashRoute>(() =>
    availableRoute(parseHashRoute(window.location.hash), communityEnabled),
  );

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHashRoute(window.location.hash);
      const next = availableRoute(parsed, communityEnabled);
      if (!sameRoute(parsed, next)) {
        window.history.replaceState(window.history.state, '', routeToHash(next));
      }
      setRoute((current) => (sameRoute(current, next) ? current : next));
    };
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [communityEnabled]);

  const navigate = useCallback(
    (next: { view: RouteView; postId?: string | null }) => {
      const requested: HashRoute = { view: next.view, postId: next.postId ?? null };
      const normalized = availableRoute(requested, communityEnabled);
      setRoute(normalized);
      const hash = routeToHash(normalized);
      if (!sameRoute(requested, normalized)) {
        window.history.replaceState(window.history.state, '', hash);
      } else if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    },
    [communityEnabled],
  );

  return [route, navigate];
}
