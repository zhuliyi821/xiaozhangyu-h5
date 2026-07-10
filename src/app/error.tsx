"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-coral/10">
        <svg className="h-10 w-10 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text">页面加载异常</h2>
      <p className="mb-6 text-sm text-text-tertiary">
        抱歉，页面遇到了问题。请尝试刷新或稍后重试。
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-brand-teal px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-teal-dark transition-all"
      >
        重新加载
      </button>
      <p className="mt-6 text-xs text-text-tertiary">
        {error.digest && <>错误 ID: {error.digest}</>}
      </p>
    </div>
  );
}
