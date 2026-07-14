"use client";

/** 📭 通用空态 — 显示空数据 + 引导行动 */
interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "📭",
  title = "暂无内容",
  message = "",
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <div className="text-4xl mb-3 opacity-60">{icon}</div>
      <div className="text-sm font-semibold text-text-primary mb-1">{title}</div>
      {message && <div className="text-[11px] text-text-tertiary mb-3">{message}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="px-4 py-2 bg-brand-teal text-white rounded-[8px] text-xs font-medium active:scale-[0.97] transition-transform">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
