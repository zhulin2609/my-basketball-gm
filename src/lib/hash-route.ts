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

// 视图状态以 URL hash 为准：刷新后停留在当前页面，前进/后退按钮可用，帖子详情有可分享的链接。
export function useHashRoute(): [
  HashRoute,
  (next: { view: RouteView; postId?: string | null }) => void,
] {
  const [route, setRoute] = useState<HashRoute>(() => parseHashRoute(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute((current) => {
        const parsed = parseHashRoute(window.location.hash);
        return sameRoute(current, parsed) ? current : parsed;
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: { view: RouteView; postId?: string | null }) => {
    const normalized: HashRoute = { view: next.view, postId: next.postId ?? null };
    setRoute(normalized);
    const hash = routeToHash(normalized);
    if (window.location.hash !== hash) window.location.hash = hash;
  }, []);

  return [route, navigate];
}
