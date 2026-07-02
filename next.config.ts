import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // basePath removed — now deployed to independent subdomain h5.surplus.hi.cn
  images: {
    remotePatterns: [{ protocol: "https", hostname: "surplus.hi.cn" }],
  },
};

export default nextConfig;
