"use client";

/**
 * 🏪 服务号 — 智能门店一站式服务
 * 单页架构：AI对话框 + 功能入口 + 今日任务 + 产品矩阵 + 底栏
 */

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import { C } from "@/lib/brand-colors";
import { Send, Bot, X, ChevronRight, CheckCircle, Zap, Layers } from "lucide-react";
import Link from "next/link";

// ─── 12 大产品 ───
const PRODUCTS = [
  { icon: "🏪", name: "AI智慧门店", desc: "智能门店管理·7x24AI客服", color: "from-brand-teal to-brand-teal-dark", href: "/merchant" },
  { icon: "🛒", name: "A2A智能SaaS商城", desc: "AI驱动·全渠道电商解决方案", color: "from-brand-coral to-brand-coral-dark", href: "/marketplace" },
  { icon: "🤝", name: "AI异业联盟平台", desc: "跨界合作·流量共享·互利共赢", color: "from-purple-500 to-purple-700", href: "/merchant/cooperation" },
  { icon: "🏭", name: "A2A智能产业平台", desc: "产业互联·供应链智能升级", color: "from-blue-500 to-blue-700", href: "/marketplace/cooperation" },
  { icon: "☯", name: "AI周易八卦", desc: "AI推演·每日运势·命理分析", color: "from-amber-500 to-amber-700", href: "/divination" },
  { icon: "📈", name: "AI股市分析", desc: "实时行情·技术面AI解读", color: "from-brand-gold to-brand-gold-dark", href: "/stock-analysis" },
  { icon: "🎰", name: "AI彩票分析", desc: "冷热号追踪·智能推荐策略", color: "from-green-500 to-green-700", href: "/lottery-sim" },
  { icon: "🦞", name: "AI小龙虾", desc: "门店AI员工·智能经营助手", color: "from-red-500 to-red-700", href: "/agent" },
  { icon: "🐎", name: "AI爱马仕", desc: "赛马预测·赔率分析·策略推荐", color: "from-pink-500 to-pink-700", href: "/agent?persona=horse" },
  { icon: "🎯", name: "数字碰游戏", desc: "实时PK·赢家瓜分奖池", color: "from-brand-teal to-cyan-700", href: "/lottery-sim?game=number-hit" },
  { icon: "💰", name: "投资模拟", desc: "虚拟投资·策略验证·风控训练", color: "from-emerald-500 to-emerald-700", href: "/calculator" },
  { icon: "🔗", name: "区块链开发", desc: "DApp开发·智能合约·Web3方案", color: "from-indigo-500 to-indigo-700", href: "/store-services" },
];

// ─── 功能入口 ───
const QUICK_ACTIONS = [
  { icon: "💬", label: "AI对话", color: "bg-brand-teal/10 text-brand-teal-dark", href: "/ai" },
  { icon: "📊", label: "经营看板", color: "bg-brand-coral/10 text-brand-coral-dark", href: "/merchant" },
  { icon: "📋", label: "任务中心", color: "bg-brand-gold/10 text-brand-gold-dark", href: "/tasks" },
  { icon: "🏆", label: "PK大厅", color: "bg-purple-50 text-purple-600", href: "/pk-hall" },
  { icon: "🎫", label: "开奖查询", color: "bg-green-50 text-green-600", href: "/draw" },
  { icon: "👤", label: "个人中心", color: "bg-blue-50 text-blue-600", href: "/profile" },
];

// ─── 今日任务 ───
const DAILY_TASKS = [
  { icon: "📅", label: "每日签到", reward: "+100🎮", done: false, href: "/tasks" },
  { icon: "💬", label: "AI对话1次", reward: "+200🎮", done: false, href: "/ai" },
  { icon: "🎲", label: "参与PK1次", reward: "+300🎮", done: false, href: "/pk-hall" },
  { icon: "📊", label: "查看报告", reward: "+150🎮", done: false, href: "/ai-predictions" },
];

// ─── 底部 Tab ───
const BOTTOM_TABS = [
  { icon: "🏠", label: "首页", href: "/service" },
  { icon: "💬", label: "AI助手", href: "/ai" },
  { icon: "🏪", label: "服务", href: "/service#products" },
  { icon: "📋", label: "任务", href: "/tasks" },
];

// ─── AI 默认会话 ───
const WELCOME_MSG = "👋 你好！我是你的AI智能助手，可以帮你解答问题、分析市场、提供建议。有什么可以帮你的？";

