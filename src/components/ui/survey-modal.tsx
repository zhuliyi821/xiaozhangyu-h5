"use client";

import { useState } from "react";
import { X, MessageSquare } from "lucide-react";

interface SurveyProps {
  onClose: () => void;
}

const QUESTIONS = [
  {
    id: "freq",
    q: "你玩数字碰的频率是？",
    options: ["每天多次", "每天1次", "每周2-3次", "偶尔玩玩", "第一次玩"],
  },
  {
    id: "why",
    q: "为什么来玩数字碰？（选最重要的1项）",
    options: ["好奇试试", "有游戏豆没处花", "喜欢选号码的感觉", "想赢水晶石", "无聊打发时间"],
  },
  {
    id: "pick",
    q: "参与时你怎么选号？",
    options: ["每次机选", "生日/幸运数字", "凭感觉随便点", "跟着AI推荐"],
  },
  {
    id: "want",
    q: "你最想看以下哪个功能？",
    options: ["冷热号统计", "奖池金额变化", "其他人中奖记录", "连胜排行榜", "中奖概率说明"],
  },
  {
    id: "say",
    q: "你注意到开奖后的数字碰说了吗？",
    options: ["注意到了，挺有趣的", "看到了但没感觉", "完全没注意到", "有点干扰看结果"],
  },
  {
    id: "satisfy",
    q: "总体满意度",
    options: ["5分 — 非常满意", "4分 — 满意", "3分 — 一般", "2分以下 — 不满意"],
  },
];

export default function SurveyModal({ onClose }: SurveyProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const handleAnswer = (val: string) => {
    const q = QUESTIONS[step];
    const newAns = { ...answers, [q.id]: val };
    setAnswers(newAns);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // 保存问卷结果
      try {
        const existing = JSON.parse(localStorage.getItem("szp_survey") || "[]");
        existing.push({ ...newAns, ts: Date.now() });
        localStorage.setItem("szp_survey", JSON.stringify(existing));
      } catch {}
      setDone(true);
    }
  };

  const q = QUESTIONS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-[16px] w-[88%] max-w-[340px] shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">数字碰 · 小调研</span>
            </div>
            <button onClick={onClose} className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-text-tertiary" />
            </button>
          </div>
          <p className="text-[11px] text-text-tertiary">3个问题就能帮我们做得更好</p>
        </div>

        <div className="px-5 py-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-sm font-semibold mb-1">感谢反馈！</div>
              <div className="text-xs text-text-tertiary">你的意见让数字碰变得更好</div>
            </div>
          ) : (
            <>
              {/* 进度条 */}
              <div className="flex gap-1 mb-4">
                {QUESTIONS.map((_, i) => (
                  <div key={i}
                    className={`flex-1 h-1 rounded-full ${
                      i <= step ? "bg-gradient-to-r from-purple-400 to-pink-400" : "bg-gray-200"
                    }`} />
                ))}
              </div>

              <div className="text-xs text-text-tertiary mb-1">
                第 {step+1}/{QUESTIONS.length} 题
              </div>
              <div className="text-sm font-semibold mb-3">{q.q}</div>

              <div className="flex flex-col gap-2">
                {q.options.map((opt) => (
                  <button key={opt} onClick={() => handleAnswer(opt)}
                    className="w-full text-left px-3.5 py-2.5 rounded-[10px] border border-border-tertiary text-xs
                      hover:border-purple-300 hover:bg-purple-50 transition-all active:scale-[0.98]">
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {done && (
          <div className="px-5 pb-4">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-[8px] bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs font-bold">
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
