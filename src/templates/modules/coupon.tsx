"use client";
import type { ModuleProps } from "./";

export default function CouponModule({ config }: ModuleProps) {
  const title = config?.title || "限时优惠";

  return (
    <div className="px-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className="text-[11px] text-gray-400">查看更多 →</span>
      </div>
      <div className="bg-white rounded-[8px] border border-gray-100 overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center p-3 border-b border-gray-50 last:border-b-0"
          >
            <div className="w-16 h-10 rounded-lg bg-brand-teal-light/30 flex items-center justify-center text-brand-teal-dark font-bold text-sm mr-3">
              ¥5
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-gray-700">满减优惠券</div>
              <div className="text-[10px] text-gray-400 mt-0.5">满50元可用</div>
            </div>
            <button className="text-[11px] text-brand-teal-dark font-medium bg-brand-teal-light/30 px-3 py-1.5 rounded-full">
              领取
            </button>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-400 text-center mt-1.5">
        已领 128 张
      </div>
    </div>
  );
}
