"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

/**
 * 🔮 预测模板
 *
 * 通用预测/投票/竞猜类页面模板，支持排行榜、AI娱乐预测、PK对战三大模块
 * 可配置方向类别、PK方式、排行榜数据源
 */

export interface PredictConfig {
  title: string;
  subtitle: string;
  leaderboard: Array<{
    rank: number;
    name: string;
    avatar: string;
    stats: string;
    accuracy: string;
    isCrown?: boolean;
  }>;
  aiSilly: Array<{
    icon: string;
    name: string;
    desc: string;
    accentColor: string;
  }>;
  simGames: Array<{
    icon: string;
    name: string;
    desc: string;
    accentColor: string;
  }>;
  pkDirections: Array<{
    icon: string;
    name: string;
    count: string;
    color: string;
  }>;
  pkModes: Array<{
    icon: string;
    name: string;
    desc: string;
    highlight?: boolean;
  }>;
}

export interface PredictTemplateProps {
  config?: Partial<PredictConfig>;
  lotteryPrediction?: { top5: number[]; top3Back?: number[]; score: number } | null;
}

const defaultConfig: PredictConfig = {
  title: "小章鱼 · AI趣预测",
  subtitle: "AI驱动 · 全民预测 · 有奖PK",
  leaderboard: [
    { rank: 1, name: "涨停达人", avatar: "牛", stats: "预测128场·命中89场", accuracy: "69.5%", isCrown: true },
    { rank: 2, name: "神算子", avatar: "鹰", stats: "预测96场·命中62场", accuracy: "64.6%" },
    { rank: 3, name: "预言家", avatar: "虎", stats: "预测72场·命中45场", accuracy: "62.5%" },
  ],
  aiSilly: [
    { icon: "🎱", name: "彩票乱说", desc: "AI随机生成·纯属娱乐", accentColor: "rgba(242,113,82,0.1)" },
    { icon: "📈", name: "股市瞎猜", desc: "AI盲猜涨跌·不准别打", accentColor: "rgba(69,204,213,0.1)" },
    { icon: "₿", name: "BTC胡判", desc: "AI胡说走势·纯随机", accentColor: "rgba(139,92,246,0.1)" },
  ],
  simGames: [
    { icon: "🎱", name: "彩票试玩", desc: "大乐透·双色球", accentColor: "rgba(242,182,49,0.1)" },
    { icon: "₿", name: "BTC试玩", desc: "看涨·跌·大小", accentColor: "rgba(69,204,213,0.1)" },
    { icon: "📊", name: "股指试玩", desc: "沪深300模拟", accentColor: "rgba(242,113,82,0.1)" },
  ],
  pkDirections: [
    { icon: "⚽", name: "体育赛事", count: "12场进行中", color: "from-brand-coral to-brand-coral-dark" },
    { icon: "🌐", name: "社会热点", count: "8场进行中", color: "from-brand-teal to-brand-teal-dark" },
    { icon: "⚡", name: "突发事件", count: "3场进行中", color: "from-brand-gold to-brand-gold-dark" },
    { icon: "💬", name: "一言不合", count: "自由发起", color: "from-purple-400 to-purple-600" },
  ],
  pkModes: [
    { icon: "⚔️", name: "1:1", desc: "单人PK" },
    { icon: "🛡️", name: "1对多", desc: "挑战群雄" },
    { icon: "🏰", name: "多对多", desc: "团队对决" },
    { icon: "💰", name: "发起有奖", desc: "设奖邀战", highlight: true },
  ],
};

