"use client";

interface PricePanelProps {
  name: string;
  contract: string;
  desc: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  preClose: number;
}

export function PricePanel({ name, contract, desc, price, change, changePct, open, high, low, preClose }: PricePanelProps) {
  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold">{name}</span>
            <span className="text-[10px] bg-bg px-2 py-0.5 rounded text-text-tertiary">{contract}合约</span>
          </div>
          <div className="text-[10px] text-text-tertiary mt-0.5">{desc}</div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold">{price > 0 ? price.toFixed(2) : "加载中"}</div>
          <div className={`text-[12px] font-medium ${change >= 0 ? "text-brand-coral" : "text-brand-teal"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-2 text-center">
        {[
          { label: "开盘", val: open > 0 ? open.toFixed(2) : "—" },
          { label: "最高", val: high > 0 ? high.toFixed(2) : "—" },
          { label: "最低", val: low > 0 ? low.toFixed(2) : "—" },
          { label: "昨收", val: preClose > 0 ? preClose.toFixed(2) : "—" },
        ].map((d, i) => (
          <div key={i} className="bg-bg rounded-xl py-2">
            <div className="text-[10px] text-text-tertiary">{d.label}</div>
            <div className="text-[13px] font-semibold">{d.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
