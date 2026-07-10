"use client";

/**
 * 微信 OAuth 回调页
 *
 * 微信授权后会重定向到本页，URL 带 ?code=xxx
 * 前端将 code 发给后端完成登录，然后存 token 并跳转回首页
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function WeChatCallbackPage() {
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState("正在登录...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
      setStatus("授权失败，缺少 code");
      return;
    }

    setStatus("微信授权成功，正在登录...");

    fetch(`/api/wechat?action=login&code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.code !== 0) {
          setStatus(res.msg || "登录失败");
          return;
        }
        const data = res.data;
        // 存 token
        localStorage.setItem("token", data.token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        // 通知 auth context
        loginWithToken(data.token, data);
        // 跳转首页
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      })
      .catch(() => {
        setStatus("网络错误，登录失败");
      });
  }, [loginWithToken]);

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center px-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="text-lg font-bold text-text mb-2">微信登录</h1>
        <p className="text-sm text-text-tertiary">{status}</p>
        {status.includes("失败") && (
          <button onClick={() => window.location.href = "/"}
            className="mt-4 px-5 py-2 bg-brand-teal text-white text-xs font-medium rounded-[8px]">
            返回首页
          </button>
        )}
      </div>
    </main>
  );
}
