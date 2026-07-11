"use client";

/** 🦴 骨架屏：页面整体加载时的占位效果 */
export default function ProfileSkeleton() {
  return (
    <main className="pb-20">
      {/* Header skeleton */}
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

      {/* Asset skeleton */}
      <div className="mx-4 -mt-5">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[10px] p-3.5 text-center shadow-sm border border-gray-100">
              <div className="w-5 h-5 bg-gray-100 rounded-full mx-auto mb-1 animate-pulse" />
              <div className="h-5 w-14 bg-gray-100 rounded mx-auto mb-0.5 animate-pulse" />
              <div className="h-3 w-10 bg-gray-50 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="mx-4 mt-3">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[10px] p-3 text-center shadow-sm border border-gray-100">
              <div className="w-5 h-5 bg-gray-100 rounded-full mx-auto mb-1 animate-pulse" />
              <div className="h-3 w-14 bg-gray-100 rounded mx-auto mb-0.5 animate-pulse" />
              <div className="h-2 w-10 bg-gray-50 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Service list skeleton */}
      <div className="mt-4 px-4 space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-[10px] py-3.5 px-4 shadow-sm border border-gray-100">
            <div className="w-9 h-9 rounded-[10px] bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-2.5 w-14 bg-gray-50 rounded animate-pulse" />
            </div>
            <div className="w-3 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
