"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PKTopic, APIResponse, PKMode, CharityMode, PoolMode, POOL_MODE_LABELS, POOL_MODE_DESCS, PK_MODE_LABELS, PK_MODE_DESCS, DailySidelineStats, SidelineResult, AGENT_TOPICS_POOL, UserInterestProfile, type VoteConfirmData } from "./types";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import PKGuideOverlay from "@/components/pk-guide-overlay";
import TierBadge from "@/components/ui/tier-badge";
import { loadXp } from "@/lib/tier-system";
import PKCreator from "@/components/pk/pk-creator";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";

// ─── 新品类Tab（情感化命名） ───
const CATEGORIES = [
  { key: "",      label: "🔥 全部" },
  { key: "general", label: "🏠 家庭战场" },
  { key: "social", label: "🌐 社会动脉" },
  { key: "sports", label: "⚽ 竞技声浪" },
  { key: "event", label: "⚡ 事件脉冲" },
  { key: "consumption", label: "🏪 消费对决" },
];

// ─── 消费对决预设话题（硬编码） ───
const CONSUMPTION_TOPICS: any[] = [
  { id: -1, title: "沙县小吃 vs 兰州拉面 哪家好吃？", category: "consumption", options: ["沙县小吃", "兰州拉面"], option_a: "沙县小吃", option_b: "兰州拉面", vote_a: 1284, vote_b: 1023, vote_counts: [1284, 1023], total_votes: 2307, total_pool: 4560, pools: [2200, 2360], min_bet: 10, max_bet: 1000, status: 1, status_label: "进行中", mode: "NvN", creator_name: "消费达人", creator_id: 0, time_label: "3天后截止", end_time: 0, time_remaining: 259200, comment_count: 56, spectator_count: 892, charity: "none", charity_ratio: 0, charity_project: "", pool_distribution: "winner_takes_all", platform_fee_ratio: 5, creator_fee_ratio: 0, challenger_limit: 100, challenger_pool_limit: 10000, estimated_rewards: [220, 230], created_at: "", time_ago: "1天前" },
  { id: -2, title: "华为 vs iPhone 下一部手机买哪个？", category: "consumption", options: ["华为", "iPhone"], option_a: "华为", option_b: "iPhone", vote_a: 2456, vote_b: 1892, vote_counts: [2456, 1892], total_votes: 4348, total_pool: 8920, pools: [5000, 3920], min_bet: 10, max_bet: 1000, status: 1, status_label: "进行中", mode: "NvN", creator_name: "数码控", creator_id: 0, time_label: "5天后截止", end_time: 0, time_remaining: 432000, comment_count: 128, spectator_count: 2341, charity: "none", charity_ratio: 0, charity_project: "", pool_distribution: "winner_takes_all", platform_fee_ratio: 5, creator_fee_ratio: 0, challenger_limit: 100, challenger_pool_limit: 10000, estimated_rewards: [500, 392], created_at: "", time_ago: "2天前" },
  { id: -3, title: "社区火锅店 vs 商业区烤肉 周末去哪吃？", category: "consumption", options: ["老重庆火锅", "韩式烤肉"], option_a: "老重庆火锅", option_b: "韩式烤肉", vote_a: 892, vote_b: 1156, vote_counts: [892, 1156], total_votes: 2048, total_pool: 3200, pools: [1500, 1700], min_bet: 10, max_bet: 1000, status: 1, status_label: "进行中", mode: "NvN", creator_name: "美食侦探", creator_id: 0, time_label: "2天后截止", end_time: 0, time_remaining: 172800, comment_count: 34, spectator_count: 456, charity: "none", charity_ratio: 0, charity_project: "", pool_distribution: "winner_takes_all", platform_fee_ratio: 5, creator_fee_ratio: 0, challenger_limit: 100, challenger_pool_limit: 10000, estimated_rewards: [150, 170], created_at: "", time_ago: "昨天" },
];

// ETag cache
let lastETag = "";
let cachedData: PKTopic[] = [];

/** 获取品类图标 */
function catIcon(key: string): string {
  switch(key) {
    case "sports": return "⚽"; case "social": return "🌐"; case "event": return "⚡";
    case "general": return "🏠"; case "consumption": return "🏪"; default: return "💬";
  }
}

/** 品类色 */
function catColor(key: string): string {
  switch(key) {
    case "sports": return "bg-brand-teal/10 text-brand-teal-dark";
    case "social": return "bg-brand-gold-light/50 text-brand-gold-dark";
    case "event": return "bg-brand-coral/10 text-brand-coral-dark";
    case "general": return "bg-amber-100 text-amber-700";
    case "consumption": return "bg-blue-50 text-blue-600";
    default: return "bg-purple-100 text-purple-700";
  }
}

// ── 参与追踪（localStorage）──
function getMyPkCount(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem("pk_participation_count");
  if (!stored) return 0;
  const parsed = JSON.parse(stored);
  return parsed.date === today ? parsed.count : 0;
}
function setMyPkCount(count: number) {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem("pk_participation_count", JSON.stringify({ date: today, count }));
}

