"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE } from "@/config/api";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import type { TabId, Message, TabConfig, CostOption } from "@/types/ai-chat";
import { createInitialSessions, saveSessions, loadSessions } from "@/lib/ai-chat-store";
import ChatHeader from "./components/chat-header";
import CategoryTabs from "./components/category-tabs";
import ChatArea from "./components/chat-area";
import CostBar from "./components/cost-bar";
import ZodiacSubSelector from "./components/zodiac-sub-selector";
import InputArea from "./components/input-area";
import Modal from "./components/modal";

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
  { id: "lottery", label: "彩运", cost: 5, icon: "🎱", subtitle: "仅传统文化娱乐推演，不作为购彩依据", disclaimer: "本服务仅传统文化娱乐推演，不作为购彩依据。网络售彩均违法，请理性娱乐勿沉迷。" },
  { id: "stock", label: "股市", cost: 8, icon: "📈", subtitle: "无证券咨询资质，仅运势娱乐参考", disclaimer: "本平台无证券咨询资质，仅运势娱乐参考，不构成任何买卖建议。" },
  { id: "crypto", label: "加密", cost: 10, icon: "₿", subtitle: "虚拟货币交易属于非法金融活动", disclaimer: "虚拟货币交易属于非法金融活动，本内容仅传统文化娱乐解读。" },
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

  const getInitialTab = (): TabId => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t && TAB_CONFIGS.find(c => c.id === t)) return t as TabId;
    }
    return "zodiac";
  };
  const [tab, setTab] = useState<TabId>(getInitialTab);
  const [sessions, setSessions] = useState<Record<TabId, Message[]>>(() => {
    const saved = loadSessions();
    if (saved) return saved;
    return createInitialSessions();
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [subCategory, setSubCategory] = useState("");
  const [zodiacCost, setZodiacCost] = useState(1);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerTab, setDisclaimerTab] = useState<TabId | "">("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showSubPanel, setShowSubPanel] = useState(false); // 周易子类别底部面板

  const [toast, setToast] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const cfg = TAB_CONFIGS.find(t => t.id === tab)!;
  const isFinancial = tab === "stock" || tab === "crypto";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessions, loading]);

  // ── Load balance with localStorage cache ──
  useEffect(() => {
    if (!user) { setBalance(0); return; }
    const cached = localStorage.getItem("ai_balance_cache");
    if (cached) {
      try {
        const { balance: b, cachedAt } = JSON.parse(cached);
        if (Date.now() - cachedAt < 30000) { setBalance(b); return; } // 30秒缓存
      } catch {}
    }
    fetch(API_BASE + "/api/ai-deduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, action: "balance" }),
    }).then(r => r.json()).then(j => {
      if (j.code === 0) {
        setBalance(j.data.balance);
        localStorage.setItem("ai_balance_cache", JSON.stringify({ balance: j.data.balance, cachedAt: Date.now() }));
      }
    }).catch(() => {});
  }, [user]);

  // ── Disclaimer: 仅首次展示 ──
  useEffect(() => {
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setDisclaimerAccepted(false); setShowDisclaimer(true);
    }
  }, [tab, isFinancial]);

  // ── 每次sessions变化自动持久化 ──
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // ── 清除24h以上旧数据 ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai_chat_sessions");
      if (raw) {
        const data = JSON.parse(raw);
        let changed = false;
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            const cutoff = Date.now() - 86400000;
            data[key] = data[key].filter((m: any) => m.timestamp > cutoff);
            if (data[key].length === 0) changed = true;
          }
        }
        if (changed) localStorage.setItem("ai_chat_sessions", JSON.stringify(data));
      }
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  const handleTabChange = (id: TabId) => { setTab(id); };

  // ── Core send with message status ──
  const doSend = async (msg: string, cost: number) => {
    if (!user) { setShowLogin(true); return; }
    if (balance < cost) { showToast("豆子不足，去做任务签到领取吧"); return; }

    const tempId = Date.now().toString(36);
    const userMsg: Message = { role: "user", content: msg, timestamp: Date.now(), _tempId: tempId, status: "sending" };
    setSessions(prev => ({ ...prev, [tab]: [...prev[tab], userMsg] }));
    setLoading(true);
    if (cost <= 100) showToast(`-${cost}🎮`);

    try {
      const res = await fetch(API_BASE + "/api/ai-deduct-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user?.uid || 0, cost, category: cfg.label, session_id: sessionId, tab,
          messages: [
            { role: "system", content: `你是AI趣预测平台的周易推演助手。回答要求：1.积极正向 2.若推演气场偏弱则追加安抚文案 3.末尾随机附一句励志短句 4.控制在200字内 5.不使用"大凶、必亏、无解"等词汇，用"气场阻滞、存在阻碍、调整方式即可迎来转机"替代。当前用户咨询分类:${cfg.label}。回复风格：传统文化+正向引导。
重要：请参考对话历史中的之前回复，保持上下文一致。如果用户追问上一个话题，先回顾之前的分析再给出新回答。` },
            ...sessions[tab].filter(m => m.role === "user" || m.role === "assistant").slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: msg },
          ],
        }),
      });
      const json = await res.json();

      if (json.deduct?.success) setBalance(b => b - cost);

      const aiData = json.data;
      let reply = aiData?.choices?.[0]?.message?.content || aiData?.response || "抱歉，我暂时无法回答。";
      if (!reply.includes("事在人为") && !reply.includes("心态")) {
        reply += "\n\n—— " + INSPIRING_WORDS[Math.floor(Math.random() * INSPIRING_WORDS.length)];
      }

      // Mark user message as sent, add assistant reply
      setSessions(prev => {
        const msgs = [...prev[tab]];
        const idx = msgs.findIndex(m => m._tempId === tempId);
        if (idx >= 0) msgs[idx] = { ...msgs[idx], status: "sent" };
        return { ...prev, [tab]: [...msgs, { role: "assistant", content: reply, timestamp: Date.now() }] };
      });
    } catch {
      // Mark user message as failed
      setSessions(prev => {
        const msgs = [...prev[tab]];
        const idx = msgs.findIndex(m => m._tempId === tempId);
        if (idx >= 0) msgs[idx] = { ...msgs[idx], status: "failed", error: "网络开小差了" };
        return { ...prev, [tab]: msgs };
      });
      showToast("网络开小差了");
    }
    setLoading(false);
  };

  const handleQuickQuestion = (q: string, cost: number) => {
    if (!user) { setShowLogin(true); return; }
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setShowDisclaimer(true); return;
    }
    if (balance < cost) { showToast("游戏豆不足"); return; }
    if (cost > 150) {
      // 插入内联成本确认卡片到会话流
      const card: Message = { role: "system", content: "", timestamp: Date.now(), _type: "cost-confirm", _cost: cost, _pendingContent: q };
      setSessions(prev => ({ ...prev, [tab]: [...prev[tab], card] }));
    }
    else { doSend(q, cost); }
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setShowDisclaimer(true); return;
    }
    const cost = tab === "zodiac" ? zodiacCost : cfg.cost;
    if (cost > 150) {
      const card: Message = { role: "system", content: "", timestamp: Date.now(), _type: "cost-confirm", _cost: cost, _pendingContent: input.trim() };
      setSessions(prev => ({ ...prev, [tab]: [...prev[tab], card] }));
    }
    else { doSend(input.trim(), cost); setInput(""); }
  };

  const confirmCostCard = (cost: number, content: string) => {
    // 移除确认卡片
    setSessions(prev => {
      const msgs = prev[tab].filter(m => m._type !== "cost-confirm");
      return { ...prev, [tab]: msgs };
    });
    doSend(content, cost);
  };

  const cancelCostCard = () => {
    setSessions(prev => {
      const msgs = prev[tab].filter(m => m._type !== "cost-confirm");
      return { ...prev, [tab]: msgs };
    });
  };

  const confirmDisclaimer = () => {
    if (!disclaimerAccepted) return;
    localStorage.setItem("ai_disclaimer_" + disclaimerTab, "true");
    setShowDisclaimer(false);
  };

  const handleRetry = (failedMsg: Message) => {
    if (failedMsg._tempId) {
      setSessions(prev => {
        const msgs = prev[tab].filter(m => m._tempId !== failedMsg._tempId);
        return { ...prev, [tab]: msgs };
      });
      doSend(failedMsg.content, tab === "zodiac" ? zodiacCost : cfg.cost);
    }
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+64px)]">
      {/* 精简头部: 2层 */}
      <ChatHeader balance={balance} user={user} onLogin={() => setShowLogin(true)} />
      <div className="flex items-center gap-1 mx-3 mb-1">
        <CategoryTabs current={tab} onChange={handleTabChange} />
        <a href="/ai-predictions" className="shrink-0 text-[10px] text-brand-teal font-medium px-2 py-1 rounded-full bg-brand-teal/5 whitespace-nowrap">📋 日报</a>
        <a href="/ai/birth" className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-brand-teal/20 text-text-secondary whitespace-nowrap">📅 八字</a>
      </div>

      {/* Zodiac subtitle（非粘性，跟随滚动） */}
      {tab === "zodiac" && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-brand-teal-light/15 to-brand-teal-light/5 border-b border-brand-teal-light/20">
          <p className="text-[9px] text-brand-teal-dark/70 leading-relaxed">{cfg.subtitle}</p>
          <button onClick={() => setShowSubPanel(true)}
            className="text-[9px] text-brand-teal font-medium mt-1">{subCategory || "选择咨询类型"} ▾</button>
        </div>
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
        onRetry={handleRetry}
        onCostConfirm={confirmCostCard}
        onCostCancel={cancelCostCard}
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

      {/* Zodiac子类别底部面板（非粘性，点击弹出） */}
      {showSubPanel && cfg.cost_map && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowSubPanel(false)}>
          <div className="bg-white rounded-t-xl w-full p-4 max-h-[50vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium">选择咨询类型</span>
              <button onClick={() => setShowSubPanel(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-1">
              {cfg.cost_map.map((opt, i) => (
                <button key={i} onClick={() => { setSubCategory(opt.label); setZodiacCost(opt.cost); setShowSubPanel(false); }}
                  className={`w-full text-left p-3 rounded-lg text-xs flex items-center justify-between ${opt.label === subCategory ? "bg-brand-teal/10 text-brand-teal-dark font-medium" : "hover:bg-gray-50"}`}>
                  <span>{opt.label}</span>
                  <span className="text-brand-teal font-medium">{opt.cost}豆</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
