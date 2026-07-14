"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import { Bot, Sparkles, Settings, Clock, CheckCircle2, XCircle, RefreshCw, Zap, Loader2 } from "lucide-react";
import { C } from "@/lib/brand-colors";


const EMPLOYEES = [
  { code: "zhang-guanshi", icon: "📋", name: "章管事", desc: "经营日报/库存预警", color: C.coral, accent: "#FDE8E4" },
  { code: "zhang-suanpan", icon: "🧮", name: "章算盘", desc: "财务分析/成本报告", color: C.gold, accent: "#FEF3D5" },
  { code: "zhang-erzhang", icon: "📈", name: "章二涨", desc: "定价/促销策略", color: C.purple, accent: "#EDE9FE" },
  { code: "zhang-xiaomi", icon: "💬", name: "章小蜜", desc: "客服/客户分析", color: C.teal, accent: "#D5F5F7" },
];

const TASK_ACTIONS: Record<string, { key: string; label: string; icon: string }[]> = {
  "zhang-guanshi": [
    { key: "daily_report", label: "经营日报", icon: "📊" },
    { key: "inventory_alert", label: "库存预警", icon: "📦" },
    { key: "evening_prep", label: "晚间准备", icon: "🌙" },
  ],
  "zhang-suanpan": [
    { key: "finance_report", label: "财务报表", icon: "💰" },
    { key: "cost_analysis", label: "成本分析", icon: "📉" },
  ],
  "zhang-erzhang": [
    { key: "pricing_advice", label: "定价建议", icon: "🏷️" },
    { key: "promotion_plan", label: "促销方案", icon: "🎯" },
  ],
  "zhang-xiaomi": [
    { key: "satisfaction", label: "满意度分析", icon: "⭐" },
    { key: "hot_products", label: "热门商品", icon: "🔥" },
  ],
};

