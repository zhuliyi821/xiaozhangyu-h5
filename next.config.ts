import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ws.hi.cn" }],
  },
  // ─── 路由重定向：门店体系统一到 /store ───
  async redirects() {
    return [
      { source: "/stores", destination: "/store", permanent: true },
      { source: "/store-services", destination: "/store", permanent: true },
    ];
  },
};

export default nextConfig;
