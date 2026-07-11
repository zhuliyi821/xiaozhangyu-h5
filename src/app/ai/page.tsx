"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE } from "@/config/api";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import type { TabId, Message, TabConfig, CostOption } from "@/types/ai-chat";
import { createInitialSessions } from "@/lib/ai-chat-store";
import ChatHeader from "./components/chat-header";
import CategoryTabs from "./components/category-tabs";
import ChatArea from "./components/chat-area";
import CostBar from "./components/cost-bar";
import ZodiacSubSelector from "./components/zodiac-sub-selector";
import InputArea from "./components/input-area";
import Modal from "./components/modal";

// ── Tabs 配置 ──
const TAB_CONFIGS: (TabConfig & { cost_map?: CostOption[]; questions?: string[] })[] = [
  {
    id: "zodiac", label: "周易", cost: 0, icon: "🔮",
    subtitle: "卦象仅供自我梳理，事在人为，保持积极心态方能顺势而行",
    disclaimer: "",
    cost_map: [
      { label: "随心快速起卦", cost: 10 },
      { label: "日常琐事（考试/出行/寻物/纠纷/健康）", cost: 20 },
      { label: "情感婚姻 / 职场事业", cost: 30 },
      { label: "实业投资（开店/合伙/房产/回款）", cost: 60 },
      { label: "终身深度运势（八字流年/大运/风水）", cost: 150 },
    ],
  },
  {
    id: "lottery", label: "彩运", cost: 5, icon: "🎱",
    subtitle: "仅传统文化娱乐推演，不作为购彩依据，网络售彩均违法，理性娱乐勿沉迷",
    disclaimer: "本服务仅传统文化娱乐推演，不作为购彩依据。网络售彩均违法，请理性娱乐勿沉迷。",
  },
  {
    id: "stock", label: "股市", cost: 8, icon: "📈",
    subtitle: "无证券咨询资质，仅运势娱乐参考，不构成买卖建议，投资有风险",
    disclaimer: "本平台无证券咨询资质，仅运势娱乐参考，不构成任何买卖建议。投资有风险，入市须谨慎。",
  },
  {
    id: "crypto", label: "加密", cost: 10, icon: "₿",
    subtitle: "虚拟货币交易属于非法金融活动，本内容仅娱乐，请勿参与币圈交易",
    disclaimer: "虚拟货币交易属于非法金融活动，本内容仅传统文化娱乐解读，请勿参与任何币圈交易。",
  },
];

const INSPIRING_WORDS = [
  "事在人为，保持积极心态方能顺势而行",
  "每一个努力的人，运气都不会太差",
  "心态决定状态，状态决定结果",
  "人生如棋，落子无悔，静待花开",
  "不积跬步无以至千里，每一天都是新的开始",
  "顺境不骄，逆境不馁，平常心是道",
  "机会留给有准备的人，也留给心态好的人",
];

