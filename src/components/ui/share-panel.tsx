"use client";

/**
 * 🖼️ 分享面板 v2 — 微信 + 朋友圈
 *
 * 两个主选项：
 *   1. 💬 微信好友  → 复制链接，提示去微信粘贴
 *   2. 🌟 朋友圈    → 生成海报图片，保存后去朋友圈发图
 *
 * 微信内置浏览器内，右上角「...」由 JS-SDK 拦截；
 * 本面板处理用户主动点击分享按钮的场景。
 */

import { useState, useEffect } from "react";
import { X, ImageIcon, Share2, Download } from "lucide-react";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import { C } from "@/lib/brand-colors";

interface PosterData {
  title: string;
  subtitle?: string;
  desc?: string;
  brand?: string;
  url: string;
  imageUrl?: string;
  bgColor?: string;
}

interface SharePanelProps {
  data: PosterData;
  onClose: () => void;
}

// ─────── 海报生成 ───────
async function generatePoster(data: PosterData): Promise<string> {
  const W = 600, H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.teal);
  bg.addColorStop(0.4, C.tealDark);
  bg.addColorStop(1, C.goldDark);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.arc(W - 80, -60, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(80, 80, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐙", 80, 82);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(data.brand || "小章鱼", 140, 70);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "14px system-ui";
  ctx.fillText("AI趣预测 · 门店优选", 140, 96);

  const imgY = 160, imgSize = 340;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.roundRect((W - imgSize) / 2, imgY, imgSize, imgSize, 20);
  ctx.fill();

  if (data.imageUrl) {
    try {
      const img = await loadImage(data.imageUrl);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect((W - imgSize) / 2, imgY, imgSize, imgSize, 20);
      ctx.clip();
      ctx.drawImage(img, (W - imgSize) / 2, imgY, imgSize, imgSize);
      ctx.restore();
    } catch {}
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "100px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎁", W / 2, imgY + imgSize / 2);
  }

  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleY = imgY + imgSize + 24;
  wrapText(ctx, data.title, W / 2, titleY, W - 80, 36, 2);

  if (data.subtitle) {
    ctx.fillStyle = C.gold;
    ctx.font = "bold 32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(data.subtitle, W / 2, titleY + 56);
  }

  const qrSize = 100;
  const qrX = (W - qrSize) / 2;
  const qrY = H - 170;
  const qrUrl = `/api/wechat?action=qrcode&text=${encodeURIComponent(data.url || window.location.href)}&size=10&margin=2`;
  try {
    const qrImg = await loadImage(qrUrl);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 8);
    ctx.clip();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 8);
    ctx.fill();
    ctx.fillStyle = "#999";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("QR", W / 2, qrY + qrSize / 2);
  }

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("微信扫码查看详情", W / 2, qrY - 22);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "11px system-ui";
  ctx.fillText("小章鱼 · AI趣预测", W / 2, H - 30);

  return canvas.toDataURL("image/png");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const chars = text.split("");
  let line = "", lines = 0;
  for (const c of chars) {
    const test = line + c;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines++;
      if (lines >= maxLines) { ctx.fillText(line.substring(0, line.length - 1) + "...", x, y + (maxLines - 1) * lineHeight); return; }
      line = c;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, y + lines * lineHeight);
}

