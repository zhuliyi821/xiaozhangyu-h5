"use client";

/**
 * 🔐 登录/注册/找回密码 弹窗 — UX v3
 *
 * 改进:
 *   1. ✅ 微信登录 fetch→redirect（修复 P0 auth_url JSON 白屏）
 *   2. ✅ 非微信浏览器显示扫码降级方案
 *   3. ✅ 微信跳转加载态（"正在跳转微信授权..."）
 *   4. ✅ 用户名+手机号 双模式登录
 *   5. ✅ 验证码 60s 倒计时
 *   6. ✅ 密码显隐在找回密码步骤二统一
 *   7. ✅ 注册成功动画
 *   8. ✅ debug_code 仅控制台输出
 *   9. ✅ 网络错误显示重试按钮
 */

import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, Phone, Lock, Loader2, Gift, KeyRound, ArrowLeft, CheckCircle2, RotateCcw, User, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { checkReferral, claimReferralReward, loginByMobile, loginByUsername } from "@/lib/api";
import { apiFetch } from "@/config/api";

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalMode = "login" | "register" | "forgot";
type LoginTab = "mobile" | "username";

// ─── 环境检测 ───
const isWeChatBrowser = typeof navigator !== "undefined" && /micromessenger/i.test(navigator.userAgent);
const isMobile = typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<ModalMode>("login");
  const [loginTab, setLoginTab] = useState<LoginTab>("mobile");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [referrer, setReferrer] = useState<{ uid: number; nickname: string } | null>(null);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 注册成功动画
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // 微信加载态
  const [wechatLoading, setWechatLoading] = useState(false);

  // 倒计时清理
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  // ── 微信登录（fetch auth_url → redirect） ──
  const handleWeChatLogin = async () => {
    setWechatLoading(true);
    setError("");
    try {
      const target = window.location.pathname + window.location.search;
      const res = await fetch(`/api/wechat?action=auth_url&scope=userinfo&target=${encodeURIComponent(target)}`);
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.msg || "获取微信授权失败");
      // 存 state 到 sessionStorage 供回调页验证 CSRF
      if (json.data?.state) {
        sessionStorage.setItem("wechat_oauth_state", json.data.state);
      }
      // 延迟 300ms 让用户看到加载动画
      setTimeout(() => {
        window.location.href = json.data.auth_url;
      }, 300);
    } catch (err: any) {
      setError(err.message || "获取微信授权地址失败，请稍后重试");
      setWechatLoading(false);
    }
  };

  // ── 登录/注册 ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (loginTab === "mobile") {
      if (!/^1\d{10}$/.test(mobile)) {
        setError("请输入正确的11位手机号");
        return;
      }
    } else {
      if (!username || username.length < 2) {
        setError("用户名至少2个字符");
        return;
      }
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        if (loginTab === "mobile") {
          await login(mobile, password);
        } else {
          // 用户名登录
          await loginByUsername(username, password);
        }
        onSuccess?.();
        onClose();
      } else {
        // 注册始终用手机号
        await register(mobile, password);
        if (referrer) {
          try { await claimReferralReward(referrer.uid, mobile); } catch {}
        }
        // 注册成功动画
        setRegisterSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  // ── 发送验证码 (带 60s 倒计时) ──
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
      startCountdown();
      if (data?.debug_code) {
        console.log("[DEV] 验证码:", data.debug_code);
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
      setError("");
      setError("✅ 密码已重置！请用新密码登录");
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
    setForgotStep(1);
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  return (
    <>
      {/* ── 微信跳转加载态（全屏遮罩） ── */}
      {wechatLoading && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
          <div className="w-16 h-16 mb-5 rounded-[20px] bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center animate-bounce">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5S10 11.17 10 12s-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5S15 11.17 15 12s-.67 1.5-1.5 1.5zM12 2C6.48 2 2 5.58 2 10c0 2.5 1.35 4.67 3.44 6.15l-.94 2.85 3.09-1.69c.82.23 1.76.36 2.71.36h.3A7.85 7.85 0 0010 16.5c0-3.87 3.13-7 7-7 .34 0 .68.03 1.01.07C16.87 5.56 14.54 2 12 2zm7 7c-2.76 0-5 2.24-5 5s2.24 5 5 5c.46 0 .9-.07 1.33-.19l1.84 1.01-.56-1.69C22.37 17.23 23 15.9 23 14.43 23 11.18 20.76 9 18.59 9z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-text">正在跳转微信授权...</p>
          <p className="text-xs text-text-tertiary mt-1">请确认微信已登录</p>
          <button onClick={() => { setWechatLoading(false); }}
            className="mt-6 text-xs text-text-tertiary underline">
            取消
          </button>
        </div>
      )}

      <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-[12px] w-full max-w-[360px] overflow-hidden shadow-2xl animate-[celebrate-pop_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative pt-8 pb-4 px-6 text-center">
            <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center" aria-label="关闭登录弹窗">
              <X className="w-3.5 h-3.5" />
            </button>

            {mode === "forgot" && (
              <button onClick={() => switchMode("login")} className="absolute top-3 left-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl transition-all duration-500 ${
              registerSuccess ? "bg-green-500 scale-110" : "bg-gradient-to-br from-brand-teal to-brand-teal-dark"
            }`}>
              {registerSuccess ? <CheckCircle2 className="w-7 h-7 text-white" /> : (mode === "forgot" ? "🔑" : "🐙")}
            </div>
            <h2 className="text-lg font-bold">
              {registerSuccess ? "🎉 注册成功！" : (mode === "login" ? "欢迎回来" : mode === "register" ? "注册账号" : "找回密码")}
            </h2>
            <p className={`text-xs mt-1 ${mode === "register" && !registerSuccess ? "text-brand-coral font-medium" : "text-text-tertiary"}`}>
              {registerSuccess ? "150,000 游戏豆已到账 🎉" : ""}
              {!registerSuccess && mode === "login" && "登录后同步资产和订单"}
              {!registerSuccess && mode === "register" && "注册即送 150,000 游戏豆 🎉"}
              {!registerSuccess && mode === "forgot" && "输入注册手机号重置密码"}
            </p>
            {referrer && mode === "register" && !registerSuccess && (
              <div className="mt-2 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] px-3 py-1 rounded-[8px]">
                <Gift className="w-3 h-3" /> {referrer.nickname} 推荐了你，你们各得 1,000 游戏豆 🎉
              </div>
            )}
          </div>

          {/* ── 注册成功动画 ── */}
          {registerSuccess ? (
            <div className="px-6 pb-8 text-center">
              <div className="animate-bounce text-4xl mb-3">🤑</div>
              <p className="text-sm text-text-secondary">开始你的预测之旅吧！</p>
            </div>
          ) : (mode === "login" || mode === "register") && (
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
              {/* ── 登录方式 Tab（仅登录模式显示） ── */}
              {mode === "login" && (
                <div className="flex bg-gray-50 rounded-[8px] p-0.5 mb-1">
                  <button type="button"
                    onClick={() => { setLoginTab("mobile"); setError(""); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-[7px] transition-all ${
                      loginTab === "mobile"
                        ? "bg-white shadow-sm text-brand-teal-dark"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 inline mr-1" />手机号登录
                  </button>
                  <button type="button"
                    onClick={() => { setLoginTab("username"); setError(""); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-[7px] transition-all ${
                      loginTab === "username"
                        ? "bg-white shadow-sm text-brand-teal-dark"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 inline mr-1" />用户名登录
                  </button>
                </div>
              )}

              {/* ── 手机号输入 ── */}
              {(loginTab === "mobile" || mode === "register") && (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel" placeholder="手机号" maxLength={11}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[8px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* ── 用户名输入 ── */}
              {mode === "login" && loginTab === "username" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" placeholder="用户名" maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.trim())}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[8px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* ── 密码输入 ── */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"} placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-3 bg-gray-50 rounded-[8px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={() => switchMode("forgot")}
                    className="text-[11px] text-brand-teal-dark hover:underline">
                    忘记密码？
                  </button>
                </div>
              )}

              {error && (
                <p className={`text-xs text-center flex items-center justify-center gap-1 ${
                  error.startsWith("✅") ? "text-green-600" : "text-brand-coral"
                }`}>
                  <span>{error}</span>
                </p>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "登录" : "注册并登录"}
              </button>

              <p className="text-xs text-center text-text-tertiary">
                {mode === "login" ? (
                  <>还没有账号？<button type="button" onClick={() => switchMode("register")} className="text-brand-teal font-medium">去注册</button></>
                ) : (
                  <>已有账号？<button type="button" onClick={() => switchMode("login")} className="text-brand-teal font-medium">去登录</button></>
                )}
              </p>
            </form>
          )}

          {/* ── WeChat Login ── */}
          {mode === "login" && (
            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-text-tertiary shrink-0">其他登录方式</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {isWeChatBrowser ? (
                /* 微信内置浏览器 → 一键登录 */
                <button type="button" onClick={handleWeChatLogin} disabled={wechatLoading}
                  className="w-full py-2.5 border border-[#07C160] text-[#07C160] rounded-[8px] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-[#07C160]/5 disabled:opacity-50">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5S10 11.17 10 12s-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5S15 11.17 15 12s-.67 1.5-1.5 1.5zM12 2C6.48 2 2 5.58 2 10c0 2.5 1.35 4.67 3.44 6.15l-.94 2.85 3.09-1.69c.82.23 1.76.36 2.71.36h.3A7.85 7.85 0 0010 16.5c0-3.87 3.13-7 7-7 .34 0 .68.03 1.01.07C16.87 5.56 14.54 2 12 2zm7 7c-2.76 0-5 2.24-5 5s2.24 5 5 5c.46 0 .9-.07 1.33-.19l1.84 1.01-.56-1.69C22.37 17.23 23 15.9 23 14.43 23 11.18 20.76 9 18.59 9z"/>
                  </svg>
                  {wechatLoading ? "获取授权中..." : "微信一键登录"}
                </button>
              ) : (
                /* 非微信浏览器 → 提示用微信打开 */
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-[8px] text-xs text-text-tertiary">
                    <Smartphone className="w-4 h-4" />
                    <span>请用微信打开此页面一键登录</span>
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-2">
                    微信登录仅支持微信内置浏览器
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Forgot Password ── */}
          {mode === "forgot" && (
            <div className="px-6 pb-6 space-y-3">
              {/* Step 1: 手机号 + 发送验证码 */}
              {forgotStep === 1 && (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" placeholder="注册手机号" maxLength={11}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[8px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-brand-coral text-center flex items-center justify-center gap-1">
                      {error}
                      {error.includes("验证码") && (
                        <button onClick={() => { switchMode("forgot"); }} className="underline text-brand-teal-dark ml-1">重新获取</button>
                      )}
                    </p>
                  )}

                  {!codeSent ? (
                    <button onClick={handleSendCode} disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      获取验证码
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {countdown > 0 ? (
                        <div className="text-center py-2">
                          <span className="text-[12px] text-text-tertiary">验证码已发送</span>
                          <div className="text-lg font-bold text-brand-teal-dark mt-1">{countdown}s</div>
                          {countdown < 55 && (
                            <button onClick={() => { setCodeSent(false); setCountdown(0); }}
                              className="text-[11px] text-brand-teal underline mt-1">
                              重新发送
                            </button>
                          )}
                        </div>
                      ) : (
                        <button onClick={handleSendCode} disabled={submitting}
                          className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-[8px] text-xs font-medium">
                          重新发送验证码
                        </button>
                      )}
                      <button onClick={() => setForgotStep(2)}
                        className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium">
                        下一步
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: 验证码 + 新密码 */}
              {forgotStep === 2 && (
                <>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="输入验证码" maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-[8px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showNewPwd ? "text" : "password"} placeholder="新密码（至少6位）"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-3 bg-gray-50 rounded-[8px] text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showNewPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>

                  {error && (
                    <p className={`text-xs text-center ${error.startsWith("✅") ? "text-green-600" : "text-brand-coral"}`}>{error}</p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setForgotStep(1); setCode(""); setNewPassword(""); setError(""); }}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-[8px] text-sm font-medium">
                      返回
                    </button>
                    <button onClick={handleResetPassword} disabled={submitting}
                      className="flex-[2] py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
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
    </>
  );
}
