"use client";

/**
 * 🔄 兑换中心 — Bottom Sheet 弹窗
 *
 * 支持 4 种兑换方向 + 水晶石激活状态:
 *   1. 水晶石 → 游戏豆 (1:1)
 *   2. 水晶石 → 水晶球50% + 余额50%
 *   3. 余额   → 游戏豆 (1:100)
 *   4. 水晶球 → 游戏豆 (1:100)
 *   5. 激活水晶石 — 消耗游戏豆解冻冻结的水晶石
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/config/api";
import { X, ArrowRightLeft, CheckCircle, Loader2, ShoppingBag, Zap } from "lucide-react";

type ExchangeType = "beans_to_game" | "beans_split" | "balance_to_game" | "crystal_to_game" | "activate";

interface TabDef {
  key: ExchangeType;
  label: string;
  fromLabel?: string;
  toLabel?: string;
  rate?: number;
  fromAsset?: string;
  fromField?: keyof typeof balancesMap;
  minAmount?: number;
}

const balancesMap = {
  credit1: "游戏豆",
  credit5: "水晶石",
  credit4: "余额",
  credit3: "水晶球",
};

const tabs: TabDef[] = [
  { key: "beans_to_game",    label: "水晶石→游戏豆",  fromLabel: "水晶石", toLabel: "游戏豆", rate: 1,   fromAsset: "credit5", fromField: "credit5", minAmount: 10 },
  { key: "balance_to_game",  label: "余额→游戏豆",    fromLabel: "余额",   toLabel: "游戏豆", rate: 100, fromAsset: "credit4", fromField: "credit4", minAmount: 1 },
  { key: "crystal_to_game",  label: "水晶球→游戏豆",  fromLabel: "水晶球", toLabel: "游戏豆", rate: 100, fromAsset: "credit3", fromField: "credit3", minAmount: 1 },
  { key: "beans_split",      label: "水晶石→水晶球+余额", fromLabel: "水晶石", toLabel: "水晶球+余额", rate: 0.5, fromAsset: "credit5", fromField: "credit5", minAmount: 10 },
  { key: "activate",         label: "🔓 激活水晶石" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExchangeModal({ open, onClose, onSuccess }: Props) {
  const { user, refreshBalance } = useAuth();
  const [activeTab, setActiveTab] = useState<ExchangeType>("beans_to_game");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 选中 Tab
  const tab = tabs.find((t) => t.key === activeTab)!;
  const balance = tab.fromField ? (user?.balance?.[tab.fromField] ?? 0) : 0;
  const parsedAmount = parseFloat(amount) || 0;
  // 冻结/可用水晶石 — 统一使用 70% 冻结比例
  const totalCrystal = Math.floor(user?.balance?.credit5 ?? 0);
  const frozenCrystal = Math.floor(totalCrystal * 0.7);
  // 激活相关状态
  const [activateAmount, setActivateAmount] = useState("");
  const parsedActivate = parseInt(activateAmount) || 0;
  const canActivate = parsedActivate > 0 && parsedActivate <= (user?.balance?.credit1 ?? 0);

  // 计算兑换结果
  const getExchangeResult = () => {
    if (parsedAmount <= 0) return null;
    if (activeTab === "activate") return null;
    if (activeTab === "beans_split") {
      const half = parsedAmount / 2;
      return { from: parsedAmount, to: `🔮 ${half.toFixed(1)} 水晶球 + 💰 ¥${half.toFixed(2)}` };
    }
    const toAmount = parsedAmount * (tab.rate ?? 1);
    return { from: parsedAmount, to: `${toAmount.toLocaleString()} ${tab.toLabel}` };
  };

  // 重置
  useEffect(() => {
    if (open) { setAmount(""); setResult(null); setActiveTab("beans_to_game"); }
  }, [open]);

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // 执行兑换
  // 执行激活
  const handleActivate = async () => {
    if (!canActivate || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      await apiFetch("/wallet_api.php", {
        method: "POST",
        params: { action: "activate_crystal" },
        body: JSON.stringify({ uid: user!.uid, game_coins: parsedActivate }),
      });
      await refreshBalance();
      setResult({ ok: true, msg: `✅ 激活成功！${parsedActivate} 水晶石已解锁` });
      setTimeout(() => { setActivateAmount(""); setResult(null); onSuccess(); }, 2000);
    } catch (err) {
      setResult({ ok: false, msg: err instanceof ApiError ? err.message : "激活失败" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExchange = async () => {
    if (activeTab === "activate") return; // 激活不是兑换操作
    if (parsedAmount <= 0 || parsedAmount > balance) return;
    setSubmitting(true);
    setResult(null);
    try {
      if (activeTab === "beans_split") {
        // 水晶石 → 50% 水晶球 + 50% 余额
        await apiFetch("/wallet_api.php", {
          method: "POST",
          params: { action: "exchange_beans_to" },
          body: JSON.stringify({ uid: user!.uid, amount: parsedAmount }),
        });
      } else {
        // 各种 → 游戏豆
        const fromMap: Record<string, string> = {
          beans_to_game: "beans",
          balance_to_game: "balance",
          crystal_to_game: "crystal",
        };
        await apiFetch("/wallet_api.php", {
          method: "POST",
          params: { action: "exchange_to_game" },
          body: JSON.stringify({ uid: user!.uid, from: fromMap[activeTab], amount: parsedAmount * (tab.rate ?? 1) }),
        });
      }
      await refreshBalance();
      setResult({ ok: true, msg: "✅ 兑换成功！" });
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err) {
      setResult({ ok: false, msg: err instanceof ApiError ? err.message : "兑换失败" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const exchangeResult = getExchangeResult();
  const canSubmit = activeTab !== "activate" && parsedAmount > 0 && parsedAmount <= balance && !submitting;
  const canActivateNow = canActivate && !submitting;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[24px] shadow-2xl animate-slide-up"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* 头部 */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {activeTab === "activate" ? (
              <ShoppingBag className="w-5 h-5 text-brand-teal-dark" />
            ) : (
              <ArrowRightLeft className="w-5 h-5 text-brand-teal-dark" />
            )}
            <span className="text-sm font-semibold">
              {activeTab === "activate" ? "🔓 激活水晶石" : "🔄 兑换中心"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-[10px] text-[11px] font-medium transition-all ${
                activeTab === t.key
                  ? "bg-brand-teal-dark text-white shadow-sm"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-5 pt-2 pb-6 space-y-4">

          {/* ===== 激活水晶石 Tab — 真操作界面 ===== */}
          {activeTab === "activate" ? (
            <>
              {/* 冻结状态总览 */}
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-50 rounded-[8px] px-4 py-3 text-center">
                  <div className="text-[10px] text-gray-400">冻结</div>
                  <div className="text-lg font-bold text-brand-coral mt-1">{frozenCrystal}</div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-[8px] px-4 py-3 text-center">
                  <div className="text-[10px] text-gray-400">可用</div>
                  <div className="text-lg font-bold text-brand-teal mt-1">{totalCrystal - frozenCrystal}</div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-[8px] px-4 py-3 text-center">
                  <div className="text-[10px] text-gray-400">总计</div>
                  <div className="text-lg font-bold mt-1">{totalCrystal}</div>
                </div>
              </div>

              {/* 激活操作 */}
              <div className="bg-gradient-to-r from-amber-50 to-brand-gold-light/20 rounded-[8px] p-4 border border-brand-gold/20">
                <div className="flex items-center gap-1.5 mb-3">
                  <Zap className="w-4 h-4 text-brand-gold-dark" />
                  <span className="text-[11px] font-semibold text-amber-800">消耗游戏豆激活水晶石</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={activateAmount}
                    onChange={(e) => setActivateAmount(e.target.value)}
                    placeholder="输入游戏豆数量"
                    className="flex-1 px-4 py-3 bg-white rounded-[8px] text-sm font-medium outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all"
                    min="0"
                    max={user?.balance?.credit1 ?? 0}
                  />
                  <span className="text-[10px] text-gray-400 w-14 text-right">游戏豆</span>
                </div>
                <div className="text-[10px] text-amber-700 mb-1">
                  消耗 1 游戏豆 = 激活 1 水晶石 · 账户余额：{(user?.balance?.credit1 ?? 0).toLocaleString()} 游戏豆
                </div>
                {parsedActivate > frozenCrystal && (
                  <div className="text-[10px] text-brand-coral mb-1">⚠️ 输入超过冻结数量({frozenCrystal})，多余部分将无法激活</div>
                )}
                {/* 快捷选择 */}
                <div className="flex gap-2 mt-2">
                  {[0.25, 0.5, 0.75, 1].map((pct) => {
                    const val = Math.min(Math.floor((user?.balance?.credit1 ?? 0) * pct), frozenCrystal);
                    return (
                      <button
                        key={pct}
                        onClick={() => setActivateAmount(String(val))}
                        className="flex-1 py-1.5 bg-white/60 rounded-[8px] text-[10px] text-gray-400 active:bg-gray-100 transition-colors"
                      >
                        {Math.round(pct * 100)}%
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 激活进度条 */}
              {totalCrystal > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>激活进度</span>
                    <span>{(totalCrystal - frozenCrystal)} / {totalCrystal}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-coral to-brand-teal"
                      style={{ width: `${((totalCrystal - frozenCrystal) / totalCrystal) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 激活结果 */}
              {result && (
                <div className={`px-4 py-2.5 rounded-[10px] text-xs font-medium text-center ${
                  result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {result.msg}
                </div>
              )}

              {/* 确认激活按钮 */}
              <button
                onClick={handleActivate}
                disabled={!canActivate || submitting}
                className={`w-full py-3 rounded-[8px] text-sm font-semibold transition-all active:scale-[0.98] ${
                  canActivate
                    ? "bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white shadow-[0_4px_16px_rgba(242,182,49,0.3)]"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    激活中...
                  </span>
                ) : (
                  `⚡ 消耗 ${parsedActivate || 0} 游戏豆激活水晶石`
                )}
              </button>

              {/* 去消费补充 */}
              <a
                href="/store"
                className="block w-full text-center py-2.5 rounded-[8px] text-[11px] font-medium bg-gray-50 text-gray-500 active:scale-[0.98] transition-transform"
              >
                游戏豆不够？去消费赚豆 🛒
              </a>

              {/* 过期提醒 */}
              <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-red-700">⏰ 过期提醒</span>
                  <span className="text-[10px] text-red-600 font-medium">冻结后 90 天未激活将自动过期</span>
                </div>
                <p className="text-[10px] text-red-500 mt-1">
                  冻结水晶石 90 天内未激活将自动过期清零，请及时消费激活。
                </p>
              </div>
            </>
          ) : (
          <>
          {/* 当前余额 */}
          <div className="flex items-center justify-between bg-gray-50 rounded-[8px] px-4 py-3">
            <span className="text-[11px] text-gray-500">
              当前 {tab.fromLabel}
            </span>
            <span className="text-sm font-bold">
              {tab.fromAsset === "credit4"
                ? `¥${balance.toFixed(2)}`
                : balance.toLocaleString()}
            </span>
          </div>

          {/* 兑换比例 */}
          <div className="text-center">
            <span className="text-[11px] text-gray-400">
              兑换比例：1 {tab.fromLabel}
              {activeTab === "beans_split"
                ? " = 0.5 水晶球 + ¥0.5"
                : ` = ${tab.rate} ${tab.toLabel}`}
            </span>
          </div>

          {/* 输入区 */}
          <div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="输入兑换数量"
                className="flex-1 px-4 py-3 bg-gray-50 rounded-[8px] text-sm font-medium outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all"
                min="0"
                max={balance}
              />
              <span className="text-[11px] text-gray-400 w-12">{tab.fromLabel}</span>
            </div>
            {/* 快捷选择 */}
            {balance > 0 && (
              <div className="flex gap-2 mt-2">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    onClick={() =>
                      setAmount(
                        String(
                          tab.fromAsset === "credit4"
                            ? Math.floor(balance * pct * 100) / 100
                            : Math.floor(balance * pct)
                        )
                      )
                    }
                    className="flex-1 py-1.5 bg-gray-50 rounded-[8px] text-[10px] text-gray-400 active:bg-gray-200 transition-colors"
                  >
                    {Math.round(pct * 100)}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 兑换结果预览 */}
          {exchangeResult && (
            <div className="bg-gradient-to-r from-brand-teal/5 to-brand-teal-dark/5 rounded-[8px] px-4 py-3 border border-brand-teal/10">
              <div className="text-[11px] text-gray-500 mb-1">兑换预览</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  消耗 {tab.fromLabel}: <strong>{exchangeResult.from.toLocaleString()}</strong>
                </span>
                <ArrowRightLeft className="w-4 h-4 text-brand-teal-dark mx-2" />
                <span className="text-xs font-medium text-right">
                  获得: <strong className="text-green-600">{exchangeResult.to}</strong>
                </span>
              </div>
            </div>
          )}

          {/* 结果反馈 */}
          {result && (
            <div className={`px-4 py-2.5 rounded-[10px] text-xs font-medium text-center ${
              result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}>
              {result.msg}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleExchange}
            disabled={!canSubmit}
            className={`w-full py-3 rounded-[8px] text-sm font-semibold transition-all active:scale-[0.98] ${
              canSubmit
                ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-[0_4px_16px_rgba(69,204,213,0.3)]"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                兑换中...
              </span>
            ) : (
              "确认兑换"
            )}
          </button>

          {/* 规则说明 */}
          <div className="bg-gray-50 rounded-[8px] px-4 py-3">
            <div className="text-[10px] text-gray-400 font-medium mb-1">📌 兑换规则</div>
            <ul className="text-[10px] text-gray-400 space-y-0.5">
              <li>· 所有兑换即时生效，不可撤销</li>
              <li>· 最低兑换：{tab.fromAsset === "credit4" ? `¥${tab.minAmount}` : `${tab.minAmount} ${tab.fromLabel}`}</li>
              {activeTab === "beans_split" && <li>· 水晶石拆分后按 50% + 50% 自动分配</li>}
              {activeTab !== "beans_split" && <li>· 游戏豆仅用于投注，不可逆向兑换</li>}
            </ul>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
