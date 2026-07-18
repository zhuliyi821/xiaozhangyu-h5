"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { CATEGORY_CONFIG, PKTopic, APIResponse, AGENT_TOPICS_POOL, PKMode, CharityMode, PoolMode } from "../../types";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";

export default function PKRoomPage() {
  const params = useParams();
  const router = useRouter();
  const category = (params?.category as string) || "";
  const pkId = parseInt(params?.id as string || "0");
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
  const { user } = useAuth();
  const uid = user?.uid || 0;

  const [topic, setTopic] = useState<PKTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [confirmVote, setConfirmVote] = useState<{ choice: string; betAmount: number } | null>(null);
  const [showBindWx, setShowBindWx] = useState(false);
  const [bindMsg, setBindMsg] = useState("");
  const [userVote, setUserVote] = useState("");
  const [wallet, setWallet] = useState({ credit1: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && pkId) {
      setUserVote(localStorage.getItem(`pk_voted_${pkId}`) || "");
    }
  }, [pkId]);

  // 加载钱包余额
  useEffect(() => {
    if (!uid) return;
    fetch(`${API_BASE}/wallet_api.php?uid=${uid}&action=balance`)
      .then(r => r.json()).then(d => { if (d.code === 0) setWallet(d.data); }).catch(() => console.warn("请求 失败"));
  }, [uid]);

  const loadDetail = useCallback(() => {
    if (!pkId) return;
    
    // Agent话题（负ID）→ 从本地预设加载，不调后端API
    if (pkId < 0) {
      const agentIndex = -pkId - 1001;
      const preset = AGENT_TOPICS_POOL[agentIndex];
      if (preset) {
        const now = Math.floor(Date.now() / 1000);
        const agentTopic: PKTopic = {
          id: pkId,
          title: preset.title,
          category: preset.category,
          options: [...preset.options],
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
          end_time: now + preset.end_time_days * 86400,
          time_remaining: preset.end_time_days * 86400,
          time_label: `${preset.end_time_days}天后截止`,
          min_bet: preset.min_bet,
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
          topic_source: "agent",
          agent_source: preset.agent_source,
          settlement_type: preset.settlement_type,
          sideline_counts: [0, 0],
          sideline_total: 0,
          charity_from_sideline: 0,
        };
        setTopic(agentTopic);
        setLoading(false);
        return;
      } else {
        setError("话题不存在");
        setLoading(false);
        return;
      }
    }

    // 正常话题 → 调后端API
    fetch(`${API_BASE}/api/pk?action=detail&id=${pkId}`)
      .then(r => r.json())
      .then((j: APIResponse<PKTopic>) => { if (j.code === 0 && j.data) setTopic(j.data); else setError("加载失败"); })
      .catch(() => setError("网络不太给力"))
      .finally(() => setLoading(false));
  }, [pkId]);

  const loadComments = useCallback(() => {
    if (!pkId || pkId < 0) return; // Agent话题无评论
    fetch(`${API_BASE}/api/pk?action=comments&pk_id=${pkId}`)
      .then(r => r.json())
      .then((j: APIResponse<any[]>) => { if (j.code === 0) setComments(j.data || []); })
      .catch(() => console.warn("请求 失败"));
  }, [pkId]);

  useEffect(() => { loadDetail(); loadComments(); }, [loadDetail, loadComments]);

  // 30秒自动轮询刷新
  useEffect(() => {
    const timer = setInterval(() => { loadDetail(); loadComments(); }, 30000);
    return () => clearInterval(timer);
  }, [loadDetail, loadComments]);

  // 围观
  useEffect(() => {
    if (pkId && pkId > 0) fetch(`${API_BASE}/api/pk?action=spectate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pk_id: pkId }),
    }).catch(() => console.warn("请求 失败"));
  }, [pkId]);

  const handleOptionClick = (choice: string) => {
    if (!uid) { setShowLogin(true); return; }
    if (!topic || topic.status !== 1) { setVoteMsg("话题已结束"); setTimeout(() => setVoteMsg(""), 2000); return; }
    setConfirmVote({ choice, betAmount: topic.min_bet });
  };

  const executeVote = async () => {
    if (!confirmVote || !topic) return;
    const { choice, betAmount } = confirmVote;
    setConfirmVote(null);
    try {
      const res = await fetch(`${API_BASE}/api/pk?action=vote`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk_id: pkId, uid, option_choice: choice, bet_amount: betAmount }),
      });
      const j: APIResponse = await res.json();
      setVoteMsg(j.msg || (j.code === 0 ? `✅ 参与${betAmount}豆成功` : `❌ ${j.msg}`));
      if (j.code === 0) { localStorage.setItem(`pk_voted_${pkId}`, choice); setUserVote(choice); loadDetail(); loadComments(); setTimeout(() => setShowBindWx(true), 800); }
    } catch { setVoteMsg("❌ 网络错误"); }
    setTimeout(() => setVoteMsg(""), 3000);
  };

  const handleComment = async () => {
    if (!uid || !commentText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/pk?action=comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk_id: pkId, uid, content: commentText.trim() }),
      });
      const j: APIResponse = await res.json();
      if (j.code === 0) { setCommentText(""); loadComments(); }
      else setVoteMsg(j.msg || "评论失败");
    } catch { setVoteMsg("❌ 评论失败"); }
    setTimeout(() => setVoteMsg(""), 2000);
  };

  const handleInvite = () => {
    if (!topic) return;
    const text = buildShareText(
      "⚔️ PK挑战邀请",
      `「${topic.title}」选【${topic.option_a}】VS【${topic.option_b}】· 💰奖池${topic.total_pool}豆·👥${topic.total_votes}人参与`
    );
    shareToWeChat(text);
  };

  if (loading) return (
    <main className="pb-20">
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-7`}>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm" aria-label="返回上一页">←</button>
      </div>
      <div className="mx-4 mt-4 h-40 bg-white rounded-[8px] animate-pulse border border-gray-100" />
    </main>
  );

  if (error || !topic) return (
    <main className="pb-20">
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-7`}>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm" aria-label="返回上一页">←</button>
      </div>
      <div className="mx-4 mt-4 bg-white rounded-[8px] p-8 text-center border border-gray-100">
        <div className="text-2xl mb-2">🔍</div>
        <div className="text-[11px] text-gray-400">{error || "PK话题不存在"}</div>
        <button onClick={() => { setError(""); setLoading(true); loadDetail(); }} className="mt-2 text-xs text-brand-teal-dark font-medium" aria-label="重新加载">重试</button>
      </div>
    </main>
  );

  const isActive = topic.status === 1;
  const isSettled = topic.status === 3;
  const options = topic.options || [topic.option_a || "A", topic.option_b || "B"];
  const aVotes = topic.vote_a || topic.vote_counts?.[0] || 0;
  const bVotes = topic.vote_b || topic.vote_counts?.[1] || 0;
  const total = aVotes + bVotes;
  const aPct = total > 0 ? Math.round(aVotes / total * 100) : 50;
  const bPct = total > 0 ? Math.round(bVotes / total * 100) : 50;

  return (
    <main className="pb-28">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-6 relative overflow-hidden`}>
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm z-10">←</button>
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)]" />
        <div className="text-center relative z-10 pt-4">
          <div className="text-xs text-white/70">{cfg.icon} {cfg.name} PK厅</div>
          <h1 className="text-base font-bold text-white mt-1 leading-snug line-clamp-2">{topic.title}</h1>
        </div>
      </div>

      {/* 状态条 */}
      <div className="mx-4 -mt-3 relative z-20 bg-white rounded-[8px] p-3 shadow-sm border border-gray-100 flex justify-around text-center">
        <div><div className="text-[10px] text-gray-400">状态</div><div className={`text-[11px] font-medium ${isSettled ? 'text-brand-gold-dark' : isActive ? 'text-green-600' : 'text-red-400'}`}>{topic.status_label}</div></div>
        <div className="w-px bg-gray-100" />
        <div><div className="text-[10px] text-gray-400">倒计时</div><div className="text-[11px] font-medium">{topic.time_label}</div></div>
        <div className="w-px bg-gray-100" />
        <div><div className="text-[10px] text-gray-400">围观</div><div className="text-[11px] font-medium">{(topic.spectator_count || 0) + 1}人</div></div>
        <div className="w-px bg-gray-100" />
        <div><div className="text-[10px] text-gray-400">奖池💰</div><div className="text-[11px] font-bold text-brand-gold">{topic.total_pool}</div></div>
      </div>

      {/* PK对战卡片 */}
      <div className="mx-4 mt-3 bg-white rounded-[8px] p-5 shadow-sm border border-gray-100">
          <div className={`rounded-[8px] p-4 text-center ${isSettled && topic.winner === 'A' ? 'bg-amber-50 border-2 border-amber-400' : userVote === 'A' ? 'bg-brand-teal/20 border-2 border-brand-teal' : 'bg-brand-teal/10 border border-brand-teal/20'}`}>
          <div className={`text-sm font-bold ${isSettled && topic.winner === 'A' ? 'text-brand-gold-dark' : 'text-brand-teal-dark'}`}>
            {options[0] || topic.option_a} {isSettled && topic.winner === 'A' && '🏆'} {userVote === 'A' && '✅'}
          </div>
          {isActive && (
            <button onClick={() => handleOptionClick('A')} disabled={!!userVote}
              className="mt-2 px-5 py-1.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[10px] text-[11px] font-medium active:scale-95 transition-transform disabled:opacity-40">
              {userVote === 'A' ? '✅ 已投' : `🎮投${topic.min_bet}豆 · 赢⛏️`}
            </button>
          )}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-full transition-all" style={{ width: `${aPct}%` }} />
            </div>
            <span className="font-medium">{aVotes}票 ({aPct}%)</span>
          </div>
          <div className="text-[9px] text-gray-400 mt-1">💰 奖池 {topic.pool_a}豆</div>
        </div>

        <div className="text-center my-2">
          <span className="inline-block w-8 h-8 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center mx-auto">VS</span>
        </div>

        <div className={`rounded-[8px] p-4 text-center ${isSettled && topic.winner === 'B' ? 'bg-amber-50 border-2 border-amber-400' : userVote === 'B' ? 'bg-brand-coral/20 border-2 border-brand-coral' : 'bg-brand-coral/10 border border-brand-coral/10'}`}>
          <div className={`text-sm font-bold ${isSettled && topic.winner === 'B' ? 'text-brand-gold-dark' : 'text-brand-coral-dark'}`}>
            {topic.option_b} {isSettled && topic.winner === 'B' && '🏆'} {userVote === 'B' && '✅'}
          </div>
          {isActive && (
            <button onClick={() => handleOptionClick('B')} disabled={!!userVote}
              className="mt-2 px-5 py-1.5 bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white rounded-[10px] text-[11px] font-medium active:scale-95 transition-transform disabled:opacity-40">
              {userVote === 'B' ? '✅ 已投' : `🎮投${topic.min_bet}豆 · 赢⛏️`}
            </button>
          )}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-coral to-brand-coral-dark rounded-full transition-all" style={{ width: `${bPct}%` }} />
            </div>
            <span className="font-medium">{bVotes}票 ({bPct}%)</span>
          </div>
          <div className="text-[9px] text-gray-400 mt-1">💰 奖池 {topic.pool_b}豆</div>
        </div>

        <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-400">
          <span>{topic.creator_name} 发起</span>
          <span>{total} 人参与</span>
          <button onClick={handleInvite} className="text-brand-teal-dark font-medium">↗ 邀请好友</button>
        </div>

        {isActive && (
          <div className="mt-2 bg-gray-50 rounded-[10px] px-3 py-2 text-[9px] text-gray-400 text-center">
            💡 消耗🎮{topic.min_bet}豆：选[{topic.option_a}]赢⛏️{topic.estimated_reward_a}石 · 选[{topic.option_b}]赢⛏️{topic.estimated_reward_b}石
          </div>
        )}
      </div>

      {/* 评论区 */}
      <div className="mx-4 mt-3 bg-white rounded-[8px] p-4 shadow-sm border border-gray-100">
        <div className="text-[11px] font-semibold mb-3">💬 评论 ({comments.length})</div>
        <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3">
          {comments.length === 0 ? (
            <div className="text-center text-[10px] text-gray-400 py-4">暂无评论，来说两句吧</div>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-[10px] text-white shrink-0">
                  {c.nickname?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium">{c.nickname}</span>
                    <span className="text-[8px] text-gray-400">{c.created_at?.substring(11, 16) || ""}</span>
                  </div>
                  <div className="text-[11px] mt-0.5">{c.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {uid ? (
          <div className="flex gap-2">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="说点什么..."
              className="flex-1 px-3 py-2 bg-gray-50 rounded-[8px] text-[11px] outline-none focus:ring-2 focus:ring-brand-teal/30" />
            <button onClick={handleComment} disabled={!commentText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-[11px] font-medium disabled:opacity-50">发送</button>
          </div>
        ) : (
          <div className="text-center text-[10px] text-gray-400 py-2">登录后可以参与评论</div>
        )}
      </div>

      {voteMsg && (
        <div className="fixed bottom-28 left-4 right-4 px-4 py-2 text-center text-[11px] font-medium bg-green-50 text-green-700 rounded-[8px] z-50 shadow-lg">
          {voteMsg}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40">
        <div className="flex gap-3">
          <button onClick={() => handleOptionClick('A')} disabled={!isActive || !!userVote}
            className={`flex-1 py-3.5 rounded-[8px] text-xs font-semibold active:scale-[0.97] transition-transform disabled:opacity-40 shadow-sm ${userVote === 'A' ? 'bg-brand-teal text-white border-2 border-brand-teal' : 'bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white'}`}>
            {userVote === 'A' ? `✅ ${topic.option_a?.substring(0, 6)}` : topic.option_a?.substring(0, 6)}
          </button>
          <button onClick={handleInvite}
            className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center text-lg active:scale-90 transition-transform shrink-0">↗</button>
          <button onClick={() => handleOptionClick('B')} disabled={!isActive || !!userVote}
            className={`flex-1 py-3.5 rounded-[8px] text-xs font-semibold active:scale-[0.97] transition-transform disabled:opacity-40 shadow-sm ${userVote === 'B' ? 'bg-brand-coral text-white border-2 border-brand-coral' : 'bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white'}`}>
            {userVote === 'B' ? `✅ ${topic.option_b?.substring(0, 6)}` : topic.option_b?.substring(0, 6)}
          </button>
        </div>
      </div>

      {confirmVote && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setConfirmVote(null)}>
          <div className="bg-white rounded-[8px] w-full max-w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">🎯 参与确认</h3>
            {uid && <div className="text-[10px] text-text-tertiary mb-3 flex items-center gap-1"><span>🎮 当前余额</span><span className="text-brand-teal-dark font-semibold">{wallet.credit1.toLocaleString()}豆</span></div>}
            <div className="space-y-2.5 text-xs">
              <div className="bg-gray-50 rounded-[8px] p-3">
                <div className="font-medium mb-1">{topic.title}</div>
                <span className="px-2 py-0.5 rounded-[6px] bg-brand-teal/10 text-brand-teal-dark font-medium">
                  {confirmVote.choice === 'A' ? topic.option_a : topic.option_b}
                </span>
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 200].map(amt => (
                  <button key={amt} onClick={() => setConfirmVote(v => v ? {...v, betAmount: amt} : null)}
                    className={`flex-1 py-2 rounded-[10px] text-center text-[11px] font-medium transition-all ${confirmVote.betAmount === amt ? 'bg-brand-teal text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {amt}豆
                  </button>
                ))}
              </div>
              <div className="bg-amber-50 rounded-[8px] p-3 text-center">
                <div className="text-[10px] text-gray-400">预估正确可赢得</div>
                <div className="text-lg font-bold text-brand-gold-dark">
                  +{(() => {
                    const bet = confirmVote.betAmount; const ch = confirmVote.choice;
                    const myP = ch === 'A' ? (topic.pool_a ?? 0) : (topic.pool_b ?? 0);
                    const oppP = ch === 'A' ? (topic.pool_b ?? 0) : (topic.pool_a ?? 0);
                    if (oppP <= 0) return bet;
                    const rp = oppP - Math.floor(oppP * topic.platform_fee_ratio / 100);
                    return rp <= 0 ? bet : Math.floor(bet / (myP + bet) * rp) + bet;
                  })()} 豆 <span className="text-[10px] text-gray-400 font-normal">(含本金)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmVote(null)} className="flex-1 py-2.5 bg-gray-100 rounded-[8px] text-xs font-medium">取消</button>
              <button onClick={executeVote} className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-xs font-medium">
                确认 · 消耗🎮{confirmVote.betAmount}豆 · 赢⛏️水晶石
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* ─── 参与成功→绑定企微引导 ─── */}
      {showBindWx && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowBindWx(false)}>
          <div className="bg-white rounded-[8px] w-full max-w-[340px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-sm font-bold">参与成功！</div>
              <div className="text-[11px] text-gray-400 mt-1">结果一出马上通知你</div>
            </div>
            <div className="bg-brand-teal/10 rounded-[8px] p-3 mb-3 text-center">
              <div className="text-[10px] text-gray-400">当前参与</div>
              <div className="text-xs font-bold text-brand-teal-dark">{confirmVote?.choice === 'A' ? topic?.option_a : topic?.option_b}</div>
              <div className="text-[20px] font-bold text-brand-teal-dark">{confirmVote?.betAmount || 0}豆</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBindWx(false)}
                className="flex-1 py-2.5 bg-gray-100 rounded-[8px] text-xs font-medium text-gray-500">下次再说</button>
              <button onClick={async () => {
                  try {
                    const r = await fetch(`${API_BASE}/api/pk?action=bind_identity`, {
                      method:"POST",headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({uid,source:"h5",external_id:`user_${uid}`})
                    });
                    const j = await r.json();
                    setBindMsg(j.code === 0 ? "✅ 绑定成功，后续结果将推送到企微" : `❌ ${j.msg}`);
                    if (j.code === 0) setTimeout(() => setShowBindWx(false), 2000);
                  } catch { setBindMsg("❌ 网络错误"); }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-xs font-semibold shadow-sm">
                📱 添加企微通知
              </button>
            </div>
            {bindMsg && <div className="text-center text-[11px] mt-2" style={{color: bindMsg.includes("✅") ? "#2AA8B0" : "#F27152"}}>{bindMsg}</div>}
          </div>
        </div>
      )}

      {/* ─── 到店核销LBS卡片 ─── */}
      {topic && (
        <div className="mx-4 mt-3 bg-white rounded-[8px] p-4 shadow-sm border border-gray-100">
          <div className="text-[11px] font-semibold mb-3">📍 附近门店</div>
          <div className="bg-gradient-to-r from-brand-teal-light/30 to-brand-gold-light/30 rounded-[8px] p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[8px] bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-white text-xl shrink-0">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">小章鱼体彩参与站</div>
              <div className="text-[10px] text-gray-400 mt-0.5">距您约 800m</div>
              <div className="text-[10px] text-brand-teal-dark font-medium mt-1">🎁 到店出示PK战绩 → 送200豆</div>
            </div>
            <button onClick={() => {
              shareToWeChat("小章鱼体彩参与站 - 地址：门店详情页\n到店出示PK战绩 → 送200豆");
            }}
              className="px-3 py-1.5 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white rounded-[10px] text-[10px] font-medium shrink-0">
              📋 复制门店信息
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
