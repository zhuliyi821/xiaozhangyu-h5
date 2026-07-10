"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Bot, Send, Loader2, ArrowLeft, Plus, Sparkles } from "lucide-react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA" };

const EMPLOYEES = [
  { code: "zhang-guanshi", icon: "📋", name: "章管事", desc: "AI店长 · 经营建议", color: C.coral, accent: "#FDE8E4" },
  { code: "zhang-suanpan", icon: "🧮", name: "章算盘", desc: "AI财务 · 数据分析", color: C.gold, accent: "#FEF3D5" },
  { code: "zhang-erzhang", icon: "📈", name: "章二涨", desc: "AI增长 · 营销策略", color: C.purple, accent: "#EDE9FE" },
  { code: "zhang-xiaomi", icon: "💬", name: "章小蜜", desc: "AI客服 · 客户洞察", color: C.teal, accent: "#D5F5F7" },
];

type Message = { role: "user" | "assistant"; content: string; loading?: boolean };

const QUICK_ACTIONS: Record<string, string[]> = {
  "zhang-guanshi": [
    "生成今日经营日报",
    "检查库存预警",
    "今晚营业准备建议",
    "客流分析报告",
  ],
  "zhang-suanpan": [
    "生成上周财务报表",
    "成本分析报告",
    "利润趋势分析",
  ],
  "zhang-erzhang": [
    "新品定价建议",
    "促销活动方案",
    "竞争对手分析",
  ],
  "zhang-xiaomi": [
    "客户满意度分析",
    "热门商品排行",
    "客户画像分析",
  ],
};

const TASK_MAP: Record<string, Record<string, string>> = {
  "zhang-guanshi": {
    "生成今日经营日报": "daily_report",
    "检查库存预警": "inventory_alert",
    "今晚营业准备建议": "evening_prep",
  },
  "zhang-suanpan": {
    "生成上周财务报表": "finance_report",
    "成本分析报告": "cost_analysis",
    "利润趋势分析": "profit_trend",
  },
  "zhang-erzhang": {
    "新品定价建议": "pricing_advice",
    "促销活动方案": "promotion_plan",
  },
  "zhang-xiaomi": {
    "客户满意度分析": "satisfaction",
    "热门商品排行": "hot_products",
  },
};

export default function AiChatPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(EMPLOYEES[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addMessage = (m: Message) => setMessages(prev => [...prev, m]);

  const doSend = async (text: string) => {
    if (!text.trim() || sending || !user?.uid) return;
    setSending(true);
    addMessage({ role: "user", content: text });
    setInput("");

    // 检测是否是快捷任务
    const taskMatch = TASK_MAP[selected.code];
    let taskKey = "custom_advice";
    if (taskMatch && taskMatch[text]) {
      taskKey = taskMatch[text];
    }

    const loadingId = Date.now();
    addMessage({ role: "assistant", content: "", loading: true });

    try {
      const r = await fetch("/api/employees/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_code: selected.code,
          task: taskKey,
          merchant_id: user.uid,
          params: { query: taskKey === "custom_advice" ? text : "" },
        }),
      });
      const j = await r.json();
      setMessages(prev => prev.filter(m => !(m as any).loading));

      if (j.error) {
        addMessage({ role: "assistant", content: `❌ ${j.error}` });
      } else {
        const display = j.content || j.summary || "完成 ✅";
        addMessage({ role: "assistant", content: display });
      }
    } catch (e: any) {
      setMessages(prev => prev.filter(m => !(m as any).loading));
      addMessage({ role: "assistant", content: "❌ 请求失败，请稍后重试" });
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(input); }
  };

  return (
    <main className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 h-12">
          <button onClick={() => window.history.back()} className="text-gray-600 text-lg">←</button>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: selected.accent }}>{selected.icon}</div>
            <div>
              <div className="text-sm font-semibold">{selected.name}</div>
              <div className="text-[10px] text-gray-400">{selected.desc}</div>
            </div>
          </div>
          <Sparkles className="w-4 h-4" style={{ color: C.coral }} />
        </div>

        {/* Employee Switcher */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {EMPLOYEES.map(e => (
            <button key={e.code} onClick={() => { setSelected(e); setMessages([]); }}
              className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: selected.code === e.code ? e.color : "#fff",
                color: selected.code === e.code ? "#fff" : "#666",
                boxShadow: selected.code === e.code ? "none" : "0 1px 2px rgba(0,0,0,0.04)"
              }}>
              <span>{e.icon}</span>
              <span>{e.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="pt-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{selected.icon}</div>
              <div className="text-sm font-semibold text-gray-700">你好，我是{selected.name}</div>
              <div className="text-[11px] text-gray-400 mt-1">{selected.desc}</div>
              <div className="text-[10px] text-gray-300 mt-0.5">可以帮你做什么？</div>
            </div>
            <div className="space-y-2 px-2">
              {(QUICK_ACTIONS[selected.code] || []).map((action, i) => (
                <button key={i} onClick={() => doSend(action)}
                  className="w-full text-left text-[12px] p-2.5 rounded-[10px] border border-gray-100 bg-white hover:border-gray-200 active:scale-[0.98] transition-all shadow-sm">
                  <span className="mr-2">{["🔍", "📊", "📝", "🎯"][i] || "💡"}</span>
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && !m.loading && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mr-2 mt-1"
                style={{ backgroundColor: selected.accent }}>{selected.icon}</div>
            )}
            <div className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              m.role === "user"
                ? "rounded-br-[4px] text-white shadow-sm"
                : "bg-white rounded-bl-[4px] shadow-sm border border-gray-100"
            }`} style={m.role === "user" ? { backgroundColor: selected.color } : {}}>
              {m.loading ? (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: selected.color, animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: selected.color, animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: selected.color, animationDelay: "300ms" }} />
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs shrink-0 ml-2 mt-1">👤</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`向${selected.name}提问...`}
            disabled={sending}
            className="flex-1 text-[13px] px-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 outline-none focus:border focus:border-[var(--input-focus)] placeholder:text-gray-300"
            style={{ "--input-focus": selected.color } as React.CSSProperties}
          />
          <button onClick={() => doSend(input)} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-90"
            style={{ backgroundColor: selected.color }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </main>
  );
}
