"use client";

/**
 * 🖼️ 分享海报生成器
 *
 * 在客户端用 Canvas 生成分享海报
 * 参考 YUNshop new-poster 风格: 商品图 + 价格 + 二维码 + 品牌信息
 */

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2 } from "lucide-react";

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

/** 生成海报 Canvas 并返回 Data URL */
async function generatePoster(data: PosterData): Promise<string> {
  const W = 600, H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0D9488");
  bg.addColorStop(0.5, "#0F766E");
  bg.addColorStop(1, "#115E59");
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

  // 如果有图片，尝试加载
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
    // 无图片时显示 emoji 占位
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

  // 价格
  if (data.subtitle) {
    ctx.fillStyle = "#FCD34D";
    ctx.font = "bold 32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(data.subtitle, W / 2, titleY + 56);
  }

  // 底部信息
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("长按识别 或 微信扫码", W / 2, H - 80);

  // 二维码占位区域
  const qrSize = 80;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect((W - qrSize) / 2, H - 140, qrSize, qrSize, 8);
  ctx.fill();

  // 二维码中放链接文字（简化版）
  ctx.fillStyle = "#333";
  ctx.font = "9px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const shortUrl = data.url.replace(/^https?:\/\//, "").substring(0, 18);
  ctx.fillText(shortUrl, W / 2, H - 100);

  // 底部品牌
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const chars = text.split("");
  let line = "";
  let lines = 0;
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
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + lines * lineHeight);
}

export function PosterModal({ data, onClose }: PosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [posterUrl, setPosterUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    generatePoster(data).then((url) => {
      setPosterUrl(url);
      setLoading(false);
    });
  }, [data]);

  async function handleSave() {
    // 尝试用 Web Share API 分享图片
    if (navigator.share && posterUrl) {
      try {
        const blob = await (await fetch(posterUrl)).blob();
        const file = new File([blob], "poster.png", { type: "image/png" });
        await navigator.share({ title: data.title, files: [file] });
        setSaved(true);
        return;
      } catch {}
    }
    // 降级：下载
    const a = document.createElement("a");
    a.href = posterUrl;
    a.download = "poster.png";
    a.click();
    setSaved(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] overflow-hidden max-w-[340px] w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold">分享海报</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Poster Preview */}
        <div className="p-4 flex justify-center">
          {loading ? (
            <div className="w-[280px] h-[420px] bg-gray-100 rounded-[16px] animate-pulse flex items-center justify-center">
              <span className="text-xs text-gray-400">生成海报中...</span>
            </div>
          ) : (
            <img src={posterUrl} alt="分享海报" className="w-[280px] rounded-[16px] shadow-md" />
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {saved ? "✅ 已保存" : loading ? "⏳ 生成中..." : "💾 保存海报 / 分享"}
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            保存后可分享到微信朋友圈或发送给好友
          </p>
        </div>
      </div>
    </div>
  );
}

/** 分享 + 海报一体化操作面板 */
export default function SharePanel({ data, onClose }: { data: PosterData; onClose: () => void }) {
  const [mode, setMode] = useState<"menu" | "poster">("menu");
  const shareUrl = data.url || (typeof window !== "undefined" ? window.location.href : "");

  async function handleShare(type: "link" | "poster") {
    if (type === "poster") {
      setMode("poster");
      return;
    }

    // Web Share
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.desc || data.subtitle || "", url: shareUrl });
        onClose();
        return;
      } catch {}
    }
    // Clipboard
    try {
      await navigator.clipboard.writeText(`${data.title}\n${shareUrl}`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = `${data.title}\n${shareUrl}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    alert("✅ 链接已复制");
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
        <h3 className="text-sm font-semibold text-center mb-6">分享到</h3>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <button onClick={() => handleShare("link")} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-[20px] bg-green-500 flex items-center justify-center text-white text-2xl shadow-sm">
              💬
            </div>
            <span className="text-[11px] text-gray-600">微信</span>
          </button>
          <button onClick={() => handleShare("link")} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-[20px] bg-green-600 flex items-center justify-center text-white text-2xl shadow-sm">
              🌐
            </div>
            <span className="text-[11px] text-gray-600">朋友圈</span>
          </button>
          <button onClick={() => handleShare("poster")} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-[20px] bg-brand-teal flex items-center justify-center text-white text-2xl shadow-sm">
              🖼️
            </div>
            <span className="text-[11px] text-gray-600">生成海报</span>
          </button>
          <button onClick={() => handleShare("link")} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-[20px] bg-gray-100 flex items-center justify-center text-gray-500 text-2xl shadow-sm">
              🔗
            </div>
            <span className="text-[11px] text-gray-600">复制链接</span>
          </button>
        </div>

        <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-500 rounded-[14px] text-sm font-medium">
          取消
        </button>
      </div>
    </div>
  );
}
