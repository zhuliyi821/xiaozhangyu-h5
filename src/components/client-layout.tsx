"use client";

import { AuthProvider } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initWeChatSdk, setWeChatShare } from "@/lib/wechat-jssdk";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 初始化微信 JS-SDK（仅微信浏览器内生效）
  useEffect(() => {
    const isWeChat = /micromessenger/i.test(navigator.userAgent);
    if (!isWeChat) return;

    const url = window.location.href;
    initWeChatSdk(url).then(() => {
      // 设置默认分享卡片
      setWeChatShare({
        title: "小章鱼 · AI趣预测",
        desc: "AI驱动 · 全民预测 · 有奖PK",
        link: url,
        imgUrl: "https://ws.hi.cn/favicon.svg",
      });
    });
  }, [pathname]);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
