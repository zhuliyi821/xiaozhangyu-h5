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

export default function CategoryPKHall() {
  const params = useParams();
  const router = useRouter();
  const category = (params?.category as string) || "";
  const cfg = catConfig[category] || catConfig.general;
  const { user } = useAuth();
  const uid = user?.uid || 0;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://h5.ws.hi.cn";

  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // 发起PK弹窗
  const [showCreate, setShowCreate] = useState(false);
  const [pkForm, setPkForm] = useState({ title: "", option_a: "", option_b: "", end_time: "tomorrow", min_bet: "10" });

  // 投注确认弹窗
  const [confirmVote, setConfirmVote] = useState<{
    pk: any; choice: string; betAmount: number; estimatedReward: number;
  } | null>(null);

  // 分享弹窗
  const [showShare, setShowShare] = useState(false);
  const [shareTopic, setShareTopic] = useState<any>(null);

  const loadTopics = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/pk?action=list&category=${category}`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setTopics(j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE, category]);

  useEffect(() => { loadTopics(); }, [loadTopics]);

  // ── 投票弹窗 ──
  const handleOptionClick = (pk: any, choice: string) => {
    if (!uid) { setShowLogin(true); return; }
    if (pk.status !== 1) { setVoteMsg("❌ 话题已结束"); setTimeout(() => setVoteMsg(""), 2000); return; }
    const bet = pk.min_bet || 10;
    const estReward = choice === 'A' ? (pk.estimated_reward_a || 0) : (pk.estimated_reward_b || 0);
    setConfirmVote({ pk, choice, betAmount: bet, estimatedReward: estReward });
  };

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
      if (j.code === 0) loadTopics();
    } catch { setVoteMsg("❌ 网络错误"); }
    setTimeout(() => setVoteMsg(""), 3000);
  };

  // ── 发起PK ──
  const handleCreatePK = async () => {
    if (!uid) return;
    if (!pkForm.title || !pkForm.option_a || !pkForm.option_b) return;
    let endTime = 0;
    if (pkForm.end_time === "1h") endTime = Math.floor(Date.now()/1000) + 3600;
    else if (pkForm.end_time === "3h") endTime = Math.floor(Date.now()/1000) + 10800;
    else if (pkForm.end_time === "tomorrow") endTime = Math.floor(Date.now()/1000) + 86400;
    else endTime = Math.floor(Date.now()/1000) + 604800;
    const minBet = parseInt(pkForm.min_bet) || 10;
    try {
      const res = await fetch(`${API_BASE}/api/pk?action=create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, title: pkForm.title, option_a: pkForm.option_a, option_b: pkForm.option_b, category, mode: "1v1", end_time: endTime, min_bet: minBet }),
      });
      const j = await res.json();
      if (j.code === 0) {
        setShowCreate(false);
        setPkForm({ title: "", option_a: "", option_b: "", end_time: "tomorrow", min_bet: "10" });
        loadTopics();
        setVoteMsg("✅ PK话题发起成功！");
      } else { alert(j.msg); }
    } catch { alert("创建失败"); }
    setTimeout(() => setVoteMsg(""), 2500);
  };

  // ── 分享 ──
  const handleShare = (topic: any) => {
    setShareTopic(topic);
    setShowShare(true);
  };
  const copyShareLink = () => {
    if (!shareTopic) return;
    const text = `⚔️ PK挑战：${shareTopic.title}\n选【${shareTopic.option_a}】VS【${shareTopic.option_b}】\n💰当前奖池：${shareTopic.total_pool || 0}豆\n来小章鱼AI趣预测参与PK！\nhttps://h5.ws.hi.cn/pk-hall/${category}/${shareTopic.id}`;
    navigator.clipboard.writeText(text).then(() => {
      setVoteMsg("✅ 分享链接已复制！");
      setShowShare(false);
      setTimeout(() => setVoteMsg(""), 2000);
    });
  };

  // ── 统计 ──
  const activeCount = topics.filter((t: any) => t.status === 1).length;
  const totalPool = topics.reduce((s: number, t: any) => s + (t.total_pool || 0), 0);
  const totalVotes = topics.reduce((s: number, t: any) => s + (t.total_votes || 0), 0);

  return (
    <main className="pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.color} px-6 pt-8 pb-7 relative overflow-hidden`}>
        <button onClick={() => router.push("/pk-hall")} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm z-10">
          ←
        </button>
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <div className="text-center relative z-10">
          <div className="text-3xl mb-1">{cfg.icon}</div>
          <h1 className="text-xl font-bold text-white">{cfg.name} PK厅</h1>
          <p className="text-xs text-white/80 mt-0.5">{cfg.desc}</p>
        </div>
        {/* 统计条 */}
        <div className="mx-2 mt-3 bg-white/15 backdrop-blur-sm rounded-[16px] p-3 flex justify-around relative z-10">
          <div className="text-center">
            <div className="text-sm font-bold text-white">{activeCount}</div>
            <div className="text-[9px] text-white/70">进行中</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-sm font-bold text-white">{totalPool}</div>
            <div className="text-[9px] text-white/70">总奖池💰</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-sm font-bold text-white">{totalVotes}</div>
            <div className="text-[9px] text-white/70">总参与</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-sm font-bold text-white">{topics.length}</div>
            <div className="text-[9px] text-white/70">话题</div>
          </div>
        </div>
      </div>

      {/* Tab: 进行中 | 已结算 */}
      {loading ? (
        <div className="mx-4 mt-3 space-y-2">
          {[1,2].map(i => <div key={i} className="h-28 bg-surface rounded-[20px] animate-pulse" />)}
        </div>
      ) : topics.length === 0 ? (
        <div className="mx-4 mt-3 bg-surface rounded-[20px] p-8 text-center border border-[rgba(69,204,213,0.08)]">
          <div className="text-3xl mb-2">{cfg.icon}</div>
          <div className="text-[11px] text-text-tertiary">还没有PK话题</div>
          <div className="text-[10px] text-text-tertiary mt-1">发起第一个PK吧！</div>
        </div>
      ) : (
        <div className="px-4 mt-3 space-y-2">
          {topics.map((p: any) => {
            const isActive = p.status === 1;
            const isSettled = p.status === 3;
            const isClosed = p.status === 2;
            return (
              <div key={p.id} onClick={() => router.push(`/pk-hall/${category}/${p.id}`)} className={`bg-surface rounded-[20px] p-4 shadow-sm border cursor-pointer active:scale-[0.98] transition-transform ${isSettled ? 'border-brand-gold/30' : isClosed ? 'border-gray-200/50' : 'border-[rgba(69,204,213,0.08)]'}`}>
                {/* 顶栏 */}
                <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary mb-2">
                  <span className={isSettled ? 'text-brand-gold font-medium' : isClosed ? 'text-red-400' : 'text-brand-teal'}>{p.status_label}</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary" />
                  <span>{p.time_label}</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary" />
                  <span>⚔️ {p.mode}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <span>💰</span>
                    <span className="font-semibold text-brand-gold">{p.total_pool || 0}</span>
                  </span>
                </div>

                <div className="text-[13px] font-semibold mb-1.5">{p.title}</div>

                {/* 选项预览 */}
                <div className="flex gap-2 text-[10px] text-text-tertiary mb-1.5">
                  <span className="px-2 py-0.5 rounded-[6px] bg-brand-coral/10 text-brand-coral font-medium">{p.option_a}</span>
                  <span>VS</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-brand-teal/10 text-brand-teal font-medium">{p.option_b}</span>
                </div>

                {/* 底栏 */}
                <div className="flex justify-between items-center text-[9px] text-text-tertiary">
                  <span>{p.creator_name} 发起 · 👁 {p.spectator_count || 0}围观 · 💬 {p.comment_count || 0}评论</span>
                  <span>{p.total_votes} 人参与</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 消息提示 */}
      {voteMsg && (
        <div className="fixed bottom-24 left-4 right-4 px-4 py-2 text-center text-[11px] font-medium bg-green-50 text-green-700 rounded-[12px] animate-fade-in z-50 shadow-lg">
          {voteMsg}
        </div>
      )}

      {/* 登录弹窗 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40">
        <div className="flex gap-3">
          <button onClick={() => { if (!uid) { setShowLogin(true); return; } setShowCreate(true); }}
            className="flex-1 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white py-3.5 rounded-[20px] text-sm font-semibold shadow-[0_4px_16px_rgba(242,182,49,0.3)] active:scale-[0.97] transition-transform">
            💰 发起PK
          </button>
          <button onClick={() => {
            const text = `⚔️ ${cfg.name} PK厅\n${cfg.desc}\n${activeCount}场进行中 · 💰总奖池${totalPool}豆\n来小章鱼AI趣预测参与PK！\nhttps://h5.ws.hi.cn/pk-hall/${category}`;
            navigator.clipboard.writeText(text).then(() => {
              setVoteMsg("✅ 分享链接已复制！");
              setTimeout(() => setVoteMsg(""), 2000);
            });
          }}
            className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center text-lg active:scale-90 transition-transform shrink-0">
            ↗
          </button>
        </div>
      </div>

      {/* ── 投注确认弹窗 ── */}
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
              <div className="text-text-secondary">选择投注数量</div>
              <div className="flex gap-2">
                {[10, 50, 100, 200].map(amt => (
                  <button key={amt}
                    onClick={() => setConfirmVote(prev => prev ? {...prev, betAmount: amt} : null)}
                    className={`flex-1 py-2 rounded-[10px] text-center text-[11px] font-medium transition-all ${confirmVote.betAmount === amt ? 'bg-brand-teal text-white shadow-sm' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'}`}>
                    {amt}豆
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min={confirmVote.pk.min_bet} max={10000}
                  value={confirmVote.betAmount}
                  onChange={e => setConfirmVote(prev => prev ? {...prev, betAmount: Math.max(confirmVote.pk.min_bet, parseInt(e.target.value) || confirmVote.pk.min_bet)} : null)}
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" placeholder="自定义" />
                <span className="text-[10px] text-text-tertiary whitespace-nowrap">游戏豆</span>
              </div>
              <div className="bg-brand-gold/5 rounded-[12px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">预估预测正确可赢得</div>
                <div className="text-lg font-bold text-brand-gold-dark">
                  +{(() => {
                    const pk = confirmVote.pk; const bet = confirmVote.betAmount; const choice = confirmVote.choice;
                    const myPool = choice === 'A' ? (pk.pool_a || 0) : (pk.pool_b || 0);
                    const oppPool = choice === 'A' ? (pk.pool_b || 0) : (pk.pool_a || 0);
                    if (oppPool <= 0) return bet;
                    const fee = Math.floor(oppPool * 20 / 100);
                    const rewardPool = oppPool - fee;
                    if (rewardPool <= 0) return bet;
                    const newMyPool = myPool + bet;
                    const est = Math.floor(bet / newMyPool * rewardPool);
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

      {/* ── 发起PK弹窗 ── */}
      {showCreate && (
        <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">💰 发起PK · {cfg.name}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="PK话题" value={pkForm.title} onChange={e => setPkForm({...pkForm, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
              <div className="flex gap-2">
                <input type="text" placeholder="选项A" value={pkForm.option_a} onChange={e => setPkForm({...pkForm, option_a: e.target.value})}
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
                <span className="self-center text-xs text-gray-400">VS</span>
                <input type="text" placeholder="选项B" value={pkForm.option_b} onChange={e => setPkForm({...pkForm, option_b: e.target.value})}
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
              </div>
              <div>
                <div className="text-[10px] text-text-tertiary mb-1.5">⏱ 截止时间</div>
                <div className="flex gap-2">
                  {[{label:"1小时",v:"1h"},{label:"3小时",v:"3h"},{label:"明天",v:"tomorrow"},{label:"7天",v:"7d"}].map(opt => (
                    <button key={opt.v} onClick={() => setPkForm({...pkForm, end_time: opt.v})}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${pkForm.end_time === opt.v ? 'bg-brand-teal text-white' : 'bg-gray-50 text-text-secondary'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-text-tertiary mb-1.5">💰 最低投注</div>
                <div className="flex gap-2">
                  {[10,50,100].map(amt => (
                    <button key={amt} onClick={() => setPkForm({...pkForm, min_bet: amt.toString()})}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${pkForm.min_bet === amt.toString() ? 'bg-brand-teal text-white' : 'bg-gray-50 text-text-secondary'}`}>
                      {amt}豆
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreatePK} disabled={!pkForm.title || !pkForm.option_a || !pkForm.option_b}
                className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[12px] text-xs font-medium disabled:opacity-50">
                发起PK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 分享弹窗 ── */}
      {showShare && shareTopic && (
        <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[340px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">↗ 分享此PK</h3>
            <div className="bg-gray-50 rounded-[14px] p-4 mb-4">
              <div className="text-xs font-medium mb-1">{shareTopic.title}</div>
              <div className="flex gap-2 text-[11px] mt-2">
                <span className="px-2 py-1 rounded-[6px] bg-brand-coral/10 text-brand-coral font-medium">{shareTopic.option_a}</span>
                <span className="self-center text-text-tertiary">VS</span>
                <span className="px-2 py-1 rounded-[6px] bg-brand-teal/10 text-brand-teal font-medium">{shareTopic.option_b}</span>
              </div>
              <div className="text-[10px] text-text-tertiary mt-2">💰 当前奖池：{shareTopic.total_pool || 0}豆</div>
            </div>
            <button onClick={copyShareLink}
              className="w-full py-3 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white rounded-[14px] text-sm font-medium">
              📋 复制分享文本
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
