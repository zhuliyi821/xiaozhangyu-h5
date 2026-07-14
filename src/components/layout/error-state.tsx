"use client";

import { ArrowLeft } from "lucide-react";

/** ❌ 通用错误态 — 显示错误信息 + 重试按钮 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "加载失败",
  message = "请检查网络后重试",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-brand-coral/10 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div className="text-sm font-semibold text-text-primary mb-1">{title}</div>
      <div className="text-[11px] text-text-tertiary mb-3">{message}</div>
      {onRetry && (
        <button onClick={onRetry}
          className="px-4 py-2 bg-brand-teal text-white rounded-[8px] text-xs font-medium active:scale-[0.97] transition-transform">
          重新加载
        </button>
      )}
    </div>
  );
}
