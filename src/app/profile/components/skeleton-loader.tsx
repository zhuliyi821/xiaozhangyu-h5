"use client";

/** 🦴 骨架屏：页面整体加载时的占位效果（v4 5模块） */
export default function ProfileSkeleton() {
  return (
    <main className="pb-20">
      {/* ① Header skeleton */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-5 pt-4 pb-9 text-white rounded-b-[28px]">
        <div className="flex items-center gap-3">
          <div className="w-[52px] h-[52px] rounded-full bg-white/20 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/15 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* ② Asset skeleton (4-grid) */}
      <div className="mx-4 -mt-5">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-[10px] py-3 text-center shadow-sm border border-gray-100 animate-pulse">
              <div className="w-5 h-5 bg-gray-100 rounded-full mx-auto mb-1" />
              <div className="h-4 w-12 bg-gray-100 rounded mx-auto mb-0.5" />
              <div className="h-2.5 w-10 bg-gray-50 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* ③ Tasks skeleton (3 items) */}
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2.5 bg-white rounded-[10px] p-2.5 mb-1.5 border border-gray-100 animate-pulse">
            <div className="w-[18px] h-[18px] rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* ④ Quick grid skeleton (4×2) */}
      <div className="mx-4 mt-3">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-[10px] py-3 text-center shadow-sm border border-gray-100 animate-pulse">
              <div className="w-5 h-5 bg-gray-100 rounded-full mx-auto mb-1" />
              <div className="h-3 w-10 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* ⑤ Invite skeleton */}
      <div className="mx-4 mt-3">
        <div className="rounded-[12px] p-4 border border-gray-100 animate-pulse">
          <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
          <div className="h-3 w-40 bg-gray-50 rounded mb-3" />
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-100 rounded-[8px]" />
            <div className="flex-1 h-8 bg-gray-100 rounded-[8px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
