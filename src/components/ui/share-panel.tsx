"use client";

/**
 * 🖼️ 分享面板 — 只要微信
 *
 * 点击「分享到微信」→ 复制内容到剪贴板 → 尝试打开微信
 * 加一个「生成海报」作为辅助
 */

import { useEffect, useRef, useState } from "react";
import { X, ImageIcon } from "lucide-react";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

interface PosterData {
  /** 商品/页面标题 */
  title: string;
  /** 副标题/价格 */
  subtitle?: string;
  /** 描述 */
  desc?: string;
  /** 品牌名 */
  brand?: string;
  /** 分享链接（用于二维码） */
  url: string;
  /** 商品图 URL */
  imageUrl?: string;
  /** 背景色 */
  bgColor?: string;
}

interface PosterModalProps {
  data: PosterData;
  onClose: () => void;
}

// ─────── 海报 Canvas ───────
/** 生成海报 Canvas 并返回 Data URL */
async function generatePoster(data: PosterData): Promise<string> {
  const W = 600, H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 背景 — 使用品牌金青珊瑚色系
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#45CCD5");    // brand-teal
  bg.addColorStop(0.4, "#2BAAAF");  // brand-teal-dark
  bg.addColorStop(1, "#D99A0F");    // brand-gold-dark
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部装饰圆
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.arc(W - 80, -60, 200, 0, Math.PI * 2);
  ctx.fill();

  // Logo 区
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(80, 80, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐙", 80, 82);

  // 品牌名
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(data.brand || "小章鱼", 140, 70);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "14px system-ui";
  ctx.fillText("AI趣预测 · 门店优选", 140, 96);

  // 商品图区域
  const imgY = 160;
  const imgSize = 340;
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

  // 标题
  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleY = imgY + imgSize + 24;
  wrapText(ctx, data.title, W / 2, titleY, W - 80, 36, 2);

  // 价格 - 使用品牌金色
  if (data.subtitle) {
    ctx.fillStyle = "#F2B631";    // brand-gold
    ctx.font = "bold 32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(data.subtitle, W / 2, titleY + 56);
  }

  // 二维码（从服务器生成真实 QR Code）
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
    ctx.textBaseline = "middle";
    ctx.fillText("QR", W / 2, qrY + qrSize / 2);
  }

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
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
      if (lines >= maxLines) {
        ctx.fillText(line.substring(0, line.length - 1) + "...", x, y + (maxLines - 1) * lineHeight);
        return;
      }
      line = c;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, y + lines * lineHeight);
}

// ─────── 海报弹窗 ───────
export function PosterModal({ data, onClose }: PosterModalProps) {
  const [posterUrl, setPosterUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    generatePoster(data).then((url) => { setPosterUrl(url); setLoading(false); });
  }, [data]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function handleSave() {
    if (navigator.share && posterUrl) {
      try {
        const blob = await (await fetch(posterUrl)).blob();
        const file = new File([blob], "poster.png", { type: "image/png" });
        await navigator.share({ title: data.title, files: [file] });
        setSaved(true);
        setTimeout(onClose, 500);
        return;
      } catch {}
    }
    const a = document.createElement("a");
    a.href = posterUrl;
    a.download = "poster.png";
    a.click();
    setSaved(true);
    showToast("✅ 海报已保存");
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[8px] overflow-hidden max-w-[340px] w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold">分享海报</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-4 flex justify-center">
          {loading ? (
            <div className="w-[280px] h-[420px] bg-gray-100 rounded-[8px] animate-pulse flex items-center justify-center">
              <span className="text-xs text-gray-400">生成海报中...</span>
            </div>
          ) : (
            <img src={posterUrl} alt="分享海报" className="w-[280px] rounded-[8px] shadow-md" />
          )}
        </div>
        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {saved ? "✅ 已保存" : loading ? "⏳ 生成中..." : "💾 保存海报"}
          </button>
          <p className="text-[10px] text-gray-400 text-center">保存后可分享到微信朋友圈或发送给好友</p>
        </div>
      </div>
      {toastMsg && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] bg-black/80 text-white text-xs px-5 py-2.5 rounded-[8px] shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// ─────── 分享面板 — 只要微信 ───────
export default function SharePanel({ data, onClose }: { data: PosterData; onClose: () => void }) {
  const [mode, setMode] = useState<"menu" | "poster">("menu");
  const shareUrl = data.url || (typeof window !== "undefined" ? window.location.href : "");

  async function handleWeChat() {
    const content = buildShareText(
      data.title,
      data.desc || data.subtitle || "",
      shareUrl
    );
    await shareToWeChat(content);
    onClose();
  }

  if (mode === "poster") {
    return <PosterModal data={data} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[998] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-[24px] w-full max-w-[430px] p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="space-y-3">
          {/* 微信分享 — 独占按钮 */}
          <button
            onClick={handleWeChat}
            className="w-full py-4 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-sm font-semibold shadow-[0_4px_16px_rgba(69,204,213,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">💬</span>
            <span>分享到微信</span>
          </button>

          {/* 辅助: 生成海报 */}
          <button
            onClick={() => setMode("poster")}
            className="w-full py-3.5 rounded-[8px] bg-gray-50 text-gray-500 text-xs font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>生成分享海报</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-400 text-center mt-4">
          💡 已复制到剪贴板，去微信粘贴发送
        </div>
      </div>
    </div>
  );
}
