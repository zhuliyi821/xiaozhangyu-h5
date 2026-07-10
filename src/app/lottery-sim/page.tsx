"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle, Dices, Sparkles, Trophy, DollarSign, History, ChevronDown, Bot } from "lucide-react";

import { API_BASE } from '@/config/api';
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

interface LotteryConfig {
  name: string; code: string; front_name: string; front_range: number; front_pick: number;
  back_name: string | null; back_range: number; back_pick: number; price: number; source: string;
  tiers: Array<{ tier: number; name: string; desc: string; odds: string; amount: number }>;
}

interface BetResult {
  bet_id: string; lottery_name: string; total_bet: number; total_win: number; net_result: number;
  tickets: Array<{ ticket: any; prize: any }>;
  draw: any; draw_id: string; balance_after: number;
}

const LOTTERY_LIST = [
  { code: "ssq", name: "双色球", color: "from-red-500 to-red-600", icon: "🔴" },
  { code: "dlt", name: "大乐透", color: "from-purple-500 to-purple-600", icon: "🟣" },
  { code: "fc3d", name: "3D", color: "from-blue-500 to-blue-600", icon: "🔵" },
  { code: "pl3", name: "排列3", color: "from-green-500 to-green-600", icon: "🟢" },
  { code: "qxc", name: "七星彩", color: "from-amber-500 to-amber-600", icon: "⭐" },
];

import { Suspense } from "react";

export default function LotterySimPage() {
  return (
    <Suspense fallback={
      <main className="pb-20 min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-tertiary text-sm">加载中...</div>
      </main>
    }>
      <LotterySimContent />
    </Suspense>
  );
}

