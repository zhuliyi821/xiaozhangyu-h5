"use client";

import { useEffect, useState } from "react";

/* ── 喜悦彩蛋管理器 ── */

export function useDelight() {
  const [celebration, setCelebration] = useState<{ type: string; message: string } | null>(null);

  const celebrate = (type: string, message: string) => {
    setCelebration({ type, message });
    setTimeout(() => setCelebration(null), 2500);
  };

  return { celebration, celebrate };
}

/* ── 金色涟漪效果 ── */
export function GoldRipple({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {[...Array(3)].map((_, i) => (
        <div key={i}
          className="absolute w-32 h-32 rounded-full border-2 border-brand-gold opacity-0 animate-ping"
          style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}

/* ── 触手加载动画 ── */
export function TentacleLoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i}
            className="w-3 h-8 rounded-full bg-gradient-to-t from-brand-teal to-brand-teal-light animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, height: `${16 + i * 8}px` }}
          />
        ))}
      </div>
      <span className="text-[11px] text-text-tertiary animate-pulse">{text || "章鱼正在思考…"}</span>
    </div>
  );
}

/* ── 结果揭示动画 ── */
export function RevealContainer({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── 分数庆祝动画 ── */
export function ScoreCelebration({ score }: { score: number }) {
  if (score < 60) return null;
  return (
    <div className="flex items-center gap-1">
      {score >= 80 ? (
        <>
          <span className="text-[14px] animate-bounce" style={{animationDuration:"1s"}}>🌟</span>
          <span className="text-[10px] text-brand-gold font-bold animate-pulse">大吉</span>
        </>
      ) : (
        <>
          <span className="text-[12px] animate-bounce" style={{animationDuration:"1.5s"}}>✨</span>
          <span className="text-[10px] text-brand-teal font-medium">中吉</span>
        </>
      )}
    </div>
  );
}

/* ── 趣味空状态 ── */
export function EmptyState({ icon, title, subtitle, action }: { icon: string; title: string; subtitle: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-4xl mb-4 animate-bounce" style={{animationDuration:"2s"}}>{icon}</div>
      <div className="text-sm font-bold text-text-primary mb-1">{title}</div>
      <div className="text-[11px] text-text-tertiary mb-4">{subtitle}</div>
      {action && (
        <button onClick={action.onClick}
          className="bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium px-5 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm hover:shadow-md">
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ── 🎉 五彩纸屑效果 ── */
export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#F2B631", "#45CCD5", "#F27152", "#A0EDF2", "#FCE7A8", "#FABAA8"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(20)].map((_, i) => {
        const color = colors[i % colors.length];
        const left = 5 + Math.random() * 90;
        const delay = Math.random() * 1;
        const size = 4 + Math.random() * 6;
        return (
          <div key={i}
            className="absolute top-0 rounded-sm opacity-0"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              animation: `confetti-fall ${1 + Math.random()}s ease-out ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── 数字跳动效果 ── */
export function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display}</>;
}
