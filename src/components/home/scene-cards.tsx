"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";

interface SceneItem {
  icon: string;
  quote: string;
  debate: string;
  optionA: string;
  optionB: string;
  votesA: number;
  votesB: number;
  category: "home" | "worry" | "fun";
}

const ALL_SCENES: SceneItem[] = [
  // ── 🏠 在家憋屈 ──
  {
    icon: "🏠",
    quote: "老公回家就打游戏，说他两句就嫌我烦",
    debate: "是老公太自私，还是你管太多？",
    optionA: "老公太自私",
    optionB: "你管太多",
    votesA: 342, votesB: 56,
    category: "home",
  },
  {
    icon: "👶",
    quote: "我妈带娃总说'我当年就是这样带你的'，但现在的育儿方式不一样了啊",
    debate: "该听老人的经验，还是坚持科学育儿？",
    optionA: "听老人的",
    optionB: "坚持科学",
    votesA: 203, votesB: 567,
    category: "home",
  },
  {
    icon: "🥣",
    quote: "婆婆非要给孩子喝十全大补汤，我说中医不科学她跟我急",
    debate: "中医调理到底靠不靠谱？",
    optionA: "中医靠谱",
    optionB: "信科学",
    votesA: 89, votesB: 256,
    category: "home",
  },
  // ── 😰 正在焦心 ──
  {
    icon: "💼",
    quote: "35岁真的会被裁员吗？我现在转行还来得及吗？",
    debate: "35岁危机是真实的还是贩卖焦虑？",
    optionA: "真实存在",
    optionB: "贩卖焦虑",
    votesA: 892, votesB: 420,
    category: "worry",
  },
  {
    icon: "🏡",
    quote: "学区房价格跌了20%，现在到底该不该上车？",
    debate: "现在是抄底的好时机吗？",
    optionA: "赶紧上车",
    optionB: "再等等",
    votesA: 310, votesB: 654,
    category: "worry",
  },
  {
    icon: "📚",
    quote: "孩子期中考试全班倒数，是该逼他补课还是让他快乐就好？",
    debate: "鸡娃 VS 放养，哪个对孩子更好？",
    optionA: "补课要紧",
    optionB: "快乐就好",
    votesA: 205, votesB: 478,
    category: "worry",
  },
  // ── 🍵 茶余饭后 ──
  {
    icon: "🎵",
    quote: "周杰伦和林俊杰谁才是华语乐坛天花板？我和同事吵了一下午了！",
    debate: "谁的成就更高？",
    optionA: "周杰伦",
    optionB: "林俊杰",
    votesA: 1283, votesB: 632,
    category: "fun",
  },
  {
    icon: "🍲",
    quote: "海底捞和巴奴到底哪个好吃？朋友请客该选哪家？",
    debate: "请客选海底捞还是巴奴？",
    optionA: "海底捞",
    optionB: "巴奴",
    votesA: 934, votesB: 451,
    category: "fun",
  },
  {
    icon: "🔇",
    quote: "隔壁邻居天天半夜剁肉馅，我该敲门还是忍了？",
    debate: "邻里噪音，正面刚还是忍气吞声？",
    optionA: "敲门沟通",
    optionB: "忍忍算了",
    votesA: 158, votesB: 386,
    category: "fun",
  },
];

