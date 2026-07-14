"use client";

/** ⏳ 通用骨架屏 — 适配多种形状 */
interface SkeletonProps {
  /** 预设形状 */
  variant?: "text" | "card" | "circle" | "chart" | "list" | "banner";
  className?: string;
}

export function Skeleton({ variant = "text", className = "" }: SkeletonProps) {
  const base = "bg-gray-100 rounded animate-pulse";

  const shapes: Record<string, string> = {
    text: "h-4 w-full rounded",
    card: "h-24 w-full rounded-[12px]",
    circle: "h-10 w-10 rounded-full",
    chart: "h-[120px] w-full rounded-[8px]",
    list: "h-12 w-full rounded-[8px]",
    banner: "h-16 w-full rounded-[10px]",
  };

  return <div className={`${base} ${shapes[variant]} ${className}`} />;
}

/** 卡片骨架屏：3 行文本 + 底栏 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-[12px] border border-brand-teal/10 p-4 space-y-3">
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="card" />
      <div className="flex gap-2">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
  );
}
