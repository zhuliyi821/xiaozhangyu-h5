"use client";

import { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

interface FortuneShareProps {
  score: number;
  tag: string;
  dimensions: Record<string, { score: number; level: string }>;
  advice: { do: string[]; dont: string[] };
  lucky: { color: string; color_hex: string; numbers: number[]; direction: string };
  bestHour: { name: string; score: number };
}

const DIM_ICONS: Record<string, string> = { wealth: "💰", love: "❤️", career: "💼", health: "🏥", social: "👥" };
const DIM_LABELS: Record<string, string> = { wealth: "财运", love: "感情", career: "事业", health: "健康", social: "社交" };

export default function FortuneShare({ score, tag, dimensions, advice, lucky, bestHour }: FortuneShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);

  const generatePoster = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const W = 540, H = 960;
    canvas.width = W; canvas.height = H;

    // 背景渐变 — 品牌金青珊瑚色系
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#45CCD5");    // brand-teal
    grad.addColorStop(0.5, "#2BAAAF");  // brand-teal-dark
    grad.addColorStop(1, "#D99A0F");    // brand-gold-dark
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 装饰光晕
    ctx.save();
    ctx.globalAlpha = 0.08;
    const g2 = ctx.createRadialGradient(270, 200, 10, 270, 200, 250);
    g2.addColorStop(0, "#F2B631");    // brand-gold
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 标题
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
    ctx.fillText("🐙 小章鱼", W / 2, 60);
    ctx.font = "bold 22px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
    ctx.fillText("每日一卦", W / 2, 92);

    // 分隔线
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(W - 60, 110);
    ctx.stroke();

    // 综合评分
    ctx.fillStyle = "#F5A623";
    ctx.font = "bold 72px 'PingFang SC', sans-serif";
    ctx.fillText(String(score), W / 2, 210);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "16px 'PingFang SC', sans-serif";
    ctx.fillText(`综合运势 · ${tag}`, W / 2, 238);

    // 星星
    const stars = Math.round(score / 20);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#F5A623";
    ctx.fillText("⭐".repeat(stars) + "☆".repeat(5 - stars), W / 2, 262);

    // 维度卡片
    const dimEntries = Object.entries(dimensions).slice(0, 5);
    const cardW = (W - 80) / 5;
    dimEntries.forEach(([key, dim], i) => {
      const x = 40 + i * cardW;
      const y = 290;
      const cw = cardW - 8;

      // 卡片背景
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(x, y, cw, 80, 10);
      ctx.fill();

      // 图标
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(DIM_ICONS[key] || "📊", x + cw / 2, y + 28);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px 'PingFang SC', sans-serif";
      ctx.fillText(DIM_LABELS[key] || key, x + cw / 2, y + 48);
      ctx.fillStyle = "#F5A623";
      ctx.font = "bold 18px 'PingFang SC', sans-serif";
      ctx.fillText(String(dim.score), x + cw / 2, y + 72);
    });

    // 宜忌
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "15px 'PingFang SC', sans-serif";
    if (advice.do.length) {
      ctx.fillStyle = "#7ED321";
      ctx.fillText("✅ 宜：" + advice.do.slice(0, 3).join(" · "), 40, 420);
    }
    if (advice.dont.length) {
      ctx.fillStyle = "#FF5252";
      ctx.fillText("❌ 忌：" + advice.dont.slice(0, 3).join(" · "), 40, 450);
    }

    // 幸运信息
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "13px 'PingFang SC', sans-serif";
    let ly = 490;
    ctx.fillText("🎨 幸运色：" + lucky.color, 40, ly);
    ly += 28;
    ctx.fillText("🔢 幸运数字：" + lucky.numbers.join("、"), 40, ly);
    ly += 28;
    ctx.fillText("📍 幸运方位：" + lucky.direction, 40, ly);
    ly += 28;
    ctx.fillText("⏰ 最佳时段：" + bestHour.name, 40, ly);

    // 分隔线
    ly += 20;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(60, ly);
    ctx.lineTo(W - 60, ly);
    ctx.stroke();

    // 箴言
    ly += 24;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "14px 'PingFang SC', sans-serif";
    ctx.fillText("小章鱼箴言：", W / 2, ly);
    ly += 26;
    ctx.font = "13px 'PingFang SC', sans-serif";
    ctx.fillText("机会像八爪鱼一样多，但抓住最重要的一只就够了", W / 2, ly);

    // 底部
    const by = H - 70;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "11px 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("扫码查看你的运势", W / 2, by + 18);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.font = "10px 'PingFang SC', sans-serif";
    ctx.fillText("小章鱼 · AI趣预测", W / 2, by + 38);

    // 免责
    ctx.fillStyle = "rgba(255,200,200,0.15)";
    ctx.font = "9px 'PingFang SC', sans-serif";
    ctx.fillText("⚠️ 仅供娱乐参考，生活由自己做主", W / 2, by + 55);

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  };

  const handleShare = async () => {
    setSaving(true);
    try {
      const blob = await generatePoster();
      const text = buildShareText(
        "小章鱼每日一卦",
        `今日运势 ${score}分 ${tag} · ${Object.entries(dimensions).slice(0,5).map(([k,v]) => `${k}${v.score}`).join(" ")}`
      );
      if (blob) {
        // 有海报 = 复制海报 + 文字
        const url = URL.createObjectURL(blob);
        // 复制文字 + 海报 URL (用户去微信里贴)
        await shareToWeChat(`${text}\n海报: ${url}`);
      } else {
        await shareToWeChat(text);
      }
    } catch {}
    setSaving(false);
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        onClick={handleShare}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-brand-teal-light/30 to-brand-teal/20 border border-brand-teal/30 active:scale-95 transition-transform shadow-sm disabled:opacity-50"
      >
        <Share2 className="w-3 h-3 text-brand-teal" />
        <span className="text-brand-teal-dark">{saving ? "生成中…" : "分享到微信"}</span>
      </button>
    </>
  );
}
