import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/decoration?store_id=10007
 * Proxies to PHP backend on same server
 */
export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("store_id");
  if (!storeId) {
    return NextResponse.json({ code: -1, msg: "store_id required" });
  }

  try {
    // Direct PHP via FastCGI? Use HTTP to local Nginx
    const url = `https://ws.hi.cn/plugins/api-store-decoration.php?api=decoration&store_id=${storeId}`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Host: "ws.hi.cn" },
    });
    if (!res.ok) {
      return NextResponse.json({ code: -1, msg: `upstream error: ${res.status}` });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ code: -1, msg: e.message });
  }
}
