"use client";

/**
 * 🔐 登录/注册/找回密码 弹窗
 */

import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Phone, Lock, Loader2, Gift, KeyRound, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { checkReferral, claimReferralReward } from "@/lib/api";
import { apiFetch } from "@/config/api";

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalMode = "login" | "register" | "forgot";

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<ModalMode>("login");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [referrer, setReferrer] = useState<{ uid: number; nickname: string } | null>(null);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [debugCode, setDebugCode] = useState("");

  // 检测 URL 中的推荐参数 ?ref=UID 或 ?invite=UID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("invite");
      if (ref && /^\d+$/.test(ref)) {
        const refUid = parseInt(ref);
        checkReferral(refUid)
          .then((data) => setReferrer({ uid: data.referrer_id, nickname: data.nickname }))
          .catch(() => {});
      }
    }
  }, []);

  // ── 登录/注册 ──
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
        const result = await register(mobile, password);
        if (referrer) {
          try { await claimReferralReward(referrer.uid, mobile); } catch {}
        }
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  // ── 发送验证码 ──
  const handleSendCode = async () => {
    if (!/^1\d{10}$/.test(mobile)) {
      setError("请输入正确的11位手机号");
      return;
    }
    setError(""); setSubmitting(true);
    try {
      const data = await apiFetch<any>("/api/member/reset-password", {
        method: "POST",
        body: JSON.stringify({ action: "send_code", mobile }),
      });
      setCodeSent(true);
      if (data?.debug_code) {
        setDebugCode(data.debug_code);
      }
    } catch (err: any) {
      setError(err.message || "发送验证码失败");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 重置密码 ──
  const handleResetPassword = async () => {
    if (!code || code.length < 6) { setError("请输入6位验证码"); return; }
    if (newPassword.length < 6) { setError("新密码至少6位"); return; }
    setError(""); setSubmitting(true);
    try {
      await apiFetch("/api/member/reset-password", {
        method: "POST",
        body: JSON.stringify({ action: "reset", mobile, code, new_password: newPassword }),
      });
      setMode("login");
      setPassword(newPassword);
      setError("✅ 密码重置成功！请登录");
    } catch (err: any) {
      setError(err.message || "重置失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 切换模式时重置状态
  const switchMode = (newMode: ModalMode) => {
    setMode(newMode);
    setError("");
    setPassword("");
    setCode("");
    setNewPassword("");
    setCodeSent(false);
    setDebugCode("");
    setForgotStep(1);
  };

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

          {/* Back button for forgot password */}
          {mode === "forgot" && (
            <button onClick={() => switchMode("login")} className="absolute top-3 left-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center mx-auto mb-3 text-2xl">
            {mode === "forgot" ? "🔑" : "🐙"}
          </div>
          <h2 className="text-lg font-bold">
            {mode === "login" ? "欢迎回来" : mode === "register" ? "注册账号" : "找回密码"}
          </h2>
          <p className={`text-xs mt-1 ${mode === "register" ? "text-red-500 font-medium" : "text-text-tertiary"}`}>
            {mode === "login" && "登录后同步资产和订单"}
            {mode === "register" && "注册即送 150,000 游戏豆 🎉"}
            {mode === "forgot" && "输入注册手机号重置密码"}
          </p>
          {referrer && mode === "register" && (
            <div className="mt-2 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] px-3 py-1 rounded-[20px]">
              <Gift className="w-3 h-3" /> {referrer.nickname} 推荐了你，你们各得 1,000 游戏豆 🎉
            </div>
          )}
        </div>

        {/* ── Login / Register Form ── */}
        {(mode === "login" || mode === "register") && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel" placeholder="手机号" maxLength={11}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPwd ? "text" : "password"} placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>

            {/* 忘记密码 */}
            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => switchMode("forgot")}
                  className="text-[11px] text-brand-teal-dark hover:underline">
                  忘记密码？
                </button>
              </div>
            )}

            {error && (
              <p className={`text-xs text-center ${error.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{error}</p>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "登录" : "注册并登录"}
            </button>

            <p className="text-xs text-center text-text-tertiary">
              {mode === "login" ? (
                <>还没有账号？<button type="button" onClick={() => { switchMode("register"); }} className="text-brand-teal font-medium">去注册</button></>
              ) : (
                <>已有账号？<button type="button" onClick={() => { switchMode("login"); }} className="text-brand-teal font-medium">去登录</button></>
              )}
            </p>
          </form>
        )}

        {/* ── Forgot Password Form ── */}
        {mode === "forgot" && (
          <div className="px-6 pb-6 space-y-3">
            {/* Step 1: Enter phone + get code */}
            {forgotStep === 1 && (
              <>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" placeholder="注册手机号" maxLength={11}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                  />
                </div>

                {codeSent && debugCode && (
                  <div className="bg-amber-50 rounded-[12px] px-4 py-2.5 text-center">
                    <p className="text-[10px] text-amber-600">📱 验证码（调试模式）</p>
                    <p className="text-lg font-mono font-bold text-amber-800 tracking-[0.3em]">{debugCode}</p>
                    <p className="text-[9px] text-amber-500 mt-0.5">接入短信后将自动发送到手机</p>
                  </div>
                )}

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                {!codeSent ? (
                  <button onClick={handleSendCode} disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    获取验证码
                  </button>
                ) : (
                  <button onClick={() => setForgotStep(2)}
                    className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-medium"
                  >
                    下一步
                  </button>
                )}
              </>
            )}

            {/* Step 2: Enter code + new password */}
            {forgotStep === 2 && (
              <>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="输入验证码" maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" placeholder="新密码（至少6位）"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                  />
                </div>

                {/* Show debug code again for convenience */}
                {debugCode && (
                  <div className="text-center">
                    <span className="text-[10px] text-amber-600">验证码: <strong className="text-base font-mono">{debugCode}</strong></span>
                  </div>
                )}

                {error && (
                  <p className={`text-xs text-center ${error.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{error}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setForgotStep(1); setCode(""); setNewPassword(""); setError(""); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-[14px] text-sm font-medium">
                    返回
                  </button>
                  <button onClick={handleResetPassword} disabled={submitting}
                    className="flex-[2] py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    重置密码
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
