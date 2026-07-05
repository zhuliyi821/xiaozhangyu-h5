"use client";

import { AuthProvider } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const FortuneFloating = dynamic(() => import("@/components/fortune/fortune-floating"), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 不在 AI 会话页显示悬浮球（已有聊天窗口）
  const showFloating = !pathname?.startsWith("/ai");

  return (
    <AuthProvider>
      {children}
      {showFloating && <FortuneFloating />}
    </AuthProvider>
  );
}
