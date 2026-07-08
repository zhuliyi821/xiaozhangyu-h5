"use client";

import Link from "next/link";

const chips = [
  { name: "大乐透", key: "dlt" },
  { name: "双色球", key: "ssq" },
  { name: "排列3", key: "pl3" },
  { name: "3D", key: "fc3d" },
  { name: "快乐8", key: "kl8" },
  { name: "七星彩", key: "qxc" },
];

export function LotteryScroll() {
  return (
    <section className="mt-5 px-4">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-teal to-brand-gold">
          更多彩种
        </h2>
        <span className="text-xs text-brand-teal font-medium">全部</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={`/lottery/${chip.key}/chart`}
            className="flex-shrink-0 px-4 py-2 rounded-[4px] text-xs font-medium transition-all duration-250 whitespace-nowrap bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-brand-teal hover:to-brand-gold hover:text-white"
          >
            {chip.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
