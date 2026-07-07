"use client";
import type { ModuleProps } from "./";

export default function ProductGridModule({ config }: ModuleProps) {
  const title = config?.title || "商品推荐";
  const columns = config?.columns || 2;

  return (
    <div className="px-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className="text-[11px] text-gray-400">查看更多 →</span>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[12px] overflow-hidden border border-gray-100">
            <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
              📦
            </div>
            <div className="p-2">
              <div className="text-[11px] text-gray-600 truncate">商品名称</div>
              <div className="text-[13px] font-medium text-brand-teal-dark mt-1">
                ¥0.00
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