function LotterySimContent() {
  const searchParams = useSearchParams();
  const initType = searchParams.get("type") || "ssq";
  const predParam = searchParams.get("pred") || "";
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [lotteryCode, setLotteryCode] = useState(initType);
  const [config, setConfig] = useState<LotteryConfig | null>(null);
  const [balance, setBalance] = useState(0);
  const [selectedFront, setSelectedFront] = useState<number[]>([]);
  const [selectedBack, setSelectedBack] = useState<number[]>([]);
  const [tickets, setTickets] = useState<Array<{ front: number[]; back: number[] }>>([]);
  const [betting, setBetting] = useState(false);
  const [result, setResult] = useState<BetResult | null>(null);
  const [showDraw, setShowDraw] = useState(false);
  const [history, setHistory] = useState<BetResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const [betMultiple, setBetMultiple] = useState(1);

  // Parse AI prediction from URL params
  const predNumbers: { front: number[]; back: number[] } | null = (() => {
    if (!predParam || !predParam.includes("-")) return null;
    const parts = predParam.split("-");
    const front = parts[0]?.split(",").map(Number).filter(n => n > 0) || [];
    const back = parts[1]?.split(",").map(Number).filter(n => n > 0) || [];
    if (front.length === 0) return null;
    return { front, back };
  })();

  const [aiPrediction, setAiPrediction] = useState(predNumbers);

  // Load config and auto-fill AI prediction
  useEffect(() => {
    fetch(API_BASE + "/api/lotto/config?code=" + lotteryCode)
      .then(r => r.json())
      .then(j => { 
        if (j.code === 0) {
          setConfig(j.data);
          // Auto-fill AI prediction numbers
          if (aiPrediction) {
            setSelectedFront(aiPrediction.front);
            setSelectedBack(aiPrediction.back);
          }
        }
      })
      .catch(() => {});
    if (!aiPrediction) {
      setSelectedFront([]);
      setSelectedBack([]);
    }
    setResult(null);
    setShowDraw(false);
  }, [lotteryCode]);

  // Load real balance from wallet
  useEffect(() => {
    if (!user) { setBalance(0); return; }
    fetch(API_BASE + "/api/lotto-bet-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, action: "balance" }),
    })
      .then(r => r.json())
      .then(j => { if (j.code === 0) setBalance(Math.floor(j.data.game_coins)); })
      .catch(() => {});
  }, [user]);

  const toggleNumber = (num: number, isFront: boolean) => {
    const setter = isFront ? setSelectedFront : setSelectedBack;
    const current = isFront ? selectedFront : selectedBack;
    const range = isFront ? (config?.front_range || 33) : (config?.back_range || 16);
    const pick = isFront ? (config?.front_pick || 6) : (config?.back_pick || 1);
    if (current.includes(num)) {
      setter(current.filter(n => n !== num));
    } else if (current.length < pick) {
      setter([...current, num].sort((a, b) => a - b));
    }
  };

  const addTicket = () => {
    if (!config) return;
    if (config.back_pick > 0) {
      if (selectedFront.length !== config.front_pick) { setError(`请选 ${config.front_pick} 个${config.front_name}`); return; }
      if (selectedBack.length !== config.back_pick) { setError(`请选 ${config.back_pick} 个${config.back_name}`); return; }
    } else {
      if (selectedFront.length === 0) { setError("请选择号码"); return; }
    }
    setTickets([...tickets, { front: [...selectedFront], back: [...selectedBack] }]);
    setSelectedFront([]);
    setSelectedBack([]);
    setError("");
  };

  const removeTicket = (idx: number) => {
    setTickets(tickets.filter((_, i) => i !== idx));
  };

  const quickPick = () => {
    fetch(API_BASE + "/api/lotto/quick-pick?code=" + lotteryCode)
      .then(r => r.json())
      .then(j => {
        if (j.code === 0) {
          const t = j.data.ticket;
          setSelectedFront(t.front || []);
          setSelectedBack(t.back || []);
          if (t.digits) setSelectedFront(t.digits);
        }
      })
      .catch(() => {});
    setError("");
  };

  const placeBet = async () => {
    if (!user) { setShowLogin(true); return; }
    if (tickets.length === 0 && (selectedFront.length > 0 || (config?.back_pick === 0 && selectedFront.length === 0))) {
      // Auto-add current selection
      if (config && config.back_pick > 0 && selectedFront.length === config.front_pick && selectedBack.length === config.back_pick) {
        setTickets([...tickets, { front: [...selectedFront], back: [...selectedBack] }]);
        setSelectedFront([]); setSelectedBack([]);
      } else if (config && config.back_pick === 0 && selectedFront.length > 0) {
        setTickets([...tickets, { front: [...selectedFront], back: [] }]);
        setSelectedFront([]);
      } else {
        setError("请选择号码或添加投注");
        return;
      }
    }
    
    // Wait for state update
    await new Promise(r => setTimeout(r, 50));
    
    const betTickets = tickets.length > 0 ? tickets : 
      config?.back_pick === 0 ? [{ front: selectedFront, back: [] }] : [{ front: selectedFront, back: selectedBack }];
    
    if (betTickets.length === 0) { setError("请至少添加一注"); return; }
    
    setBetting(true);
    setError("");
    setResult(null);
    setShowDraw(false);
    
    try {
      // 1) 扣游戏豆
      const deductRes = await fetch(API_BASE + "/api/lotto-bet-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "bet", amount: totalCost, lottery: lotteryCode }),
      });
      const deductJson = await deductRes.json();
      if (deductJson.code !== 0) throw new Error(deductJson.msg || "投注失败");
      
      // 2) Python开奖模拟
      const res = await fetch(API_BASE + "/api/lotto/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: String(user.uid), lottery: lotteryCode, tickets: betTickets, multiple: betMultiple }),
      });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.msg);
      
      // 3) 结算: 赢则加水晶石
      const totalWin = json.data?.total_win || 0;
      const winAmount = totalWin > totalCost ? totalWin - totalCost : 0;
      if (totalWin > 0) {
        await fetch(API_BASE + "/api/lotto-bet-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid, action: "settle",
            return_amount: totalWin >= totalCost ? totalCost : totalWin,
            win_amount: winAmount,
            lottery: lotteryCode,
          }),
        });
      }
      
      setResult(json.data);
      setBalance(prev => prev - totalCost + totalWin);
      setHistory(prev => [json.data, ...prev].slice(0, 50));
      setTickets([]);
      setSelectedFront([]);
      setSelectedBack([]);
      setTimeout(() => setShowDraw(true), 300);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBetting(false);
    }
  };

  const totalCost = tickets.length * (config?.price || 2) * betMultiple;
  const canBet = (totalCost > 0 || selectedFront.length > 0) && balance >= (totalCost > 0 ? totalCost : (config?.price || 2) * betMultiple);

  return (
    <main className="pb-20 min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">彩票投注</h1>
              <p className="text-[11px] text-white/80">用游戏豆投注 · 赢水晶石</p>
            </div>
          </div>
          <div className="text-right text-white">
                    <div className="text-[10px] opacity-75">{user ? "🎮游戏豆" : "未登录"}</div>
            <div className="text-base font-bold">{user ? balance.toLocaleString() : "—"} 🎮</div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-20">
        {/* Lottery Type Selector */}
        <div className="bg-surface rounded-[8px] p-3 shadow-sm border border-border-tertiary mb-3">
          <div className="grid grid-cols-5 gap-1.5">
            {LOTTERY_LIST.map(l => (
              <button key={l.code} onClick={() => { setLotteryCode(l.code); setTickets([]); }}
                className={`py-2.5 rounded-[8px] text-center active:scale-95 transition-all ${
                  lotteryCode === l.code
                    ? `bg-gradient-to-r ${l.color} text-white shadow-sm`
                    : "bg-bg text-text-secondary border border-border-tertiary"
                }`}>
                <div className="text-lg">{l.icon}</div>
                <div className="text-[9px] font-semibold mt-0.5">{l.name}</div>
              </button>
            ))}
          </div>
        </div>

        {config && (
          <>
            {/* AI Prediction Banner */}
            {aiPrediction && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-[8px] p-3 mb-3 border border-indigo-200/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="text-xs font-semibold text-indigo-700">AI 推荐号码</div>
                    <div className="text-[10px] text-indigo-500">
                      {aiPrediction.front.join(", ")}
                      {aiPrediction.back.length > 0 && <span> + {aiPrediction.back.join(", ")}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => {
                  setSelectedFront(aiPrediction.front);
                  setSelectedBack(aiPrediction.back);
                }} className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-500 text-white font-medium active:scale-95 transition-transform">
                  选此号
                </button>
              </div>
            )}

            {/* Number Picker */}
            <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{config.front_name}</span>
                  <span className="text-[10px] text-text-tertiary">选 {config.front_pick} 个 (1-{config.front_range})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold">{selectedFront.length}/{config.front_pick}</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 max-h-[160px] overflow-y-auto">
                {Array.from({ length: config.front_range }, (_, i) => i + 1).map(n => {
                  const isSelected = selectedFront.includes(n);
                  return (
                    <button key={n} onClick={() => toggleNumber(n, true)}
                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center active:scale-90 transition-all ${
                        isSelected ? "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-sm scale-110" : "bg-bg text-text-secondary border border-border-tertiary"
                      }`}>
                      {String(n).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              {config.back_pick > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-3">
                    <span className="text-sm font-semibold">{config.back_name}</span>
                    <span className="text-[10px] text-text-tertiary">选 {config.back_pick} 个 (1-{config.back_range})</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: config.back_range }, (_, i) => i + 1).map(n => {
                      const isSelected = selectedBack.includes(n);
                      return (
                        <button key={n} onClick={() => toggleNumber(n, false)}
                          className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center active:scale-90 transition-all ${
                            isSelected ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm scale-110" : "bg-bg text-text-secondary border border-border-tertiary"
                          }`}>
                          {String(n).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Quick Pick + Add */}
              <div className="flex gap-2 mt-4">
                <button onClick={quickPick} className="flex-1 py-2 rounded-[8px] bg-bg text-text-secondary text-xs font-medium border border-border-tertiary flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  <Dices className="w-3.5 h-3.5" /> 机选
                </button>
                <button onClick={addTicket} className="flex-1 py-2 rounded-[8px] bg-brand-teal/10 text-brand-teal-dark text-xs font-medium border border-brand-teal/30 flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  + 添加选号 ({(config?.price || 2) * betMultiple}🎮)
                </button>
              </div>
            </div>

            {/* Bet Slip */}
            {tickets.length > 0 && (
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
                <div className="text-sm font-semibold mb-2">投注清单 ({tickets.length}注)</div>
                {tickets.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-tertiary/40 last:border-0">
                    <div className="text-xs">
                      <span className="text-red-500 font-medium">{t.front.join(", ")}</span>
                      {t.back.length > 0 && <span className="text-blue-500 font-medium ml-1">+ {t.back.join(", ")}</span>}
                    </div>
                    <button onClick={() => removeTicket(i)} className="text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-200 active:scale-90">删除</button>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-text-tertiary">共 {tickets.length} 注</div>
                  <div className="text-sm font-bold">{totalCost} 🎮</div>
                </div>
              </div>
            )}

            {/* Multiple selector */}
            <div className="bg-surface rounded-[8px] p-3 shadow-sm border border-border-tertiary mb-3 flex items-center justify-between">
              <span className="text-xs text-text-secondary">倍数</span>
              <div className="flex items-center gap-2">
                {[1, 2, 5, 10].map(m => (
                  <button key={m} onClick={() => setBetMultiple(m)}
                    className={`w-8 h-7 rounded-[8px] text-xs font-medium active:scale-90 ${betMultiple === m ? "bg-brand-teal text-white" : "bg-bg text-text-secondary border border-border-tertiary"}`}>
                    {m}x
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs mb-3">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Place Bet */}
            <button onClick={placeBet} disabled={betting || !canBet}
              className={`w-full py-3 mb-3 rounded-[8px] text-sm font-bold text-white active:scale-[0.97] transition-all ${
                canBet ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-sm" : "bg-gray-200 text-gray-400"
              }`}>
              {betting ? "开奖中..." : !user ? "请先登录" : `投注 ${tickets.length > 0 ? totalCost : (config?.price || 2) * betMultiple} 🎮`}
            </button>

            {!user && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 text-amber-700 text-xs text-center">
                请先 <button onClick={() => setShowLogin(true)} className="font-bold underline">登录</button> 后使用游戏豆投注
              </div>
            )}

            {/* Draw Result */}
            {result && showDraw && (
              <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-border-tertiary mb-3 text-center animate-in">
                <div className="flex items-center justify-center gap-1 mb-3">
                  <Trophy className="w-5 h-5 text-brand-gold" />
                  <span className="text-sm font-bold">开奖结果</span>
                </div>
                
                {/* Draw numbers animation */}
                <div className="flex justify-center gap-2 mb-3">
                  {result.draw.front?.map((n: number, i: number) => (
                    <div key={"f"+i} className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center text-sm font-bold shadow-sm animate-bounce" style={{ animationDelay: `${i * 0.1}s`, animationDuration: "0.5s" }}>
                      {String(n).padStart(2, "0")}
                    </div>
                  ))}
                  {result.draw.back?.map((n: number, i: number) => (
                    <div key={"b"+i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm animate-bounce" style={{ animationDelay: `${(result.draw.front?.length || 0) * 0.1 + i * 0.1}s`, animationDuration: "0.5s" }}>
                      {String(n).padStart(2, "0")}
                    </div>
                  ))}
                  {result.draw.digits?.map((n: number, i: number) => (
                    <div key={"d"+i} className="w-9 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-sm animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.5s" }}>
                      {n}
                    </div>
                  ))}
                </div>
                
                {/* Prize info */}
                {result.tickets.map((t, i) => (
                  <div key={i} className={`p-3 rounded-xl mb-2 ${t.prize.won ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-brand-gold/30" : "bg-bg"}`}>
                    <div className="flex items-center justify-center gap-1 text-xs mb-1">
                      {t.prize.won ? <Sparkles className="w-4 h-4 text-brand-gold" /> : <span className="text-text-tertiary">😅</span>}
                      <span className={t.prize.won ? "text-brand-gold-dark font-bold" : "text-text-tertiary"}>
                        {t.prize.won ? `🎉 ${t.prize.name} — 奖金 ${t.prize.amount}✨` : "未中奖"}
                      </span>
                    </div>
                    {t.prize.won && <div className="text-[10px] text-text-tertiary">匹配 {t.prize.matched_front}前+{t.prize.matched_back}后</div>}
                  </div>
                ))}
                
                <div className="mt-3 text-sm">
                  {result.net_result > 0 ? (
                    <span className="text-red-500 font-bold">+{result.net_result}✨ 🎉</span>
                  ) : result.net_result === 0 ? (
                    <span className="text-text-tertiary">收支平衡</span>
                  ) : (
                    <span className="text-text-tertiary">{result.net_result}🎮</span>
                  )}
                </div>
              </div>
            )}

            {/* History Toggle */}
            <details className="bg-surface rounded-[8px] overflow-hidden shadow-sm border border-border-tertiary mb-3">
              <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-text-tertiary" />
                  <span>投注历史</span>
                </div>
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              </summary>
              <div className="px-4 pb-4 max-h-60 overflow-y-auto space-y-2">
                {history.length === 0 && <div className="text-xs text-text-tertiary text-center py-4">暂无投注记录</div>}
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-tertiary/40 last:border-0">
                    <div>
                      <div className="text-xs font-semibold">{h.lottery_name}</div>
                      <div className="text-[10px] text-text-tertiary">{h.bet_id.slice(0, 16)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-text-tertiary">{h.total_bet}🪙</div>
                      <div className={`text-[11px] font-bold ${h.net_result > 0 ? "text-red-500" : "text-text-tertiary"}`}>
                        {h.net_result > 0 ? `+${h.net_result}` : h.net_result === 0 ? "0" : `${h.net_result}`}🪙
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
