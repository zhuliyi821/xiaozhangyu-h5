"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, History, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_BASE, apiFetch, ApiError } from "@/config/api";
import { useAuth } from "@/lib/auth-context";

const ASSETS: Record<string, { icon: string; label: string; color: string; desc: string; note: string; exchange?: string }> = {
  credit1: { icon: "🎮", label: "游戏豆", color: "from-brand-teal to-brand-teal-dark", desc: "流通币，用于参与、投票、AI 会话消耗", note: "游戏豆不可反向兑换为其他资产" },
  credit2: { icon: "🫘", label: "闲豆", color: "from-brand-teal to-brand-gold", desc: "商城券，仅限商城内消费使用", note: "仅通过物资/服务置换获得，不可通过任务获得" },
  credit3: { icon: "🔮", label: "水晶球", color: "from-brand-coral to-brand-gold", desc: "荣誉值，享有赢家盈利分红", note: "每个赢家盈利的 5% 水晶石分给所有水晶球持有人，按持有比例分配", exchange: "1:100 → 游戏豆" },
  credit4: { icon: "💰", label: "余额", color: "from-brand-gold to-brand-gold-dark", desc: "现金资产，可用于消费和购物", note: "¥1.00 = 100 游戏豆", exchange: "1:100 → 游戏豆" },
  credit5: { icon: "⛏️", label: "水晶石", color: "from-brand-coral to-brand-coral-dark", desc: "PK 竞技奖励，可用于兑换游戏豆", note: "注册赠送游戏豆赢得的水晶石 100% 冻结，需消耗游戏豆激活", exchange: "1:1 → 游戏豆" },
};

// 模拟流水账数据（可按实际 API 替换）
const genLedger = (asset: string) => {
  const base: Record<string, { items: { date: string; time: string; action: string; ref: string; change: string; balance: string; type: "in" | "out" }[] }> = {
    credit1: { items: [
      { date: "今天", time: "16:30", action: "参与", ref: "双色球·第2026178期", change: "-500", balance: "967,000", type: "out" },
      { date: "今天", time: "14:00", action: "充值", ref: "余额兑换", change: "+10,000", balance: "967,500", type: "in" },
      { date: "今天", time: "12:20", action: "AI 会话", ref: "咨询运势", change: "-100", balance: "957,500", type: "out" },
      { date: "昨天", time: "20:15", action: "PK 投票", ref: "娱乐竞技", change: "-200", balance: "957,600", type: "out" },
      { date: "昨天", time: "10:00", action: "签到奖励", ref: "每日签到", change: "+500", balance: "957,800", type: "in" },
      { date: "07-06", time: "18:30", action: "兑换", ref: "水晶石→游戏豆", change: "+1,000", balance: "957,300", type: "in" },
    ]},
    credit2: { items: [
      { date: "昨天", time: "10:30", action: "商城消费", ref: "购买商品", change: "-200", balance: "800", type: "out" },
      { date: "07-06", time: "15:00", action: "置换获得", ref: "到店消费兑换", change: "+1,000", balance: "1,000", type: "in" },
    ]},
    credit3: { items: [
      { date: "今天", time: "08:00", action: "分红发放", ref: "赢家盈利分红", change: "+50", balance: "238", type: "in" },
      { date: "07-05", time: "08:00", action: "分红发放", ref: "赢家盈利分红", change: "+35", balance: "188", type: "in" },
    ]},
    credit4: { items: [
      { date: "07-05", time: "09:15", action: "充值", ref: "微信支付", change: "+¥100.00", balance: "¥100.00", type: "in" },
      { date: "07-04", time: "18:30", action: "兑换", ref: "余额→游戏豆", change: "-¥20.00", balance: "¥0.00", type: "out" },
    ]},
    credit5: { items: [
      { date: "今天", time: "17:00", action: "PK 获胜", ref: "娱乐竞技", change: "+500", balance: "500", type: "in" },
      { date: "今天", time: "15:00", action: "兑换", ref: "水晶石→游戏豆", change: "-1,000", balance: "0", type: "out" },
      { date: "昨天", time: "21:00", action: "PK 获胜", ref: "有奖竞猜", change: "+2,000", balance: "1,000", type: "in" },
    ]},
  };
  return base[asset]?.items || [];
};

