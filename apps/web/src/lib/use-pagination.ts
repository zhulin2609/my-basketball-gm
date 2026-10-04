import { useEffect, useState } from 'react';

export interface PaginationResult<T> {
  page: number;
  pageCount: number;
  pageItems: T[];
  setPage: (page: number) => void;
}

// resetSignal 变化（搜索词、过滤或排序条件改变）时回到第 1 页，否则用户会停留在旧条件下的页码，看到错误的子集。
export function usePagination<T>(
  items: T[],
  pageSize: number,
  resetSignal: unknown,
): PaginationResult<T> {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  // 列表缩短时钳制到最后一页：添加球员后候选列表变少，旧页码可能已不存在。
  const currentPage = Math.min(page, pageCount);
  useEffect(() => {
    setPage(1);
  }, [resetSignal]);
  return {
    page: currentPage,
    pageCount,
    pageItems: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    setPage,
  };
}
