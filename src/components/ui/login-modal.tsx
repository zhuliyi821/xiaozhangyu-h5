"use client";

/**
 * 🔐 登录/注册弹窗（含推荐码检测）
 */

import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Phone, Lock, Loader2, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { checkReferral, claimReferralReward } from "@/lib/api";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [referrer, setReferrer] = useState<{ uid: number; nickname: string } | null>(null);

  // 检测 URL 中的推荐参数 ?ref=UID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && /^\d+$/.test(ref)) {
        const refUid = parseInt(ref);
        checkReferral(refUid)
          .then((data) => setReferrer({ uid: data.referrer_id, nickname: data.nickname }))
          .catch(() => {});
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^1\d{10}$/.test(mobile)) {
      setError("请输入正确的11位手机号");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(mobile, password);
      } else {
        // 注册
        const result = await register(mobile, password);
        // 如果有推荐人，发奖励
        if (referrer) {
          try {
            await claimReferralReward(referrer.uid, mobile);
          } catch {}
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-[360px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative pt-8 pb-4 px-6 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center mx-auto mb-3 text-2xl">
            🐙
          </div>
          <h2 className="text-lg font-bold">{mode === "login" ? "欢迎回来" : "注册账号"}</h2>
          <p className="text-xs text-text-tertiary mt-1">
            {mode === "login" ? "登录后同步资产和订单" : "注册即送 150,000 游戏豆 🎉"}
          </p>
          {referrer && mode === "register" && (
            <div className="mt-2 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] px-3 py-1 rounded-[20px]">
              <Gift className="w-3 h-3" /> {referrer.nickname} 推荐了你
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              placeholder="手机号"
              maxLength={11}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPwd ? "text" : "password"}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-9 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "登录" : "注册并登录"}
          </button>

          <p className="text-xs text-center text-text-tertiary">
            {mode === "login" ? (
              <>还没有账号？<button type="button" onClick={() => { setMode("register"); setError(""); }} className="text-brand-teal font-medium">去注册</button></>
            ) : (
              <>已有账号？<button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-brand-teal font-medium">去登录</button></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
