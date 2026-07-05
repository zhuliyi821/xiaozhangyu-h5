"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, AlertTriangle, ChevronDown, Shield } from "lucide-react";
import { API_BASE } from "@/config/api";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

interface Message { role: "user" | "assistant"; content: string; }

// ── 运势工具快捷入口 ──
const FORTUNE_TOOLS = [
  { icon: "💰", label: "财运", tab: "lottery", question: "近期偏财气场如何" },
  { icon: "❤️", label: "感情", tab: "zodiac", question: "情感婚姻运势如何" },
  { icon: "💼", label: "事业", tab: "zodiac", question: "职场事业发展运势如何" },
  { icon: "🔮", label: "抽签", tab: "zodiac", question: "帮我起一卦随心快速起卦" },
  { icon: "🎯", label: "预测", tab: "lottery", question: "近期有什么好机遇" },
  { icon: "📤", label: "分享", tab: "", question: "" },
];

const TAB_CONFIG = [
  {
    id: "lottery", label: "彩运趣味推演", cost: 5, icon: "🎱",
    subtitle: "仅传统文化娱乐推演，不作为购彩依据，网络售彩均违法，理性娱乐勿沉迷",
    disclaimer: "本服务仅传统文化娱乐推演，不作为购彩依据。网络售彩均违法，请理性娱乐勿沉迷。",
    subs: ["短期偏财气场参考", "财运心态疏导", "近期机遇参考"],
    questions: ["近期偏财气场如何", "如何调整购彩心态", "近期有什么好机遇"],
  },
  {
    id: "stock", label: "股市行情参考", cost: 8, icon: "📈",
    subtitle: "无证券咨询资质，仅运势娱乐参考，不构成买卖建议，投资有风险",
    disclaimer: "本平台无证券咨询资质，仅运势娱乐参考，不构成任何买卖建议。投资有风险，入市须谨慎。",
    subs: ["个股短期气场", "账户整体财运", "合伙投资风险", "择时心态提醒"],
    questions: ["这只股票短期气场如何", "我账户最近财运如何", "合伙投资要注意什么", "现在适合操作吗"],
  },
  {
    id: "crypto", label: "加密行情趣味解读", cost: 10, icon: "₿",
    subtitle: "虚拟货币交易属于非法金融活动，本内容仅娱乐，请勿参与币圈交易",
    disclaimer: "虚拟货币交易属于非法金融活动，本内容仅传统文化娱乐解读，请勿参与任何币圈交易。",
    subs: ["短期投机气场", "偏财风险预警", "心态疏导参考"],
    questions: ["短期行情怎么看", "有什么风险需要注意", "如何调整投资心态"],
  },
  {
    id: "zodiac", label: "周易综合运势", cost: 0, icon: "🔮",
    subtitle: "卦象仅供自我梳理，事在人为，保持积极心态方能顺势而行",
    disclaimer: "",
    subs: [], cost_map: [
      { label: "随心快速起卦", cost: 10 },
      { label: "日常琐事（考试/出行/寻物/纠纷/健康）", cost: 20 },
      { label: "情感婚姻 / 职场事业", cost: 30 },
      { label: "实业投资（开店/合伙/房产/回款）", cost: 60 },
      { label: "终身深度运势（八字流年/大运/风水）", cost: 150 },
    ],
    questions: [],
  },
];

const DAILY_GREETINGS = {
  morning: "早安！新的一天充满可能，保持积极心态，好运自然来。有什么想探讨的？",
  noon: "午后时光正好，放慢脚步，静心思考。今天有什么想要了解的吗？",
  evening: "夜幕降临，回顾今天的收获，带着平和的心态迎接明天。聊聊？",
};

