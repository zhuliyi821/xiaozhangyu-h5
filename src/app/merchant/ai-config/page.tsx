"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, CheckCircle2, Loader2, Clock, X } from "lucide-react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA" };

const EMPLOYEES = [
  { code: "zhang-guanshi", icon: "📋", name: "章管事", desc: "AI店长 · 经营日报/库存预警/客流分析", color: C.coral, accent: "#FDE8E4", tier: "free", features: ["📊 每日经营日报", "📦 库存预警通知", "🌙 晚间营业准备"] },
  { code: "zhang-suanpan", icon: "🧮", name: "章算盘", desc: "AI财务 · 财务报表/成本分析/利润趋势", color: C.gold, accent: "#FEF3D5", tier: "pro", features: ["💰 财务报表生成", "📉 成本分析报告", "📈 利润趋势分析"] },
  { code: "zhang-erzhang", icon: "📈", name: "章二涨", desc: "AI增长 · 定价建议/促销策略", color: C.purple, accent: "#EDE9FE", tier: "pro", features: ["🏷️ 智能定价建议", "🎯 促销活动方案"] },
  { code: "zhang-xiaomi", icon: "💬", name: "章小蜜", desc: "AI客服 · 智能回复/客户分析/满意度", color: C.teal, accent: "#D5F5F7", tier: "free", features: ["⭐ 客户满意度分析", "🔥 热门商品排行", "👥 客户画像"] },
];

const SCHEDULE_OPTIONS = [
  { value: "30 8 * * *", label: "每日 08:30", desc: "上班前收到报告" },
  { value: "0 12 * * *", label: "每日 12:00", desc: "午间查看" },
  { value: "0 18 * * *", label: "每日 18:00", desc: "下班前查看" },
  { value: "30 20 * * *", label: "每日 20:30", desc: "晚间营业准备" },
  { value: "0 9 * * 1", label: "每周一 09:00", desc: "周报" },
];

export default function AiConfigPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    // 加载引擎中的已订阅状态
    fetch(`/api/employees/logs?merchant_id=${user.uid}&limit=1`)
      .then(r => r.json())
      .then(d => {
        // 如果能获取到log说明引擎在线
        console.log("Engine connected");
      })
      .catch(() => {});
  }, [user]);

  const toggleSubscribe = async (code: string) => {
    setSaving(code);
    const newVal = !subscriptions[code];
    try {
      const r = await fetch("/api/employees/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: user?.uid || 1,
          skill_code: code,
          tier: EMPLOYEES.find(e => e.code === code)?.tier || "free",
          days: 30,
        }),
      });
      const j = await r.json();
      if (j.success) {
        setSubscriptions(prev => ({ ...prev, [code]: newVal }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(null);
  };

  const setSchedule = async (code: string, cron: string) => {
    try {
      const r = await fetch("/api/employees/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: user?.uid || 1,
          skill_code: code,
          config: { cron, enabled: true },
        }),
      });
      const j = await r.json();
      if (j.success) {
        setSchedules(prev => ({ ...prev, [code]: cron }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
  };

  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-gray-600 text-lg">←</button>
            <h1 className="text-base font-semibold">AI员工订阅</h1>
          </div>
          {saved && (
            <span className="text-[11px] text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 已保存
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {EMPLOYEES.map(emp => (
          <div key={emp.code} className="bg-white rounded-[12px] p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: emp.accent }}>{emp.icon}</div>
                <div>
                  <div className="text-sm font-semibold">{emp.name}</div>
                  <div className="text-[11px] text-gray-500">{emp.desc}</div>
                </div>
              </div>
              <button onClick={() => toggleSubscribe(emp.code)} disabled={saving === emp.code}
                className="relative w-12 h-6 rounded-full transition-all"
                style={{
                  backgroundColor: subscriptions[emp.code] !== false ? emp.color : "#ddd"
                }}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  subscriptions[emp.code] !== false ? "left-[26px]" : "left-0.5"
                }`} />
              </button>
            </div>

            {/* Features */}
            <div className="space-y-1.5 mb-3">
              {emp.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-gray-600">
                  <span className="text-gray-400">{f}</span>
                </div>
              ))}
            </div>

            {/* Schedule */}
            {subscriptions[emp.code] !== false && (
              <div className="border-t border-gray-50 pt-3 mt-1">
                <div className="flex items-center gap-1.5 mb-2 text-[11px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  定时推送
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {SCHEDULE_OPTIONS.slice(0, 3).map(opt => (
                    <button key={opt.value} onClick={() => setSchedule(emp.code, opt.value)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                        schedules[emp.code] === opt.value
                          ? "text-white border-transparent"
                          : "text-gray-500 border-gray-200"
                      }`}
                      style={schedules[emp.code] === opt.value ? { backgroundColor: emp.color } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tier badge */}
            <div className="mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                emp.tier === "free" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
              }`}>
                {emp.tier === "free" ? "🆓 免费" : "⭐ Pro"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="px-4 pb-8 text-center">
        <p className="text-[10px] text-gray-400 mt-4">AI员工数据基于门店经营数据生成，定时推送至商户后台</p>
        <a href="/merchant/ai-reports" className="inline-block mt-2 text-[11px] text-brand-teal underline">
          查看历史报告 →
        </a>
      </div>
    </main>
  );
}
