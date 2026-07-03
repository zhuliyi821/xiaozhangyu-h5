import { NextRequest, NextResponse } from "next/server";

/**
 * 🔀 Next.js Middleware — 千店千面子域名路由
 *
 * 路由规则：
 *   store-{id}.ws.hi.cn/*   →  /store/{id}/*
 *   {tenant}.ws.hi.cn/*      →  /tenant/{tenant}/*
 *   h5.ws.hi.cn/*            →  (默认 H5 路由)
 *   merchant.ws.hi.cn/*      →  /merchant/*
 */

export function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // 提取子域名（第一个 . 之前的部分）
  const parts = hostname.split(".");
  // Only treat as subdomain if we have at least 3 parts AND the hostname is not an IP
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  // hostname = "store-10001.ws.hi.cn" → subdomain = "store-10001"
  // hostname = "h5.ws.hi.cn" → subdomain = "h5"
  // hostname = "127.0.0.1" → isIp = true → subdomain = null
  const subdomain =
    !isIp && parts.length >= 3 && parts[0] !== "www" ? parts[0] : null;

  // 处理通配子域名路由
  if (subdomain) {
    // 门店专属 H5: store-{id}.ws.hi.cn
    const storeMatch = subdomain.match(/^store-(\d+)$/);
    if (storeMatch) {
      const storeId = storeMatch[1];
      // 已经是 /store/{id} 路径 → 直接放行
      if (pathname.startsWith(`/store/${storeId}`)) {
        return NextResponse.next();
      }
      // 重写到 /store/{storeId}/{originalPath}
      const url = request.nextUrl.clone();
      url.pathname = `/store/${storeId}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    // SaaS 租户: {tenant}.ws.hi.cn
    if (
      subdomain !== "h5" &&
      subdomain !== "merchant" &&
      subdomain !== "admin" &&
      subdomain !== "invest" &&
      subdomain !== "region" &&
      subdomain !== "www"
    ) {
      // 非保留子域名 → 视为租户
      const url = request.nextUrl.clone();
      url.pathname = `/tenant/${subdomain}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // 只匹配需要中间件的路径，排除静态资源
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
