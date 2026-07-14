"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Skeleton, CardSkeleton } from "./skeleton";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";

type SkeletonVariant = "text" | "card" | "circle" | "chart" | "list" | "banner";

interface DataLoaderProps<T> {
  /** 数据获取函数，返回 Promise<T> */
  fetch: () => Promise<T>;
  /** 依赖项（变化时重新 fetch） */
  deps?: any[];
  /** 骨架屏变体 */
  skeleton?: SkeletonVariant;
  /** 自定义骨架屏 */
  skeletonCustom?: ReactNode;
  /** 空态提示 */
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: string;
  onEmptyAction?: () => void;
  /** 成功渲染函数 */
  children: (data: T) => ReactNode;
  /** 是否跳过初始加载 */
  skip?: boolean;
}

/**
 * 🔄 通用数据加载器
 *
 * 统一处理：loading → skeleton → error (retry) → empty → success
 *
 * 用法:
 * ```tsx
 * <DataLoader fetch={() => api(`/api/fortune?uid=${uid}`)} deps={[uid]}>
 *   {(data) => <FortuneUI data={data} />}
 * </DataLoader>
 * ```
 */
export function DataLoader<T>({
  fetch: fetchFn,
  deps = [],
  skeleton = "card",
  skeletonCustom,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction,
  onEmptyAction,
  children,
  skip = false,
}: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (skip) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      setError(err?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <>{skeletonCustom || <CardSkeleton />}</>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (data === null || (Array.isArray(data) && data.length === 0)) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyAction}
        onAction={onEmptyAction}
      />
    );
  }

  return <>{children(data)}</>;
}