export default function PKHallPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<PKTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [bindMsg, setBindMsg] = useState("");
  const [showBind, setShowBind] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0); // 沸腾榜刷新

  const [showCreator, setShowCreator] = useState(false);
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // 站队状态
  const [sidelineStats, setSidelineStats] = useState<DailySidelineStats>(() => {
    if (typeof window === "undefined") return { date: "", free_count: 0, paid_count: 0 };
    const stored = localStorage.getItem("pk_sideline_stats");
    if (stored) {
      const parsed = JSON.parse(stored);
      const today = new Date().toISOString().split("T")[0];
      if (parsed.date === today) return parsed;
    }
    return { date: new Date().toISOString().split("T")[0], free_count: 0, paid_count: 0 };
  });
  const [sidelineLoading, setSidelineLoading] = useState<number | null>(null);

  // 保存站队统计到localStorage
  const saveSidelineStats = (stats: DailySidelineStats) => {
    localStorage.setItem("pk_sideline_stats", JSON.stringify(stats));
    setSidelineStats(stats);
  };

  // 站队操作
  const handleSideline = async (pk: PKTopic, optionIndex: number) => {
    if (!uid) { setShowLogin(true); return; }
    setSidelineLoading(pk.id);
    try {
      const isFree = sidelineStats.free_count < 3;
      const cost = isFree ? 0 : 10;
      
      // 调用后端API
      const res = await fetch(`${API_BASE}/api/pk?action=side_line`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk_id: pk.id, uid, option_index: optionIndex, cost }),
      });
      const json: APIResponse<SidelineResult> = await res.json();
      
      if (json.code === 0) {
        // 更新本地站队统计
        const newStats = {
          ...sidelineStats,
          free_count: isFree ? sidelineStats.free_count + 1 : sidelineStats.free_count,
          paid_count: isFree ? sidelineStats.paid_count : sidelineStats.paid_count + 1,
        };
        saveSidelineStats(newStats);
        // 记录兴趣
        trackInterest(pk.category, 2);
        setVoteMsg(isFree ? "✅ 站队成功！" : "✅ 站队成功！10🎮已进入公益资金池");
      } else {
        setVoteMsg(`❌ ${json.msg || "站队失败"}`);
      }
    } catch {
      setVoteMsg("❌ 网络错误，站队失败");
    }
    setSidelineLoading(null);
    setTimeout(() => setVoteMsg(""), 2000);
  };

  const uid = (user as any)?.uid || 0;
  const [myPkCount, setMyPkCountState] = useState(getMyPkCount());
  const trackPkParticipate = () => {
    const newCount = myPkCount + 1;
    setMyPkCountState(newCount);
    setMyPkCount(newCount);
  };

  const [wallet, setWallet] = useState({ credit1: 0 });
  const [rankData, setRankData] = useState<any[]>([]);
  useEffect(() => {
    if (!uid) return;
    fetch(`${API_BASE}/api/wallet/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    }).then(r => r.json()).then(d => { if (d.code === 0) setWallet(d.data); }).catch(() => {});
  }, [uid]);

  // ═══ 千人千面智能推荐引擎 ═══

  /** 获取用户兴趣画像 */
  const getInterestProfile = (): UserInterestProfile => {
    if (typeof window === "undefined") return { categoryWeights: {}, totalActions: 0, lastUpdated: "" };
    const stored = localStorage.getItem("pk_interest_profile");
    if (stored) return JSON.parse(stored);
    return { categoryWeights: {}, totalActions: 0, lastUpdated: "" };
  };

  /** 记录用户对某品类的兴趣 */
  const trackInterest = (category: string, weight: number = 1) => {
    const profile = getInterestProfile();
    profile.categoryWeights[category] = (profile.categoryWeights[category] || 0) + weight;
    profile.totalActions += weight;
    profile.lastUpdated = new Date().toISOString();
    localStorage.setItem("pk_interest_profile", JSON.stringify(profile));
  };

  /** 计算话题对用户的匹配度（0-1） */
  const calcMatchScore = (topic: PKTopic, profile: UserInterestProfile): number => {
    const catWeight = profile.categoryWeights[topic.category] || 0;
    const total = profile.totalActions || 1;
    // 基础匹配：该品类权重占比
    const baseMatch = Math.min(1, catWeight / Math.max(total * 0.3, 1));
    // 热度加分：参与人数多的略高
    const hotBonus = Math.min(0.15, (topic.total_votes || 0) / 10000 * 0.15);
    // 多样性补偿：从未互动的品类给0.2保底分（发现新内容）
    const diversityBonus = catWeight === 0 && profile.totalActions > 0 ? 0.2 : 0;
    return Math.min(1, baseMatch + hotBonus + diversityBonus);
  };

  /** 获取推荐标签 */
  const getRecommendLabel = (topic: PKTopic, matchScore: number): { icon: string; text: string; color: string } | null => {
    if (topic.topic_source !== "agent") return null;
    const urgent = topic.time_remaining && topic.time_remaining < 3600;
    if (urgent) return { icon: "⏰", text: "即将截止", color: "bg-brand-coral/10 text-brand-coral-dark" };
    if (matchScore >= 0.6) return { icon: "⭐", text: `为你推荐·${Math.round(matchScore * 100)}%匹配`, color: "bg-brand-gold-light/50 text-brand-gold-dark" };
    if ((topic.total_votes || 0) >= 200) return { icon: "🔥", text: "热门", color: "bg-red-50 text-brand-coral-dark" };
    if (matchScore >= 0.3) return { icon: "💡", text: `猜你喜欢`, color: "bg-brand-teal/10 text-brand-teal-dark" };
    return { icon: "🆕", text: "新鲜话题", color: "bg-blue-50 text-blue-600" };
  };

  // 用户兴趣画像（实时）
  const interestProfile = getInterestProfile();

  useEffect(() => {
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    if (lastETag) headers["If-None-Match"] = lastETag;
    fetch(`${API_BASE}/api/pk?action=list`, { headers, signal: controller.signal })
      .then(async r => {
        const etag = r.headers.get("ETag") || "";
        if (etag) lastETag = etag;
        if (r.status === 304) { setTopics(cachedData); return; }
        const j: APIResponse<PKTopic[]> = await r.json();
        if (j.code === 0 && j.data) { cachedData = j.data; setTopics(j.data); }
      })
      .catch(() => setError("网络不太给力"))
      .finally(() => setLoading(false));
  }, []);

  // ═══ 排行榜数据 ═══
  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboard?limit=3`)
      .then(r => r.json())
      .then(j => { if (j.code === 0 && j.data) setRankData(j.data); })
      .catch(() => {});
  }, []);

  // 60秒自动轮询刷新
  useEffect(() => {
    const timer = setInterval(() => {
      fetch(`${API_BASE}/api/pk?action=list`)
        .then(async r => {
          const etag = r.headers.get("ETag") || "";
          if (etag) lastETag = etag;
          if (r.status === 304) return;
          const j: APIResponse<PKTopic[]> = await r.json();
          if (j.code === 0 && j.data) { cachedData = j.data; setTopics(j.data); }
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 合并消费对决话题
  const allTopics = useMemo(() => {
    // Agent预设话题 → 转为PKTopic格式
    const agentTopics: PKTopic[] = AGENT_TOPICS_POOL.map((p, i) => ({
      id: -(1001 + i),                    // 负数ID避免冲突
      title: p.title,
      category: p.category,
      options: p.options,
      mode: "NvN" as PKMode,
      charity: "none" as CharityMode,
      charity_ratio: 0,
      charity_project: "",
      pool_distribution: "winner_takes_all" as PoolMode,
      platform_fee_ratio: 5,
      creator_fee_ratio: 0,
      challenger_limit: 999,
      challenger_pool_limit: 999999,
      vote_counts: [Math.floor(Math.random() * 200 + 50), Math.floor(Math.random() * 150 + 30)],
      pools: [0, 0],
      total_pool: Math.floor(Math.random() * 100000 + 10000),
      total_votes: 0,
      comment_count: Math.floor(Math.random() * 30),
      spectator_count: Math.floor(Math.random() * 500 + 100),
      end_time: Math.floor(Date.now() / 1000) + p.end_time_days * 86400,
      time_remaining: p.end_time_days * 86400,
      time_label: `${p.end_time_days}天后截止`,
      min_bet: p.min_bet,
      max_bet: 10000,
      status: 1,
      status_label: "进行中",
      winner: null,
      creator_name: "🐙 小章鱼话题官",
      creator_id: 0,
      created_at: new Date().toISOString(),
      time_ago: "刚刚",
      estimated_rewards: [0, 0],
      max_choices: 1,
      // Agent字段
      topic_source: "agent",
      agent_source: p.agent_source,
      settlement_type: p.settlement_type,
      sideline_counts: [0, 0],
      sideline_total: 0,
      charity_from_sideline: 0,
    }));
    return [...agentTopics, ...topics, ...CONSUMPTION_TOPICS] as PKTopic[];
  }, [topics]);

  // 千人千面排序：Agent话题按匹配度排序 + 混排用户话题
  const rankedTopics = useMemo(() => {
    const profile = getInterestProfile();
    return [...allTopics].sort((a, b) => {
      // Agent话题按匹配度降序
      if (a.topic_source === "agent" && b.topic_source === "agent") {
        return calcMatchScore(b, profile) - calcMatchScore(a, profile);
      }
      // 用户话题→按热度（总投票数）
      if (!a.topic_source && !b.topic_source) {
        return (b.total_votes || 0) - (a.total_votes || 0);
      }
      // Agent话题优先于用户话题展示
      return a.topic_source === "agent" ? -1 : 1;
    });
  }, [allTopics]);

  // 筛选（基于千人千面排序后）
  let filtered = [...rankedTopics];
  if (activeCat) filtered = filtered.filter(t => t.category === activeCat && t.status === 1);

  // 沸腾榜（取前3，shuffleKey触发随机打乱）
  const boilingList = useMemo(() =>
    [...allTopics].filter(t => t.status === 1)
      .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
      .slice(0, 6) // 取前6作为候选池
      .sort(() => (shuffleKey > 0 ? Math.random() - 0.5 : 0)) // 有shuffleKey时随机打乱
      .slice(0, 3),
  [allTopics, shuffleKey]);

  // 围观大厅（取前2活跃话题）
  const spectatorFeed = useMemo(() =>
    allTopics.filter(t => t.status === 1).slice(0, 2),
  [allTopics]);

  const stats = {
    active: allTopics.filter(t => t.status === 1).length,
    pool: allTopics.reduce((s, t) => s + (t.total_pool || 0), 0),
    voters: allTopics.reduce((s, t) => s + (t.total_votes || 0), 0),
  };

  // 品类名映射
  const catName: Record<string, string> = { sports: "竞技声浪", social: "社会动脉", event: "事件脉冲", general: "家庭战场", consumption: "消费对决" };

  // 围观用户名池
  const spectatorNames = ["王姐", "贵州老铁", "张大哥", "李阿姨", "陈律师", "程序员阿杰", "退休老李", "宝妈小杨"];

  // 获取品类卡片底色
  const cardBg = (key: string) => {
    if (key === "consumption") return "border-blue-100";
    if (key === "general") return "border-amber-100";
    return "border-gray-100";
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white min-h-screen relative">

      <PKGuideOverlay />

      {/* ─── Header ─── */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-gold rounded-b-[24px] px-4 pt-5 pb-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold">⚔️ PK大厅</div>
            <div className="text-[10px] text-white/70 mt-0.5">全民预测竞技场</div>
          </div>
          <Link href="/jiadouzhan"
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-medium active:scale-95 transition-transform">
            <span>🎮 {wallet.credit1.toLocaleString()}</span>
            <span className="text-white/70">获取→</span>
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-white/12 backdrop-blur-sm rounded-[8px] py-2 text-center">
            <div className="text-sm font-bold">{stats.active}</div>
            <div className="text-[9px] text-white/70">正在吵</div>
          </div>
          <div className="bg-white/12 backdrop-blur-sm rounded-[8px] py-2 text-center">
            <div className="text-sm font-bold">{stats.pool > 999 ? (stats.pool/1000).toFixed(1)+"k" : stats.pool}</div>
            <div className="text-[9px] text-white/70">总奖池</div>
          </div>
          <div className="bg-white/12 backdrop-blur-sm rounded-[8px] py-2 text-center">
            <div className="text-sm font-bold">{stats.voters}</div>
            <div className="text-[9px] text-white/70">参与人</div>
          </div>
          {/* P0-2: 沉没成本 — 今日已参与 */}
          <div className="bg-white/20 backdrop-blur-sm rounded-[8px] py-2 text-center">
            <div className="text-sm font-bold">{myPkCount}</div>
            <div className="text-[9px] text-white/70">今日参与</div>
          </div>
        </div>
        <div className="mt-2.5 text-center text-[11px] text-white/80 py-1.5 bg-white/10 rounded-[8px]">
          📣 为你家乡呐喊 · 他们pk你也有奖励 🎁
        </div>
      </div>

      <div className="px-3">

        {/* ─── 错误提示 ─── */}
        {error && (
          <div className="mt-2 px-4 py-2.5 bg-red-50 text-red-600 text-[11px] rounded-[8px] text-center">
            {error}
            <span className="ml-2 underline cursor-pointer" onClick={() => window.location.reload()}>重试</span>
          </div>
        )}

        {/* ─── 身份绑定入口 ─── */}
        {user && !showBind && (
          <div onClick={() => setShowBind(true)}
            className="inline-flex items-center gap-1 mt-2 mb-0 px-2.5 py-1 rounded-full text-[10px] text-[#6B6B6E] border border-[#E7E7E8] cursor-pointer bg-white">
            🔗 绑定账号
          </div>
        )}
        {showBind && (
          <div className="bg-white rounded-[8px] p-3 mt-2 mb-2 border border-brand-teal shadow-[0_2px_12px_rgba(69,204,213,0.15)] relative">
            <div className="text-[11px] font-semibold text-brand-teal-dark mb-1.5">🔗 身份绑定</div>
            <div className="text-[10px] text-[#6B6B6E] mb-2">绑定后可在企微接收结算通知、到店核销奖励</div>
            <div className="flex gap-1.5">
              <input id="bindSource" placeholder="来源 (h5/wecom)"
                className="flex-1 px-2 py-1.5 rounded-[8px] border border-[#E7E7E8] text-[11px] outline-none" />
              <input id="bindExtId" placeholder="外部ID"
                className="flex-1 px-2 py-1.5 rounded-[8px] border border-[#E7E7E8] text-[11px] outline-none" />
            </div>
            <div className="flex gap-1.5 mt-1.5 justify-end">
              <div onClick={() => { setShowBind(false); setBindMsg(""); }}
                className="px-3 py-1.5 rounded-[8px] border border-[#E7E7E8] text-[11px] text-[#6B6B6E] cursor-pointer">取消</div>
              <div onClick={async () => {
                  const src = (document.getElementById("bindSource") as HTMLInputElement)?.value || "h5";
                  const extId = (document.getElementById("bindExtId") as HTMLInputElement)?.value || `user_${(user as any)?.uid || 0}`;
                  try {
                    const r = await fetch(`${API_BASE}/api/pk?action=bind_identity`, {
                      method:"POST",headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({uid:(user as any)?.uid || 0, source:src, external_id:extId})
                    });
                    const j = await r.json();
                    setBindMsg(j.code === 0 ? "✅ 绑定成功" : `❌ ${j.msg || "绑定失败"}`);
                    if (j.code === 0) setTimeout(() => setShowBind(false), 1500);
                  } catch { setBindMsg("❌ 网络错误"); }
                }}
                className="px-4 py-1.5 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[11px] font-semibold cursor-pointer">确认绑定</div>
            </div>
            {bindMsg && <div className={`text-[10px] mt-1 ${bindMsg.includes("✅") ? 'text-brand-teal-dark' : 'text-brand-coral'}`}>{bindMsg}</div>}
          </div>
        )}

        {/* ─── 🔥 实时沸腾榜 ─── */}
        {boilingList.length > 0 && (
          <div className="bg-white rounded-[12px] border border-gray-100 p-3 mt-3 mb-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold text-text-primary">🔥 实时沸腾榜</span>
              <button onClick={() => setShuffleKey(k => k + 1)} className="text-[10px] text-brand-teal font-medium" aria-label="刷新榜单">换一换</button>
            </div>
            <div className="flex flex-col gap-1.5">
              {boilingList.map((t, i) => (
                <div key={t.id} onClick={() => { trackInterest(t.category, 1); router.push(`/pk-hall/${t.category}/${t.id}`); }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] cursor-pointer active:scale-[0.98] transition-transform ${
                    i === 0 ? "bg-brand-coral-light/30" : i === 1 ? "bg-brand-teal-light/30" : i === 2 ? "bg-brand-gold-light/30" : "bg-gray-50"
                  }`}>
                  <span className={`text-[11px] w-[18px] font-bold text-center shrink-0 ${
                    i === 0 ? "text-brand-coral-dark" : i === 1 ? "text-brand-teal-dark" : i === 2 ? "text-brand-gold-dark" : "text-text-tertiary"
                  }`}>{i + 1}</span>
                  <span className="flex-1 text-[11px] text-text-primary truncate">{t.title}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-[1px] rounded-[6px] shrink-0 ${
                    i === 0 ? "bg-brand-coral-light/50 text-brand-coral-dark" : i === 1 ? "bg-brand-teal-light/50 text-brand-teal-dark" : i === 2 ? "bg-brand-gold-light/50 text-brand-gold-dark" : "bg-gray-100 text-text-tertiary"
                  }`}>{(t.total_votes || 0).toLocaleString()}人</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 🏆 预测排行榜 ─── */}
        <div className="bg-white rounded-[12px] border border-gray-100 p-3 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-text-primary">🏆 预测排行榜</span>
            <Link href="/rank" className="text-[10px] text-brand-teal font-medium">查看全部 →</Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {(() => {
              const TOP3_LABELS = [
                { icon: "🥇", label: "准确率之王", sub: "命中率", color: "bg-purple-50", textColor: "text-purple-700", key: "accuracy" },
                { icon: "🥈", label: "赢豆之王", sub: "赢豆数", color: "bg-brand-gold-light/30", textColor: "text-brand-gold-dark", key: "earnings" },
                { icon: "🥉", label: "场次之王", sub: "参与场次", color: "bg-brand-teal-light/30", textColor: "text-brand-teal-dark", key: "bets" },
              ];
              const top3 = (rankData || []).slice(0, 3);
              return TOP3_LABELS.map((item, i) => {
                const entry = top3[i];
                return (
                <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] ${item.color}`}>
                  <span className="text-[16px] shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-primary">{item.label}</span>
                      <span className="text-[11px] font-semibold text-text-primary">{entry?.nickname || "—"}</span>
                    </div>
                    <div className="text-[9px] text-text-tertiary">{item.sub}</div>
                  </div>
                  <span className={`text-[13px] font-bold ${item.textColor}`}>
                    {entry ? (item.key === "accuracy" ? `${entry.accuracy}%` : item.key === "earnings" ? `${(entry.won || 0).toLocaleString()}🎮` : `${entry.total_bets}次`) : "暂无"}
                  </span>
                </div>
                );
              });
            })()}
          </div>
        </div>

        {/* ─── 品类 Tab ─── */}
        <div className="bg-white rounded-[10px] p-2.5 border border-gray-100 shadow-sm mb-3">
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <span key={cat.key} onClick={() => setActiveCat(cat.key)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-all select-none ${
                  activeCat === cat.key
                    ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white"
                    : "bg-gray-100 text-text-secondary hover:text-text-primary"
                }`}>
                {cat.label}
              </span>
            ))}
          </div>
        </div>

        {/* ─── 围观大厅 ─── */}
        {spectatorFeed.length > 0 && (
          <div className="bg-white rounded-[10px] px-3 py-2.5 mb-3 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-ping" />
              <span className="text-[11px] font-medium text-text-primary">围观大厅</span>
              <span className="text-[9px] text-text-tertiary">实时</span>
            </div>
            {spectatorFeed.map((t, i) => (
              <div key={t.id} className="text-[10px] text-text-secondary mt-1">
                <span className="font-medium text-brand-teal-dark">{spectatorNames[(t.id + i) % spectatorNames.length]}</span>
                {i === 0 ? (
                  <> 投了「{t.title}」选「{t.options?.[0] || t.option_a || "A"}」{(t.min_bet || 10)}豆 <span className="text-text-tertiary">刚刚</span></>
                ) : (
                  <> 发起了「{t.title}」<span className="text-text-tertiary">2分钟前</span></>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── 话题列表 ─── */}
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-[8px] p-4 shadow-[0_2px_8px_rgba(69,204,213,0.05)] border border-gray-200 animate-pulse">
                <div className="h-3.5 w-3/5 bg-gray-200 rounded mb-3" />
                <div className="h-2.5 w-full bg-gray-200 rounded mb-2" />
                <div className="h-2 w-full bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-[#9A9A9D] text-xs">
            <div className="text-[40px] mb-2">🏟</div>
            还没有PK话题
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-brand-teal font-medium">成为第一个发起PK的人</span>
              <span className="text-[10px] text-text-tertiary">· 已有 {stats.voters} 人在线</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map(pk => {
              const total = pk.total_votes || 1;
              const votes = pk.vote_counts || [pk.vote_a || 0, pk.vote_b || 0];
              const optA = pk.options?.[0] || pk.option_a || "A";
              const optB = pk.options?.[1] || pk.option_b || "B";
              const pctA = Math.min(100, Math.round((votes[0] / total) * 100));
              const pctB = Math.min(100, Math.round((votes[1] / total) * 100));
              const isConsumption = pk.category === "consumption" && pk.id < 0;
              const isCharity = pk.charity && pk.charity !== "none";
              const voteDiff = Math.abs(pctA - pctB);
              const heatLabel = pk.total_pool >= 5000 ? { icon: "👑", label: "大额奖池", color: "bg-amber-100 text-amber-700" }
                : total >= 20 && voteDiff <= 15 ? { icon: "🔥", label: "热门", color: "bg-red-50 text-brand-coral-dark" }
                : total >= 10 && voteDiff <= 25 ? { icon: "⚡", label: "激烈", color: "bg-orange-50 text-orange-600" }
                : null;

              // P0-1: 紧迫感 — 计算剩余时间标签
              const isUrgent = pk.time_remaining && pk.time_remaining < 3600;
              const isSoon = pk.time_remaining && pk.time_remaining < 10800;
              const scarcityLabel = isUrgent ? { icon: "⏰", label: "即将截止", color: "bg-brand-coral/10 text-brand-coral-dark" }
                : isSoon ? { icon: "⏳", label: "余3小时", color: "bg-brand-gold-light/50 text-brand-gold-dark" }
                : null;

              const isFirst = filtered.indexOf(pk) === 0;

              return (
              <div key={pk.id}
                className={`bg-white rounded-[10px] border shadow-sm active:scale-[0.98] transition-transform overflow-hidden ${cardBg(pk.category)}`}>

                {/* Card header: icon + title + tags */}
                <div className="px-3.5 pt-3 pb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] shrink-0">{catIcon(pk.category)}</span>
                    <span className="flex-1 text-[13px] font-semibold text-text-primary leading-snug line-clamp-1">{pk.title}</span>
                    {heatLabel && (
                      <span className={`shrink-0 px-1.5 py-[2px] rounded-[5px] text-[8px] font-medium ${heatLabel.color}`}>
                        {heatLabel.icon} {heatLabel.label}
                      </span>
                    )}
                    {/* P0-1: 紧迫感 — 倒数计时 */}
                    {scarcityLabel && (
                      <span className={`shrink-0 px-1.5 py-[2px] rounded-[5px] text-[8px] font-medium ${scarcityLabel.color}`}>
                        {scarcityLabel.icon} {scarcityLabel.label}
                      </span>
                    )}
                    {/* P1-1: 默认偏差 — 第一条推荐 */}
                    {isFirst && (
                      <span className="shrink-0 px-1.5 py-[2px] rounded-[5px] text-[8px] font-medium bg-brand-teal/10 text-brand-teal-dark">
                        🔥 今日必投
                      </span>
                    )}
                    {isCharity && (
                      <span className="shrink-0 text-[8px] bg-purple-50 text-purple-700 px-1.5 py-[2px] rounded-[5px] font-medium">❤️公益</span>
                    )}
                    {pk.topic_source === "agent" && (
                      <span className="shrink-0 text-[8px] bg-brand-teal/10 text-brand-teal-dark px-1.5 py-[2px] rounded-[5px] font-medium">🤖话题官</span>
                    )}
                    {/* 千人千面推荐标签 */}
                    {(() => {
                      if (pk.topic_source !== "agent") return null;
                      const matchScore = calcMatchScore(pk, interestProfile);
                      const label = getRecommendLabel(pk, matchScore);
                      if (!label) return null;
                      return (
                        <span className={`shrink-0 px-1.5 py-[2px] rounded-[5px] text-[8px] font-medium ${label.color}`}>
                          {label.icon} {label.text}
                        </span>
                      );
                    })()}
                    {isConsumption && (
                      <span className="shrink-0 text-[8px] bg-blue-50 text-blue-600 px-1.5 py-[2px] rounded-[5px] font-medium">消费对决</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-text-tertiary mt-0.5">
                    <span>👥 {(total).toLocaleString()}人</span>
                    <span>💰 奖池{(pk.total_pool || 0).toLocaleString()}豆</span>
                    <span>起投{pk.min_bet || 10}豆</span>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="px-3.5 pt-2 cursor-pointer" onClick={() => router.push(`/pk-hall/${pk.category}/${pk.id}`)}>
                  <div className="mb-1.5">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="font-medium text-brand-teal-dark truncate max-w-[140px]">{optA}</span>
                      <span className="text-text-tertiary shrink-0">{pctA}% · {votes[0]}豆</span>
                    </div>
                    <div className="h-[18px] bg-brand-teal/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-full transition-all" style={{width: `${pctA}%`}} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="font-medium text-brand-coral-dark truncate max-w-[140px]">{optB}</span>
                      <span className="text-text-tertiary shrink-0">{pctB}% · {votes[1]}豆</span>
                    </div>
                    <div className="h-[18px] bg-brand-coral/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-coral to-brand-coral-dark rounded-full transition-all" style={{width: `${pctB}%`}} />
                    </div>
                  </div>
                </div>

                {/* 站队区（仅Agent话题显示） */}
                {pk.topic_source === "agent" && (
                  <div className="px-3.5 pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] text-text-tertiary flex items-center gap-1">
                        🏴 站队 · <span className="text-brand-teal-dark">已站{pk.sideline_total || 0}人</span>
                      </span>
                      <span className="text-[8px] text-text-tertiary">
                        {sidelineStats.free_count < 3 ? `免费剩${3 - sidelineStats.free_count}次` : "10🎮/次"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {pk.options.slice(0, 2).map((opt, oi) => {
                        const sidelinePct = pk.sideline_total && pk.sideline_total > 0
                          ? Math.round(((pk.sideline_counts?.[oi] || 0) / pk.sideline_total) * 100) : 0;
                        return (
                          <button key={oi} onClick={() => handleSideline(pk, oi)} disabled={sidelineLoading === pk.id}
                            className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-[8px] text-[9px] border border-dashed transition-all active:scale-[0.97]
                              hover:bg-gray-50 disabled:opacity-50"
                            style={{ borderColor: oi === 0 ? 'rgba(69,204,213,0.3)' : 'rgba(242,113,82,0.3)' }}>
                            <span className="truncate max-w-[80px]">{opt}</span>
                            <span className="font-medium ml-1" style={{ color: oi === 0 ? '#0F6E56' : '#C04A2E' }}>
                              {sidelinePct}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-coral" style={{
                        width: `${pk.sideline_total && pk.sideline_total > 0 ? Math.round(((pk.sideline_counts?.[0] || 0) / pk.sideline_total) * 100) : 50}%`,
                      }} />
                    </div>
                  </div>
                )}

                {/* CTA row */}
                <div className="px-3.5 py-2.5 flex items-center justify-between border-t border-gray-50 mt-2.5">
                  <div className="flex items-center gap-2.5 text-[9px] text-text-tertiary">
                    <span className="cursor-pointer hover:text-brand-teal transition-colors">💬 {(pk.comment_count || 0)}</span>
                    <span onClick={async (e) => { e.stopPropagation(); await shareToWeChat(buildShareText(`⚔️ ${pk.title}`, `选【${optA}】VS【${optB}】· 💰奖池${(pk.total_pool || 0).toLocaleString()}豆·👥${(pk.total_votes || 0).toLocaleString()}人参与`, typeof window !== "undefined" ? `${window.location.origin}/pk-hall/${pk.category}/${pk.id}` : "")); setVoteMsg("✅ 已复制，去微信粘贴"); setTimeout(() => setVoteMsg(""), 2000); }} className="cursor-pointer hover:text-brand-gold-dark transition-colors">↗ 转发拉票</span>
                    {isCharity && <span className="text-purple-600">❤️输家80%捐赠</span>}
                  </div>
                  <button onClick={() => { trackPkParticipate(); trackInterest(pk.category, 3); router.push(`/pk-hall/${pk.category}/${pk.id}`); }}
                    className="text-[10px] px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white font-medium active:scale-95 transition-transform shadow-sm"
                    aria-label={`参与PK：${pk.title}`}>
                    参与 · {pk.min_bet || 10}豆
                  </button>
                </div>

                {/* 消费对决：附近门店标签 */}
                {isConsumption && (
                  <div className="px-3.5 pb-2.5 flex gap-2">
                    {[
                      { name: "沙县小吃(800m)", id: 1 }, { name: "兰州拉面(1.2km)", id: 2 },
                      { name: "华为授权店(500m)", id: 3 }, { name: "Apple Store(2km)", id: 4 },
                      { name: "老重庆火锅(300m)", id: 5 }, { name: "韩式烤肉(900m)", id: 6 },
                    ].slice((pk.id * -1 - 1) * 2, (pk.id * -1 - 1) * 2 + 2).map(s => (
                      <span key={s.id} className="text-[8px] bg-blue-50 text-blue-600 px-2 py-[2px] rounded-[4px] cursor-pointer hover:bg-blue-100 transition-colors">
                        🏪 {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* ─── CTA ─── */}
        <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[10px] p-3 text-center mb-2 mt-3 cursor-pointer active:scale-[0.98] transition-transform shadow-sm">
          <div className="text-[13px] font-semibold text-white" onClick={() => { if (!uid) { setShowLogin(true); return; } setShowCreator(true); }}>
            🔥 发起pk · 赢输家的豆-5%
          </div>
          <div className="text-[9px] text-white/70 mt-0.5">
            围观分享奖-5% · 门店奖-5% · 招商奖-3% · 公益PK输家80%捐赠
          </div>
        </div>

        {/* ─── 底部快捷入口 + P1-2: 段位徽章 ─── */}
        <div className="flex gap-2 mb-6">
          <Link href="/charity-fund"
            className="flex-1 bg-white rounded-[10px] border border-gray-100 p-2.5 text-center active:scale-[0.98] transition-transform shadow-sm">
            <div className="text-[10px] text-purple-600 font-medium">❤️ 公益资金池</div>
            <div className="text-[8px] text-text-tertiary mt-0.5">284,560豆</div>
          </Link>
          <Link href="/pk-rank"
            className="flex-1 bg-white rounded-[10px] border border-gray-100 p-2.5 text-center active:scale-[0.98] transition-transform shadow-sm">
            <div className="text-[10px] text-text-secondary font-medium">📊 我的战绩</div>
            <div className="text-[8px] text-text-tertiary mt-0.5">段位 · 胜率 · 排行</div>
          </Link>
          {/* 段位徽章 — 7段体系 */}
          <div className="flex-1 bg-white rounded-[10px] border border-gray-100 p-2.5 text-center shadow-sm">
            <TierBadge mode="tiny" />
            <div className="text-[8px] text-text-tertiary mt-0.5">已参与 {myPkCount} 场</div>
          </div>
        </div>

      </div>

      {/* ─── FAB按钮 ─── */}
      <div onClick={() => { if (!uid) { setShowLogin(true); return; } setShowCreator(true); }}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center justify-center flex-col text-xl font-light shadow-[0_4px_16px_rgba(69,204,213,0.35)] cursor-pointer z-[100] leading-none active:scale-90 transition-transform">
        <span className="-mt-0.5">+</span>
        <span className="text-[9px]">PK</span>
      </div>

      <style>{`
        @keyframes ping { 0%,100% { opacity:1;transform:scale(1) } 50%{opacity:.6;transform:scale(.8)} }
        @keyframes pulse { 0%,100% { opacity:1 } 50%{ opacity:.5 } }
      `}</style>

      {voteMsg && (
        <div className="fixed bottom-28 left-4 right-4 px-4 py-2 text-center text-[11px] font-medium bg-green-50 text-green-700 rounded-[8px] z-50 shadow-lg">
          {voteMsg}
        </div>
      )}

      {/* PKCreator 统一创建弹窗 */}
      <PKCreator
        open={showCreator}
        onClose={() => setShowCreator(false)}
        entryPoint="fab"
        onPublished={(topicId) => {
          setShowCreator(false);
          setVoteMsg("✅ PK话题发起成功！");
          if (topicId) {
            const cat = activeCat || 'general';
            setTimeout(() => router.push(`/pk-hall/${cat}/${topicId}`), 1000);
          } else {
            setTimeout(() => window.location.reload(), 1500);
          }
          setTimeout(() => setVoteMsg(""), 3000);
        }}
      />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
