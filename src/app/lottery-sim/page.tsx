"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Bot, MessageSquare } from "lucide-react";
import LotteryHeader from "./_components/LotteryHeader";
import BetButton from "./_components/BetButton";
import NumberPickerArea from "./_components/NumberPickerArea";
import BetSlip from "./_components/BetSlip";
import DrawResult from "./_components/DrawResult";
import DailyChallenges from "./_components/DailyChallenges";
import BetHistory from "./_components/BetHistory";

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
  const bettingLockRef = useRef(false); // 防连击锁
  const [lotteryCode, setLotteryCode] = useState(initType);
  const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null); // 切换彩种确认
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
  const [countdown, setCountdown] = useState(0); // 参与后开奖倒计时秒数
  // 冷热号状态: scorching/hot/normal/cold/icy
  const [trendData, setTrendData] = useState<Record<number, 'scorching'|'hot'|'normal'|'cold'|'icy'>>({});
  const [trendDataBack, setTrendDataBack] = useState<Record<number, 'scorching'|'hot'|'normal'|'cold'|'icy'>>({});
  const [recommendations, setRecommendations] = useState<Array<{strategy:string; label:string; front:number[]; back:number[]}>>([]);
  // 全量冷热数据（含z值/率等，用于详情弹窗）
  const [frontStats, setFrontStats] = useState<Array<{number:number; count:number; rate:number; z:number; status:string}>>([]);
  const [backStats, setBackStats] = useState<Array<{number:number; count:number; rate:number; z:number; status:string}>>([]);
  const [detailNum, setDetailNum] = useState<number | null>(null); // 弹窗的号码
  const [detailData, setDetailData] = useState<{number:number; count:number; rate:number; z:number; status:string} | null>(null);
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
    { title: "🎯 欢迎来到数字碰！", desc: "这是一款选号碰运气的游戏。选择你心仪的号码，试试手气吧！每注最低 100🎮，最高可赢 500,000🎮！", highlight: "none" },
    { title: "📊 冷热号助你决策", desc: "号码球上的红/青色标记显示冷热状态——红色=🔥近期热门，青色=❄️冷门蓄势。点击📊分析看完整数据！", highlight: "number-area" },
    { title: "⚡ 一键参与，一秒开奖", desc: "点「机选」或策略按钮快速选号，点「参与」立刻开奖。先送您一注免费体验！", highlight: "bet-area" },
  ];

  // ─── 每日挑战系统 ───
  const [dailyTasks, setDailyTasks] = useState<{
    date: string;
    // 晨间签到
    checkedIn: boolean;
    // 核心任务
    betCount: number;       // 参与次数
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
    { zone: "core", id: "bet3", label: "🎯 参与达人", desc: "参与 3 次", target: 3, progress: () => dailyTasks.betCount, reward: 15 },
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
    { id: "first_bet", label: "🥉 数字新手", desc: "首次参与", reward: "10🎮" },
    { id: "bet_100", label: "🥈 百战勇士", desc: "参与 100 次", reward: "100🎮" },
    { id: "bet_1000", label: "🥇 千次挑战", desc: "参与 1000 次", reward: "500🎮" },
    { id: "streak_5", label: "🔥 五连胜", desc: "连续 5 局赢", reward: "200🎮" },
    { id: "jackpot", label: "💎 天选之人", desc: "中过头彩", reward: "1000🎮" },
    { id: "night_owl", label: "🌙 夜猫子", desc: "凌晨 1-5 点参与", reward: "50🎮" },
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

  // 登录后恢复选号 (sessionStorage)
  useEffect(() => {
    if (!user) { 
      try {
        const saved = sessionStorage.getItem("lottery_tickets");
        if (saved) setTickets(JSON.parse(saved));
      } catch {}
      return;
    }
  }, [user]);

  // tickets 变化时持久化
  useEffect(() => {
    try { sessionStorage.setItem("lottery_tickets", JSON.stringify(tickets)); } catch {}
  }, [tickets]);

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
    if (bettingLockRef.current) return; // 防连击锁
    bettingLockRef.current = true;
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
        setError("请选择号码或添加参与");
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
    setCountdown(0);
    
    try {
      // 计算实际参与金额（修复P0: 首次参与totalCost=0的bug）
      const betTicketsForCost = betTickets.length > 0 ? betTickets : 
        config?.back_pick === 0 ? [{ front: selectedFront, back: [] }] : [{ front: selectedFront, back: selectedBack }];
      const effectiveCost = betTicketsForCost.length * (config?.price || 100) * betMultiple;
      
      // 最低参与100游戏豆
      if (effectiveCost < MIN_BET) {
        throw new Error(`最低参与额 ${MIN_BET}🎮，当前仅 ${effectiveCost}🎮，请增加注数或倍数`);
      }
      
      // 1) 扣游戏豆
      const deductRes = await fetch(API_BASE + "/api/lotto-bet-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "bet", amount: effectiveCost, lottery: lotteryCode }),
      });
      const deductJson = await deductRes.json();
      if (deductJson.code !== 0) throw new Error(deductJson.msg || "参与失败");
      
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
      const winAmount = totalWin > effectiveCost ? totalWin - effectiveCost : 0;
      if (totalWin > 0) {
        await fetch(API_BASE + "/api/lotto-bet-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid, action: "settle",
            return_amount: totalWin >= effectiveCost ? effectiveCost : totalWin,
            win_amount: winAmount,
            lottery: lotteryCode,
          }),
        });
      }
      
      setResult(json.data);
      setBalance(prev => prev - effectiveCost + totalWin);
      // 余额后校准
      fetch(API_BASE + "/api/member/balance?uid=" + user.uid).then(r => r.json()).then(b => { if (b.code === 0) setBalance(b.data?.credit1 || 0); }).catch(() => {});
      setHistory(prev => [json.data, ...prev].slice(0, 50));
      trackBet(effectiveCost, totalWin);
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
      // 参与次数++
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

    // 启动开奖倒计时（5秒动画）
    setCountdown(5);
    const cd = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cd);
          setShowDraw(true);
          setBetting(false);
          bettingLockRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
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
      setBetting(false);
      bettingLockRef.current = false;
    } finally {
      // betting 在倒计时结束或catch中设置
    }
  };

  const totalCost = tickets.length > 0 ? tickets.length * (config?.price || 100) * betMultiple : (config?.price || 100) * betMultiple;
  const MIN_BET = 100;
  const canBet = (tickets.length > 0 || selectedFront.length > 0) && balance >= Math.max(totalCost, MIN_BET);

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
      {/* 头部 + 彩种切换 (拆分组件) */}
      <LotteryHeader
        lotteryCode={lotteryCode}
        setLotteryCode={setLotteryCode}
        confirmSwitch={confirmSwitch}
        setConfirmSwitch={setConfirmSwitch}
        trackModeSwitch={trackModeSwitch}
        tickets={tickets}
        setTickets={setTickets}
        user={user}
        balance={balance}
        jackpot={jackpot}
      />

      <div className="px-4 -mt-3 relative z-20">
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
            <NumberPickerArea
              config={config}
              selectedFront={selectedFront}
              selectedBack={selectedBack}
              onSelectFront={setSelectedFront}
              onSelectBack={setSelectedBack}
              trendData={trendData}
              trendDataBack={trendDataBack}
              frontStats={frontStats}
              backStats={backStats}
              recommendations={recommendations}
              onToggleNumber={toggleNumber}
              onDetail={(num, data) => { setDetailNum(num); setDetailData(data); }}
              onQuickPick={quickPick}
              onAddTicket={addTicket}
              onPlaceBet={placeBet}
              onSetTickets={setTickets}
              onSetBetMultiple={setBetMultiple}
              lotteryCode={lotteryCode}
              apiBase={API_BASE}
              onSetError={setError}
            />

            {/* Bet Slip + Multiple + Error */}
            <BetSlip
              tickets={tickets}
              onRemoveTicket={removeTicket}
              totalCost={totalCost}
              betMultiple={betMultiple}
              onSetBetMultiple={setBetMultiple}
              error={error}
            />

            {/* BetButton (拆分组件) */}
            <BetButton
              countdown={countdown}
              betting={betting}
              canBet={canBet}
              user={user}
              tickets={tickets}
              totalCost={totalCost}
              config={config}
              betMultiple={betMultiple}
              showDraw={showDraw}
              setShowDraw={setShowDraw}
              setBetting={setBetting}
              bettingLockRef={bettingLockRef}
              setCountdown={setCountdown}
              placeBet={placeBet}
            />

            {!user && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 text-amber-700 text-xs text-center">
                请先 <button onClick={() => setShowLogin(true)} className="font-bold underline">登录</button> 后使用游戏豆参与
              </div>
            )}

            {/* Draw Result (倒计时+开奖+再来一注) */}
            <DrawResult
              countdown={countdown}
              showDraw={showDraw}
              result={result}
              rollDisplay={rollDisplay}
              lastTickets={lastTickets}
              onRebet={rebet}
            />

            {/* History */}
            <BetHistory
              history={history}
              onHistoryView={trackHistoryView}
            />
          </>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSurvey && <SurveyModal onClose={() => setShowSurvey(false)} />}

      {/* 切换彩种确认弹窗 */}
      {confirmSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setConfirmSwitch(null)}>
          <div className="bg-white rounded-[16px] p-5 w-[280px] shadow-xl mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-[14px] font-semibold mb-2">切换彩种</p>
            <p className="text-[12px] text-gray-400 mb-4">当前有 {tickets.length} 注待清空，确定切换吗？</p>
            <div className="flex gap-2">
              <button onClick={() => { setLotteryCode(confirmSwitch); setTickets([]); trackModeSwitch(); setConfirmSwitch(null); }}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-medium text-white"
                style={{background: "#E24B4A"}}>确定切换</button>
              <button onClick={() => setConfirmSwitch(null)}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-medium bg-gray-100 text-gray-500">取消</button>
            </div>
          </div>
        </div>
      )}

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

            {user ? (
              <DailyChallenges
                user={user}
                dailyTasks={dailyTasks as any}
                onSetDailyTasks={setDailyTasks}
                achievements={achievements}
                onSetAchievements={setAchievements}
                balance={balance}
                onSetBalance={setBalance}
                showTasks={showTasks}
                onSetShowTasks={setShowTasks}
                apiBase={API_BASE}
              />
            ) : null}

      
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
                <div className="text-[11px] text-text-tertiary text-center py-4">还没有参与记录，开始玩吧！</div>
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
