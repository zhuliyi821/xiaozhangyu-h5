"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProfile, updateProfile, changePassword } from "@/lib/api";
import type { MemberProfile } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Password change state
  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getProfile(user.uid)
      .then(p => { setProfile(p); setNickname(p.nickname); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true); setMsg("");
    const r = await updateProfile(user.uid, { nickname: nickname.trim() });
    setMsg(r.code === 0 ? "✅ 保存成功" : `❌ ${r.msg}`);
    setSaving(false);
  };

  const handleChangePwd = async () => {
    if (!user || !oldPwd || newPwd.length < 6) return;
    setPwdSaving(true); setMsg("");
    const r = await changePassword(user.uid, oldPwd, newPwd);
    setMsg(r.code === 0 ? "✅ 密码修改成功" : `❌ ${r.msg}`);
    if (r.code === 0) { setOldPwd(""); setNewPwd(""); }
    setPwdSaving(false);
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">设置</h1>
        </div>
      </div>

      {loading && (
        <div className="px-4 mt-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface rounded-[16px] animate-pulse" />)}
        </div>
      )}

      {profile && (
        <div className="px-4 mt-6 space-y-4">
          {/* 个人资料 */}
          <div className="bg-surface rounded-[20px] p-5 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <h2 className="text-sm font-semibold mb-4">个人资料</h2>
            {/* 头像 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center text-2xl text-white font-bold shadow-md">
                {profile.nickname?.charAt(0) || "🐙"}
              </div>
              <div>
                <div className="text-sm font-semibold">{profile.nickname || "未设置昵称"}</div>
                <div className="text-[11px] text-text-tertiary mt-0.5">UID: {profile.uid}</div>
                <div className="text-[11px] text-text-tertiary">{profile.mobile}</div>
              </div>
            </div>
            {/* 昵称编辑 */}
            <div className="mb-3">
              <label className="text-[11px] text-text-secondary block mb-1">昵称</label>
              <div className="flex gap-2">
                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                  className="flex-1 bg-bg rounded-[12px] px-3 py-2 text-xs border border-[rgba(69,204,213,0.1)] focus:outline-none focus:border-brand-teal" />
                <button onClick={handleSave} disabled={saving || !nickname.trim()}
                  className="px-4 py-2 bg-brand-teal text-white text-xs rounded-[12px] disabled:opacity-50">
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
            <div className="text-[11px] text-text-tertiary">
              邮箱: {profile.email || "未设置"}
            </div>
          </div>

          {/* 修改密码 */}
          <div className="bg-surface rounded-[20px] p-5 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">安全设置</h2>
              <button onClick={() => setShowPwd(!showPwd)}
                className="text-[11px] text-brand-teal">
                {showPwd ? "取消" : "修改密码"}
              </button>
            </div>
            {showPwd && (
              <div className="space-y-3">
                <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                  placeholder="原密码" className="w-full bg-bg rounded-[12px] px-3 py-2 text-xs border border-[rgba(69,204,213,0.1)] focus:outline-none focus:border-brand-teal" />
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="新密码（至少6位）" className="w-full bg-bg rounded-[12px] px-3 py-2 text-xs border border-[rgba(69,204,213,0.1)] focus:outline-none focus:border-brand-teal" />
                <button onClick={handleChangePwd} disabled={pwdSaving || !oldPwd || newPwd.length < 6}
                  className="w-full py-2 bg-amber-500 text-white text-xs rounded-[12px] disabled:opacity-50">
                  {pwdSaving ? "修改中..." : "确认修改"}
                </button>
              </div>
            )}
          </div>

          {/* 账户信息 */}
          <div className="bg-surface rounded-[20px] p-5 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <h2 className="text-sm font-semibold mb-3">账户信息</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-bg rounded-[12px] p-3">
                <div className="text-text-tertiary mb-1">🎮 游戏豆</div>
                <div className="font-bold">{profile.assets.credit1 || 0}</div>
              </div>
              <div className="bg-bg rounded-[12px] p-3">
                <div className="text-text-tertiary mb-1">⛏️ 水晶石</div>
                <div className="font-bold">{profile.assets.credit5 || 0}</div>
              </div>
              <div className="bg-bg rounded-[12px] p-3">
                <div className="text-text-tertiary mb-1">🔮 水晶球</div>
                <div className="font-bold">{profile.assets.credit3 || 0}</div>
              </div>
              <div className="bg-bg rounded-[12px] p-3">
                <div className="text-text-tertiary mb-1">🏪 闲豆</div>
                <div className="font-bold">{profile.assets.credit2 || 0}</div>
              </div>
            </div>
          </div>

          {/* 提示消息 */}
          {msg && (
            <div className={`text-center text-xs py-2 rounded-[12px] ${msg.startsWith("✅") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
              {msg}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