export default function AIChatPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));

  // ── Tab 状态 (不重置消息) ──
  const getInitialTab = (): TabId => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t && TAB_CONFIGS.find(c => c.id === t)) return t as TabId;
    }
    return "zodiac";
  };
  const [tab, setTab] = useState<TabId>(getInitialTab);
  const [sessions, setSessions] = useState<Record<TabId, Message[]>>(createInitialSessions);

  // ── 输入状态 ──
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // ── Zodiac 子类 ──
  const [subCategory, setSubCategory] = useState("");
  const [zodiacCost, setZodiacCost] = useState(1);

  // ── 弹窗 ──
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMsg, setPendingMsg] = useState("");
  const [deductCost, setDeductCost] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerTab, setDisclaimerTab] = useState<TabId | "">("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const [toast, setToast] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const cfg = TAB_CONFIGS.find(t => t.id === tab)!;
  const isFinancial = tab === "stock" || tab === "crypto";

  // ── Auto-scroll ──
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessions, loading]);

  // ── Load balance ──
  useEffect(() => {
    if (!user) { setBalance(0); return; }
    fetch(API_BASE + "/api/ai-deduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, action: "balance" }),
    }).then(r => r.json()).then(j => { if (j.code === 0) setBalance(j.data.balance); }).catch(() => {});
  }, [user]);

  // ── Disclaimer check ──
  useEffect(() => {
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setDisclaimerAccepted(false); setShowDisclaimer(true);
    }
  }, [tab, isFinancial]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  // ── Tab 切换 (不重置消息) ──
  const handleTabChange = (id: TabId) => {
    setTab(id);
    // 移除了zodiac欢迎语预回复 — 由欢迎卡片统一处理
  };

  // ── 核心发送 ──
  const doSend = async (msg: string, cost: number) => {
    if (!user) { setShowLogin(true); return; }
    if (balance < cost) { showToast("豆子不足，去做任务签到领取吧"); return; }

    // Optimistic: 显示用户消息
    const userMsg: Message = { role: "user", content: msg, timestamp: Date.now() };
    setSessions(prev => ({ ...prev, [tab]: [...prev[tab], userMsg] }));
    setLoading(true);
    if (cost <= 100) showToast(`-${cost}🎮`);

    try {
      // 统一端点: 扣豆 + AI调用一次完成
      const res = await fetch(API_BASE + "/api/ai-deduct-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user?.uid || 0,
          cost,
          category: cfg.label,
          session_id: sessionId,
          tab,
          messages: [
            { role: "system", content: `你是AI趣预测平台的周易推演助手。回答要求：1.积极正向 2.若推演气场偏弱则追加安抚文案 3.末尾随机附一句励志短句 4.控制在200字内 5.不使用"大凶、必亏、无解"等词汇，用"气场阻滞、存在阻碍、调整方式即可迎来转机"替代。当前用户咨询分类:${cfg.label}。回复风格：传统文化+正向引导` },
            ...sessions[tab].filter(m => m.role === "user").slice(-8).map(m => ({ role: "user", content: m.content })),
            { role: "user", content: msg },
          ],
        }),
      });
      const json = await res.json();

      // 扣豆结果
      if (json.deduct?.success) {
        setBalance(b => b - cost);
      }

      // AI回复
      const aiData = json.data;
      let reply = aiData?.choices?.[0]?.message?.content || aiData?.response || "抱歉，我暂时无法回答。";
      if (!reply.includes("事在人为") && !reply.includes("心态")) {
        reply += "\n\n—— " + INSPIRING_WORDS[Math.floor(Math.random() * INSPIRING_WORDS.length)];
      }
      setSessions(prev => ({ ...prev, [tab]: [...prev[tab], { role: "assistant", content: reply, timestamp: Date.now() }] }));
    } catch {
      showToast("网络开小差了，请稍后重试");
    }
    setLoading(false);
  };

  // ── 快捷问题 ──
  const handleQuickQuestion = (q: string, cost: number) => {
    if (!user) { setShowLogin(true); return; }
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setShowDisclaimer(true); return;
    }
    if (balance < cost) { showToast("游戏豆不足"); return; }
    // >150豆需确认, 否则直接发
    if (cost > 150) {
      setPendingMsg(q); setDeductCost(cost); setShowConfirm(true);
    } else {
      doSend(q, cost);
    }
  };

  // ── 手动输入发送 ──
  const sendMessage = () => {
    if (!input.trim() || loading) return;
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setShowDisclaimer(true); return;
    }
    const cost = tab === "zodiac" ? zodiacCost : cfg.cost;
    if (cost > 150) {
      setPendingMsg(input.trim()); setDeductCost(cost); setShowConfirm(true);
    } else {
      doSend(input.trim(), cost);
      setInput("");
    }
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    await doSend(pendingMsg, deductCost);
    setInput("");
  };

  const confirmDisclaimer = () => {
    if (!disclaimerAccepted) return;
    localStorage.setItem("ai_disclaimer_" + disclaimerTab, "true");
    setShowDisclaimer(false);
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+64px)]">
      <ChatHeader balance={balance} user={user} onLogin={() => setShowLogin(true)} />
      {/* AI预测日报入口 */}
      <a href="/ai-predictions"
        className="mx-3 mt-1.5 mb-0.5 flex items-center gap-2 bg-gradient-to-r from-[#7C3AED]/8 to-[#8B5CF6]/5 rounded-[8px] px-3 py-2 border border-[#7C3AED]/10 active:scale-[0.98] transition-transform">
        <span className="text-[16px]">🤖</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-text-primary">AI 预测日报</div>
          <div className="text-[9px] text-text-tertiary truncate">5大分类 · 多源交叉分析 · 每日更新</div>
        </div>
        <span className="text-[10px] text-[#7C3AED] font-medium shrink-0">查看 →</span>
      </a>
      <CategoryTabs current={tab} onChange={handleTabChange} />

      {/* Zodiac subtitle + Subcategory selector */}
      {tab === "zodiac" && (
        <>
          <div className="px-4 py-1.5 bg-gradient-to-r from-brand-teal-light/15 to-brand-teal-light/5 border-b border-brand-teal-light/20">
            <p className="text-[9px] text-brand-teal-dark/70 leading-relaxed">{cfg.subtitle}</p>
          </div>
          <ZodiacSubSelector
            costOptions={cfg.cost_map || []}
            subCategory={subCategory}
            zodiacCost={zodiacCost}
            onSelect={(label, cost) => { setSubCategory(label); setZodiacCost(cost); }}
          />
        </>
      )}

      <ChatArea
        messages={sessions[tab]}
        loading={loading}
        tab={tab}
        onQuickQuestion={handleQuickQuestion}
        onFeedback={async (idx, fb) => {
          try {
            await fetch(`${API_BASE}/api/v1/fortune/feedback`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: user?.uid || 0, feedback_type: "chat", feedback_date: new Date().toISOString().split("T")[0], dimension: tab, feedback: fb }),
            });
            showToast(fb === 1 ? "👍 感谢反馈" : "👎 已记录");
          } catch {}
        }}
      />

      <CostBar cost={tab === "zodiac" ? zodiacCost : cfg.cost} />
      <InputArea value={input} onChange={setInput} onSend={sendMessage} disabled={loading} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-brand-teal-dark text-white text-xs px-4 py-2 rounded-full shadow-lg animate-bounce">
          {toast}
        </div>
      )}

      <div ref={bottomRef} />

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <Modal type="disclaimer"
          message={TAB_CONFIGS.find(t => t.id === disclaimerTab)?.disclaimer || ""}
          accepted={disclaimerAccepted}
          onAcceptChange={setDisclaimerAccepted}
          onConfirm={confirmDisclaimer}
          onCancel={() => setShowDisclaimer(false)}
        />
      )}

      {/* Confirm deduct Modal (>150豆) */}
      {showConfirm && (
        <Modal type="confirm"
          message=""
          cost={deductCost}
          onConfirm={confirmSend}
          onCancel={() => { setShowConfirm(false); setPendingMsg(""); }}
        />
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
