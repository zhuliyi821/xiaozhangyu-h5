import type { Metadata } from "next";
import "./globals.css";
import { TabBar } from "@/components/ui/tab-bar";
import ClientLayout from "@/components/client-layout";
import ConditionalTabBar from "@/components/ui/conditional-tab-bar";

export const metadata: Metadata = {
  title: "小章鱼 · AI趣预测",
  description: "AI驱动 · 全民预测 · 有奖PK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ClientLayout>
          {children}
          <ConditionalTabBar />
        </ClientLayout>
      </body>
    </html>
  );
}
