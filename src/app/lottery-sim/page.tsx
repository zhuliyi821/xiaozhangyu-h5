"use client";

import React, { useState, useEffect, useRef } from "react";
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
  // 长按定时器 ref（号码球长按 → 详情弹窗）
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPressed, setLongPressed] = useState<number | null>(null);
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
  // 冷热号状态: scorching/hot/normal/cold/icy
  const [trendData, setTrendData] = useState<Record<number, 'scorching'|'hot'|'normal'|'cold'|'icy'>>({});
  const [trendDataBack, setTrendDataBack] = useState<Record<number, 'scorching'|'hot'|'normal'|'cold'|'icy'>>({});
  const [recommendations, setRecommendations] = useState<Array<{strategy:string; label:string; front:number[]; back:number[]}>>([]);
  // 全量冷热数据（含z值/率等，用于详情弹窗）
  const [frontStats, setFrontStats] = useState<Array<{number:number; count:number; rate:number; z:number; status:string}>>([]);
  const [backStats, setBackStats] = useState<Array<{number:number; count:number; rate:number; z:number; status:string}>>([]);
  const [detailNum, setDetailNum] = useState<number | null>(null); // 弹窗的号码
  const [detailData, setDetailData] = useState<{number:number; count:number; rate:number; z:number; status:string} | null>(null);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  // 冷热筛选: null=全部, 否则只显示对应状态的号码
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [backFilterStatus, setBackFilterStatus] = useState<string | null>(null);
  const [showTasks, setShowTasks] = useState(false);
  // 庆祝效果
  const [celebrate, setCelebrate] = useState<{show:boolean; amount:number; label:string}>({show:false, amount:0, label:""});

  // ─── 个人统计 ───
  const defaultStats = { totalBets: 0, totalWins: 0, totalProfit: 0, biggestWin: 0, bestStreak: 0, worstStreak: 0, currentStreak: 0 };
  const [playerStats, setPlayerStats] = useState<{
    totalBets: number; totalWins: number; totalProfit: number;
    biggestWin: number; bestStreak: number; worstStreak: number; currentStreak: number;
  }>(defaultStats);
  const [showPlayerStats, setShowPlayerStats] = useState(false);

  // ─── 新手引导 ───
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const TUTORIAL_STEPS = [
    { title: "🎯 欢迎来到数字碰！", desc: "这是一款选号碰运气的游戏。选择你心仪的号码，试试手气吧！每注只需 2🎮，最高可赢 500,000🎮！", highlight: "none" },
    { title: "📊 冷热号助你决策", desc: "号码球上的红/青色标记显示冷热状态——红色=🔥近期热门，青色=❄️冷门蓄势。点击📊分析看完整数据！", highlight: "number-area" },
    { title: "⚡ 一键投注，一秒开奖", desc: "点「机选」或策略按钮快速选号，点「投注」立刻开奖。先送您一注免费体验！", highlight: "bet-area" },
  ];

  // ─── 每日挑战系统 ───
  const [dailyTasks, setDailyTasks] = useState<{
    date: string;
    // 晨间签到
    checkedIn: boolean;
    // 核心任务
    betCount: number;       // 投注次数
    hotWin: boolean;        // 热号中奖
    earn50: boolean;        // 单局净赚≥50
    // 挑战任务
    streak3: number;        // 连续中奖计数
    // 领奖
    claimed: string[];
    // 连击
    streakDay: number;      // 连续完成天数
    // 宝箱
    chestStars: number;     // 已积攒的星星
    chestOpened: boolean;   // 今日是否已开宝箱
  }>({ date: "", checkedIn: false, betCount: 0, hotWin: false, earn50: false, streak3: 0, claimed: [], streakDay: 0, chestStars: 0, chestOpened: false });

  const TASK_LIST = [
    // 晨间
    { zone: "morning", id: "checkin", label: "☀️ 晨间签到", desc: "新的一天，来签到吧", reward: 10 },
    // 核心
    { zone: "core", id: "bet3", label: "🎯 投注达人", desc: "投注 3 次", target: 3, progress: () => dailyTasks.betCount, reward: 15 },
    { zone: "core", id: "hotWin", label: "🔥 热号追踪", desc: "选热号(scorching/hot)并中奖", target: 1, progress: () => dailyTasks.hotWin ? 1 : 0, reward: 20 },
    { zone: "core", id: "earn50", label: "💰 日入百金", desc: "单局净赚 ≥50🎮", target: 1, progress: () => dailyTasks.earn50 ? 1 : 0, reward: 25 },
    // 挑战
    { zone: "challenge", id: "streak3", label: "👑 五连暴击", desc: "连续中奖 3 次", target: 3, progress: () => dailyTasks.streak3, reward: 50 },
  ];

  const BONUS_ALL_CLEAR = 30;   // 全清额外奖励
  const STREAK_BONUS = [0, 0, 0.3, 0.5, 0.7]; // 连击天数对应加成, index=day, max day 4
  const CHEST_COST = 3;  // 开宝箱所需星星数

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
    // 拉取冷热号（标准差模型 v2）
    fetch(API_BASE + "/api/lotto/trend?code=" + lotteryCode + "&limit=100")
      .then(r => r.json())
      .then(j => {
        if (j.code === 0) {
          // 从 front 数组读取每个号码的 status
          const map: Record<number, 'scorching'|'hot'|'normal'|'cold'|'icy'> = {};
          (j.data.front || []).forEach((item: any) => {
            if (item.number && item.status) map[item.number] = item.status;
          });
          setTrendData(map);
          // 后区冷热号
          const mapBack: Record<number, 'scorching'|'hot'|'normal'|'cold'|'icy'> = {};
          (j.data.back || []).forEach((item: any) => {
            if (item.number && item.status) mapBack[item.number] = item.status;
          });
          setTrendDataBack(mapBack);
          setFrontStats(j.data.front || []);
          setBackStats(j.data.back || []);
          setRecommendations(j.data.recommendations || []);
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

  // ─── 每日挑战 + 成就 初始化 ───
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("szp_daily_tasks");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        // 合并旧数据到新格式（旧 localStorage 缺少新字段）
        setDailyTasks({
          date: today,
          checkedIn: parsed.checkedIn || false,
          betCount: parsed.betCount || parsed.bet10 || 0,
          hotWin: parsed.hotWin || false,
          earn50: parsed.earn50 || false,
          streak3: parsed.streak3 || 0,
          claimed: parsed.claimed || [],
          streakDay: parsed.streakDay || 0,
          chestStars: parsed.chestStars || 0,
          chestOpened: parsed.chestOpened || false,
        });
      } else {
        // 新的一天：继承连击天数
        const oldStreak = parsed.streakDay || 0;
        // 检查昨天是否完成了全部任务
        const yesterdayIds = ["checkin","bet3","hotWin","earn50","streak3"];
        const done = yesterdayIds.every((id: string) => parsed.claimed?.includes(id));
        setDailyTasks({ date: today, checkedIn: false, betCount: 0, hotWin: false, earn50: false, streak3: 0, claimed: [], streakDay: done ? oldStreak + 1 : 0, chestStars: parsed.chestStars || 0, chestOpened: false });
      }
    } else {
      setDailyTasks({ date: today, checkedIn: false, betCount: 0, hotWin: false, earn50: false, streak3: 0, claimed: [], streakDay: 0, chestStars: 0, chestOpened: false });
    }
    const ach = localStorage.getItem("szp_achievements");
    if (ach) setAchievements(JSON.parse(ach));
    // 个人统计
    const tr = localStorage.getItem("szp_track");
    if (tr) {
      const p = JSON.parse(tr);
      setPlayerStats({
        totalBets: p.totalBets || 0, totalWins: p.totalWins || 0, totalProfit: p.totalProfit || 0,
        biggestWin: p.biggestWin || 0, bestStreak: p.bestStreak || 0, worstStreak: p.worstStreak || 0, currentStreak: p.currentStreak || 0,
      });
    }
    // 新手引导检测
    if (!localStorage.getItem("szp_tutorial_done")) {
      setShowTutorial(true);
    }
  }, []);

  // 任务进度持久化
  useEffect(() => { localStorage.setItem("szp_daily_tasks", JSON.stringify(dailyTasks)); }, [dailyTasks]);
  useEffect(() => { localStorage.setItem("szp_achievements", JSON.stringify(achievements)); }, [achievements]);

  const toggleNumber = (num: number, isFront: boolean) => {
    vibrate(5);
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
    vibrate(8);
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
      // ─── 个人统计追踪 ───
      const netProfit = json.data.net_result || 0;
      setPlayerStats(prev => {
        const isWin = netProfit > 0;
        const newStreak = isWin ? (prev.currentStreak > 0 ? prev.currentStreak + 1 : 1) : (prev.currentStreak < 0 ? prev.currentStreak - 1 : -1);
        const newStats = {
          totalBets: prev.totalBets + 1,
          totalWins: prev.totalWins + (isWin ? 1 : 0),
          totalProfit: prev.totalProfit + netProfit,
          biggestWin: Math.max(prev.biggestWin, netProfit),
          bestStreak: Math.max(prev.bestStreak, isWin ? newStreak : 0),
          worstStreak: Math.min(prev.worstStreak, !isWin ? -newStreak : 0),
          currentStreak: newStreak,
        };
        localStorage.setItem("szp_track", JSON.stringify(newStats));
        return newStats;
      });
      setTickets([]);
      setSelectedFront([]);
      setSelectedBack([]);

    // ─── 每日挑战追踪 ───
    setDailyTasks(prev => {
      const next = { ...prev };
      // 投注次数++
      next.betCount = (next.betCount || 0) + 1;
      // 热号中奖
      if (json.data.net_result > 0 && betTickets.some(t => t.front.some(n => trendData[n] === 'scorching' || trendData[n] === 'hot'))) {
        next.hotWin = true;
      }
      // 单局净赚≥50
      if (json.data.net_result >= 50) {
        next.earn50 = true;
      }
      // 连续中奖追踪 (挑战任务)
      if (json.data.net_result > 0) {
        next.streak3 = (next.streak3 || 0) + 1;
      } else {
        next.streak3 = 0;
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
    
    // 🎉 中奖庆祝特效
    if (json.data.total_win >= 100) {
      const tier = json.data.tickets.find((t:any) => t.prize.won)?.prize?.name || "";
      const label = tier.includes("头彩") ? "🏆 头彩" : tier.includes("大赏") ? "🥇 大赏" : "🎉 大赢";
      setCelebrate({show: true, amount: json.data.total_win, label});
      vibrate(50);
      setTimeout(() => setCelebrate(prev => ({...prev, show: false})), 3000);
    }
    
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

  // ─── 震动反馈辅助函数 ───
  const vibrate = (ms: number = 8) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  return (
    <main className="pb-20 min-h-screen bg-bg">
      {/* Header — 金青珊瑚品牌色 */}
      <div className="bg-gradient-to-b from-[#0F6E56] to-[#04342C] px-5 pt-6 pb-5 relative overflow-hidden">
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
            <a href={"/lottery?type=" + lotteryCode}
              className="ml-2 px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[9px] font-medium flex items-center gap-1 active:scale-90 transition-transform whitespace-nowrap">
              <span>📊</span><span>走势</span>
            </a>
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
                <div className="flex items-center gap-1.5">
                  {[
                    { key: 'scorching', label: '超热', color: '#F27152', bg: 'rgba(242,113,82,0.1)' },
                    { key: 'hot', label: '热', color: '#F27152', bg: 'rgba(242,113,82,0.08)' },
                    { key: 'cold', label: '冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.1)' },
                    { key: 'icy', label: '极冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.15)' },
                  ].map(g => (
                    <button key={g.key} onClick={() => setFilterStatus(filterStatus === g.key ? null : g.key)}
                      className="text-[8px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full active:scale-90 transition-all"
                      style={{
                        backgroundColor: filterStatus === g.key ? g.color : g.bg,
                        color: filterStatus === g.key ? 'white' : g.color,
                      }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === g.key ? 'bg-white/80' : ''}`} style={{backgroundColor: filterStatus === g.key ? undefined : g.color}} />
                      {g.label}
                      {filterStatus === g.key && <span className="ml-0.5">✕</span>}
                    </button>
                  ))}
                  <button onClick={() => setShowStatsPanel(!showStatsPanel)}
                    className="text-[9px] px-1.5 py-0.5 rounded-full border border-border-tertiary/50 flex items-center gap-0.5 active:scale-90 transition-transform"
                    style={{color: showStatsPanel ? '#F27152' : undefined, borderColor: showStatsPanel ? '#F27152' : undefined}}>
                    <span>📊</span><span className="text-[8px]">{showStatsPanel ? '收起' : '分析'}</span>
                  </button>
                  <span className="text-xs font-semibold ml-0.5">{selectedFront.length}/{config.front_pick}</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: config.front_range }, (_, i) => i + 1).map(n => {
                  const isSelected = selectedFront.includes(n);
                  const trend = trendData[n];
                  const isFiltered = filterStatus !== null && trend !== filterStatus && !isSelected;
                  // 样式计算
                  let ballStyle = "bg-bg text-text-secondary border border-border-tertiary";
                  let badge: React.ReactNode = null;
                  if (isSelected) {
                    ballStyle = "bg-[#F27152] text-white shadow-sm scale-110 border-2 border-[#F27152]";
                  } else if (trend === 'scorching') {
                    ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#F27152] font-bold border-2 border-[#F27152] ring-1 ring-[#F27152]/30";
                    if (!isFiltered) badge = <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold leading-none text-white bg-[#F27152] rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm">火</span>;
                  } else if (trend === 'hot') {
                    ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#F27152] font-semibold border-2 border-[#F27152]/60";
                    if (!isFiltered) badge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#F27152]" />;
                  } else if (trend === 'icy') {
                    ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-[#45CCD5]/10 text-[#45CCD5] font-bold border-2 border-[#45CCD5]";
                    if (!isFiltered) badge = <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold leading-none text-white bg-[#45CCD5] rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm">冰</span>;
                  } else if (trend === 'cold') {
                    ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-semibold border-2 border-[#45CCD5]/60";
                    if (!isFiltered) badge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#45CCD5]" />;
                  } else if (isFiltered) {
                    ballStyle = "bg-gray-50 text-gray-300 border border-gray-200";
                  }
                  return (
                    <button key={n} onClick={() => {
                      // 如果是长按触发的，不执行 toggle
                      if (longPressed === n) { setLongPressed(null); return; }
                      toggleNumber(n, true);
                    }}
                      onPointerDown={() => {
                        longPressRef.current = setTimeout(() => {
                          setLongPressed(n);
                          // 打开详情弹窗
                          const stat = frontStats.find(s => s.number === n);
                          if (stat) { setDetailNum(n); setDetailData(stat); }
                        }, 400);
                      }}
                      onPointerUp={() => {
                        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                      }}
                      onPointerLeave={() => {
                        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                      }}
                      className={`relative w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center active:scale-90 transition-all overflow-visible ${ballStyle}`}
                      style={{opacity: isFiltered ? 0.35 : 1}}>
                      {String(n).padStart(2, "0")}
                      {badge}
                    </button>
                  );
                })}
              </div>

              {/* 已选号码冷热分析 */}
              {selectedFront.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 px-1 text-[10px]">
                  <span className="text-text-tertiary shrink-0">已选:</span>
                  {selectedFront.map(n => {
                    const t = trendData[n];
                    let dotColor = '#8E8E93';
                    let label = '常规';
                    if (t === 'scorching') { dotColor = '#F27152'; label = '超热'; }
                    else if (t === 'hot') { dotColor = '#F27152'; label = '热'; }
                    else if (t === 'icy') { dotColor = '#45CCD5'; label = '极冷'; }
                    else if (t === 'cold') { dotColor = '#45CCD5'; label = '冷'; }
                    return (
                      <span key={n} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white border border-border-tertiary/60">
                        <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: dotColor}} />
                        <span className="text-[9px] font-medium">{String(n).padStart(2,"0")}</span>
                        <span className="text-[8px] text-text-tertiary">{label}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 冷热分析面板 */}
              {showStatsPanel && frontStats.length > 0 && (
                <div className="mt-3 rounded-[8px] border border-border-tertiary overflow-hidden bg-bg/50">
                  <div className="grid grid-cols-5 gap-px bg-border-tertiary/30">
                    {[
                      { key: 'scorching', label: '🔥超热', color: '#F27152', bg: 'rgba(242,113,82,0.08)' },
                      { key: 'hot', label: '🔥热', color: '#F27152', bg: 'rgba(242,113,82,0.05)' },
                      { key: 'normal', label: '🌡️常', color: '#8E8E93', bg: 'transparent' },
                      { key: 'cold', label: '❄️冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.05)' },
                      { key: 'icy', label: '❄️极冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
                    ].map(g => {
                      const items = frontStats.filter(s => s.status === g.key);
                      return (
                        <div key={g.key} className="p-2 text-center" style={{backgroundColor: g.bg}}>
                          <div className="text-[13px] font-bold" style={{color: g.color}}>{items.length}</div>
                          <div className="text-[8px] text-text-tertiary mt-0.5">{g.label}</div>
                          {items.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                              {items.slice(0, 4).map(s => (
                                <button key={s.number} onClick={() => { setDetailNum(s.number); setDetailData(s); }}
                                  className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold active:scale-90"
                                  style={{backgroundColor: g.color+'20', color: g.color}}>
                                  {s.number}
                                </button>
                              ))}
                              {items.length > 4 && <span className="text-[8px] text-text-tertiary">+{items.length-4}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 后区冷热分析面板 */}
              {showStatsPanel && backStats.length > 0 && config.back_pick > 0 && (
                <div className="mt-2 rounded-[8px] border border-border-tertiary overflow-hidden bg-bg/50">
                  <div className="grid grid-cols-5 gap-px bg-border-tertiary/30">
                    {[
                      { key: 'scorching', label: '🔥超热', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
                      { key: 'hot', label: '🔥热', color: '#45CCD5', bg: 'rgba(69,204,213,0.05)' },
                      { key: 'normal', label: '🌡️常', color: '#8E8E93', bg: 'transparent' },
                      { key: 'cold', label: '❄冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.05)' },
                      { key: 'icy', label: '❄极冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
                    ].map(g => {
                      const items = backStats.filter(s => s.status === g.key);
                      return (
                        <div key={g.key} className="p-2 text-center" style={{backgroundColor: g.bg}}>
                          <div className="text-[12px] font-bold" style={{color: g.color}}>{items.length}</div>
                          <div className="text-[7px] text-text-tertiary mt-0.5">{g.label}</div>
                          {items.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                              {items.slice(0, 4).map(s => (
                                <button key={s.number} onClick={() => { setDetailNum(s.number); setDetailData(s); }}
                                  className="text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold active:scale-90"
                                  style={{backgroundColor: g.color+'20', color: g.color}}>
                                  {s.number}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 号码频率柱状图（在分析模式下显示） */}
              {showStatsPanel && frontStats.length > 0 && (
                <div className="mt-3 rounded-[8px] border border-border-tertiary overflow-hidden bg-bg/50 p-3">
                  <div className="text-[10px] font-semibold text-text-secondary mb-2 flex items-center gap-1">
                    <span>📈</span> 号码频率分布 <span className="text-[8px] text-text-tertiary">(近{frontStats.reduce((s,f)=>s+f.count,0)}次出现)</span>
                  </div>
                  <div className="space-y-[2px] max-h-[160px] overflow-y-auto">
                    {[...frontStats].sort((a,b) => a.number - b.number).map(s => {
                      const maxCount = Math.max(...frontStats.map(f => f.count));
                      const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                      const barColor = s.status === 'scorching' ? '#F27152' :
                        s.status === 'hot' ? '#F27152' :
                        s.status === 'icy' ? '#45CCD5' :
                        s.status === 'cold' ? '#45CCD5' : '#D1D5DB';
                      return (
                        <div key={s.number} className="flex items-center gap-1.5">
                          <span className="text-[9px] w-5 text-right font-mono text-text-secondary">{String(s.number).padStart(2,"0")}</span>
                          <div className="flex-1 h-3 rounded-[3px] bg-gray-100 overflow-hidden relative">
                            <div className="h-full rounded-[3px] transition-all" style={{width: `${pct}%`, backgroundColor: barColor, opacity: pct > 50 ? 0.8 : 0.5}} />
                          </div>
                          <span className="text-[8px] w-5 text-right text-text-tertiary">{s.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {config.back_pick > 0 && (
                <>
                  <div className="flex items-center justify-between mt-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.back_name}</span>
                      <span className="text-[10px] text-text-tertiary">选 {config.back_pick} 个 (1-{config.back_range})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'hot', label: '热', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
                        { key: 'cold', label: '冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.12)' },
                      ].map(g => (
                        <button key={g.key} onClick={() => setBackFilterStatus(backFilterStatus === g.key ? null : g.key)}
                          className="text-[8px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full active:scale-90 transition-all"
                          style={{
                            backgroundColor: backFilterStatus === g.key ? g.color : g.bg,
                            color: backFilterStatus === g.key ? 'white' : g.color,
                          }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${backFilterStatus === g.key ? 'bg-white/80' : ''}`} style={{backgroundColor: backFilterStatus === g.key ? undefined : g.color}} />
                          {g.label}
                          {backFilterStatus === g.key && <span className="ml-0.5">✕</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: config.back_range }, (_, i) => i + 1).map(n => {
                      const isSelected = selectedBack.includes(n);
                      const trend = trendDataBack[n];
                      const backIsFiltered = backFilterStatus !== null && trend !== backFilterStatus && !isSelected;
                      let backBallStyle = "bg-bg text-text-secondary border border-border-tertiary";
                      let backBadge: React.ReactNode = null;
                      if (isSelected) {
                        backBallStyle = "bg-[#45CCD5] text-white shadow-sm scale-110 border-2 border-[#45CCD5]";
                      } else if (trend === 'scorching') {
                        backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-bold border-2 border-[#45CCD5]";
                        if (!backIsFiltered) backBadge = <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold leading-none text-white bg-[#45CCD5] rounded-full w-3 h-3 flex items-center justify-center shadow-sm">火</span>;
                      } else if (trend === 'hot') {
                        backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-semibold border-2 border-[#45CCD5]/60";
                        if (!backIsFiltered) backBadge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#45CCD5]" />;
                      } else if (trend === 'icy') {
                        backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-[#45CCD5]/10 text-[#45CCD5] font-bold border-2 border-[#45CCD5]";
                        if (!backIsFiltered) backBadge = <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold leading-none text-white bg-[#45CCD5] rounded-full w-3 h-3 flex items-center justify-center shadow-sm">冰</span>;
                      } else if (trend === 'cold') {
                        backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-semibold border-2 border-[#45CCD5]/60";
                        if (!backIsFiltered) backBadge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#45CCD5]" />;
                      } else if (backIsFiltered) {
                        backBallStyle = "bg-gray-50 text-gray-300 border border-gray-200";
                      }
                      return (
                        <button key={n} onClick={() => {
                          if (longPressed === n) { setLongPressed(null); return; }
                          toggleNumber(n, false);
                        }}
                          onPointerDown={() => {
                            longPressRef.current = setTimeout(() => {
                              setLongPressed(n);
                              // 后区号码详情
                              const bStat = backStats.find(s => s.number === n);
                              if (bStat) { setDetailNum(n); setDetailData(bStat); }
                              else {
                                const status = trendDataBack[n] || 'normal';
                                setDetailNum(n); setDetailData({number: n, count: 0, rate: 0, z: 0, status});
                              }
                            }, 400);
                          }}
                          onPointerUp={() => {
                            if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                          }}
                          onPointerLeave={() => {
                            if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                          }}
                          className={`relative w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center active:scale-90 transition-all overflow-visible ${backBallStyle}`}
                          style={{opacity: backIsFiltered ? 0.35 : 1}}>
                          {String(n).padStart(2, "0")}
                          {backBadge}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 智能选号建议 */}
              {recommendations.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {recommendations.map(r => {
                    const emoji = r.strategy === 'chase_hot' ? '🔥' : r.strategy === 'chase_cold' ? '❄️' : '⚖️';
                    const colorClass = r.strategy === 'chase_hot' ? 'bg-red-50 border-red-200 text-red-600' : 
                      r.strategy === 'chase_cold' ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 
                      'bg-amber-50 border-amber-200 text-amber-700';
                    return (
                    <button key={r.strategy} onClick={() => {
                      setSelectedFront(r.front);
                      setSelectedBack(r.back || []);
                    }}
                      className={`flex-1 py-1.5 rounded-[8px] text-[10px] font-medium active:scale-95 transition-all border ${colorClass}`}>
                      {emoji} {r.label}
                    </button>
                    );
                  })}
                </div>
              )}

              {/* 快捷投注 */}
              <div className="mt-2 flex gap-1.5">
                <button onClick={async () => {
                  // 机选1注并直接投注
                  try {
                    const q = await fetch(API_BASE + "/api/lotto/quick-pick?code=" + lotteryCode).then(r => r.json());
                    if (q.code !== 0) return;
                    const t = q.data.ticket;
                    const front = t.front || t.digits || [];
                    const back = t.back || [];
                    setTickets([{front, back}]);
                    setBetMultiple(1);
                    await new Promise(r => setTimeout(r, 60));
                    placeBet();
                  } catch {}
                }} className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-brand-teal/80 to-brand-teal text-white text-[10px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1">
                  ⚡ 机选1注
                </button>
                <button onClick={async () => {
                  try {
                    const tickets = [];
                    for (let i = 0; i < 5; i++) {
                      const q = await fetch(API_BASE + "/api/lotto/quick-pick?code=" + lotteryCode).then(r => r.json());
                      if (q.code !== 0) continue;
                      const t = q.data.ticket;
                      tickets.push({ front: t.front || t.digits || [], back: t.back || [] });
                    }
                    if (tickets.length > 0) {
                      setTickets(tickets);
                      setBetMultiple(1);
                      await new Promise(r => setTimeout(r, 60));
                      placeBet();
                    }
                  } catch {}
                }} className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1">
                  ⚡ 机选5注
                </button>
                <button onClick={async () => {
                  // 追热1注: 用推荐的热号
                  const hotRec = recommendations.find(r => r.strategy === 'chase_hot');
                  if (hotRec && hotRec.front.length > 0) {
                    setTickets([{front: hotRec.front, back: hotRec.back || []}]);
                    setBetMultiple(1);
                    await new Promise(r => setTimeout(r, 60));
                    placeBet();
                  }
                }} className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-red-400 to-red-500 text-white text-[10px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1">
                  ⚡ 追热1注
                </button>
              </div>

              {/* Quick Pick + Add */}
              <div className="flex gap-2 mt-4">
                <button onClick={quickPick} className="flex-1 py-2 rounded-[8px] bg-bg text-text-secondary text-xs font-medium border border-border-tertiary flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  <Dices className="w-3.5 h-3.5" /> 机选
                </button>
                <button onClick={addTicket} className="flex-1 py-2 rounded-[8px] bg-[#E1F5EE] text-[#0F6E56] text-xs font-medium border border-[#1D9E75]/30 flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  + 选号 ({(config?.price || 2) * betMultiple}🎮)
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
                
                {/* 🏆 开奖号码 (本期开出的号码) */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <Trophy className="w-4 h-4 text-brand-gold" />
                  <span className="text-[13px] font-medium">开奖号码</span>
                  <span className="text-[8px] text-text-tertiary ml-1">第{result.bet_id?.slice(-6) || "—"}期</span>
                </div>
                
                <div className="flex justify-center gap-2 mb-3">
                  {result.draw.front?.map((n: number, i: number) => (
                    <div key={"f"+i}
                      className="w-10 h-10 rounded-full bg-[#F27152] text-white flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ animation: `ballDrop 0.4s ease-out ${i * 0.08}s both` }}>
                      {String(n).padStart(2, "0")}
                    </div>
                  ))}
                  {result.draw.back?.map((n: number, i: number) => (
                    <div key={"b"+i}
                      className="w-10 h-10 rounded-full bg-[#45CCD5] text-white flex items-center justify-center text-sm font-bold shadow-sm"
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

                {/* 分割 + 比对结果 */}
                <div className="h-px bg-gradient-to-r from-transparent via-border-tertiary to-transparent my-3" />

                <div className="flex items-center justify-center gap-1 mb-3">
                  <span className="text-[13px] font-medium">投注比对</span>
                </div>

                {/* 每注比对结果 */}
                {result.tickets.map((t, i) => {
                  const isWin = t.prize.won;
                  return (
                    <div key={i} className={`p-3 rounded-[8px] mb-2 text-left ${isWin ? "bg-[#FFF9EB] border border-[#F2B631]/30" : "bg-bg"}`}>
                      {/* 用户的号码 */}
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-[9px] text-text-tertiary w-6 shrink-0">选号</span>
                        <div className="flex gap-1 flex-wrap">
                          {(t.ticket?.front || []).map((fn: number, fi: number) => {
                            const matched = (result.draw.front || []).includes(fn);
                            return (
                              <span key={fi} className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${
                                matched ? "bg-[#F27152] text-white" : "bg-gray-100 text-text-tertiary"
                              }`}>
                                {String(fn).padStart(2, "0")}
                              </span>
                            );
                          })}
                          {(t.ticket?.back || []).map((bn: number, bi: number) => {
                            const matched = (result.draw.back || []).includes(bn);
                            return (
                              <span key={"b"+bi} className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${
                                matched ? "bg-[#45CCD5] text-white" : "bg-gray-100 text-text-tertiary"
                              }`}>
                                {String(bn).padStart(2, "0")}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {/* 中奖信息 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-tertiary">
                          匹配 {t.prize.matched_front || 0}前+{t.prize.matched_back || 0}后
                        </span>
                        <span className={`text-xs font-bold ${isWin ? "text-brand-gold-dark" : "text-text-tertiary"}`}>
                          {isWin ? `🎉 ${t.prize.name}` : "😅 未中奖"}
                        </span>
                      </div>
                      {isWin && (
                        <div className="mt-1 text-right text-sm font-bold text-brand-coral">
                          +{Number(t.prize.amount || 0).toLocaleString()} ✨
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* 盈亏汇总 */}
                <div className="mt-3 pt-2 border-t border-border-tertiary/40">
                  {result.net_result > 0 ? (
                    <span className="text-brand-coral font-bold text-lg">
                      +{Number(rollDisplay || result.net_result).toLocaleString()}✨ 🎉
                    </span>
                  ) : result.net_result === 0 ? (
                    <span className="text-text-tertiary text-sm">收支平衡</span>
                  ) : (
                    <span className="text-text-tertiary text-sm">{result.net_result}🎮</span>
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
                  {history.length > 0 && <span className="text-[9px] text-text-tertiary font-normal">({history.length})</span>}
                </div>
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              </summary>
              <div className="px-4 pb-4 max-h-72 overflow-y-auto space-y-2">
                {history.length === 0 && <div className="text-xs text-text-tertiary text-center py-4">暂无投注记录</div>}
                {history.map((h, i) => {
                  const drawFront = h.draw?.front || [];
                  const drawBack = h.draw?.back || [];
                  return (
                    <div key={i} className={`p-2.5 rounded-[8px] border ${h.net_result > 0 ? 'bg-[#FFF9EB] border-[#F2B631]/20' : 'bg-bg border-border-tertiary/60'}`}>
                      {/* 头部信息 */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold">{h.lottery_name}</span>
                          <span className="text-[8px] text-text-tertiary">#{h.bet_id.slice(-6)}</span>
                        </div>
                        <div className={`text-[10px] font-bold ${h.net_result > 0 ? 'text-brand-coral' : 'text-text-tertiary'}`}>
                          {h.net_result > 0 ? `+${h.net_result}🎮` : h.net_result === 0 ? '0🎮' : `${h.net_result}🎮`}
                        </div>
                      </div>
                      {/* 号码比对 */}
                      {h.tickets?.slice(0, 1).map((t, ti) => (
                        <div key={ti} className="flex items-start gap-1">
                          <span className="text-[8px] text-text-tertiary mt-1 w-4 shrink-0">选</span>
                          <div className="flex gap-0.5 flex-wrap">
                            {(t.ticket?.front || []).map((fn: number, fi: number) => {
                              const matched = drawFront.includes(fn);
                              return <span key={fi} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold ${matched ? 'bg-[#F27152] text-white' : 'bg-gray-100 text-text-tertiary'}`}>{String(fn).padStart(2,"0")}</span>;
                            })}
                            {(t.ticket?.back || []).map((bn: number, bi: number) => {
                              const matched = drawBack.includes(bn);
                              return <span key={"b"+bi} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold ${matched ? 'bg-[#45CCD5] text-white' : 'bg-gray-100 text-text-tertiary'}`}>{String(bn).padStart(2,"0")}</span>;
                            })}
                          </div>
                        </div>
                      ))}
                      {/* 开奖号码 */}
                      {drawFront.length > 0 && (
                        <div className="flex items-start gap-1 mt-1">
                          <span className="text-[8px] text-text-tertiary mt-1 w-4 shrink-0">开</span>
                          <div className="flex gap-0.5 flex-wrap">
                            {drawFront.map((fn: number, fi: number) => (
                              <span key={fi} className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[7px] font-bold bg-gray-50 text-text-tertiary border border-gray-200">{String(fn).padStart(2,"0")}</span>
                            ))}
                            {drawBack.map((bn: number, bi: number) => (
                              <span key={"b"+bi} className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[7px] font-bold bg-gray-50 text-text-tertiary border border-gray-200">{String(bn).padStart(2,"0")}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 中奖信息 */}
                      {h.tickets?.slice(0, 1).map((t, ti) => (
                        t.prize?.won && (
                          <div key={`p${ti}`} className="mt-1 text-[9px] font-medium text-brand-gold-dark flex items-center gap-1">
                            <span>🎉</span> {t.prize.name} +{Number(t.prize.amount || 0).toLocaleString()}✨
                          </div>
                        )
                      ))}
                    </div>
                  );
                })}
              </div>
            </details>
          </>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSurvey && <SurveyModal onClose={() => setShowSurvey(false)} />}

      {/* 号码详情弹窗 */}
      {detailNum !== null && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setDetailNum(null)}>
          <div className="bg-white rounded-[16px] p-5 w-[240px] shadow-xl mx-4"
            onClick={e => e.stopPropagation()}>
            <div className="text-center">
              {/* 号码球 */}
              <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-lg font-bold shadow-md
                ${detailData.status === 'scorching' ? 'bg-[#F27152] text-white border-2 border-[#F27152]' : ''}
                ${detailData.status === 'hot' ? 'border-2 border-[#F27152] text-[#F27152] bg-white' : ''}
                ${detailData.status === 'normal' ? 'bg-gray-100 text-text-secondary border-2 border-gray-200' : ''}
                ${detailData.status === 'cold' ? 'border-2 border-[#45CCD5] text-[#45CCD5] bg-white' : ''}
                ${detailData.status === 'icy' ? 'bg-[#45CCD5]/10 text-[#45CCD5] border-2 border-[#45CCD5]' : ''}
              `}>
                {String(detailData.number).padStart(2, "0")}
              </div>
              <h3 className="text-sm font-bold mt-2 text-text">号码 {detailData.number}</h3>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { label: '出现次数', value: `${detailData.count} 次` },
                { label: '出现率', value: `${detailData.rate}%` },
                { label: '偏差值(Z)', value: detailData.z.toFixed(2) },
                { label: '状态', value: 
                  detailData.status === 'scorching' ? '🔥🔥 超热' :
                  detailData.status === 'hot' ? '🔥 热号' :
                  detailData.status === 'normal' ? '🌡️ 常规' :
                  detailData.status === 'cold' ? '❄️ 冷号' :
                  detailData.status === 'icy' ? '❄️❄️ 极冷' : '—'
                },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-[11px] text-text-tertiary">{row.label}</span>
                  <span className="text-[11px] font-semibold text-text">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => {
                toggleNumber(detailData.number, true);
                setDetailNum(null);
              }} className="flex-1 py-2 rounded-[8px] bg-[#F27152] text-white text-xs font-bold active:scale-95 transition-transform">
                选择此号
              </button>
              <button onClick={() => setDetailNum(null)}
                className="flex-1 py-2 rounded-[8px] bg-bg text-text-secondary text-xs font-medium border border-border-tertiary active:scale-95 transition-transform">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 中奖庆祝特效 */}
      {celebrate.show && (
        <>
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-10vh) rotate(0deg) scale(0.8); opacity: 1; }
              100% { transform: translateY(110vh) rotate(720deg) scale(0.4); opacity: 0; }
            }
            @keyframes celebrate-pop {
              0% { transform: scale(0.5); opacity: 0; }
              60% { transform: scale(1.05); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* 彩纸粒子 */}
            {Array.from({length: 40}).map((_, i) => (
              <div key={i} className="absolute"
                style={{
                  width: `${6 + Math.random() * 6}px`,
                  height: `${8 + Math.random() * 6}px`,
                  backgroundColor: ['#F27152','#45CCD5','#F2B631','#FF6B6B','#48D1CC','#A78BFA','#34D399'][i % 7],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}%`,
                  animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-out ${i * 0.04}s both`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: 0.8,
                }} />
            ))}
            {/* 中央庆祝卡片 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto"
              onClick={() => setCelebrate(prev => ({...prev, show: false}))}>
              <div className="bg-white/95 backdrop-blur-md rounded-[20px] p-6 shadow-2xl text-center border-2 border-brand-gold/30 max-w-[260px]"
                style={{animation: 'celebrate-pop 0.6s ease-out'}}>
                <div className="text-4xl mb-2">{celebrate.label.includes('头彩') ? '🏆' : '🎉'}</div>
                <div className="text-[13px] font-bold text-text mb-1">{celebrate.label}</div>
                <div className="text-[28px] font-bold text-brand-coral">+{celebrate.amount.toLocaleString()}✨</div>
                <div className="mt-2 text-[10px] text-text-tertiary">太棒了！继续保持！</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════ 每日任务 + 成就 ════════ */}
      <div className="px-4 mt-2 mb-2">
        <div className="bg-surface rounded-[8px] shadow-sm border border-border-tertiary overflow-hidden">
          <button onClick={() => setShowTasks(!showTasks)}
            className="w-full flex items-center justify-between p-3 text-sm font-semibold active:bg-gray-50 transition-colors">
            <span>🏆 每日挑战 · 成就</span>
            <div className="flex items-center gap-2">
              {(() => {
                const doneCount = TASK_LIST.filter(t => t.progress).filter(t => {
                  const p = t.progress!();
                  return p >= (t.target || 1);
                }).length;
                const claimedCount = TASK_LIST.filter(t => (dailyTasks.claimed || []).includes(t.id)).length;
                const totalTasks = TASK_LIST.length;
                const displayCount = claimedCount > 0 ? claimedCount : doneCount;
                return displayCount > 0 ? (
                  <span className="text-[10px] bg-brand-teal/10 text-brand-teal-dark px-2 py-0.5 rounded-full">{displayCount}/{totalTasks}</span>
                ) : null;
              })()}
              {dailyTasks.streakDay > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">🔥×{dailyTasks.streakDay}</span>
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
              {/* ── 连击状态条 ── */}
              {dailyTasks.streakDay > 0 && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60">
                  <span className="text-sm">🔥</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-amber-700">连击 ×{dailyTasks.streakDay}</div>
                    <div className="text-[8px] text-amber-500">
                      {dailyTasks.streakDay <= 2 ? `奖励 +${STREAK_BONUS[dailyTasks.streakDay]*100}%` : `奖励 +${STREAK_BONUS[Math.min(dailyTasks.streakDay,4)]*100}% · 再坚持${7-dailyTasks.streakDay}天`}
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium">连续完成任务可叠加</div>
                </div>
              )}
              {/* ── 晨间签到 ── */}
              <div>
                <div className="text-[9px] font-medium text-text-tertiary mb-1.5">🌅 晨间</div>
                <div className="flex items-center justify-between py-2 px-2 rounded-[8px] bg-gradient-to-r from-amber-50/50 to-white border border-amber-100/50">
                  <div className="flex items-center gap-2">
                    <span className="text-base">☀️</span>
                    <div>
                      <div className="text-xs font-medium">晨间签到</div>
                      <div className="text-[9px] text-text-tertiary">新的一天，来签到吧</div>
                    </div>
                  </div>
                  <div>
                    {dailyTasks.checkedIn ? (
                      <span className="text-[10px] text-text-tertiary">✅ 已签</span>
                    ) : (
                      <button onClick={async () => {
                          try {
                            await fetch(API_BASE + "/api/lotto-bet-sync", {
                              method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: 10, lottery: "task" }),
                            });
                            setDailyTasks(prev => ({ ...prev, checkedIn: true, claimed: [...prev.claimed, "checkin"] }));
                            setBalance(prev => prev + 10);
                          } catch {}
                        }} className="text-[10px] bg-brand-gold text-white px-3 py-1 rounded-full font-medium active:scale-90">
                        +10🎮 签到
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* ── 核心任务 ── */}
              <div>
                <div className="text-[9px] font-medium text-text-tertiary mb-1.5">🎮 核心</div>
                {TASK_LIST.filter(t => t.zone === "core" && t.progress).map(t => {
                  const progressVal = t.progress!();
                  const done = progressVal >= (t.target || 1);
                  const claimed = (dailyTasks.claimed || []).includes(t.id);
                  const streakMult = 1 + (STREAK_BONUS[Math.min(dailyTasks.streakDay, 4)] || 0);
                  const rewardVal = Math.floor(t.reward * streakMult);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border-tertiary/20 last:border-0">
                      <div className="flex-1">
                        <div className="text-xs font-medium">{t.label}</div>
                        <div className="text-[9px] text-text-tertiary">{t.desc}</div>
                        {!done && t.target && t.target > 1 && (
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
                              try {
                                await fetch(API_BASE + "/api/lotto-bet-sync", {
                                  method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: rewardVal, lottery: "task" }),
                                });
                                setDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, t.id], chestStars: (prev.chestStars || 0) + (t.target ? 1 : 0) }));
                                setBalance(prev => prev + rewardVal);
                              } catch {}
                            }} className="text-[10px] bg-brand-gold text-white px-2.5 py-1 rounded-full font-medium active:scale-90">
                              领 {rewardVal}🎮
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-text-tertiary">{t.target ? `${progressVal}/${t.target}` : "未完成"}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* ── 挑战任务 ── */}
              <div>
                <div className="text-[9px] font-medium text-text-tertiary mb-1.5">🌙 挑战</div>
                {TASK_LIST.filter(t => t.zone === "challenge" && t.progress).map(t => {
                  const progressVal = t.progress!();
                  const done = progressVal >= (t.target || 1);
                  const claimed = (dailyTasks.claimed || []).includes(t.id);
                  const streakMult = 1 + (STREAK_BONUS[Math.min(dailyTasks.streakDay, 4)] || 0);
                  const rewardVal = Math.floor(t.reward * streakMult);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded-[8px] bg-gradient-to-r from-purple-50/50 to-white border border-purple-100/50">
                      <div className="flex-1">
                        <div className="text-xs font-medium">{t.label}</div>
                        <div className="text-[9px] text-text-tertiary">{t.desc}</div>
                        {!done && t.target && t.target > 1 && (
                          <div className="mt-1 h-1.5 bg-bg rounded-full overflow-hidden w-24">
                            <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${(progressVal / t.target) * 100}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {done ? (
                          claimed ? (
                            <span className="text-[10px] text-text-tertiary">✅ 已领</span>
                          ) : (
                            <button onClick={async () => {
                              try {
                                await fetch(API_BASE + "/api/lotto-bet-sync", {
                                  method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: rewardVal, lottery: "task" }),
                                });
                                setDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, t.id], chestStars: (prev.chestStars || 0) + 2 }));
                                setBalance(prev => prev + rewardVal);
                              } catch {}
                            }} className="text-[10px] bg-purple-500 text-white px-2.5 py-1 rounded-full font-medium active:scale-90">
                              领 {rewardVal}🎮
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-text-tertiary">{t.target ? `${progressVal}/${t.target}` : "未完成"}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* ── 全清奖 ── */}
              {(() => {
                const allIds = ["checkin","bet3","hotWin","earn50","streak3"];
                const allDone = allIds.every(id => dailyTasks.claimed.includes(id));
                return allDone && !dailyTasks.claimed.includes("all_clear") ? (
                  <button onClick={async () => {
                    try {
                      await fetch(API_BASE + "/api/lotto-bet-sync", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: BONUS_ALL_CLEAR, lottery: "task" }),
                      });
                      setDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, "all_clear"] }));
                      setBalance(prev => prev + BONUS_ALL_CLEAR);
                    } catch {}
                  }} className="w-full py-2 rounded-[8px] bg-gradient-to-r from-brand-gold to-amber-500 text-white text-[11px] font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                    🏆 全清奖励 +{BONUS_ALL_CLEAR}🎮
                  </button>
                ) : null;
              })()}
              {/* ── 宝箱 ── */}
              <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/60">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{dailyTasks.chestOpened ? '📦' : (dailyTasks.chestStars >= CHEST_COST ? '🎁' : '📦')}</span>
                  <div>
                    <div className="text-[10px] font-semibold text-indigo-700">{dailyTasks.chestOpened ? '今日宝箱已开' : (dailyTasks.chestStars >= CHEST_COST ? '可以开宝箱了！' : '完成挑战积攒星星')}</div>
                    <div className="text-[9px] text-indigo-400">⭐ {dailyTasks.chestStars || 0}/{CHEST_COST} (完成挑战+2⭐, 核心+1⭐)</div>
                  </div>
                </div>
                {dailyTasks.chestStars >= CHEST_COST && !dailyTasks.chestOpened && (
                  <button onClick={async () => {
                    const chestReward = [10, 15, 20, 30, 50, 100, 200][Math.floor(Math.random() * 7)];
                    try {
                      await fetch(API_BASE + "/api/lotto-bet-sync", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: chestReward, lottery: "task" }),
                      });
                      setDailyTasks(prev => ({ ...prev, chestOpened: true, chestStars: Math.max(0, (prev.chestStars || 0) - CHEST_COST) }));
                      setBalance(prev => prev + chestReward);
                    } catch {}
                  }} className="text-[10px] bg-indigo-500 text-white px-3 py-1.5 rounded-full font-bold active:scale-90">
                    开宝箱
                  </button>
                )}
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
      
      {/* ════════ 个人统计 ════════ */}
      <div className="px-4 mt-2 mb-2">
        <div className="bg-surface rounded-[8px] shadow-sm border border-border-tertiary overflow-hidden">
          <button onClick={() => setShowPlayerStats(!showPlayerStats)}
            className="w-full flex items-center justify-between p-3 text-sm font-semibold active:bg-gray-50 transition-colors">
            <span>📊 我的统计</span>
            <div className="flex items-center gap-2">
              {playerStats.totalBets > 0 && (
                <span className="text-[10px] bg-brand-teal/10 text-brand-teal-dark px-2 py-0.5 rounded-full">
                  共{playerStats.totalBets}局
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${showPlayerStats ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {showPlayerStats && (
            <div className="px-3 pb-4 border-t border-border-tertiary/40 pt-3">
              {playerStats.totalBets === 0 ? (
                <div className="text-[11px] text-text-tertiary text-center py-4">还没有投注记录，开始玩吧！</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '总局数', value: `${playerStats.totalBets}`, color: 'text-text' },
                    { label: '胜率', value: `${Math.round(playerStats.totalWins / playerStats.totalBets * 100)}%`, color: playerStats.totalWins/playerStats.totalBets > 0.3 ? 'text-brand-coral' : 'text-text' },
                    { label: '总盈亏', value: `${playerStats.totalProfit > 0 ? '+' : ''}${playerStats.totalProfit.toLocaleString()}🎮`, color: playerStats.totalProfit > 0 ? 'text-brand-coral' : 'text-text-tertiary' },
                    { label: '最大盈利', value: `${playerStats.biggestWin.toLocaleString()}🎮`, color: 'text-brand-gold-dark' },
                    { label: '最优连胜', value: `${playerStats.bestStreak}连`, color: 'text-brand-coral' },
                    { label: '最多连败', value: `${playerStats.worstStreak}连`, color: 'text-text-tertiary' },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 rounded-[8px] bg-bg border border-border-tertiary/60">
                      <div className="text-[9px] text-text-tertiary">{s.label}</div>
                      <div className={`text-[14px] font-bold mt-0.5 ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                  {/* 当前状态条 */}
                  <div className="col-span-2 mt-1 p-2.5 rounded-[8px] bg-gradient-to-r from-gray-50 to-white border border-border-tertiary/60 flex items-center justify-between">
                    <span className="text-[10px] text-text-tertiary">当前状态</span>
                    {playerStats.currentStreak > 2 ? (
                      <span className="text-[11px] font-bold text-brand-coral flex items-center gap-1">🔥 {playerStats.currentStreak}连胜！</span>
                    ) : playerStats.currentStreak < -2 ? (
                      <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">❄️ {Math.abs(playerStats.currentStreak)}连败中...</span>
                    ) : (
                      <span className="text-[11px] text-text-tertiary">今日手气平平</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 分享邀请 */}
      <div className="px-4 mt-2 mb-2">
        <button onClick={() => {
          const url = window.location.href;
          const text = `🎯 来数字碰试试手气吧！选号碰 · 一秒开奖\n${url}`;
          if (navigator.share) {
            navigator.share({ title: '数字碰', text, url }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(text);
            setSpriteMsg("链接已复制，分享给好友吧！🎉");
            setTimeout(() => setSpriteMsg(""), 2000);
          }
        }}
          className="w-full py-2 rounded-[8px] border border-dashed border-brand-teal/30 text-[10px] text-brand-teal-dark
            active:bg-brand-teal/5 transition-all flex items-center justify-center gap-1.5">
          <span className="text-xs">👥</span> 邀请好友
        </button>
      </div>

      {/* 反馈入口 */}
      <div className="px-4 mt-2 mb-4">
        <button onClick={() => setShowSurvey(true)}
          className="w-full py-2 rounded-[8px] border border-dashed border-purple-200 text-[10px] text-purple-400
            hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3 h-3" /> 给数字碰提建议（3个问题）
        </button>
      </div>

      {/* ─── 新手引导 ─── */}
      {showTutorial && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => {}}>
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[320px] shadow-2xl mx-auto text-center"
            onClick={e => e.stopPropagation()}>
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {TUTORIAL_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === tutorialStep ? 'w-6 bg-brand-teal' : 'w-1.5 bg-gray-200'}`} />
              ))}
            </div>

            {/* 步骤内容 */}
            <div className="min-h-[140px] flex flex-col items-center justify-center">
              <div className="text-5xl mb-3">
                {tutorialStep === 0 ? '🎯' : tutorialStep === 1 ? '📊' : '⚡'}
              </div>
              <h3 className="text-base font-bold text-text mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h3>
              <p className="text-[12px] text-text-tertiary leading-relaxed">{TUTORIAL_STEPS[tutorialStep].desc}</p>
            </div>

            {/* 操作按钮 */}
            <div className="mt-5 flex gap-2">
              {tutorialStep > 0 ? (
                <button onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="flex-1 py-2.5 rounded-[8px] bg-bg text-text-secondary text-xs font-medium border border-border-tertiary active:scale-95 transition-transform">
                  上一步
                </button>
              ) : (
                <button onClick={() => { setShowTutorial(false); localStorage.setItem("szp_tutorial_done", "1"); }}
                  className="flex-1 py-2.5 rounded-[8px] bg-bg text-text-tertiary text-xs font-medium border border-border-tertiary active:scale-95 transition-transform">
                  跳过
                </button>
              )}
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button onClick={() => setTutorialStep(tutorialStep + 1)}
                  className="flex-[2] py-2.5 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-bold active:scale-95 transition-transform shadow-sm">
                  下一步 →
                </button>
              ) : (
                <button onClick={async () => {
                  localStorage.setItem("szp_tutorial_done", "1");
                  setShowTutorial(false);
                  // 机选1注作为免费体验
                  if (user) {
                    try {
                      const q = await fetch(API_BASE + "/api/lotto/quick-pick?code=" + lotteryCode).then(r => r.json());
                      if (q.code === 0) {
                        const t = q.data.ticket;
                        setSelectedFront(t.front || t.digits || []);
                        setSelectedBack(t.back || []);
                      }
                    } catch {}
                  }
                }} className="flex-[2] py-2.5 rounded-[8px] bg-gradient-to-r from-brand-gold to-amber-500 text-white text-xs font-bold active:scale-95 transition-transform shadow-sm">
                  ✨ 免费体验一注
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 消息弹窗 */}
      {spriteMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in">
          <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur shadow-lg border border-border-tertiary/60 text-xs font-medium text-text flex items-center gap-1.5"
            style={{animation: 'fade-in 0.2s ease-out'}}>
            {spriteMsg}
          </div>
        </div>
      )}
    </main>
  );
}
