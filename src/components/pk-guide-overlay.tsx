"use client";

/**
 * 🎯 PK大厅首次访问引导 — 4步功能高亮
 *
 * localStorage 标记 seen_pk_guide，仅展示一次
 */
import { useState, useEffect } from "react";

const STEPS = [
  { icon: "🔥", title: "实时沸腾榜", desc: "看看现在大家都在吵什么" },
  { icon: "🏠", title: "6大品类", desc: "家庭·社会·体育·突发·消费·全部" },
  { icon: "👥", title: "围观·投票", desc: "围观别人PK，投出你的一票" },
  { icon: "⚡", title: "发起PK", desc: "说不清的道理？发起话题让众人来评" },
];

export default function PKGuideOverlay() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("seen_pk_guide");
      if (!seen) setVisible(true);
    }
  }, []);

  const handleDone = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("seen_pk_guide", "1");
    }
    setVisible(false);
  };

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-[16px] w-full max-w-[320px] p-6 text-center shadow-2xl">
        <div className="text-[36px] mb-3">{s.icon}</div>
        <div className="text-[17px] font-bold text-text-primary mb-2">{s.title}</div>
        <div className="text-[12px] text-text-tertiary mb-6">{s.desc}</div>

        {/* 步骤指示器 */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-brand-teal w-5" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={handleDone}
            className="flex-1 py-2.5 bg-gray-50 text-text-secondary rounded-[10px] text-[12px] font-medium active:scale-95 transition-transform"
            aria-label="跳过引导">
            跳过
          </button>
          <button onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleDone()}
            className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[10px] text-[12px] font-semibold active:scale-95 transition-transform shadow-sm"
            aria-label={step < STEPS.length - 1 ? "下一步" : "开始体验"}>
            {step < STEPS.length - 1 ? "下一步" : "开始体验"}
          </button>
        </div>
      </div>
    </div>
  );
}
