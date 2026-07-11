"use client";

/** ⚔️ 战队系统 — 创建/加入/管理战队 + 排行榜 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

interface TeamMember {
  user_id: number;
  role: string;
  nickname: string;
  avatar?: string;
  joined_at: number;
}

interface Team {
  id: number;
  name: string;
  slogan: string;
  logo: string;
  captain_id: number;
  coins: number;
  wins: number;
  losses: number;
  accuracy: string;
  status: string;
  invite_code: string;
  member_count: number;
  max_members: number;
  members?: TeamMember[];
  rank?: number;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "rank" | "create" | "join" | "battle">("my");

  // Battle state
  const [battles, setBattles] = useState<any[]>([]);
  const [opponentId, setOpponentId] = useState("");
  const [battleTopic, setBattleTopic] = useState("友谊赛");
  const [battling, setBattling] = useState(false);

  // Create team form
  const [teamName, setTeamName] = useState("");
  const [teamSlogan, setTeamSlogan] = useState("一起预测，一起赢！");
  const [submitting, setSubmitting] = useState(false);

  // Join team
  const [inviteCode, setInviteCode] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const d = await apiFetch<Team | false>(`/api/team?uid=${user.uid}`);
      setTeam(d || null);
    } catch { setTeam(null); }
    finally { setLoading(false); }
  }, [user?.uid]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const d = await apiFetch<Team[]>("/api/team/leaderboard");
      setLeaderboard(d);
    } catch { setLeaderboard([]); }
  }, []);

  const fetchBattles = useCallback(async (teamId?: number) => {
    if (!teamId) return;
    try {
      const d = await apiFetch<any[]>(`/api/team/battle/list?team_id=${teamId}`);
      setBattles(d || []);
    } catch { setBattles([]); }
  }, []);

  useEffect(() => { fetchTeam(); fetchLeaderboard(); }, [fetchTeam, fetchLeaderboard]);
  useEffect(() => { if (team) fetchBattles(team.id); }, [team, fetchBattles]);

  const handleChallenge = async () => {
    if (!user || !team || battling || !opponentId) return;
    setBattling(true);
    try {
      await apiFetch("/api/team/battle/challenge", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, team_id: team.id, opponent_id: parseInt(opponentId), topic: battleTopic }),
      });
      setOpponentId("");
      await fetchBattles(team.id);
      setTab("my");
    } catch (err: any) { alert(err?.msg || "挑战失败"); }
    finally { setBattling(false); }
  };

  const handleCreate = async () => {
    if (!user || submitting || !teamName.trim()) return;
    setSubmitting(true);
    try {
      const r = await apiFetch<{ team_id: number; invite_code: string }>("/api/team", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, name: teamName.trim(), slogan: teamSlogan.trim() }),
      });
      setTeamName("");
      await fetchTeam();
      setTab("my");
    } catch (err: any) { alert(err?.msg || "创建失败"); }
    finally { setSubmitting(false); }
  };

  const handleJoin = async () => {
    if (!user || joining || !inviteCode.trim()) return;
    setJoining(true); setJoinMsg("");
    try {
      const r = await apiFetch<{ team_id: number; name: string }>("/api/team/join", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, invite_code: inviteCode.trim().toUpperCase() }),
      });
      setJoinMsg(`✅ 成功加入「${r.name}」`);
      setInviteCode("");
      await fetchTeam();
      setTab("my");
    } catch (err: any) { setJoinMsg(`❌ ${err?.msg || "加入失败"}`); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!user || !team || team.captain_id === user.uid) return;
    if (!confirm("确定退出战队？")) return;
    try {
      await apiFetch("/api/team/leave", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid }),
      });
      setTeam(null);
      await fetchLeaderboard();
    } catch (err: any) { alert(err?.msg || "退出失败"); }
  };

  const isCaptain = user && team?.captain_id === user.uid;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-5xl mb-3">⚔️</div>
          <div className="text-[15px] font-medium mb-1">战队系统</div>
          <div className="text-[11px] text-text-tertiary mb-4">登录后创建或加入战队</div>
          <button onClick={() => setShowLogin(true)}
            className="bg-brand-teal text-white text-[12px] px-6 py-2 rounded-[10px] font-medium">立即登录</button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white px-5 pt-4 pb-6 rounded-b-[24px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[20px]">⚔️</span>
          <div>
            <h1 className="text-lg font-bold">战队中心</h1>
            <div className="text-[10px] opacity-70">全平台 {leaderboard.length} 支战队</div>
          </div>
        </div>
      </div>

      {/* My Team / Create / Join */}
      <div className="mx-4 -mt-4 relative z-10">
        {loading ? (
          <div className="bg-white rounded-[14px] p-5 shadow-sm animate-pulse border border-gray-100">
            <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-3 w-40 bg-gray-50 rounded" />
          </div>
        ) : team ? (
          /* My Team Card */
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[22px]">⚔️</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold">{team.name}</div>
                <div className="text-[10px] text-text-tertiary">{team.slogan}</div>
              </div>
              <div className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-[6px]">
                {team.accuracy || "0.0"}% 胜率
              </div>
            </div>

            {/* Member Grid */}
            <div className="space-y-1.5 mb-2">
              <div className="text-[10px] text-text-tertiary">
                成员 {team.member_count}/{team.max_members}
                {isCaptain && (
                  <span className="ml-2 text-purple-500"> · 邀请码: <strong className="text-[12px]">{team.invite_code}</strong></span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {team.members?.map(m => (
                  <div key={m.user_id} className="flex items-center gap-1.5 bg-gray-50 rounded-[8px] px-2.5 py-1.5">
                    <span className="text-[16px]">{m.avatar || '🐙'}</span>
                    <span className="text-[10px] font-medium">{m.nickname || `用户${m.user_id}`}</span>
                    {m.role === 'captain' && <span className="text-[8px] bg-amber-100 text-amber-600 px-1 rounded-[3px]">队长</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              {isCaptain && (
                <button onClick={() => setTab("battle")}
                  className="flex-1 bg-purple-50 text-purple-600 text-[10px] font-medium py-2 rounded-[8px]">发起对战</button>
              )}
              <button onClick={() => setTab("rank")}
                className="flex-1 bg-purple-50 text-purple-600 text-[10px] font-medium py-2 rounded-[8px]">战队排行</button>
              {!isCaptain && (
                <button onClick={handleLeave}
                  className="px-3 bg-red-50 text-red-500 text-[10px] py-2 rounded-[8px]">退出</button>
              )}
            </div>

            {/* My Team's Battles */}
            {battles.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="text-[10px] font-medium mb-1.5">⚔️ 战队对战记录</div>
                {battles.filter(b => b.status !== 'finished').slice(0, 2).map(b => (
                  <div key={b.id} className="flex items-center gap-2 bg-amber-50 rounded-[8px] p-2 text-[10px] mb-1">
                    <span>⚔️</span>
                    <span className="font-medium">{b.team1_name}</span>
                    <span className="text-text-tertiary">VS</span>
                    <span className="font-medium">{b.team2_name}</span>
                    <span className="ml-auto px-1.5 py-0.5 bg-amber-200 rounded-[4px] text-[9px]">
                      {b.status === 'pending' ? '待开始' : '进行中'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No Team - Create or Join */
          <div className="flex gap-2">
            <button onClick={() => setTab("create")}
              className={`flex-1 bg-white rounded-[12px] p-3.5 shadow-sm border text-center active:scale-[0.98] transition-transform ${
                tab === "create" ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'
              }`}>
              <div className="text-[22px] mb-0.5">🆕</div>
              <div className="text-[12px] font-medium">创建战队</div>
              <div className="text-[9px] text-text-tertiary">成为队长</div>
            </button>
            <button onClick={() => setTab("join")}
              className={`flex-1 bg-white rounded-[12px] p-3.5 shadow-sm border text-center active:scale-[0.98] transition-transform ${
                tab === "join" ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'
              }`}>
              <div className="text-[22px] mb-0.5">🔗</div>
              <div className="text-[12px] font-medium">加入战队</div>
              <div className="text-[9px] text-text-tertiary">输入邀请码</div>
            </button>
            <button onClick={() => setTab("rank")}
              className="flex-1 bg-white rounded-[12px] p-3.5 shadow-sm border border-gray-100 text-center active:scale-[0.98] transition-transform">
              <div className="text-[22px] mb-0.5">🏆</div>
              <div className="text-[12px] font-medium">排行榜</div>
              <div className="text-[9px] text-text-tertiary">{leaderboard.length} 队</div>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="mx-4 mt-4 pb-6">
        {/* Create Team */}
        {(!team && tab === "create") && (
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
            <div className="text-[13px] font-medium mb-3">🆕 创建战队</div>
            <input value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="战队名称（12字以内）" maxLength={12}
              className="w-full text-[12px] border border-gray-100 rounded-[8px] px-3 py-2 mb-2 outline-none focus:border-purple-200" />
            <input value={teamSlogan} onChange={e => setTeamSlogan(e.target.value)}
              placeholder="战队口号"
              className="w-full text-[12px] border border-gray-100 rounded-[8px] px-3 py-2 mb-3 outline-none focus:border-purple-200" />
            <button onClick={handleCreate} disabled={submitting || !teamName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[12px] font-medium py-2.5 rounded-[10px] active:scale-[0.98] transition-transform disabled:opacity-50">
              {submitting ? "创建中..." : "⚔️ 创建战队"}
            </button>
          </div>
        )}

        {/* Join Team */}
        {(!team && tab === "join") && (
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
            <div className="text-[13px] font-medium mb-3">🔗 加入战队</div>
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="输入6位邀请码" maxLength={6}
              className="w-full text-[14px] tracking-[0.3em] text-center font-mono border border-gray-100 rounded-[8px] px-3 py-2.5 mb-2 outline-none focus:border-purple-200" />
            {joinMsg && <div className="text-[10px] mb-2">{joinMsg}</div>}
            <button onClick={handleJoin} disabled={joining || inviteCode.length < 6}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[12px] font-medium py-2.5 rounded-[10px] active:scale-[0.98] transition-transform disabled:opacity-50">
              {joining ? "加入中..." : "加入战队"}
            </button>
          </div>
        )}

        {/* Battle Challenge */}
        {(team && tab === "battle") && (
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
            <div className="text-[13px] font-medium mb-3">⚔️ 发起对战</div>
            <input value={opponentId} onChange={e => setOpponentId(e.target.value)}
              placeholder="对手战队ID" type="number"
              className="w-full text-[12px] border border-gray-100 rounded-[8px] px-3 py-2 mb-2 outline-none focus:border-purple-200" />
            <input value={battleTopic} onChange={e => setBattleTopic(e.target.value)}
              placeholder="对战主题" maxLength={50}
              className="w-full text-[12px] border border-gray-100 rounded-[8px] px-3 py-2 mb-3 outline-none focus:border-purple-200" />

            {/* Team selection from leaderboard */}
            <div className="mb-2">
              <div className="text-[10px] text-text-tertiary mb-1">可选对手:</div>
              <div className="flex flex-wrap gap-1.5">
                {leaderboard.filter(t => t.id !== team.id).slice(0, 8).map(t => (
                  <button key={t.id} onClick={() => setOpponentId(String(t.id))}
                    className={`text-[10px] px-2.5 py-1 rounded-[6px] border transition-colors ${
                      opponentId === String(t.id)
                        ? 'bg-purple-100 border-purple-200 text-purple-700'
                        : 'bg-gray-50 border-gray-100 text-text-tertiary'
                    }`}>
                    {t.name} #{t.accuracy}%
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleChallenge} disabled={battling || !opponentId}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[12px] font-medium py-2.5 rounded-[10px] active:scale-[0.98] transition-transform disabled:opacity-50">
              {battling ? "发起中..." : "⚔️ 发起挑战"}
            </button>
          </div>
        )}

        {/* Leaderboard */}
        {(tab === "rank") && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-text-tertiary mb-1">战队排行榜 · 按命中率排序</div>
            {leaderboard.length === 0 ? (
              <div className="bg-white rounded-[12px] p-6 text-center text-[12px] text-text-tertiary border border-gray-100">
                暂无战队，创建第一支吧！⚔️
              </div>
            ) : (
              leaderboard.map((t, i) => (
                <div key={t.id}
                  className="bg-white rounded-[10px] p-3.5 shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-text-tertiary'
                  }`}>
                    {i < 3 ? ['👑','🥈','🥉'][i] : `#${i + 1}`}
                  </div>
                  <span className="text-[20px]">⚔️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{t.name}</div>
                    <div className="text-[10px] text-text-tertiary">
                      {t.wins}胜/{t.losses}负 · {t.member_count}人
                    </div>
                  </div>
                  <div className="text-[12px] font-bold text-green-600">{t.accuracy}%</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