export default function AiReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("zhang-guanshi");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadReports();
  }, [user, activeTab]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v2/merchant/ai-reports?limit=20`);
      const j = await r.json();
      if (j.code === 0) setReports(j.data || []);
    } catch {}
    setLoading(false);
  };

  const filtered = reports.filter(r => r.skill_code === activeTab);

  const doGenerate = async (taskKey: string, label: string) => {
    if (!user?.uid) return;
    setGenerating(taskKey);
    try {
      const r = await fetch("/api/employees/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_code: activeTab,
          task: taskKey,
          merchant_id: user.uid,
          params: {},
        }),
      });
      const j = await r.json();
      if (j.success || j.content) {
        setTimeout(loadReports, 1000);
      }
    } catch {}
    setGenerating(null);
  };

  const activeEmp = EMPLOYEES.find(e => e.code === activeTab)!;

  return (
    <main className="min-h-screen bg-[#F5F6FA] pb-16">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <div>
              <h1 className="text-base font-semibold">AI员工报告</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">生成 · 查阅 · 管理</p>
            </div>
          </div>
          <a href="/merchant/ai-chat"
            className="text-[11px] flex items-center gap-1 px-3 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: C.coral, color: "#fff" }}>
            <Bot className="w-3 h-3" /> AI对话
          </a>
        </div>
      </div>

      {/* Employee Tabs */}
      <div className="mx-4 mt-3 flex gap-2 overflow-x-auto pb-1">
        {EMPLOYEES.map(e => (
          <button key={e.code} onClick={() => setActiveTab(e.code)}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeTab === e.code ? e.color : "#fff",
              color: activeTab === e.code ? "#fff" : "#666",
              boxShadow: activeTab === e.code ? "none" : "0 1px 2px rgba(0,0,0,0.04)"
            }}>
            <span>{e.icon}</span>
            <span>{e.name}</span>
          </button>
        ))}
      </div>

      {/* Quick Generate */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[12px] p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
              <Zap className="w-3 h-3" style={{ color: activeEmp.color }} />
              一键生成
            </span>
            <button onClick={loadReports} className="text-gray-400 p-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(TASK_ACTIONS[activeTab] || []).map(action => (
              <button key={action.key} onClick={() => doGenerate(action.key, action.label)}
                disabled={generating === action.key}
                className="text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                style={{ borderColor: activeEmp.color, color: activeEmp.color }}>
                {generating === action.key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>{action.icon}</span>
                )}
                <span>{action.label}</span>
              </button>
            ))}
            <a href={`/merchant/ai-chat`}
              className="text-[11px] px-3 py-1.5 rounded-full border border-dashed flex items-center gap-1 text-gray-400">
              <Bot className="w-3 h-3" /> AI对话...
            </a>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="mx-4 mt-3 space-y-3">
        <h2 className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 px-1">
          <Clock className="w-3 h-3" />
          历史报告
          <span className="text-[10px] text-gray-300 font-normal">({filtered.length})</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-[10px] p-3.5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-2.5 bg-gray-50 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-[12px] text-gray-400">暂无{activeEmp.name}报告</p>
            <p className="text-[10px] text-gray-300 mt-1">点击上方按钮一键生成</p>
          </div>
        ) : filtered.map((r, i) => (
          <div key={r.id || i} onClick={() => setSelected(r)}
            className="bg-white rounded-[10px] p-3.5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{r.task_key === "daily_report" ? "📊" : r.task_key === "inventory_alert" ? "📦" : r.task_key === "evening_prep" ? "🌙" : r.task_key === "finance_report" ? "💰" : r.task_key === "cost_analysis" ? "📉" : r.task_key === "pricing_advice" ? "🏷️" : r.task_key === "promotion_plan" ? "🎯" : r.task_key === "satisfaction" ? "⭐" : "📋"}</span>
                <span className="text-[12px] font-medium text-gray-700">
                  {r.task_key === "daily_report" ? "经营日报" : 
                   r.task_key === "inventory_alert" ? "库存预警" :
                   r.task_key === "evening_prep" ? "晚间准备" :
                   r.task_key === "finance_report" ? "财务报表" :
                   r.task_key === "cost_analysis" ? "成本分析" :
                   r.task_key === "pricing_advice" ? "定价建议" :
                   r.task_key === "promotion_plan" ? "促销方案" :
                   r.task_key === "satisfaction" ? "满意度分析" :
                   r.task_key || "报告"}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                r.status === "success" ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
              }`}>
                {r.status === "success" ? "✓" : "✗"}
              </span>
            </div>
            {r.summary && <p className="text-[12px] text-gray-500 line-clamp-2">{r.summary}</p>}
            <p className="text-[9px] text-gray-300 mt-1.5">{r.created_at || ""}</p>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-[16px] w-full max-h-[80vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white py-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">{selected.task_key === "daily_report" ? "📊" : "📋"}</span>
                {selected.task_key === "daily_report" ? "经营日报" : "报告详情"}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className={`px-2 py-0.5 rounded-full ${
                  selected.status === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                }`}>
                  {selected.status === "success" ? "✅ 成功" : "❌ 失败"}
                </span>
                <span>{selected.created_at || ""}</span>
              </div>
              {selected.content && (
                <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-[12px]"
                  dangerouslySetInnerHTML={{ __html: selected.content.replace(/\n/g, "<br/>") }} />
              )}
              {selected.raw_output && !selected.content && (
                <pre className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-[8px] overflow-x-auto">
                  {JSON.stringify(JSON.parse(selected.raw_output || "{}"), null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick action - subscribe/config */}
      <div className="fixed bottom-4 left-4 right-4">
        <a href="/merchant/ai-config"
          className="block text-center text-[11px] py-2.5 rounded-full bg-white border border-gray-100 shadow-sm text-gray-500 flex items-center justify-center gap-1.5">
          <Settings className="w-3 h-3" />
          AI员工订阅与配置
        </a>
      </div>
    </main>
  );
}