const INSPIRING_WORDS = [
  "事在人为，保持积极心态方能顺势而行",
  "每一个努力的人，运气都不会太差",
  "心态决定状态，状态决定结果",
  "人生如棋，落子无悔，静待花开",
  "不积跬步无以至千里，每一天都是新的开始",
  "顺境不骄，逆境不馁，平常心是道",
  "机会留给有准备的人，也留给心态好的人",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return DAILY_GREETINGS.morning;
  if (h < 18) return DAILY_GREETINGS.noon;
  return DAILY_GREETINGS.evening;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  // 会话ID：每次进入页面生成一次，后续对话复用
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));
  // 从 URL 参数读取默认 tab：/ai?tab=lottery
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tab");
      if (t && TAB_CONFIG.find(c => c.id === t)) return t;
    }
    return TAB_CONFIG[0].id;
  };
  const [tab, setTab] = useState(getInitialTab);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: getGreeting() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMsg, setPendingMsg] = useState("");
  const [deductCost, setDeductCost] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerTab, setDisclaimerTab] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [subCategory, setSubCategory] = useState("");
  const [showSubs, setShowSubs] = useState(false);
  const [zodiacCost, setZodiacCost] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  const cfg = TAB_CONFIG.find(t => t.id === tab)!;
  const isFinancial = tab === "stock" || tab === "crypto";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 读取真实余额
  useEffect(() => {
    if (!user) { setBalance(0); return; }
    fetch(API_BASE + "/api/ai-deduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, action: "balance" }),
    }).then(r => r.json()).then(j => { if (j.code === 0) setBalance(j.data.balance); }).catch(() => {});
  }, [user]);

  // Check disclaimer when switching to financial tabs
  useEffect(() => {
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab);
      setDisclaimerAccepted(false);
      setShowDisclaimer(true);
    }
  }, [tab]);

  const handleQuickQuestion = (q: string, cost: number) => {
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setShowDisclaimer(true); return;
    }
    setPendingMsg(q); setDeductCost(cost); setShowConfirm(true);
  };

  const confirmDisclaimer = () => {
    if (!disclaimerAccepted) return;
    localStorage.setItem("ai_disclaimer_" + disclaimerTab, "true");
    setShowDisclaimer(false);
  };

  // 用户反馈（准/不准）
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const handleFeedback = async (msgIndex: number, feedback: number) => {
    try {
      await fetch(`${API_BASE}/api/v1/fortune/feedback`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.uid || 0,
          feedback_type: "chat",
          feedback_date: new Date().toISOString().split("T")[0],
          dimension: tab,
          feedback: feedback,
        }),
      });
      setFeedbackMsg(feedback === 1 ? "👍 感谢反馈" : "👎 已记录");
      setTimeout(() => setFeedbackMsg(""), 2000);
    } catch {}
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    if (!user) { setShowLogin(true); return; }
    if (balance < deductCost) { setMessages(prev => [...prev, { role: "assistant", content: "😅 游戏豆不足，去做任务或签到领取更多豆子吧！" }]); return; }
    // 扣真实游戏豆
    try {
      await fetch(API_BASE + "/api/ai-deduct", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "deduct", cost: deductCost, category: cfg.label }),
      });
    } catch {}
    setBalance(b => b - deductCost);
    const msg = pendingMsg;
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.uid || 0,
          session_id: sessionId,
          tab: tab,
          messages: [
            { role: "system", content: `你是AI趣预测平台的周易推演助手。回答要求：1.积极正向 2.若推演气场偏弱则追加安抚文案 3.末尾随机附一句励志短句 4.控制在200字内 5.不使用"大凶、必亏、无解"等词汇，用"气场阻滞、存在阻碍、调整方式即可迎来转机"替代。当前用户咨询分类:${cfg.label}。回复风格：传统文化+正向引导` },
            ...messages.filter(m => m.role === "user").slice(-8).map(m => ({ role: "user", content: m.content })),
            { role: "user", content: msg }
          ]
        }),
      });
      const data = await r.json();
      let reply = data?.choices?.[0]?.message?.content || data?.response || "抱歉，我暂时无法回答。";
      // Append inspiring word if not already present
      if (!reply.includes("事在人为") && !reply.includes("心态")) {
        reply += "\n\n—— " + INSPIRING_WORDS[Math.floor(Math.random() * INSPIRING_WORDS.length)];
      }
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "网络开小差了，请稍后重试 🙏" }]);
    }
    setLoading(false);
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    if (isFinancial && !localStorage.getItem("ai_disclaimer_" + tab)) {
      setDisclaimerTab(tab); setShowDisclaimer(true); return;
    }
    let cost = cfg.cost;
    if (tab === "zodiac") cost = zodiacCost;
    handleQuickQuestion(input.trim(), cost);
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+64px)]">
      {/* ── Top Bar: Logo + Balance ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-bold text-text-primary">AI趣预测</span>
          </div>
          <button onClick={() => { if (!user) setShowLogin(true); }} className="flex items-center gap-1.5 bg-bg rounded-full px-3 py-1.5 border border-border-tertiary active:scale-95 transition-transform">
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
            <span className="text-xs font-semibold">{user ? balance.toLocaleString() : "未登录"} 🎮</span>
          </button>
        </div>
      </div>

      {/* ── 运势工具快捷入口 ── */}
      <div className="sticky top-[52px] z-20 bg-white border-b border-border-tertiary overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 px-3 py-2.5">
          {FORTUNE_TOOLS.map((tool, i) => (
            <button key={i} onClick={() => {
              if (tool.tab) {
                setTab(tool.tab);
                setMessages([{ role: "assistant", content: getGreeting() }]);
                setSubCategory("");
                if (tool.question) {
                  handleQuickQuestion(tool.question, TAB_CONFIG.find(t => t.id === tool.tab)?.cost || 5);
                }
              } else if (tool.label === "分享") {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  alert("链接已复制，分享给朋友一起来测运势吧！");
                }).catch(() => {});
              }
            }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap bg-gradient-to-r from-purple-50 to-purple-100/60 border border-purple-200/60 active:scale-95 transition-transform shadow-sm">
              <span className="text-sm">{tool.icon}</span>
              <span className="text-purple-700">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 Category Tabs ── */}
      <div className="sticky top-[104px] z-20 bg-white border-b border-border-tertiary overflow-x-auto scrollbar-none">
        <div className="flex gap-0.5 px-2">
          {TAB_CONFIG.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMessages([{ role: "assistant", content: getGreeting() }]); setSubCategory(""); }}
              className={`flex-1 whitespace-nowrap py-3 px-2 text-[11px] font-medium text-center transition-all relative ${
                tab === t.id ? "text-brand-teal-dark font-semibold" : "text-text-tertiary"
              }`}>
              {t.icon} {t.label}
              {tab === t.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-teal rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Subtitle / Disclaimer ── */}
      {cfg.subtitle && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100/50">
          <p className="text-[10px] text-amber-700/80 leading-relaxed">{cfg.subtitle}</p>
        </div>
      )}

      {/* ── Subcategory Selector ── */}
      {tab === "zodiac" && (
        <div className="px-4 py-2 bg-white border-b border-border-tertiary">
          <button onClick={() => setShowSubs(!showSubs)}
            className="w-full flex items-center justify-between bg-bg rounded-[12px] px-3 py-2 text-xs">
            <span className="text-text-primary font-medium">
              {subCategory || "选择咨询类型"}
            </span>
            <span className="flex items-center gap-1 text-text-tertiary">
              <span className="font-semibold text-brand-teal-dark">{zodiacCost}豆</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSubs ? "rotate-180" : ""}`} />
            </span>
          </button>
          {showSubs && (
            <div className="mt-1.5 space-y-0.5">
              {cfg.cost_map?.map((item: {label: string; cost: number}) => (
                <button key={item.label} onClick={() => { setSubCategory(item.label); setZodiacCost(item.cost); setShowSubs(false); }}
                  className={`w-full flex items-center justify-between rounded-[10px] px-3 py-2 text-[11px] transition ${
                    subCategory === item.label ? "bg-brand-teal/10 text-brand-teal-dark font-medium" : "bg-bg text-text-secondary"
                  }`}>
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.cost}豆</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat Messages ── */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.length === 1 && (
          <div className="mb-3">
            {/* Quick questions */}
            {tab !== "zodiac" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {cfg.questions.map((q, i) => (
                  <button key={i} onClick={() => handleQuickQuestion(q, cfg.cost)}
                    className="text-[10px] bg-surface rounded-xl px-2.5 py-2.5 text-left border border-border-tertiary shadow-sm active:scale-[0.97] transition-transform hover:border-brand-teal/30">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {tab === "zodiac" && !subCategory && (
              <div className="text-center py-6">
                <p className="text-xs text-text-tertiary">请先选择咨询类型</p>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-br-md"
                  : "bg-surface border border-border-tertiary shadow-sm rounded-bl-md"
              }`}>
                {msg.content}
              </div>
              {/* 反馈按钮：只显示在assistant消息 */}
              {msg.role === "assistant" && msg.content !== getGreeting() && i > 0 && (
                <div className="flex gap-2 mt-1 ml-1">
                  <button onClick={() => handleFeedback(i, 1)}
                    className="text-[9px] text-text-tertiary hover:text-green-500 transition-colors">👍 准</button>
                  <button onClick={() => handleFeedback(i, 0)}
                    className="text-[9px] text-text-tertiary hover:text-red-400 transition-colors">👎 不准</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center mr-2 shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-surface border border-border-tertiary shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{animationDelay:"0ms"}} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{animationDelay:"150ms"}} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{animationDelay:"300ms"}} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="sticky bottom-[64px] bg-white border-t border-border-tertiary px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-2 bg-bg rounded-[16px] border border-border-tertiary px-3 py-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="输入你的问题..." className="flex-1 text-sm outline-none bg-transparent py-1" disabled={loading} />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-50">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Disclaimer Modal ── */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[24px] p-5 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold">风险提示</h3>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-4 text-center">{cfg.disclaimer}</p>
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={disclaimerAccepted} onChange={e => setDisclaimerAccepted(e.target.checked)} className="mt-0.5 accent-brand-teal" />
              <span className="text-[10px] text-text-tertiary leading-relaxed">我已阅读并理解以上提示，确认仅用于传统文化娱乐参考</span>
            </label>
            <button onClick={confirmDisclaimer} disabled={!disclaimerAccepted}
              className={`w-full rounded-[14px] py-2.5 text-sm font-semibold text-white transition ${
                disclaimerAccepted ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark" : "bg-gray-200 text-gray-400"
              }`}>确认进入</button>
          </div>
        </div>
      )}

      {/* ── Confirm Deduct Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[24px] p-5 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <Shield className="w-10 h-10 text-brand-teal mx-auto mb-2" />
              <h3 className="text-sm font-bold">确认咨询</h3>
            </div>
            <p className="text-xs text-text-secondary text-center mb-4">
              本次测算将扣除 <span className="font-bold text-brand-teal-dark">{deductCost}</span> 🎮，确认发起咨询？
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-[14px] py-2.5 text-xs font-medium border border-border-tertiary text-text-secondary active:scale-95 transition-transform">取消</button>
              <button onClick={confirmSend} disabled={balance < deductCost}
                className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform ${
                  balance >= deductCost ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark" : "bg-gray-200 text-gray-400"
                }`}>
                {balance >= deductCost ? "确认发起" : "豆子不足"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disclaimer Footer ── */}
      <div className="px-4 py-2 bg-bg border-t border-border-tertiary">
        <p className="text-[8px] text-text-tertiary/60 text-center leading-relaxed">
          本平台AI推演仅传统易学文化娱乐内容，不构成彩票、股票、虚拟货币、婚恋、医疗、法律任何决策依据；网络售彩违法，虚拟货币交易不受法律保护，各类资金操作请理性谨慎。
        </p>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
