// 小章鱼 Service Worker v2 — 分层缓存策略
const CACHE_NAME = "xiaozhangyu-v2";
const APP_SHELL = ["/", "/ai-predictions", "/pk-hall", "/assets", "/btc", "/fortune", "/lotto"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn("[SW] Shell cache partial:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // ── 静态资源：Cache-first（速度优先）──
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // ── API 请求：Network-only（数据新鲜）──
  if (url.pathname.startsWith("/api/") || url.pathname.includes("wallet_api")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ code: -1, msg: "网络离线" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // ── 页面导航：Network-first（优先网络，离线回退缓存）──
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        if (clone.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/")))
  );
});