// ─────── 海报预览弹窗 ───────
function PosterPreview({ data, onBack }: { data: PosterData; onBack: () => void }) {
  const [posterUrl, setPosterUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => { generatePoster(data).then(u => { setPosterUrl(u); setLoading(false); }); }, [data]);

  const handleSave = async () => {
    if (!posterUrl) return;
    if (navigator.share && posterUrl) {
      try {
        const blob = await (await fetch(posterUrl)).blob();
        const file = new File([blob], "poster.png", { type: "image/png" });
        await navigator.share({ title: data.title, files: [file] });
        setSaved(true);
        return;
      } catch {}
    }
    const a = document.createElement("a");
    a.href = posterUrl;
    a.download = "poster.png";
    a.click();
    setSaved(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-xs text-brand-teal">&larr; 返回</button>
        <h3 className="text-sm font-semibold">分享海报</h3>
        <div className="w-8" />
      </div>
      <div className="flex justify-center mb-3">
        {loading ? (
          <div className="w-[280px] h-[420px] bg-gray-100 rounded-[8px] animate-pulse flex items-center justify-center">
            <span className="text-xs text-gray-400">生成中...</span>
          </div>
        ) : (
          <img src={posterUrl} alt="分享海报" className="w-[280px] rounded-[8px] shadow-md" />
        )}
      </div>
      <button onClick={handleSave} disabled={loading || saved}
        className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50">
        {saved ? "✅ 已保存" : loading ? "⏳ 生成中..." : "💾 保存海报"}
      </button>
      <p className="text-[10px] text-gray-400 text-center mt-2">保存后可发朋友圈</p>
    </div>
  );
}

// ─────── 主分享面板：微信 + 朋友圈 ───────
export default function SharePanel({ data, onClose }: SharePanelProps) {
  const [mode, setMode] = useState<"menu" | "poster">("menu");
  const baseUrl = data.url || (typeof window !== "undefined" ? window.location.href : "");
  // 自动带上邀请参数
  const shareUrl = (() => {
    try {
      const raw = localStorage.getItem("xiaozhangyu_user");
      if (raw) {
        const u = JSON.parse(raw);
        const sep = baseUrl.includes("?") ? "&" : "?";
        return `${baseUrl}${sep}ref=${u.uid}`;
      }
    } catch {}
    return baseUrl;
  })();

  async function handleWeChat() {
    // 如果在小程序 web-view 内 → 跳转原生分享页
    if (typeof window !== "undefined" && (window as any).wx?.miniProgram) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get("product_id") || "";
      const storeId = window.location.pathname.match(/\/store\/(\d+)/)?.[1] || "";
      (window as any).wx.miniProgram.navigateTo({
        url: `/pages/product/product?id=${productId}&store_id=${storeId}&title=${encodeURIComponent(data.title)}&img=${encodeURIComponent(data.imageUrl || "")}`,
      });
      onClose();
      return;
    }

    const { shareToWeChat, buildShareText } = await import("@/lib/share-to-wechat");
    const { initWeChatSdk, setWeChatShare } = await import("@/lib/wechat-jssdk");
    const shareUrl = data.url || window.location.href;
    const title = data.title;
    const desc = data.desc || data.subtitle || "";
    
    // 1) 尝试 Web Share API（原生分享到微信/其他App）
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: `${title}\n${desc}`, url: shareUrl });
        onClose();
        return;
      } catch (e: any) {
        if (e.name === "AbortError") { onClose(); return; } // 用户取消
        // 其他错误 fallthrough
      }
    }

    // 2) 在微信浏览器内 → 配置右上角「...」分享卡片 + 引导用户操作
    const isWeChat = /micromessenger/i.test(navigator.userAgent);
    if (isWeChat) {
      try {
        await initWeChatSdk(shareUrl);
        setWeChatShare({ title, desc, link: shareUrl, imgUrl: data.imageUrl || "/icons/icon-192.png" });
      } catch {}
      // 微信内：复制链接 + 提示用户点「...」分享
      await shareToWeChat(`${title}\n${desc}\n${shareUrl}`);
      onClose();
      return;
    }

    // 3) 其他浏览器 → 复制到剪贴板
    const content = buildShareText(title, desc, shareUrl);
    await shareToWeChat(content);
    onClose();
  }

  function handleMoments() {
    setMode("poster");
  }

  if (mode === "poster") {
    return (
      <div className="fixed inset-0 z-[998] bg-black/70 flex items-end justify-center" onClick={onClose}>
        <div className="bg-white rounded-t-[24px] w-full max-w-[430px]" onClick={e => e.stopPropagation()}>
          <PosterPreview data={data} onBack={() => setMode("menu")} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[998] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-[24px] w-full max-w-[430px] p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <h3 className="text-sm font-semibold text-center mb-5">分享到</h3>

        <div className="flex justify-center gap-8">
          {/* ① 微信好友 */}
          <button onClick={handleWeChat}
            className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
            <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center shadow-lg shadow-brand-teal/25">
              <span className="text-2xl">💬</span>
            </div>
            <span className="text-[11px] font-medium text-text-primary">微信好友</span>
          </button>

          {/* ② 朋友圈 */}
          <button onClick={handleMoments}
            className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
            <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center shadow-lg shadow-brand-gold/25">
              <span className="text-2xl">🌟</span>
            </div>
            <span className="text-[11px] font-medium text-text-primary">朋友圈</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-400 text-center mt-6">
          分享给小章鱼的好友们
        </div>

        <button onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-[8px] text-[11px] text-gray-400 active:scale-95 transition-transform">
          取消
        </button>
      </div>
    </div>
  );
}
