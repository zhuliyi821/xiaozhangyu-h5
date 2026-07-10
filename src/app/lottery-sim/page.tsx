"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle, Dices, Sparkles, Trophy, DollarSign, History, ChevronDown, Bot, MessageSquare } from "lucide-react";

import { API_BASE } from '@/config/api';
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import SurveyModal from "@/components/ui/survey-modal";
import { trackSession, trackBet, trackModeSwitch, trackQuickPick, trackManualPick, trackRebet, trackHistoryView } from "@/lib/user-tracking";

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
  { code: "ssq", name: "红蓝碰", color: "from-red-500 to-red-600", icon: "🔴🔵" },
  { code: "dlt", name: "双区碰", color: "from-purple-500 to-purple-600", icon: "🟣🟡" },
  { code: "fc3d", name: "三顺碰", color: "from-blue-500 to-blue-600", icon: "🔵" },
  { code: "pl3", name: "排列碰", color: "from-green-500 to-green-600", icon: "🟢" },
  { code: "qxc", name: "七星碰", color: "from-amber-500 to-amber-600", icon: "⭐" },
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
  const [spriteMsg, setSpriteMsg] = useState("");
  const [animPhase, setAnimPhase] = useState<"idle"|"flipping"|"reveal">("idle");
  const [rollDisplay, setRollDisplay] = useState(0);
  const [betCount, setBetCount] = useState(0);
  const [lastTickets, setLastTickets] = useState<Array<{ front: number[]; back: number[] }>>([]);
  const [lastMultiple, setLastMultiple] = useState(1);
  const [losingStreak, setLosingStreak] = useState(0);
  const [quickPickCount, setQuickPickCount] = useState(0);
  const [lastQuick, setLastQuick] = useState<string>("");
  const [easterEgg, setEasterEgg] = useState("");
  const [showSurvey, setShowSurvey] = useState(false);
  const [jackpot, setJackpot] = useState(0);
  const [trendData, setTrendData] = useState<Record<number, 'hot'|'cold'|'normal'>>({});
  const [showTasks, setShowTasks] = useState(false);

  // ─── 每日任务 ───
  const [dailyTasks, setDailyTasks] = useState<{
    date: string;
    bet10: number;     // 投注次数
    hotWin: boolean;   // 追热达阵
    win10: boolean;    // 单局盈利>10
    claimed: string[]; // 已领奖任务id
  }>({ date: "", bet10: 0, hotWin: false, win10: false, claimed: [] });

  const TASK_CONFIG = [
    { id: "bet10", label: "🎯 专注投注", desc: "投注 10 次", progress: () => dailyTasks.bet10, target: 10, reward: "20🎮" },
    { id: "hotWin", label: "🔥 追热达阵", desc: "选热号并中奖", progress: () => dailyTasks.hotWin ? 1 : 0, target: 1, reward: "30🎮" },
    { id: "win10", label: "🏆 小赢一局", desc: "单局盈利赢 10🎮", progress: () => dailyTasks.win10 ? 1 : 0, target: 1, reward: "25🎮" },
  ];

  // ─── 成就系统 ───
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});

  const ACHIEVEMENT_LIST = [
    { id: "first_bet", label: "🥉 数字新手", desc: "首次投注", reward: "10🎮" },
    { id: "bet_100", label: "🥈 百战勇士", desc: "投注 100 次", reward: "100🎮" },
    { id: "bet_1000", label: "🥇 千次挑战", desc: "投注 1000 次", reward: "500🎮" },
    { id: "streak_5", label: "🔥 五连胜", desc: "连续 5 局赢", reward: "200🎮" },
    { id: "jackpot", label: "💎 天选之人", desc: "中过头彩", reward: "1000🎮" },
    { id: "night_owl", label: "🌙 夜猫子", desc: "凌晨 1-5 点投注", reward: "50🎮" },
  ];

  // 会话追踪 + 奖池拉取
  useEffect(() => { trackSession(); }, []);
  useEffect(() => {
    fetch(API_BASE + "/api/lotto/jackpot?code=" + lotteryCode)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setJackpot(j.data.grand_pool); })
      .catch(() => {});
  }, [lotteryCode]);

  const SPRITE_QUOTES: Record<string, string[]> = {
    welcome: ["欢迎来数字碰，选你的幸运号码吧！", "今天运气不错，试试手气？", "数字碰已就绪，等你来碰！"],
    head: ["你今天是天选之人！🎉", "我的天，这运气我服了！", "快去买张真的彩票！"],
    big: ["不错不错，有眼光！", "运气来了挡不住！", "这波很赚！"],
    small: ["小赢也是赢，积少成多！", "回本了，继续继续！", "稳稳的幸福～"],
    miss: ["差一点就中了！", "下次一定！", "运气在蓄力中..."],
    badstreak: ["运气在积蓄能量⏳", "别放弃，下一把就中了！", "连败是为了更大的胜利！"],
    egg_pattern: ["很有规律的号码，我喜欢！", "这数字排列，强迫症福音！"],
    egg_night: ["夜猫子专属时间 🌙", "凌晨的运气特别灵！"],
  };

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
    // 拉取冷热号
    fetch(API_BASE + "/api/lotto/trend?code=" + lotteryCode + "&limit=100")
      .then(r => r.json())
      .then(j => {
        if (j.code === 0) {
          const map: Record<number, 'hot'|'cold'|'normal'> = {};
          (j.data.all || []).forEach((item: any) => {
            if (item.number) map[item.number] = item.count > 0 ? (item.count > j.data.total_draws / 50 * 1.3 ? 'hot' : 'normal') : 'cold';
          });
          setTrendData(map);
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

  // ─── 每日任务 + 成就 初始化 ───
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("szp_daily_tasks");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) setDailyTasks(parsed);
      else setDailyTasks({ date: today, bet10: 0, hotWin: false, win10: false, claimed: [] });
    } else {
      setDailyTasks({ date: today, bet10: 0, hotWin: false, win10: false, claimed: [] });
    }
    const ach = localStorage.getItem("szp_achievements");
    if (ach) setAchievements(JSON.parse(ach));
  }, []);

  // 任务进度持久化
  useEffect(() => { localStorage.setItem("szp_daily_tasks", JSON.stringify(dailyTasks)); }, [dailyTasks]);
  useEffect(() => { localStorage.setItem("szp_achievements", JSON.stringify(achievements)); }, [achievements]);

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
    trackManualPick();
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
  trackQuickPick();
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
      trackBet(totalCost, totalWin);
      // 刷新奖池
      fetch(API_BASE + "/api/lotto/jackpot?code=" + lotteryCode)
        .then(r => r.json())
        .then(j => { if (j.code === 0) setJackpot(j.data.grand_pool); })
        .catch(() => {});
      // 保存号码用于"再来一注"
      setLastTickets(betTickets);
      setLastMultiple(betMultiple);
      // 连胜/连败追踪
      if (json.data.net_result > 0) {
        setLosingStreak(0);
      } else {
        setLosingStreak(prev => prev + 1);
      }
      setTickets([]);
      setSelectedFront([]);
      setSelectedBack([]);

    // ─── 每日任务追踪 ───
    setDailyTasks(prev => {
      const next = { ...prev };
      // 任务1: 投注次数
      next.bet10 = (next.bet10 || 0) + 1;
      // 任务2: 追热达阵 — 选了热号且中奖
      if (json.data.net_result > 0 && betTickets.some(t => t.front.some(n => trendData[n] === 'hot'))) {
        next.hotWin = true;
      }
      // 任务3: 单局盈利 > 10
      if (json.data.net_result > 10) {
        next.win10 = true;
      }
      return next;
    });

    // ─── 成就系统追踪 ───
    setAchievements(prev => {
      const next = { ...prev };
      const totalBets = (JSON.parse(localStorage.getItem("szp_track") || "{}") as any).totalBets || 0;
      if (!next.first_bet && totalBets >= 1) next.first_bet = true;
      if (!next.bet_100 && totalBets >= 100) next.bet_100 = true;
      if (!next.bet_1000 && totalBets >= 1000) next.bet_1000 = true;
      if (!next.jackpot && json.data.tickets.some((t: any) => t.prize.name?.includes("头彩"))) next.jackpot = true;
      const hour = new Date().getHours();
      if (!next.night_owl && hour >= 1 && hour <= 5) next.night_owl = true;
      // 五连胜追踪
      if (!next.streak_5) {
        const streakKey = "szp_win_streak";
        let streak = parseInt(localStorage.getItem(streakKey) || "0", 10);
        if (json.data.net_result > 0) {
          streak += 1;
          if (streak >= 5) next.streak_5 = true;
        } else {
          streak = 0;
        }
        localStorage.setItem(streakKey, String(streak));
      }
      return next;
    });

    setTimeout(() => setShowDraw(true), 300);
    
    // 数字精灵语录
    const msgs = SPRITE_QUOTES;
    if (json.data.net_result > 0) {
      const tier = json.data.tickets.find((t:any) => t.prize.won)?.prize?.name || "";
      if (tier.includes("头彩")) setSpriteMsg(msgs.head[Math.floor(Math.random()*msgs.head.length)]);
      else if (tier.includes("大赏") || tier.includes("中赏")) setSpriteMsg(msgs.big[Math.floor(Math.random()*msgs.big.length)]);
      else setSpriteMsg(msgs.small[Math.floor(Math.random()*msgs.small.length)]);
    } else {
      if (losingStreak >= 4) setSpriteMsg(msgs.badstreak[Math.floor(Math.random()*msgs.badstreak.length)]);
      else setSpriteMsg(msgs.miss[Math.floor(Math.random()*msgs.miss.length)]);
    }
    
    // 彩蛋检测
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 5) setEasterEgg(msgs.egg_night[Math.floor(Math.random()*msgs.egg_night.length)]);
    else if (betTickets.some(t => {
      const sorted = [...t.front].sort((a,b) => a-b);
      return sorted.every((n,i) => i===0 || n === sorted[i-1]+1);
    })) setEasterEgg(msgs.egg_pattern[Math.floor(Math.random()*msgs.egg_pattern.length)]);
    
    // 收银机滚动
    let start = 0;
    const target = json.data.total_win;
    if (target > 0) {
      const step = Math.max(1, Math.floor(target / 30));
      const interval = setInterval(() => {
        start += step;
        if (start >= target) { start = target; clearInterval(interval); }
        setRollDisplay(start);
      }, 30);
    }
    
  } catch (e: any) {
      setError(e.message);
    } finally {
      setBetting(false);
    }
  };

  const totalCost = tickets.length * (config?.price || 2) * betMultiple;
  const canBet = (totalCost > 0 || selectedFront.length > 0) && balance >= (totalCost > 0 ? totalCost : (config?.price || 2) * betMultiple);

  // 再来一注：用同样的号码和倍数再投
  const rebet = async () => {
    if (lastTickets.length === 0 || !user) return;
    trackRebet();
    setTickets(lastTickets);
    setBetMultiple(lastMultiple);
    await new Promise(r => setTimeout(r, 50));
    placeBet();
  };

  return (
    <main className="pb-20 min-h-screen bg-bg">
      {/* Header — 金青珊瑚品牌色 */}
      <div className="bg-gradient-to-r from-[#0F6E56] to-[#04342C] px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(69,204,213,0.15),transparent_70%)] blur-[16px]" />
        {/* 顶部导航行 */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-[15px] font-medium text-white">数字碰</h1>
              <p className="text-[10px] text-white/60">选号碰 · 一秒开奖</p>
            </div>
          </div>
          <div className="text-right text-white">
            <div className="text-[9px] opacity-50">{user ? "游戏豆" : "未登录"}</div>
            <div className="text-sm font-bold">{user ? balance.toLocaleString() : "—"} 🎮</div>
          </div>
        </div>
        {/* 奖金池 — 视觉重心 */}
        <div className="text-center mt-3 pt-2 border-t border-white/10 relative z-10">
          <div className="text-[9px] text-white/40 tracking-[1px]">当前奖金池</div>
          <div className="text-[22px] font-bold text-[#F2B631] tracking-[1px] mt-0.5">{Math.floor(jackpot).toLocaleString()} 🎮</div>
          <div className="text-[9px] text-white/30 mt-0.5">人人可中 · 上不封顶</div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-20">
        {/* Lottery Type Selector */}
        <div className="bg-surface rounded-[8px] p-3 shadow-sm border border-border-tertiary mb-3">
          <div className="grid grid-cols-5 gap-1.5">
            {LOTTERY_LIST.map(l => (
              <button key={l.code} onClick={() => { setLotteryCode(l.code); setTickets([]); trackModeSwitch(); }}
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
                  <span className="text-sm font-medium">{config.front_name}</span>
                  <span className="text-[10px] text-text-tertiary">选 {config.front_pick} 个 (1-{config.front_range})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />热</span>
                  <span className="text-[9px] flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />冷</span>
                  <span className="text-xs font-semibold">{selectedFront.length}/{config.front_pick}</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 max-h-[160px] overflow-y-auto">
                  {Array.from({ length: config.front_range }, (_, i) => i + 1).map(n => {
                  const isSelected = selectedFront.includes(n);
                  const trend = trendData[n];
                  return (
                    <button key={n} onClick={() => toggleNumber(n, true)}
                      className={`relative w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center active:scale-90 transition-all overflow-visible ${
                        isSelected ? "bg-[#F27152] text-white shadow-sm scale-110" : "bg-bg text-text-secondary border border-border-tertiary"
                      }`}>
                      {String(n).padStart(2, "0")}
                      {!isSelected && trend === 'hot' && <span className="absolute -top-0.5 -right-0.5 w-[5px] h-[5px] rounded-full bg-[#E24B4A]" />}
                      {!isSelected && trend === 'cold' && <span className="absolute -top-0.5 -right-0.5 w-[5px] h-[5px] rounded-full bg-[#378ADD]" />}
                    </button>
                  );
                })}
              </div>

              {config.back_pick > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-3">
                    <span className="text-sm font-medium">{config.back_name}</span>
                    <span className="text-[10px] text-text-tertiary">选 {config.back_pick} 个 (1-{config.back_range})</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: config.back_range }, (_, i) => i + 1).map(n => {
                      const isSelected = selectedBack.includes(n);
                      return (
                        <button key={n} onClick={() => toggleNumber(n, false)}
                          className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center active:scale-90 transition-all ${
                            isSelected ? "bg-[#45CCD5] text-white shadow-sm scale-110" : "bg-bg text-text-secondary border border-border-tertiary"
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
                <button onClick={addTicket} className="flex-1 py-2 rounded-[8px] bg-[#E1F5EE] text-[#0F6E56] text-xs font-medium border border-[#1D9E75]/30 flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  + add {(config?.price || 2) * betMultiple}🎮
                </button>
              </div>
            </div>

            {/* Bet Slip */}
            {tickets.length > 0 && (
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
                <div className="text-sm font-medium mb-2">投注清单 ({tickets.length}注)</div>
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

            {/* Place Bet — 品牌茶青渐变 */}
            <button onClick={placeBet} disabled={betting || !canBet}
              className={`w-full py-3 mb-3 rounded-[8px] text-sm font-bold text-white active:scale-[0.97] transition-all ${
                canBet ? "bg-gradient-to-r from-[#1D9E75] to-[#0F6E56] shadow-sm" : "bg-[#E5E5EA] text-gray-400"
              }`}>
              {betting ? "开奖中..." : !user ? "请先登录" : `bet ${tickets.length > 0 ? totalCost : (config?.price || 2) * betMultiple} 🎮`}
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
                  <span className="text-[14px] font-medium">开奖结果</span>
                  <span className="text-[9px] text-text-tertiary ml-1">{result.bet_id}</span>
                </div>
                
                {/* Draw numbers animation */}
                <div className="flex justify-center gap-2 mb-3">
                  {result.draw.front?.map((n: number, i: number) => (
                    <div key={"f"+i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ animation: `ballDrop 0.4s ease-out ${i * 0.08}s both` }}>
                      {String(n).padStart(2, "0")}
                    </div>
                  ))}
                  {result.draw.back?.map((n: number, i: number) => (
                    <div key={"b"+i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ animation: `ballDrop 0.4s ease-out ${(result.draw.front?.length || 0) * 0.08 + i * 0.08}s both` }}>
                      {String(n).padStart(2, "0")}
                    </div>
                  ))}
                  {result.draw.digits?.map((n: number, i: number) => (
                    <div key={"d"+i}
                      className="w-9 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ animation: `ballDrop 0.4s ease-out ${i * 0.08}s both` }}>
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
                        {t.prize.won ? `🎉 ${t.prize.name} — 奖金 ` : "未中奖"}
                        {t.prize.won && t.prize.name.includes("头彩") && (
                          <span className="text-brand-gold-dark font-bold text-sm animate-pulse">{Number(rollDisplay || result.total_win).toLocaleString()}✨</span>
                        )}
                        {t.prize.won && !t.prize.name.includes("头彩") && `${Number(t.prize.amount).toLocaleString()}✨`}
                      </span>
                    </div>
                    {t.prize.won && <div className="text-[10px] text-text-tertiary">匹配 {t.prize.matched_front}前+{t.prize.matched_back}后</div>}
                  </div>
                ))}
                
                {/* 数字精灵语录 */}
                {spriteMsg && (
                  <div className="flex items-center justify-center gap-1.5 mt-2 mb-2 text-xs text-purple-500/70">
                    <span>💬 数字碰说:</span>
                    <span className="italic">{spriteMsg}</span>
                  </div>
                )}
                
                {/* 彩蛋 */}
                {easterEgg && (
                  <div className="text-[10px] text-brand-gold-dark/60 mb-2 animate-pulse">
                    {easterEgg}
                  </div>
                )}
                
                {/* 收银机效果 */}
                <div className="mt-3 text-sm">
                  {result.net_result > 0 ? (
                    <span className="text-brand-coral font-bold text-lg">+{Number(rollDisplay || result.net_result).toLocaleString()}✨ 🎉</span>
                  ) : result.net_result === 0 ? (
                    <span className="text-text-tertiary">收支平衡</span>
                  ) : (
                    <span className="text-text-tertiary">{result.net_result}🎮</span>
                  )}
                </div>
                
                {/* 再来一注 */}
                {lastTickets.length > 0 && (
                  <button onClick={rebet}
                    className="mt-3 w-full py-3 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-sm font-bold active:scale-[0.97] transition-all shadow-sm">
                    🔄 再来一注 (同号)
                  </button>
                )}
              </div>
            )}

            {/* History Toggle */}
            <details className="bg-surface rounded-[8px] overflow-hidden shadow-sm border border-border-tertiary mb-3" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) trackHistoryView(); }}>
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
                      <div className={`text-[11px] font-bold ${h.net_result > 0 ? "text-brand-coral" : "text-text-tertiary"}`}>
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
      {showSurvey && <SurveyModal onClose={() => setShowSurvey(false)} />}

      {/* ════════ 每日任务 + 成就 ════════ */}
      <div className="px-4 mt-2 mb-2">
        <div className="bg-surface rounded-[8px] shadow-sm border border-border-tertiary overflow-hidden">
          <button onClick={() => setShowTasks(!showTasks)}
            className="w-full flex items-center justify-between p-3 text-sm font-semibold active:bg-gray-50 transition-colors">
            <span>🏆 每日任务 · 成就</span>
            <div className="flex items-center gap-2">
              {TASK_CONFIG.filter(t => (t.id === "bet10" ? dailyTasks.bet10 >= t.target : dailyTasks[t.id as keyof typeof dailyTasks] === true)).length > 0 && (
                <span className="text-[10px] bg-brand-teal/10 text-brand-teal-dark px-2 py-0.5 rounded-full">
                  {TASK_CONFIG.filter(t => (t.id === "bet10" ? dailyTasks.bet10 >= t.target : dailyTasks[t.id as keyof typeof dailyTasks] === true)).length}/3
                </span>
              )}
              {Object.values(achievements).filter(Boolean).length > 0 && (
                <span className="text-[10px] bg-brand-gold/10 text-brand-gold-dark px-2 py-0.5 rounded-full">
                  {Object.values(achievements).filter(Boolean).length}/{ACHIEVEMENT_LIST.length}徽章
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${showTasks ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showTasks && (
            <div className="px-3 pb-4 space-y-3 border-t border-border-tertiary/40 pt-3">
              {/* ── 每日任务 ── */}
              <div>
                <div className="text-xs font-semibold text-text-secondary mb-2">每日任务 <span className="text-[9px] text-text-tertiary">每天刷新</span></div>
                {TASK_CONFIG.map(t => {
                  const progressVal = t.id === "bet10" ? dailyTasks.bet10 : dailyTasks[t.id as keyof typeof dailyTasks] === true ? 1 : 0;
                  const done = progressVal >= t.target;
                  const claimed = dailyTasks.claimed.includes(t.id);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border-tertiary/20 last:border-0">
                      <div className="flex-1">
                        <div className="text-xs font-medium">{t.label}</div>
                        <div className="text-[9px] text-text-tertiary">{t.desc}</div>
                        {!done && t.id === "bet10" && (
                          <div className="mt-1 h-1.5 bg-bg rounded-full overflow-hidden w-24">
                            <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${(progressVal / t.target) * 100}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {done ? (
                          claimed ? (
                            <span className="text-[10px] text-text-tertiary">✅ 已领</span>
                          ) : (
                            <button onClick={async () => {
                              // 领奖: 每天15🎮 平均
                              const reward = { bet10: 20, hotWin: 30, win10: 25 }[t.id] || 20;
                              try {
                                await fetch(API_BASE + "/api/lotto-bet-sync", {
                                  method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: reward, lottery: "task" }),
                                });
                                setDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, t.id] }));
                                setBalance(prev => prev + reward);
                              } catch {}
                            }} className="text-[10px] bg-brand-gold text-white px-2.5 py-1 rounded-full font-medium active:scale-90">
                              领取 {t.reward}
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-text-tertiary">{t.id === "bet10" ? `${progressVal}/${t.target}` : "未完成"}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── 成就 ── */}
              <div>
                <div className="text-xs font-semibold text-text-secondary mb-2">成就徽章 <span className="text-[9px] text-text-tertiary">一次性</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {ACHIEVEMENT_LIST.map(a => {
                    const unlocked = achievements[a.id];
                    return (
                      <div key={a.id} className={`p-2 rounded-[8px] text-center ${unlocked ? "bg-brand-gold/10 border border-brand-gold/30" : "bg-bg border border-border-tertiary"}`}>
                        <div className={`text-base ${unlocked ? "" : "grayscale opacity-40"}`}>{a.label.split(" ")[0]}</div>
                        <div className={`text-[9px] mt-0.5 font-medium ${unlocked ? "text-brand-gold-dark" : "text-text-tertiary"}`}>
                          {unlocked ? a.label : "???"}
                        </div>
                        {unlocked && <div className="text-[8px] text-text-tertiary mt-0.5">{a.reward}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 反馈入口 */}
      <div className="px-4 mt-2 mb-4">
        <button onClick={() => setShowSurvey(true)}
          className="w-full py-2 rounded-[8px] border border-dashed border-purple-200 text-[10px] text-purple-400
            hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3 h-3" /> 给数字碰提建议（3个问题）
        </button>
      </div>
    </main>
  );
}
