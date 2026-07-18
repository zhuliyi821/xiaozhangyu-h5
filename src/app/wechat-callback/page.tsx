"use client";

/**
 * 微信 OAuth 回调页 — UX v2
 *
 * 微信授权后会重定向到本页，URL 带 ?code=xxx
 * 前端将 code 发给后端完成登录，然后存 token 并跳转回首页
 *
 * 改进:
 *   1. ✅ 仅调用 loginWithToken()，不写独立 localStorage key
 *   2. ✅ 错误时显示重试按钮 + 细分错误类型
 *   3. ✅ CSRF state 校验（取 sessionStorage 中存储的 state）
 *   4. ✅ 更友好的加载动画
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { RotateCcw, Home, AlertCircle, CheckCircle2 } from "lucide-react";

export default function WeChatCallbackPage() {
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState("正在登录...");
  const [errorType, setErrorType] = useState<"none" | "no_code" | "network" | "server" | "csrf" | "expired">("none");
  const [done, setDone] = useState(false);

  /** 获取当前 ref（邀请人UID），从sessionStorage或URL参数 */
  function getInviteRef(): number {
    const saved = sessionStorage.getItem("invite_ref");
    if (saved) return parseInt(saved, 10) || 0;
    const params = new URLSearchParams(window.location.search);
    const ref = parseInt(params.get("ref") || "0", 10);
    if (ref > 0) sessionStorage.setItem("invite_ref", ref.toString());
    return ref;
  }

  const retry = useCallback(() => {
    // 重新获取授权：跳回 auth_url，带上 ref 和 target
    const ref = getInviteRef();
    const currentPath = window.location.pathname + window.location.search;
    fetch(`/api/wechat?action=auth_url${ref ? `&ref=${ref}` : ""}&target=${encodeURIComponent(currentPath)}`)
      .then(r => r.json())
      .then(json => {
        if (json.code !== 0) throw new Error(json.msg);
        if (json.data?.state) {
          sessionStorage.setItem("wechat_oauth_state", json.data.state);
        }
        window.location.href = json.data.auth_url;
      })
      .catch(() => {
        setStatus("重新获取授权失败，请返回首页重试");
        setErrorType("network");
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
      setStatus("授权失败，未获取到授权码");
      setErrorType("no_code");
      return;
    }

    // CSRF state 校验（可选，兼容旧 flow）
    const savedState = sessionStorage.getItem("wechat_oauth_state");
    if (savedState && state && state !== savedState) {
      setStatus("安全校验失败，请重新授权");
      setErrorType("csrf");
      return;
    }
    // 校验通过后清除 state
    sessionStorage.removeItem("wechat_oauth_state");

    setStatus("微信授权成功，正在登录...");

    const loginUrl = `/api/wechat?action=login&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`;
    fetch(loginUrl)
      .then((r) => r.json())
      .then((res) => {
        if (res.code !== 0) {
          const msg = res.msg || "登录失败";
          // 判断是否为过期
          if (msg.includes("过期") || msg.includes("expired") || msg.includes("invalid")) {
            setErrorType("expired");
            setStatus("授权已过期，请重新获取");
          } else {
            setErrorType("server");
            setStatus(msg);
          }
          return;
        }
        const data = res.data;

        // ✅ 仅调用 loginWithToken，不写独立 localStorage key
        // 所有状态由 auth-context 统一管理
        loginWithToken(data.token, {
          uid: data.uid,
          nickname: data.nickname || "微信用户",
          avatar: data.avatar || "",
          balance: data.balance || { credit1: 0, credit2: 0, credit3: 0, credit4: 0, credit5: 0, credit6: 0, granted_game_coins: 0 },
          token: data.token,
        });

        setStatus("登录成功！正在跳转...");
        setDone(true);

        // 跳转到目标页面（从OAuth state中提取），默认首页
        const redirectTo = data.redirect || "/";
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 800);
      })
      .catch(() => {
        setStatus("网络错误，登录失败");
        setErrorType("network");
      });
  }, [loginWithToken]);

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center px-8 max-w-sm">
        {/* 加载/成功/失败 状态图标 */}
        <div className={`w-16 h-16 mx-auto mb-4 rounded-[20px] flex items-center justify-center transition-all duration-500 ${
          done
            ? "bg-green-500 scale-110"
            : errorType !== "none"
              ? "bg-brand-coral/10"
              : "bg-gradient-to-br from-brand-teal to-brand-gold animate-pulse"
        }`}>
          {done ? (
            <CheckCircle2 className="w-8 h-8 text-white" />
          ) : errorType !== "none" ? (
            <AlertCircle className="w-8 h-8 text-brand-coral-dark" />
          ) : (
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          )}
        </div>

        <h1 className="text-lg font-bold text-text mb-2">
          {done ? "登录成功 🎉" : "微信登录"}
        </h1>
        <p className="text-sm text-text-tertiary mb-1">{status}</p>

        {/* 失败状态 → 显示操作按钮 */}
        {errorType !== "none" && (
          <div className="space-y-2 mt-4">
            {errorType === "csrf" && (
              <p className="text-[11px] text-text-tertiary">检测到安全风险，请重新获取授权</p>
            )}
            {errorType === "expired" && (
              <p className="text-[11px] text-text-tertiary">微信授权码已过期，请重新授权</p>
            )}
            <div className="flex gap-2 justify-center">
              <button onClick={() => window.location.href = "/"}
                className="px-5 py-2 bg-gray-100 text-gray-600 rounded-[8px] text-xs font-medium inline-flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />返回首页
              </button>
              <button onClick={retry}
                className="px-5 py-2 bg-brand-teal text-white rounded-[8px] text-xs font-medium inline-flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />重新授权
              </button>
            </div>
          </div>
        )}

        {/* 成功状态 → 2秒后自动跳转 */}
        {done && (
          <div className="mt-4 w-48 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-teal to-brand-gold rounded-full animate-[shrink_0.8s_ease-in-out]" />
          </div>
        )}
      </div>
    </main>
  );
}
