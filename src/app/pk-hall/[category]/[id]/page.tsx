"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const catConfig: Record<string, { name: string; icon: string; color: string; desc: string }> = {
  sports:  { name: "体育赛事", icon: "⚽", color: "from-brand-coral to-brand-coral-dark", desc: "球赛·电竞·田径" },
  social:  { name: "社会热点", icon: "🌐", color: "from-brand-teal to-brand-teal-dark", desc: "民生·经济·科技" },
  event:   { name: "突发事件", icon: "⚡", color: "from-brand-gold to-brand-gold-dark", desc: "快讯·突发·新发现" },
  general: { name: "一言不合", icon: "💬", color: "from-purple-400 to-purple-600", desc: "日常·娱乐·随便聊" },
};

export default function PKRoomPage() {
  const params = useParams();
  const router = useRouter();
  const category = (params?.category as string) || "";
  const pkId = parseInt(params?.id as string || "0");
  const cfg = catConfig[category] || catConfig.general;
  const { user } = useAuth();
  const uid = user?.uid || 0;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";

  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // 投注确认弹窗
  const [confirmVote, setConfirmVote] = useState<{
    choice: string; betAmount: number; estimatedReward: number;
  } | null>(null);

  const loadDetail = useCallback(() => {
    if (!pkId) return;
    fetch(`${API_BASE}/api/pk?action=detail&id=${pkId}`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setTopic(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE, pkId]);

  const loadComments = useCallback(() => {
    fetch(`${API_BASE}/api/pk?action=comments&pk_id=${pkId}`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setComments(j.data || []); })
      .catch(() => {});
  }, [API_BASE, pkId]);

  useEffect(() => { loadDetail(); loadComments(); }, [loadDetail, loadComments]);

  // 围观一次
  useEffect(() => {
    if (pkId) {
      fetch(`${API_BASE}/api/pk?action=spectate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk_id: pkId }),
      }).catch(() => {});
    }
  }, [pkId, API_BASE]);

  // 投票
  const handleOptionClick = (choice: string) => {
    if (!uid) { setShowLogin(true); return; }
    if (!topic || topic.status !== 1) { setVoteMsg("话题已结束"); setTimeout(() => setVoteMsg(""), 2000); return; }
    const bet = topic.min_bet || 10;
    const est = choice === 'A' ? (topic.estimated_reward_a || 0) : (topic.estimated_reward_b || 0);
    setConfirmVote({ choice, betAmount: bet, estimatedReward: est });
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
      const j = await res.json();
      setVoteMsg(j.msg || (j.code === 0 ? `✅ 投注${betAmount}豆成功` : `❌ ${j.msg}`));
      if (j.code === 0) { loadDetail(); loadComments(); }
    } catch { setVoteMsg("❌ 网络错误"); }
    setTimeout(() => setVoteMsg(""), 3000);
  };

  // 评论
  const handleComment = async () => {
    if (!uid || !commentText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/pk?action=comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk_id: pkId, uid, content: commentText.trim() }),
      });
      const j = await res.json();
      if (j.code === 0) { setCommentText(""); loadComments(); }
      else { setVoteMsg(j.msg); setTimeout(() => setVoteMsg(""), 2000); }
    } catch { setVoteMsg("❌ 评论失败"); setTimeout(() => setVoteMsg(""), 2000); }
  };

  // 邀请
  const handleInvite = () => {
    if (!topic) return;
    const text = `⚔️ PK挑战邀请\n\n「${topic.title}」\n选【${topic.option_a}】VS【${topic.option_b}】\n💰当前奖池：${topic.total_pool || 0}豆 · 👥${topic.total_votes || 0}人参与\n\n来小章鱼AI趣预测站队投票！\nhttps://h5.ws.hi.cn/pk-hall/${category}/${pkId}`;
    navigator.clipboard.writeText(text).then(() => {
      setVoteMsg("✅ 邀请链接已复制！");
      setTimeout(() => setVoteMsg(""), 2000);
    });
  };

  if (loading) return (
    <main className="pb-20">
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-7`}>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">←</button>
      </div>
      <div className="mx-4 mt-4 h-40 bg-surface rounded-[20px] animate-pulse" />
    </main>
  );

  if (!topic) return (
    <main className="pb-20">
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-7`}>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">←</button>
      </div>
      <div className="mx-4 mt-4 bg-surface rounded-[20px] p-8 text-center">
        <div className="text-2xl mb-2">🔍</div>
        <div className="text-[11px] text-text-tertiary">PK话题不存在</div>
      </div>
    </main>
  );

  const isActive = topic.status === 1;
  const isSettled = topic.status === 3;
  const aVotes = topic.vote_a || 0;
  const bVotes = topic.vote_b || 0;
  const total = aVotes + bVotes;
  const aPct = total > 0 ? Math.round(aVotes / total * 100) : 50;
  const bPct = total > 0 ? Math.round(bVotes / total * 100) : 50;

  return (
    <main className="pb-28">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-6 relative overflow-hidden`}>
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm z-10">←</button>
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <div className="text-center relative z-10 pt-4">
          <div className="text-xs text-white/70">{cfg.icon} {cfg.name} PK厅</div>
          <h1 className="text-base font-bold text-white mt-1 leading-snug line-clamp-2">{topic.title}</h1>
        </div>
      </div>

      {/* 状态条 */}
      <div className="mx-4 -mt-3 relative z-20 bg-surface rounded-[16px] p-3 shadow-sm border border-[rgba(69,204,213,0.08)] flex justify-around text-center">
        <div>
          <div className="text-[10px] text-text-tertiary">状态</div>
          <div className={`text-[11px] font-medium ${isSettled ? 'text-brand-gold' : isActive ? 'text-green-600' : 'text-red-400'}`}>{topic.status_label}</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <div className="text-[10px] text-text-tertiary">倒计时</div>
          <div className="text-[11px] font-medium">{topic.time_label}</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <div className="text-[10px] text-text-tertiary">围观</div>
          <div className="text-[11px] font-medium">{(topic.spectator_count || 0) + 1}人</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <div className="text-[10px] text-text-tertiary">奖池💰</div>
          <div className="text-[11px] font-bold text-brand-gold">{topic.total_pool || 0}</div>
        </div>
      </div>

      {/* PK对战卡片 */}
      <div className="mx-4 mt-3 bg-surface rounded-[20px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
        {/* 选项A */}
        <div className={`rounded-[16px] p-4 text-center ${isSettled && topic.winner === 'A' ? 'bg-brand-gold/10 border-2 border-brand-gold' : 'bg-brand-coral/5 border border-brand-coral/10'}`}>
          <div className={`text-sm font-bold ${isSettled && topic.winner === 'A' ? 'text-brand-gold-dark' : 'text-brand-coral-dark'}`}>
            {topic.option_a} {isSettled && topic.winner === 'A' && '🏆'}
          </div>
          {isActive && (
            <button onClick={() => handleOptionClick('A')} className="mt-2 px-5 py-1.5 bg-brand-coral text-white rounded-[10px] text-[11px] font-medium active:scale-95 transition-transform">
              投{topic.min_bet}豆支持
            </button>
          )}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-tertiary">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-coral rounded-full transition-all" style={{ width: `${aPct}%` }} />
            </div>
            <span className="font-medium">{aVotes}票 ({aPct}%)</span>
          </div>
          <div className="text-[9px] text-text-tertiary mt-1">💰 奖池 {topic.pool_a || 0}豆</div>
        </div>

        {/* VS */}
        <div className="text-center my-2">
          <span className="inline-block w-8 h-8 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center mx-auto">VS</span>
        </div>

        {/* 选项B */}
        <div className={`rounded-[16px] p-4 text-center ${isSettled && topic.winner === 'B' ? 'bg-brand-gold/10 border-2 border-brand-gold' : 'bg-brand-teal/5 border border-brand-teal/10'}`}>
          <div className={`text-sm font-bold ${isSettled && topic.winner === 'B' ? 'text-brand-gold-dark' : 'text-brand-teal-dark'}`}>
            {topic.option_b} {isSettled && topic.winner === 'B' && '🏆'}
          </div>
          {isActive && (
            <button onClick={() => handleOptionClick('B')} className="mt-2 px-5 py-1.5 bg-brand-teal text-white rounded-[10px] text-[11px] font-medium active:scale-95 transition-transform">
              投{topic.min_bet}豆支持
            </button>
          )}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-tertiary">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${bPct}%` }} />
            </div>
            <span className="font-medium">{bVotes}票 ({bPct}%)</span>
          </div>
          <div className="text-[9px] text-text-tertiary mt-1">💰 奖池 {topic.pool_b || 0}豆</div>
        </div>

        {/* 发起信息 */}
        <div className="flex justify-center gap-4 mt-3 text-[10px] text-text-tertiary">
          <span>{topic.creator_name} 发起</span>
          <span>{total} 人参与</span>
          <button onClick={handleInvite} className="text-brand-teal font-medium">↗ 邀请好友</button>
        </div>

        {/* 预估收益提示(进行中) */}
        {isActive && (
          <div className="mt-2 bg-bg rounded-[10px] px-3 py-2 text-[9px] text-text-tertiary text-center">
            💡 投{topic.min_bet}豆：选[{topic.option_a}]预估赢{topic.estimated_reward_a}豆 · 选[{topic.option_b}]预估赢{topic.estimated_reward_b}豆
          </div>
        )}
      </div>

      {/* 评论区 */}
      <div className="mx-4 mt-3 bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)]">
        <div className="text-[11px] font-semibold mb-3">💬 评论 ({comments.length})</div>

        {/* 评论列表 */}
        <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3">
          {comments.length === 0 ? (
            <div className="text-center text-[10px] text-text-tertiary py-4">暂无评论，来说两句吧</div>
          ) : (
            comments.map((c: any, i: number) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center text-[10px] text-white shrink-0">
                  {c.nickname?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium">{c.nickname}</span>
                    <span className="text-[8px] text-text-tertiary">{c.created_at?.substring(11, 16) || ""}</span>
                  </div>
                  <div className="text-[11px] text-text-primary mt-0.5">{c.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 输入框 */}
        {uid ? (
          <div className="flex gap-2">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="说点什么..."
              className="flex-1 px-3 py-2 bg-gray-50 rounded-[12px] text-[11px] outline-none focus:ring-2 focus:ring-brand-teal/30" />
            <button onClick={handleComment} disabled={!commentText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[12px] text-[11px] font-medium disabled:opacity-50">
              发送
            </button>
          </div>
        ) : (
          <div className="text-center text-[10px] text-text-tertiary py-2">登录后可以参与评论</div>
        )}
      </div>

      {/* 消息提示 */}
      {voteMsg && (
        <div className="fixed bottom-28 left-4 right-4 px-4 py-2 text-center text-[11px] font-medium bg-green-50 text-green-700 rounded-[12px] animate-fade-in z-50 shadow-lg">
          {voteMsg}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40">
        <div className="flex gap-3">
          <button onClick={() => handleOptionClick('A')} disabled={!isActive}
            className="flex-1 bg-brand-coral text-white py-3.5 rounded-[20px] text-xs font-semibold active:scale-[0.97] transition-transform disabled:opacity-40 shadow-[0_4px_12px_rgba(242,113,82,0.25)]">
            {topic.option_a?.length > 6 ? topic.option_a?.substring(0, 6) + '..' : topic.option_a}
          </button>
          <button onClick={handleInvite}
            className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center text-lg active:scale-90 transition-transform shrink-0">
            ↗
          </button>
          <button onClick={() => handleOptionClick('B')} disabled={!isActive}
            className="flex-1 bg-brand-teal text-white py-3.5 rounded-[20px] text-xs font-semibold active:scale-[0.97] transition-transform disabled:opacity-40 shadow-[0_4px_12px_rgba(69,204,213,0.25)]">
            {topic.option_b?.length > 6 ? topic.option_b?.substring(0, 6) + '..' : topic.option_b}
          </button>
        </div>
      </div>

      {/* 投注确认弹窗 */}
      {confirmVote && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setConfirmVote(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">🎯 投注确认</h3>
            <div className="space-y-2.5 text-xs">
              <div className="bg-gray-50 rounded-[12px] p-3">
                <div className="font-medium text-text-primary mb-1">{topic.title}</div>
                <span className="px-2 py-0.5 rounded-[6px] bg-brand-teal/10 text-brand-teal font-medium">
                  {confirmVote.choice === 'A' ? topic.option_a : topic.option_b}
                </span>
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 200].map(amt => (
                  <button key={amt} onClick={() => setConfirmVote(prev => prev ? {...prev, betAmount: amt} : null)}
                    className={`flex-1 py-2 rounded-[10px] text-center text-[11px] font-medium transition-all ${confirmVote.betAmount === amt ? 'bg-brand-teal text-white shadow-sm' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'}`}>
                    {amt}豆
                  </button>
                ))}
              </div>
              <div className="bg-brand-gold/5 rounded-[12px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">预估正确可赢得</div>
                <div className="text-lg font-bold text-brand-gold-dark">
                  +{(() => {
                    const bet = confirmVote.betAmount; const ch = confirmVote.choice;
                    const myP = ch === 'A' ? (topic.pool_a || 0) : (topic.pool_b || 0);
                    const oppP = ch === 'A' ? (topic.pool_b || 0) : (topic.pool_a || 0);
                    if (oppP <= 0) return bet;
                    const fee = Math.floor(oppP * 20 / 100);
                    const rp = oppP - fee;
                    if (rp <= 0) return bet;
                    const est = Math.floor(bet / (myP + bet) * rp);
                    return est + bet;
                  })()} 豆 <span className="text-[10px] text-text-tertiary font-normal">(含本金)</span>
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

      {/* 登录弹窗 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