const CATEGORY_TABS = [
  { key: "all", label: "全部" },
  { key: "home", label: "🏠 憋屈事" },
  { key: "worry", label: "😰 焦心事" },
  { key: "fun", label: "🍵 扯闲篇" },
] as const;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SceneCards() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [visibleScenes, setVisibleScenes] = useState<SceneItem[]>(() =>
    shuffleArray(ALL_SCENES).slice(0, 3)
  );
  const [voteState, setVoteState] = useState<Record<number, "A" | "B">>({});
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  // 按分类过滤后的场景
  const filteredScenes = useMemo(() => {
    if (activeTab === "all") return ALL_SCENES;
    return ALL_SCENES.filter(s => s.category === activeTab);
  }, [activeTab]);

  const refreshScenes = useCallback(() => {
    const pool = filteredScenes;
    if (pool.length <= 3) {
      setVisibleScenes(shuffleArray(pool).slice(0, 3));
      setUsedIndices(new Set());
      return;
    }
    // 尽量不重复展示
    const available = pool.filter((_, i) => !usedIndices.has(i));
    if (available.length < 3) {
      // 池子用完了，重置
      setUsedIndices(new Set());
      const fresh = shuffleArray(pool).slice(0, 3);
      setVisibleScenes(fresh);
      return;
    }
    const shuffled = shuffleArray(available);
    const picked = shuffled.slice(0, 3);
    setVisibleScenes(picked);
    setUsedIndices(prev => {
      const next = new Set(prev);
      picked.forEach((_, i) => {
        const idx = pool.indexOf(picked[i]);
        if (idx >= 0) next.add(idx);
      });
      return next;
    });
  }, [filteredScenes, usedIndices]);

  const handleVote = (sceneIndex: number, choice: "A" | "B") => {
    setVoteState(prev => {
      // 如果已投过，取消
      if (prev[sceneIndex] === choice) {
        const next = { ...prev };
        delete next[sceneIndex];
        return next;
      }
      return { ...prev, [sceneIndex]: choice };
    });
  };

  // 找到场景在 ALL_SCENES 中的索引
  const getGlobalIndex = (scene: SceneItem): number => {
    return ALL_SCENES.indexOf(scene);
  };

  return (
    <div className="bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm overflow-hidden">
      {/* 标题行 */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-text-primary">🔥 说的就是你</span>
            <span className="text-[9px] bg-brand-teal text-white px-2 py-[1px] rounded-full font-medium">热门</span>
          </div>
          <button
            onClick={refreshScenes}
            className="text-[11px] text-brand-teal font-medium flex items-center gap-1 active:scale-95 transition-transform"
          >
            🔄 换一个话题
          </button>
        </div>

        {/* 分类 Tab */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setUsedIndices(new Set()); }}
              className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-brand-teal text-white font-medium"
                  : "bg-gray-50 text-text-tertiary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 场景列表 */}
      <div className="px-4 pb-1 flex flex-col gap-3">
        {visibleScenes.map((scene, i) => {
          const gIdx = getGlobalIndex(scene);
          const myVote = voteState[gIdx];
          const total = scene.votesA + scene.votesB;

          return (
            <div key={`${gIdx}`}
              className="rounded-[10px] border border-[rgba(69,204,213,0.06)] bg-gradient-to-br from-white to-gray-50/30 overflow-hidden"
            >
              {/* 引语 */}
              <div className="px-3.5 pt-3 pb-2">
                <div className="flex items-start gap-2">
                  <span className="text-[18px] flex-shrink-0 mt-0.5">{scene.icon}</span>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary leading-relaxed">
                      "{scene.quote}"
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-1">
                      {scene.debate}
                    </div>
                  </div>
                </div>
              </div>

              {/* 投票按钮 */}
              <div className="px-3.5 pb-3 flex gap-2">
                {/* 选项 A */}
                <button
                  onClick={() => handleVote(gIdx, "A")}
                  className={`flex-1 rounded-[8px] py-2.5 px-2 text-[12px] font-medium text-center transition-all ${
                    myVote === "A"
                      ? "bg-brand-teal text-white shadow-sm"
                      : "bg-brand-teal-light/20 text-brand-teal-dark border border-brand-teal/15"
                  }`}
                >
                  <div>{scene.optionA}</div>
                  <div className={`text-[10px] mt-0.5 ${
                    myVote === "A" ? "text-white/70" : "text-text-tertiary"
                  }`}>
                    {scene.votesA.toLocaleString()} 票 · {Math.round(scene.votesA / total * 100)}%
                  </div>
                </button>

                {/* 选项 B */}
                <button
                  onClick={() => handleVote(gIdx, "B")}
                  className={`flex-1 rounded-[8px] py-2.5 px-2 text-[12px] font-medium text-center transition-all ${
                    myVote === "B"
                      ? "bg-brand-coral text-white shadow-sm"
                      : "bg-brand-coral-light/20 text-brand-coral-dark border border-brand-coral/15"
                  }`}
                >
                  <div>{scene.optionB}</div>
                  <div className={`text-[10px] mt-0.5 ${
                    myVote === "B" ? "text-white/70" : "text-text-tertiary"
                  }`}>
                    {scene.votesB.toLocaleString()} 票 · {Math.round(scene.votesB / total * 100)}%
                  </div>
                </button>
              </div>

              {/* 投票反馈 */}
              {myVote && (
                <div className="px-3.5 pb-3">
                  <div className="bg-gradient-to-r from-brand-teal/5 to-brand-coral/5 rounded-[8px] py-2 px-3 text-[11px] text-text-secondary text-center">
                    ✅ 你支持了「{myVote === "A" ? scene.optionA : scene.optionB}」
                    · 已有 {(myVote === "A" ? scene.votesA : scene.votesB).toLocaleString()} 人和你站一边
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA 底部 */}
      <Link href="/pk-hall"
        className="block mx-4 mb-3.5 rounded-[10px] bg-gradient-to-r from-brand-teal to-brand-teal-dark py-3 text-center active:scale-[0.98] transition-transform shadow-sm">
        <div className="text-[14px] font-semibold text-white">发起pk · 赢输家的豆-5%</div>
        <div className="text-[11px] text-white/70 mt-0.5">
          围观分享奖-5% · 门店奖-5% · 招商奖-3%
        </div>
      </Link>
    </div>
  );
}
