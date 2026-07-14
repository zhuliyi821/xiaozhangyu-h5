"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface PageShellProps {
  /** 页面标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 返回地址（默认 history.back） */
  backTo?: string;
  /** 右侧操作按钮 */
  actions?: ReactNode;
  /** 渐变颜色方案 */
  gradient?: "teal-gold" | "teal" | "gold" | "coral";
  children: ReactNode;
  /** 是否在底部Tab外（自动加 pb-20） */
  withTabBar?: boolean;
  className?: string;
}

const GRADIENTS = {
  "teal-gold": "from-brand-teal to-brand-gold",
  "teal": "from-brand-teal to-brand-teal-dark",
  "gold": "from-brand-gold to-amber-500",
  "coral": "from-brand-coral to-brand-coral-dark",
};

/**
 * 📐 统一页面外壳
 *
 * 所有二级页面统一使用，确保一致的 Header、返回按钮、渐变色。
 *
 * 用法:
 * ```tsx
 * <PageShell title="今日运势" backTo="/" gradient="teal-gold">
 *   <ActualContent />
 * </PageShell>
 * ```
 */
export function PageShell({
  title,
  subtitle,
  backTo,
  actions,
  gradient = "teal-gold",
  children,
  withTabBar = true,
  className = "",
}: PageShellProps) {
  const handleBack = () => {
    if (backTo) {
      window.location.href = backTo;
    } else {
      window.history.back();
    }
  };

  return (
    <main className={`min-h-screen bg-bg ${withTabBar ? "pb-20" : ""} ${className}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${GRADIENTS[gradient]} px-5 pt-6 pb-5 relative overflow-hidden`}>
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={handleBack}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{title}</h1>
            {subtitle && <p className="text-[11px] text-white/80 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-3">
        {children}
      </div>
    </main>
  );
}
