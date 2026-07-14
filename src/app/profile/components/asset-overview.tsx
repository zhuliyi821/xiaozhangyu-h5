"use client";

/** 💰 资产概览：4项关键资产（游戏豆/水晶石/水晶球/余额） */
interface Props {
  credits: { credit1: number; credit2: number; credit3: number; credit4: number; credit5: number };
  loading?: boolean;
}

export default function AssetOverview({ credits, loading }: Props) {
  if (loading) {
    return (
      <div className="mx-4 -mt-5">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-[10px] p-3 text-center shadow-sm border border-gray-100 animate-pulse">
              <div className="w-5 h-5 bg-gray-100 rounded-full mx-auto mb-1" />
              <div className="h-4 w-12 bg-gray-100 rounded mx-auto mb-0.5" />
              <div className="h-2.5 w-10 bg-gray-50 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { icon: "🎮", value: formatAsset(credits.credit1), label: "游戏豆", href: "/assets?tab=credit1" },
    { icon: "⛏️", value: formatAsset(credits.credit5), label: "水晶石", href: "/assets?tab=credit5" },
    { icon: "🔮", value: formatAsset(credits.credit3), label: "水晶球", href: "/assets?tab=credit3" },
    { icon: "💰", value: credits.credit4.toFixed(2), label: "余额(¥)", href: "/assets?tab=credit4" },
  ];

  return (
    <div className="mx-4 -mt-5">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => window.location.href = item.href}
            className="bg-white rounded-[10px] py-3 text-center shadow-sm border border-gray-100 active:scale-[0.96] transition-transform cursor-pointer"
          >
            <div className="text-base mb-0.5">{item.icon}</div>
            <div className="text-xs font-bold text-text-primary">{item.value}</div>
            <div className="text-[9px] text-text-tertiary mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAsset(n: number): string {
  if (n >= 100000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(Math.floor(n));
}