export default function PredictTemplate({ config: userConfig, lotteryPrediction }: PredictTemplateProps) {
  const cfg = { ...defaultConfig, ...userConfig, leaderboard: userConfig?.leaderboard || defaultConfig.leaderboard };
  const router = useRouter();
  const [liveLB, setLiveLB] = useState<PredictConfig["leaderboard"]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  // 从API加载真实排行榜
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://h5.ws.hi.cn";
    fetch(`${API_BASE}/api/leaderboard?limit=10`)
      .then(r => r.json())
      .then(j => { if (j.code === 0 && j.data?.length > 0) setLiveLB(j.data); })
      .catch(() => {})
      .finally(() => setLbLoading(false));
  }, []);

  const lb = liveLB.length > 0 ? liveLB : (lbLoading ? cfg.leaderboard : cfg.leaderboard);

  // ── PK状态 ──
  const { user } = useAuth();
  const uid = user?.uid || 0;
  const [pkTopics, setPkTopics] = useState<any[]>([]);
  const [pkLoading, setPkLoading] = useState(true);
  const [showCreatePK, setShowCreatePK] = useState(false);
  const [pkForm, setPkForm] = useState({ title: "", option_a: "", option_b: "", category: "general", end_time: "", min_bet: "10" });
  const [filterCategory, setFilterCategory] = useState("");
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://h5.ws.hi.cn";

  // ── 投注确认弹窗状态 ──
  const [confirmVote, setConfirmVote] = useState<{
    pk: any;
    choice: string;
    betAmount: number;
    estimatedReward: number;
  } | null>(null);

  const loadPK = useCallback(() => {
    setPkLoading(true);
    fetch(`${API_BASE}/api/pk?action=list`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setPkTopics(j.data || []); })
      .catch(() => {})
      .finally(() => setPkLoading(false));
  }, [API_BASE]);

  useEffect(() => { loadPK(); }, [loadPK]);

  // 点击选项 → 弹出确认弹窗
  const handleOptionClick = (pk: any, choice: string) => {
    if (!uid) { setShowLogin(true); return; }
    if (pk.status !== 1) { setVoteMsg("❌ 话题已结束"); setTimeout(() => setVoteMsg(""), 2000); return; }

    const bet = pk.min_bet || 10;
    const estReward = choice === 'A' ? (pk.estimated_reward_a || 0) : (pk.estimated_reward_b || 0);

    setConfirmVote({ pk, choice, betAmount: bet, estimatedReward: estReward });
  };

  // 执行投注
  const executeVote = async () => {
    if (!confirmVote) return;
    const { pk, choice, betAmount } = confirmVote;
    setConfirmVote(null);

    try {
      const res = await fetch(`${API_BASE}/api/pk?action=vote`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk_id: pk.id, uid, option_choice: choice, bet_amount: betAmount }),
      });
      const j = await res.json();
      setVoteMsg(j.msg || (j.code === 0 ? `✅ 投注${betAmount}豆成功！` : `❌ ${j.msg}`));
      if (j.code === 0) loadPK();
    } catch {
      setVoteMsg("❌ 网络错误");
    }
    setTimeout(() => setVoteMsg(""), 3000);
  };

  // 发起PK
  const handleCreatePKClick = () => {
    if (!uid) { setShowLogin(true); return; }
    setShowCreatePK(true);
  };

  const handleCreatePK = async () => {
    if (!uid) return;
    if (!pkForm.title || !pkForm.option_a || !pkForm.option_b) return;

    // 计算end_time
    let endTime = 0;
    if (pkForm.end_time === "1h") endTime = Math.floor(Date.now()/1000) + 3600;
    else if (pkForm.end_time === "3h") endTime = Math.floor(Date.now()/1000) + 10800;
    else if (pkForm.end_time === "tomorrow") endTime = Math.floor(Date.now()/1000) + 86400;
    else endTime = Math.floor(Date.now()/1000) + 604800; // 7天

    const minBet = parseInt(pkForm.min_bet) || 10;

    try {
      const res = await fetch(`${API_BASE}/api/pk?action=create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: pkForm.title,
          option_a: pkForm.option_a,
          option_b: pkForm.option_b,
          category: pkForm.category,
          mode: "1v1",
          end_time: endTime,
          min_bet: minBet,
        }),
      });
      const j = await res.json();
      if (j.code === 0) {
        setShowCreatePK(false);
        setPkForm({ title: "", option_a: "", option_b: "", category: "general", end_time: "", min_bet: "10" });
        loadPK();
        setVoteMsg("✅ PK话题发起成功！");
      } else { alert(j.msg); }
    } catch { alert("创建失败"); }
    setTimeout(() => setVoteMsg(""), 2500);
  };

  const categoryIcons: Record<string, string> = { sports: "⚽", social: "🌐", event: "⚡", general: "💬" };
  const categoryNames: Record<string, string> = { sports: "体育", social: "社会", event: "事件", general: "一言不合" };

  return (
    <main className="pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-gold px-6 pt-8 pb-7 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <h1 className="text-2xl font-bold text-white relative z-10">{cfg.title}</h1>
        <p className="text-sm text-white/85 mt-1.5 relative z-10">{cfg.subtitle}</p>
      </div>

      {/* Leaderboard */}
      <SectionTitle title="预测排行榜" link={lbLoading ? "加载中..." : `TOP${lb.length}`} />
      {lbLoading && lb.length === 0 ? (
        <div className="mx-4 h-24 bg-surface rounded-[20px] animate-pulse flex items-center justify-center">
          <span className="text-xs text-text-tertiary">加载排行榜...</span>
        </div>
      ) : (
      <div className="grid grid-cols-7 gap-2 px-4 items-stretch">
        {lb.length >= 2 && (
        <div className="col-span-2 bg-surface rounded-[20px] py-2.5 px-2 text-center shadow-sm border border-[rgba(69,204,213,0.08)] flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-text-tertiary">2</span>
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-sm mx-auto my-0.5">
            {lb[1].avatar}
          </div>
          <div className="text-[10px] font-semibold truncate max-w-[70px]">{lb[1].name}</div>
          <div className="text-[9px] font-bold text-brand-coral mt-0.5">{lb[1].accuracy}</div>
        </div>
        )}
        {lb.length >= 1 && (
        <div className="col-span-3 bg-surface rounded-[20px] py-4 px-3 text-center shadow-sm border border-brand-gold bg-gradient-to-b from-[rgba(242,182,49,0.08)] to-surface flex flex-col items-center justify-center">
          <span className="text-lg block -mt-1">{lb[0].isCrown ? "👑" : "🏆"}</span>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center text-lg mx-auto my-1">
            {lb[0].avatar}
          </div>
          <div className="text-xs font-semibold truncate max-w-[80px]">{lb[0].name}</div>
          <div className="text-[9px] text-text-tertiary mt-0.5">{lb[0].stats}</div>
          <div className="text-base font-bold text-brand-gold-dark mt-0.5">{lb[0].accuracy}</div>
        </div>
        )}
        {lb.length >= 3 && (
        <div className="col-span-2 bg-surface rounded-[20px] py-2.5 px-2 text-center shadow-sm border border-[rgba(69,204,213,0.08)] flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-text-tertiary">3</span>
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-sm mx-auto my-0.5">
            {lb[2].avatar}
          </div>
          <div className="text-[10px] font-semibold truncate max-w-[70px]">{lb[2].name}</div>
          <div className="text-[9px] font-bold text-brand-coral mt-0.5">{lb[2].accuracy}</div>
        </div>
        )}
      </div>
      )}

      {/* AI 瞎测 */}
      <SectionTitle title="AI瞎测" link="娱乐为主·勿当真" />
      <div className="grid grid-cols-3 gap-2 px-4">
        {cfg.aiSilly.map((c, i) => {
          const isLottery = c.name === "彩票乱说";
          const isStock = c.name === "股市瞎猜";
          const isBTC = c.name === "BTC胡判";
          return (
          <div key={i}
            onClick={() => {
              if (isLottery) {
                const pred = lotteryPrediction;
                if (pred && pred.top5) {
                  const frontStr = pred.top5.slice(0,5).join(",");
                  const backStr = pred.top3Back ? pred.top3Back.slice(0,2).join(",") : "";
                  router.push(`/lottery-sim?type=dlt&pred=${frontStr}-${backStr}`);
                } else {
                  router.push("/lottery-sim");
                }
              }
              else if (isStock) router.push("/stock-analysis");
              else if (isBTC) router.push("/btc-predict");
            }}
            className={`rounded-[20px] py-4 px-2 text-center active:scale-95 transition-transform cursor-pointer relative ${isLottery && lotteryPrediction ? 'border-2 border-brand-gold' : ''}`}
            style={{ background: c.accentColor, border: `1px solid ${c.accentColor.replace('0.1','0.2')}` }}>
            {isLottery && lotteryPrediction && (
              <div className="absolute -top-1.5 -right-1.5 bg-brand-gold text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">LIVE</div>
            )}
            <span className="text-[28px] block mb-1.5">{c.icon}</span>
            <div className="text-[13px] font-semibold">{c.name}</div>
            {isLottery && lotteryPrediction ? (
              <div className="mt-1.5 space-y-1">
                <div className="flex justify-center gap-0.5">
                  {lotteryPrediction.top5.slice(0, 5).map(n => (
                    <span key={n} className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white flex items-center justify-center text-[9px] font-bold">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                {lotteryPrediction.top3Back && (
                  <div className="flex justify-center gap-0.5">
                    {lotteryPrediction.top3Back.slice(0, 2).map(n => (
                      <span key={n} className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white flex items-center justify-center text-[8px] font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[8px] text-text-tertiary">AI置信度 {lotteryPrediction.score}%</div>
              </div>
            ) : (
              <div className="text-[10px] text-text-tertiary mt-0.5 leading-tight">{c.desc}</div>
            )}
          </div>
          );
        })}
      </div>

      {/* 模拟试玩 */}
      <SectionTitle title="模拟试玩" link="" />
      <div className="grid grid-cols-3 gap-2 px-4">
        {cfg.simGames.map((g, i) => (
          <div key={i}
            onClick={() => {
              if (g.name === "BTC试玩") router.push("/btc");
              else if (g.name === "股指试玩") router.push("/sim");
              else router.push("/lottery-sim");
            }}
            className="rounded-[20px] py-4 px-2 text-center active:scale-95 transition-transform cursor-pointer"
            style={{ background: g.accentColor, border: `1px solid ${g.accentColor.replace('0.1','0.2')}` }}>
            <span className="text-[28px] block mb-1.5">{g.icon}</span>
            <div className="text-[13px] font-semibold">{g.name}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5 leading-tight">{g.desc}</div>
          </div>
        ))}
      </div>

      {/* PK Directions - 分类筛选 */}
      <SectionTitle title="⚔️ 预测方向PK" link={filterCategory ? `全部(${pkTopics.length})` : `${pkTopics.length}个话题`} />
      <div className="grid grid-cols-4 gap-1.5 px-4 mb-2">
        {cfg.pkDirections.map((d, i) => {
          const catMap = ["sports","social","event","general"];
          const cat = catMap[i];
          const count = pkTopics.filter((p: any) => p.category === cat).length;
          const isActive = filterCategory === cat;
          return (
          <div key={i} className={`bg-surface rounded-[16px] py-3 px-1.5 text-center shadow-sm border transition-all active:scale-93 cursor-pointer ${
            isActive ? "border-brand-teal ring-2 ring-brand-teal/20" : "border-[rgba(69,204,213,0.08)]"
          }`}
            onClick={() => setFilterCategory(isActive ? "" : cat)}>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${d.color} flex items-center justify-center mx-auto mb-1`}>
              <span className="text-base">{d.icon}</span>
            </div>
            <div className="text-[11px] font-semibold">{d.name}</div>
            <div className={`text-[9px] mt-0.5 ${isActive ? "text-brand-teal font-medium" : "text-text-tertiary"}`}>
              {count > 0 ? `${count}个话题` : d.count}
            </div>
          </div>
          );
        })}
      </div>

      {/* PK Modes */}
      <div className="mx-4 bg-surface rounded-[20px] p-3 shadow-sm border border-[rgba(69,204,213,0.08)] mb-2">
        <div className="text-[11px] font-semibold text-text-secondary mb-2.5 px-0.5">PK方式</div>
        <div className="grid grid-cols-4 gap-2">
          {cfg.pkModes.map((m, i) => (
            <button key={i} className={`rounded-[12px] py-2.5 px-1 text-center active:scale-93 transition-transform relative overflow-hidden ${m.highlight?'bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white shadow-[0_2px_8px_rgba(242,182,49,0.25)]':'bg-bg'}`}
              onClick={m.highlight ? handleCreatePKClick : undefined}>
              <div className="text-lg mb-0.5">{m.icon}</div>
              <div className="text-[11px] font-semibold">{m.name}</div>
              <div className={`text-[9px] mt-0.5 ${m.highlight?'text-white/80':'text-text-tertiary'}`}>{m.desc}</div>
              {m.highlight && <span className="absolute -top-1 -right-1 text-[8px] px-1 bg-white/20 rounded">🏆</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Active PK Matches - 实时数据 */}
      {filterCategory && (
        <div className="mx-4 mb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] text-brand-teal font-medium">
            {categoryIcons[filterCategory]} {categoryNames[filterCategory] || filterCategory}
          </span>
          <button onClick={() => setFilterCategory("")} className="text-[9px] text-text-tertiary hover:text-red-400">清除筛选 ✕</button>
        </div>
      )}
      {pkLoading ? (
        <div className="mx-4 space-y-2">
          {[1,2].map(i => <div key={i} className="h-24 bg-surface rounded-[20px] animate-pulse" />)}
        </div>
      ) : (() => {
        const filtered = filterCategory ? pkTopics.filter((p: any) => p.category === filterCategory) : pkTopics;
        return filtered.length === 0 ? (
        <div className="mx-4 mb-2 bg-surface rounded-[20px] p-6 text-center border border-[rgba(69,204,213,0.08)]">
          <div className="text-2xl mb-2">🏟️</div>
          <div className="text-[11px] text-text-tertiary">
            {filterCategory ? "该分类暂无PK话题" : "还没有PK话题"}
          </div>
          <div className="text-[10px] text-text-tertiary mt-1">发起第一个PK吧</div>
        </div>
      ) : (
        filtered.map((p: any) => {
          const isSettled = p.status === 3;
          const isActive = p.status === 1;
          const isClosed = p.status === 2;
          return (
          <div key={p.id} onClick={() => router.push(`/pk-hall/${p.category}/${p.id}`)} className={`mx-4 mb-2 bg-surface rounded-[20px] p-4 shadow-sm border cursor-pointer active:scale-[0.98] transition-transform ${isSettled ? 'border-brand-gold/30' : isClosed ? 'border-gray-200/50' : 'border-[rgba(69,204,213,0.08)]'}`}>
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-2">
              <span>{categoryIcons[p.category] || "💬"} {categoryNames[p.category] || p.category}</span>
              <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary" />
              <span className={isSettled ? 'text-brand-gold font-medium' : isClosed ? 'text-red-400' : 'text-brand-teal'}>{p.status_label}</span>
              <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary" />
              <span>⚔️ {p.mode}</span>
              <span className="ml-auto flex items-center gap-1">
                <span>💰</span>
                <span className="font-semibold text-brand-gold">{p.total_pool || 0}</span>
              </span>
            </div>
            <div className="text-[13px] font-semibold mb-1.5">{p.title}</div>
            <div className="flex gap-2 text-[11px] text-text-tertiary mb-2">
              <span className="px-2 py-0.5 rounded-[6px] bg-brand-coral/10 text-brand-coral font-medium">{p.option_a}</span>
              <span className="self-center">VS</span>
              <span className="px-2 py-0.5 rounded-[6px] bg-brand-teal/10 text-brand-teal font-medium">{p.option_b}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-text-tertiary">
              <span>{p.creator_name} 发起 · 👁 {p.spectator_count || 0}围观 · 💬 {p.comment_count || 0}评论</span>
              <span>{p.total_votes} 人参与</span>
            </div>
          </div>
          );
        })
      );
      })()}

      {/* 投注确认弹窗 */}
      {confirmVote && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setConfirmVote(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">🎯 投注确认</h3>
            <div className="space-y-2.5 text-xs">
              <div className="bg-gray-50 rounded-[12px] p-3">
                <div className="font-medium text-text-primary mb-1">{confirmVote.pk.title}</div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[6px] bg-brand-teal/10 text-brand-teal font-medium">
                    {confirmVote.choice === 'A' ? confirmVote.pk.option_a : confirmVote.pk.option_b}
                  </span>
                </div>
              </div>

              {/* 投注额选择 */}
              <div className="text-text-secondary">选择投注数量</div>
              <div className="flex gap-2">
                {[10, 50, 100, 200].map(amt => (
                  <button key={amt}
                    onClick={() => setConfirmVote({...confirmVote, betAmount: amt,
                      estimatedReward: amt === confirmVote.betAmount ? confirmVote.estimatedReward : (
                        confirmVote.choice === 'A'
                          ? Math.round(confirmVote.pk.estimated_reward_a / confirmVote.pk.min_bet * amt)
                          : Math.round(confirmVote.pk.estimated_reward_b / confirmVote.pk.min_bet * amt)
                      )
                    })}
                    className={`flex-1 py-2 rounded-[10px] text-center text-[11px] font-medium transition-all ${
                      confirmVote.betAmount === amt ? 'bg-brand-teal text-white shadow-sm' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
                    }`}>
                    {amt}豆
                  </button>
                ))}
              </div>

              {/* 自定义投注 */}
              <div className="flex items-center gap-2">
                <input type="number" min={confirmVote.pk.min_bet} max={10000}
                  value={confirmVote.betAmount}
                  onChange={e => setConfirmVote({...confirmVote, betAmount: Math.max(confirmVote.pk.min_bet, parseInt(e.target.value) || confirmVote.pk.min_bet)})}
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30"
                  placeholder="自定义" />
                <span className="text-[10px] text-text-tertiary whitespace-nowrap">游戏豆</span>
              </div>

              {/* 预估收益 */}
              <div className="bg-brand-gold/5 rounded-[12px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">预估预测正确可赢得</div>
                <div className="text-lg font-bold text-brand-gold-dark">
                  +{(() => {
                    const pk = confirmVote.pk;
                    const bet = confirmVote.betAmount;
                    const choice = confirmVote.choice;
                    const myPool = choice === 'A' ? (pk.pool_a || 0) : (pk.pool_b || 0);
                    const oppPool = choice === 'A' ? (pk.pool_b || 0) : (pk.pool_a || 0);
                    if (oppPool <= 0) return 0;
                    const fee = Math.floor(oppPool * 20 / 100);
                    const rewardPool = oppPool - fee;
                    if (rewardPool <= 0) return 0;
                    const newMyPool = myPool + bet;
                    const est = Math.floor(bet / newMyPool * rewardPool);
                    return est + bet; // 本金+奖励
                  })()} 豆
                  <span className="text-[10px] text-text-tertiary font-normal ml-1">(含本金)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmVote(null)} className="flex-1 py-2.5 bg-gray-100 rounded-[12px] text-xs font-medium">取消</button>
              <button onClick={executeVote} className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[12px] text-xs font-medium">
                确认投注 {confirmVote.betAmount} 豆
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 消息提示 */}
      {voteMsg && (
        <div className="mx-4 mb-2 px-4 py-2 text-center text-[11px] font-medium bg-green-50 text-green-700 rounded-[12px] animate-fade-in">
          {voteMsg}
        </div>
      )}

      {/* 登录弹窗 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Create PK Modal */}
      {showCreatePK && (
        <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCreatePK(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">💰 发起PK话题</h3>
            <div className="space-y-3">
              <input type="text" placeholder="PK话题（如：谁会赢？）" value={pkForm.title} onChange={e => setPkForm({...pkForm, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
              <div className="flex gap-2">
                <input type="text" placeholder="选项A" value={pkForm.option_a} onChange={e => setPkForm({...pkForm, option_a: e.target.value})}
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
                <span className="self-center text-xs text-gray-400">VS</span>
                <input type="text" placeholder="选项B" value={pkForm.option_b} onChange={e => setPkForm({...pkForm, option_b: e.target.value})}
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
              </div>
              {/* 截止时间 */}
              <div>
                <div className="text-[10px] text-text-tertiary mb-1.5">⏱ 截止时间</div>
                <div className="flex gap-2">
                  {[
                    { label: "1小时", value: "1h" },
                    { label: "3小时", value: "3h" },
                    { label: "明天", value: "tomorrow" },
                    { label: "7天", value: "7d" },
                  ].map(opt => (
                    <button key={opt.value}
                      onClick={() => setPkForm({...pkForm, end_time: opt.value})}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${pkForm.end_time === opt.value ? 'bg-brand-teal text-white' : 'bg-gray-50 text-text-secondary'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* 最低投注 */}
              <div>
                <div className="text-[10px] text-text-tertiary mb-1.5">💰 最低投注</div>
                <div className="flex gap-2">
                  {[10, 50, 100].map(amt => (
                    <button key={amt}
                      onClick={() => setPkForm({...pkForm, min_bet: amt.toString()})}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${pkForm.min_bet === amt.toString() ? 'bg-brand-teal text-white' : 'bg-gray-50 text-text-secondary'}`}>
                      {amt}豆
                    </button>
                  ))}
                </div>
              </div>
              <select value={pkForm.category} onChange={e => setPkForm({...pkForm, category: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none">
                <option value="sports">⚽ 体育赛事</option>
                <option value="social">🌐 社会热点</option>
                <option value="event">⚡ 突发事件</option>
                <option value="general">💬 一言不合</option>
              </select>
              <button onClick={handleCreatePK} disabled={!pkForm.title || !pkForm.option_a || !pkForm.option_b}
                className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[12px] text-xs font-medium disabled:opacity-50">
                发起PK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SectionTitle({ title, link }: { title: string; link?: string | React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
      <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-gold to-brand-coral">
        {title}
      </h2>
      {link && <span className="text-xs text-brand-teal-dark font-medium">{link}</span>}
    </div>
  );
}

function showRewardRules() {
  alert(
    "💰 预测奖励规则\n\n" +
    "🎯 如何参与PK：\n" +
    "① 选择PK方向\n" +
    "② 选择PK方式\n" +
    "③ 设定奖池（最低100游戏豆）\n" +
    "④ 发出挑战\n\n" +
    "🏆 奖励计算：\n" +
    "• 输家消耗的游戏豆 = 平台奖励的水晶石\n" +
    "• 80% 按投票比例分配\n" +
    "• 20% 入全网统一奖励池\n\n" +
    "⚔️ 1:1 → A投200 vs B投200 → A胜\n" +
    "  A收回200游戏豆 + 奖励160水晶石(80%归A)\n\n" +
    "🛡️ 1对多 → A投300 vs B(200)+C(100)\n" +
    "  B、C胜：B收200+C收100游戏豆\n" +
    "  奖励240水晶石(80%)按2:1分: B160 C80\n" +
    "  60水晶石(20%)入全网池"
  );
}
