import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/client-layout";
import ConditionalTabBar from "@/components/ui/conditional-tab-bar";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "小章鱼 · AI趣预测",
  description: "AI驱动 · 全民预测 · 有奖PK",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "小章鱼",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F27152",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="application-name" content="小章鱼" />
      </head>
      <body>
        <PwaRegister />
        <ClientLayout>
          {children}
          <ConditionalTabBar />
        </ClientLayout>
      </body>
    </html>
  );
}
