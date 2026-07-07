"use client";

export default function AIGuessCard() {
  return (
    <div className="mx-3 mt-3 rounded-[16px] bg-white border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🐙</span>
        <span className="text-[12px] font-medium text-gray-700">AI瞎猜</span>
        <span className="text-[9px] bg-brand-teal-light/30 text-brand-teal-dark rounded-full px-2 py-0.5">
          娱乐
        </span>
      </div>
      <div className="flex gap-2 mb-2">
        {["明天大盘涨跌", "今天彩票号码", "你的幸运色"].map((q, i) => (
          <button
            key={i}
            className="flex-1 text-[10px] bg-gray-50 rounded-lg py-2 px-1 text-gray-500 hover:bg-brand-teal-light/20 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="bg-gradient-to-r from-brand-teal-light/20 to-transparent rounded-lg p-2.5">
        <div className="text-[11px] text-gray-600 leading-relaxed">
          🤔 点一点上面，让小章鱼给你算一卦～
        </div>
      </div>
    </div>
  );
}