export default function ServicePage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([
    { role: "ai", content: WELCOME_MSG },
  ]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = async () => {
    const msg = chatMsg.trim();
    if (!msg || sending) return;
    setChatMsg("");
    setChatHistory(prev => [...prev, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai-deduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user?.uid || 1, msg, action: "chat" }),
      });
      const j = await res.json();
      if (j.code === 0 && j.data?.reply) {
        setChatHistory(prev => [...prev, { role: "ai", content: j.data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { role: "ai", content: j.msg || "暂时无法回答，请稍后再试。" }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { role: "ai", content: "网络异常，请重试。" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg pb-20">
      <div className="px-4 pt-4">
        {/* ═══════ 功能入口 ═══════ */}
        <div className="bg-white rounded-[12px] shadow-sm border border-brand-teal/10 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Zap className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[12px] font-semibold text-text-primary">快捷功能</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} href={a.href}
                className="flex flex-col items-center gap-1 p-2.5 rounded-[10px] active:scale-95 transition-transform">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${a.color}`}>
                  {a.icon}
                </div>
                <span className="text-[9px] font-medium text-text-secondary">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══════ 今日任务 ═══════ */}
        <div className="bg-white rounded-[12px] shadow-sm border border-brand-teal/10 p-3 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-brand-gold" />
              <span className="text-[12px] font-semibold text-text-primary">今日任务</span>
            </div>
            <Link href="/tasks" className="text-[9px] text-brand-teal flex items-center gap-0.5">
              全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1.5">
            {DAILY_TASKS.map((t, i) => (
              <Link key={i} href={t.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] bg-gray-50 active:scale-[0.98] transition-transform">
                <span className="text-base">{t.icon}</span>
                <span className="flex-1 text-[11px] text-text-primary">{t.label}</span>
                <span className="text-[9px] text-brand-teal-dark font-medium">{t.reward}</span>
                <ChevronRight className="w-3 h-3 text-text-tertiary" />
              </Link>
            ))}
          </div>
        </div>

        {/* ═══════ 产品矩阵 ═══════ */}
        <div id="products" className="mb-3">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <Layers className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[12px] font-semibold text-text-primary">产品矩阵</span>
            <span className="text-[8px] text-text-tertiary ml-auto">{PRODUCTS.length} 款产品</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS.map((p, i) => (
              <Link key={i} href={p.href}
                className="bg-white rounded-[10px] border border-brand-teal/10 p-3 active:scale-[0.97] transition-transform shadow-sm">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-sm mb-2 shadow-sm`}>
                  <span className="text-white">{p.icon}</span>
                </div>
                <h3 className="text-[11px] font-semibold text-text-primary mb-0.5">{p.name}</h3>
                <p className="text-[8px] text-text-tertiary leading-relaxed">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══════ 底部信息 ═══════ */}
        <div className="text-center py-4 text-[9px] text-text-tertiary/50">
          <p>AI趣预测 · 仅娱乐参考 · 理性参与</p>
          <p className="mt-1">小章鱼智能服务平台 v2.0</p>
        </div>
      </div>

      {/* ═══════ AI 对话浮窗 ═══════ */}
      {chatOpen && (
        <div className="fixed inset-0 z-[900] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setChatOpen(false)}>
          <div className="bg-white w-full max-w-[420px] max-h-[85vh] rounded-t-[16px] sm:rounded-[16px] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}>

            {/* 对话头部 */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white">
              <Bot className="w-5 h-5" />
              <span className="text-sm font-semibold flex-1">AI智能助手</span>
              <button onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 对话内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[60vh]">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-[12px] text-[12px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-teal text-white rounded-br-[4px]"
                      : "bg-gray-50 text-text-primary rounded-bl-[4px]"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 px-3 py-2 rounded-[12px] rounded-bl-[4px]">
                    <span className="text-[12px] text-text-tertiary">AI思考中...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 输入框 */}
            <div className="px-3 py-2.5 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input type="text"
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="输入你的问题..."
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-[10px] text-[12px] outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" />
                <button onClick={handleSend} disabled={!chatMsg.trim() || sending}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 shadow-sm">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 底部导航栏 ═══════ */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[60px] bg-white/90 backdrop-blur-[20px] border-t border-brand-teal/10 flex justify-around items-center z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        {BOTTOM_TABS.map((tab, i) => {
          const isActive = tab.href === "/service"
            ? pathname === "/service" || pathname.startsWith("/service")
            : pathname.startsWith(tab.href);
          return (
            <Link key={i} href={tab.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1 active:scale-90 transition-transform">
              <span className={`text-xl ${isActive ? "text-brand-teal" : "text-gray-400"}`}>{tab.icon}</span>
              <span className={`text-[9px] font-medium ${isActive ? "text-brand-teal-dark font-semibold" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