export default function AssetDetailPage() {
  const { asset } = useParams<{ asset: string }>();
  const { user } = useAuth();
  const config = ASSETS[asset];

  const [balance, setBalance] = useState<number>(0);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.uid || 0;
    if (!uid || !asset) { setLoading(false); return; }
    apiFetch<any>("/wallet_api.php", { params: { uid: String(uid), action: "balance" } })
      .then(d => {
        const val = asset === "credit4" ? d[asset] : Math.floor(d[asset] ?? 0);
        setBalance(val);
        setLabel(d[`${asset}_label`] || config?.label || asset);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, asset]);

  if (!config) {
    return (
      <main className="min-h-screen bg-bg pb-20 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">资产不存在</p>
      </main>
    );
  }

  const ledger = genLedger(asset);
  const formatBalance = (n: number) => {
    if (asset === "credit4") return `¥${n.toFixed(2)}`;
    return n.toLocaleString();
  };

  // 按日期分组
  const grouped = ledger.reduce<Record<string, typeof ledger>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/exchange" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold text-text-primary">{config.label} · 流水</span>
          </Link>
          {asset !== "credit1" && asset !== "credit2" && (
            <Link href="/exchange" className="text-[10px] bg-brand-teal/10 text-brand-teal-dark font-medium px-3 py-1.5 rounded-full hover:bg-brand-teal/20 transition-colors">
              去兑换
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-6 space-y-4">
          <div className="h-24 bg-gray-100 rounded-[12px] animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-[12px] animate-pulse" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto">

          {/* ── 余额概览（紧凑） ── */}
          <div className={`bg-gradient-to-br ${config.color} mx-4 mt-4 rounded-[12px] p-4 text-white shadow-soft`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/70 font-medium tracking-wider flex items-center gap-1.5">
                  <span>{config.icon}</span> {config.label}
                </div>
                <div className="text-[22px] font-bold mt-0.5 tracking-tight">{formatBalance(balance)}</div>
              </div>
              {config.exchange && (
                <div className="text-[10px] text-white/80 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  {config.exchange}
                </div>
              )}
            </div>
          </div>

          {/* ── 说明（紧凑折叠） ── */}
          {config.note && (
            <div className="mx-4 mt-3 bg-white rounded-[10px] border border-brand-teal/10 px-4 py-2.5 text-[10px] text-text-tertiary leading-relaxed">
              {config.icon} {config.note}
            </div>
          )}

          {/* ── 流水账本 ── */}
          <div className="mx-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-brand-teal" />
              <span className="text-[12px] font-bold text-text-primary">流水账本</span>
              <span className="text-[10px] text-text-tertiary">{ledger.length} 条记录</span>
            </div>

            {ledger.length === 0 ? (
              <div className="bg-white rounded-[12px] border border-brand-teal/10 p-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-[11px] text-text-tertiary">暂无流水记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    {/* 日期分组标题 */}
                    <div className="text-[10px] text-text-tertiary font-medium mb-2 px-1">{date}</div>

                    {/* 流水条目 */}
                    <div className="bg-white rounded-[12px] border border-brand-teal/10 shadow-soft overflow-hidden divide-y divide-gray-50">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors">
                          {/* 类型指示器 */}
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${item.type === "in" ? "bg-brand-teal" : "bg-brand-coral"}`} />

                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-medium text-text-primary">{item.action}</span>
                              <span className="text-[9px] text-text-tertiary truncate">{item.ref}</span>
                            </div>
                            <div className="text-[10px] text-text-tertiary mt-0.5">{item.time}</div>
                          </div>

                          {/* 金额 + 余额 */}
                          <div className="text-right shrink-0">
                            <div className={`text-[12px] font-semibold ${item.type === "in" ? "text-brand-teal-dark" : "text-brand-coral"}`}>
                              {item.change}
                            </div>
                            <div className="text-[9px] text-text-tertiary">余额 {item.balance}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </main>
  );
}
