"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import { ArrowLeft, Users, Coins, Gift, Share2, Copy, Check, ChevronDown } from "lucide-react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", bg: "#F5F6FA", green: "#10B981", purple: "#8B5CF6" };

interface InviteRecord {
  uid: number;
  nickname: string;
  created_at: string;
  reward: number;
  status: string;
}

interface InviteData {
  total_invited: number;
  total_reward: number;
  invited_list: InviteRecord[];
  demo?: InviteRecord[];
}

interface Achievement {
  id: string;
  label: string;
  icon: string;
  target: number;
  reward: number;
  desc: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "social1", label: "社交达人", icon: "🤝", target: 1, reward: 1000, desc: "邀请1位好友" },
  { id: "social2", label: "人气之星", icon: "⭐", target: 5, reward: 3000, desc: "邀请5位好友" },
  { id: "social3", label: "社交之王", icon: "👑", target: 10, reward: 8000, desc: "邀请10位好友" },
];

export default function InvitePage() {
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [data, setData] = useState<InviteData | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [showHistory, setShowHistory] = useState(false);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [claimMsg, setClaimMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const uid = user?.uid || 0;
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn"}?ref=${uid}`;

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/invite/stats?action=stats&uid=${uid}`);
      const d = await r.json();
      if (d.code === 0) setData(d.data);
    } catch {}
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (!authLoading && user) fetchStats();
    else if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, fetchStats]);

  const handleShareWeChat = () => {
    if (!uid) { setShowLogin(true); return; }
    const text = buildShareText("小章鱼 · AI趣预测", `邀请你一起玩！注册即送 150,000 游戏豆 🎉`, inviteUrl);
    shareToWeChat(text);
  };

  const handleCopyLink = () => {
    if (!uid) { setShowLogin(true); return; }
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    });
  };

  const handleClaim = async (id: string, reward: number) => {
    try {
      await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, action: "settle", win_amount: reward, lottery: "task" }),
      });
      setClaimed(prev => [...prev, id]);
      setClaimMsg(`✅ 领取成功 +${reward}🎮`);
      setTimeout(() => setClaimMsg(""), 2500);
    } catch {}
  };

  const totalInvited = data?.total_invited || 0;
  const list = data?.invited_list && data.invited_list.length > 0 ? data.invited_list : (data?.demo || []);

  return (
    <main className="pb-20 min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest px-5 pt-4 pb-6 rounded-b-[28px] shadow-soft relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(69,204,213,0.15),transparent_70%)] blur-[16px]" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-[15px] font-medium text-white">邀请好友</h1>
          </div>
          <div className="bg-white/15 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] text-white/80 flex items-center gap-1">
            <Users className="w-3 h-3" />
            已邀请 {totalInvited} 人
          </div>
        </div>
        {/* Reward highlight */}
        <div className="text-center mt-3 pt-2 border-t border-white/10 relative z-10">
          <div className="text-[22px] font-bold text-brand-gold tracking-[1px]">{data?.total_reward?.toLocaleString() || 0} 🎮</div>
          <div className="text-[9px] text-white/50">累计获得邀请奖励</div>
        </div>
      </div>

      {!uid ? (
        <div className="px-4 mt-6">
          <div className="bg-surface rounded-[12px] p-6 text-center border border-border-tertiary">
            <div className="text-4xl mb-3">🎁</div>
            <div className="text-[13px] font-medium mb-1">登录后邀请好友</div>
            <div className="text-[11px] text-text-tertiary mb-4">每邀请1人得 1,000 游戏豆</div>
            <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[13px] font-medium active:scale-95 transition-transform shadow-sm">
              立即登录
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 -mt-3 relative z-20 space-y-3">
          {/* Share buttons */}
          <div className="bg-surface rounded-[12px] p-4 border border-border-tertiary shadow-sm">
            <div className="text-[13px] font-medium mb-3">分享邀请链接</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={handleShareWeChat}
                className="flex flex-col items-center gap-1 py-4 rounded-[10px] bg-gradient-to-r from-[#07C160]/10 to-[#07C160]/5 border border-[#07C160]/20 active:scale-95 transition-transform">
                <Share2 className="w-5 h-5 text-[#07C160]" />
                <span className="text-[11px] font-medium text-[#07C160]">微信好友</span>
                <span className="text-[9px] text-text-tertiary">原生分享卡片</span>
              </button>
              <button onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 py-4 rounded-[10px] bg-brand-teal-light/20 border border-brand-teal/20 active:scale-95 transition-transform">
                {copyStatus === "copied" ? <Check className="w-5 h-5 text-brand-teal-dark" /> : <Copy className="w-5 h-5 text-brand-teal-dark" />}
                <span className="text-[11px] font-medium text-brand-teal-dark">{copyStatus === "copied" ? "已复制" : "复制链接"}</span>
                <span className="text-[9px] text-text-tertiary">分享给任意好友</span>
              </button>
            </div>
            <div className="text-[10px] text-text-tertiary text-center bg-bg rounded-[8px] py-2 px-3">
              被邀请人注册即送 <strong className="text-brand-gold-dark">150,000 游戏豆</strong> · 邀请人得 <strong className="text-brand-gold-dark">1,000 游戏豆</strong>
            </div>
          </div>

          {/* Invite History */}
          <div className="bg-surface rounded-[12px] border border-border-tertiary shadow-sm overflow-hidden">
            <button onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-brand-gold" />
                <span className="text-[13px] font-medium">邀请记录</span>
                <span className="text-[10px] text-text-tertiary bg-bg px-2 py-0.5 rounded-full">已邀请 {totalInvited} 人</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <div className="px-4 pb-4 space-y-2 border-t border-border-tertiary/40 pt-3">
                {list.length === 0 && (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📨</div>
                    <div className="text-[11px] text-text-tertiary">还没有邀请记录</div>
                    <div className="text-[10px] text-text-tertiary mt-1">分享给好友，开始邀请之旅吧</div>
                  </div>
                )}
                {list.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-tertiary/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-teal-light/30 flex items-center justify-center text-[12px] font-bold text-brand-teal-dark">
                        {item.nickname.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[11px] font-medium">{item.nickname}</div>
                        <div className="text-[9px] text-text-tertiary">{item.created_at}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-brand-gold-dark">+{item.reward}</span>
                      <span className="text-[10px]">🎮</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-surface rounded-[12px] p-4 border border-border-tertiary shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🏆</span>
              <span className="text-[13px] font-medium">邀请成就</span>
            </div>
            <div className="space-y-2">
              {ACHIEVEMENTS.map(a => {
                const unlocked = totalInvited >= a.target;
                const claimedYet = claimed.includes(a.id);
                return (
                  <div key={a.id} className={`flex items-center justify-between p-2.5 rounded-[8px] ${unlocked ? 'bg-brand-gold-light/20 border border-brand-gold/20' : 'bg-bg border border-border-tertiary/60'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${unlocked ? '' : 'opacity-40 grayscale'}`}>{a.icon}</span>
                      <div>
                        <div className={`text-[11px] font-medium ${unlocked ? 'text-brand-gold-dark' : 'text-text-tertiary'}`}>{a.label}</div>
                        <div className="text-[9px] text-text-tertiary">{a.desc}</div>
                      </div>
                    </div>
                    <div>
                      {unlocked ? (
                        claimedYet ? (
                          <span className="text-[10px] text-text-tertiary">✅ 已领取</span>
                        ) : (
                          <button onClick={() => handleClaim(a.id, a.reward)}
                            className="text-[10px] bg-gradient-to-r from-brand-gold to-amber-400 text-white px-2.5 py-1 rounded-full font-medium active:scale-90 transition-transform">
                            领 {a.reward}🎮
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 bg-bg rounded-full overflow-hidden">
                            <div className="h-full bg-brand-teal rounded-full" style={{ width: `${Math.min(100, (totalInvited / a.target) * 100)}%` }} />
                          </div>
                          <span className="text-[9px] text-text-tertiary">{totalInvited}/{a.target}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Claim toast */}
      {claimMsg && (
        <div className="fixed z-50 top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white px-5 py-2.5 rounded-[10px] shadow-lg text-[12px] font-medium animate-[fadeIn_0.3s_ease-out]">
          {claimMsg}
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
