"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

/**
 * 新用户3步引导弹窗
 *
 * Step 1: 欢迎来到小章鱼
 * Step 2: 领 150,000 游戏豆
 * Step 3: 快速上手攻略
 *
 * 状态追踪:
 *   - localStorage "onboarding_done" = "1" → 已领取，不再显示
 *   - localStorage "onboarding_skipped" = "1" → 稍后领取，首页显示入口
 *   - 无任何标记 → 首次访问
 */
export function OnboardingModal() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(false);
  const [bonusConfirmed, setBonusConfirmed] = useState(false); // 后端确认已获得

  const uid = (user as any)?.uid || 0;

  useEffect(() => {
    if (!uid) return;
    if (localStorage.getItem("onboarding_done") === "1") return;
    if (localStorage.getItem("onboarding_skipped") === "1") return;
    // 检查后端是否已发过奖励（防止清缓存后重复弹窗）
    fetch(`/api/member/bonus-status?uid=${uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.granted) {
          setBonusConfirmed(true);
          // 后端确认已获得，直接标记完成
          localStorage.setItem("onboarding_done", "1");
        }
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      })
      .catch(() => {
        // API不可用时降级到本地存储
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      });
  }, [uid]);

  const dismiss = useCallback(() => {
    setVisible(false);
    // "稍后领取" — 标记为跳过，不标记为完成
    localStorage.setItem("onboarding_skipped", "1");
  }, []);

  const claimAndDone = useCallback(() => {
    setVisible(false);
    // 标记为已完成领取
    localStorage.setItem("onboarding_done", "1");
    localStorage.removeItem("onboarding_skipped");
  }, []);

  const nextStep = useCallback(() => {
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const isLast = step === 3;

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-center justify-center px-6"
        onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      >
        <div
          className="bg-white rounded-[20px] w-full max-w-[320px] p-7 pt-6 text-center animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          <style jsx>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(30px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* 步骤指示器 */}
          <div className="flex justify-center gap-1.5 mb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-brand-teal" : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Step 1: 欢迎 */}
          {step === 1 && (
            <>
              <div className="w-[72px] h-[72px] mx-auto mb-4 rounded-[20px] bg-gradient-to-br from-brand-teal-light/30 to-brand-teal/10 flex items-center justify-center text-[32px]">
                🎉
              </div>
              <h3 className="text-[18px] font-bold text-text mb-1.5">欢迎来到小章鱼</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed mb-5">
                AI 驱动的趣味预测社区<br />
                全民竞技 · 有奖互动 · 智慧娱乐
              </p>
              <button
                onClick={nextStep}
                className="w-full py-3 rounded-[12px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[15px] font-semibold shadow-lg shadow-brand-teal/25 active:scale-[0.97] transition-all"
              >
                下一步：领新人礼包 →
              </button>
              <button
                onClick={dismiss}
                className="block mx-auto mt-3 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                跳过引导，直接进入
              </button>
            </>
          )}

          {/* Step 2: 已获得 150,000 豆 */}
          {step === 2 && (
            <>
              <div className="w-[72px] h-[72px] mx-auto mb-4 rounded-[20px] bg-gradient-to-br from-brand-gold-light/40 to-brand-gold/10 flex items-center justify-center text-[32px] animate-bounce">
                🎉
              </div>
              <h3 className="text-[18px] font-bold text-text mb-1.5">恭喜获得新人礼包</h3>
              <div className="text-[28px] font-extrabold bg-gradient-to-r from-brand-gold to-amber-600 bg-clip-text text-transparent my-2">
                150,000 <span className="text-[14px] text-brand-gold">游戏豆</span>
              </div>
              <p className="text-[12px] text-text-tertiary mb-5">
                已自动发放到您的账户 🎮<br />
                可用于参与、AI预测问答、PK挑战
              </p>
              <button
                onClick={nextStep}
                className="w-full py-3 rounded-[12px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[15px] font-semibold shadow-lg shadow-brand-teal/25 active:scale-[0.97] transition-all"
              >
                下一步：快速上手 →
              </button>
              <button
                onClick={dismiss}
                className="block mx-auto mt-3 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                跳过引导，直接开始
              </button>
            </>
          )}

          {/* Step 3: 快速上手 */}
          {step === 3 && (
            <>
              <div className="w-[72px] h-[72px] mx-auto mb-4 rounded-[20px] bg-gradient-to-br from-[#EEEDFE] to-[#EEEDFE]/40 flex items-center justify-center text-[32px]">
                🚀
              </div>
              <h3 className="text-[18px] font-bold text-text mb-1.5">开始探索</h3>
              <p className="text-[13px] text-text-tertiary mb-4">快速上手小攻略</p>
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center gap-2.5 bg-gray-50 rounded-[8px] px-3 py-2.5 text-left">
                  <span className="w-6 h-6 rounded-[7px] bg-brand-teal-light/30 flex items-center justify-center text-[11px] font-bold text-brand-teal-dark flex-shrink-0">1</span>
                  <span className="text-[12px] text-text-secondary"><strong>看热号</strong> → 首页每日热号推荐，选号不迷茫</span>
                </div>
                <div className="flex items-center gap-2.5 bg-gray-50 rounded-[8px] px-3 py-2.5 text-left">
                  <span className="w-6 h-6 rounded-[7px] bg-brand-gold-light/40 flex items-center justify-center text-[11px] font-bold text-brand-gold-dark flex-shrink-0">2</span>
                  <span className="text-[12px] text-text-secondary"><strong>下预测</strong> → 使用游戏豆参与各种预测</span>
                </div>
                <div className="flex items-center gap-2.5 bg-gray-50 rounded-[8px] px-3 py-2.5 text-left">
                  <span className="w-6 h-6 rounded-[7px] bg-brand-coral-light/40 flex items-center justify-center text-[11px] font-bold text-brand-coral-dark flex-shrink-0">3</span>
                  <span className="text-[12px] text-text-secondary"><strong>赢水晶石</strong> → 预测正确赢取水晶石兑换游戏豆</span>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-full py-3 rounded-[12px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[15px] font-semibold shadow-lg shadow-brand-teal/25 active:scale-[0.97] transition-all"
              >
                🎯 开始体验
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}
