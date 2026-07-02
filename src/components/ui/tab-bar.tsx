"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Store, User, Bot } from "lucide-react";

const tabs: { href: string; label: string; icon: any; badge?: boolean }[] = [
  { href: "/", label: "首页", icon: Home },
  { href: "/predict", label: "预测", icon: Sparkles },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/store", label: "门店", icon: Store, badge: true },
  { href: "/profile", label: "我的", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-white/85 backdrop-blur-[20px] saturate-180 border-t border-[rgba(69,204,213,0.12)] flex justify-around items-start pt-[6px] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-[2px] px-3 py-[2px] rounded-xl active:scale-90 transition-transform relative"
          >
            <div
              className={`w-7 h-7 flex items-center justify-center text-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-xl text-white shadow-[0_2px_8px_rgba(69,204,213,0.3)]"
                  : ""
              }`}
            >
              <Icon className="w-[16px] h-[16px]" />
              {tab.badge && (
                <span className="absolute top-0 right-[-2px] w-2 h-2 bg-brand-coral rounded-full border-2 border-white" />
              )}
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-brand-teal-dark font-semibold" : "text-gray-400"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
