"use client";

import { useState } from "react";
import { ArrowLeft, Calculator, Shuffle, Info } from "lucide-react";
import { calculate, CalculateResult } from "@/lib/api";

const LOTTERY_TYPES: Record<string, { name: string; frontMax: number; backMax: number; frontPick: number; backPick: number; price: number }> = {
  dlt: { name: "大乐透", frontMax: 35, backMax: 12, frontPick: 5, backPick: 2, price: 2 },
  ssq: { name: "双色球", frontMax: 33, backMax: 16, frontPick: 6, backPick: 1, price: 2 },
  pl3: { name: "排列3", frontMax: 10, backMax: 0, frontPick: 3, backPick: 0, price: 2 },
  fc3d: { name: "3D", frontMax: 10, backMax: 0, frontPick: 3, backPick: 0, price: 2 },
  qxc: { name: "七星彩", frontMax: 10, backMax: 0, frontPick: 7, backPick: 0, price: 2 },
  kl8: { name: "快乐8", frontMax: 80, backMax: 0, frontPick: 10, backPick: 0, price: 2 },
};

type CalcMode = "compound" | "bold";

export default function CalculatorPage() {
  const [type, setType] = useState("dlt");
  const [mode, setMode] = useState<CalcMode>("compound");
  const [frontCount, setFrontCount] = useState(5);
  const [backCount, setBackCount] = useState(2);
  const [boldFront, setBoldFront] = useState(2);
  const [boldBack, setBoldBack] = useState(1);
  const [dragFront, setDragFront] = useState(3);
  const [dragBack, setDragBack] = useState(1);
  const [bets, setBets] = useState(1);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const cfg = LOTTERY_TYPES[type];

  // For compound mode: show selected numbers in a visual grid
  const [selectedFront, setSelectedFront] = useState<number[]>([]);
  const [selectedBack, setSelectedBack] = useState<number[]>([]);
  const [boldFrontNums, setBoldFrontNums] = useState<number[]>([]);
  const [dragFrontNums, setDragFrontNums] = useState<number[]>([]);

  const resetSelection = () => {
    setResult(null);
    setSelectedFront([]);
    setSelectedBack([]);
    setBoldFrontNums([]);
    setDragFrontNums([]);
    setFrontCount(cfg.frontPick);
    setBackCount(cfg.backPick);
    setBoldFront(1);
    setBoldBack(0);
    setDragFront(cfg.frontPick - 1);
    setDragBack(cfg.backPick);
  };

  const handleCalc = async () => {
    setLoading(true);
    try {
      if (mode === "bold") {
        // Compute bold-drag locally
        const combos = calcBoldCombos(boldFront, dragFront, cfg.frontPick, boldBack, dragBack, cfg.backPick);
        const totalAmount = combos * cfg.price * bets;
        setResult({
          type,
          front_count: boldFront + dragFront,
          back_count: boldBack + dragBack,
          bets,
          total_notes: combos,
          total_amount: totalAmount,
          combinations: `C(${dragFront},${cfg.frontPick - boldFront}) × ${cfg.backPick > 0 ? `C(${dragBack},${cfg.backPick - boldBack})` : '1'}`,
        });
      } else {
        const res = await calculate(type, frontCount, backCount, bets);
        setResult(res);
      }
    } catch {
      setResult(null);
    }
    setLoading(false);
  };

  const toggleNumber = (n: number, list: number[], setter: (v: number[]) => void, max: number) => {
    if (list.includes(n)) setter(list.filter(x => x !== n));
    else if (list.length < max) setter([...list, n].sort((a, b) => a - b));
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => window.history.back()} className="text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-semibold flex-1">参与计算器</h1>
        </div>
        {/* Type tabs */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
          {Object.entries(LOTTERY_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => { setType(k); resetSelection(); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                type === k ? "bg-brand-teal text-white shadow-sm" : "bg-surface text-text-secondary border border-[rgba(69,204,213,0.08)]"
              }`}>{v.name}</button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {/* Mode selector */}
        <div className="flex bg-surface rounded-[8px] p-[3px] shadow-sm border border-[rgba(69,204,213,0.06)]">
          {[
            { key: "compound" as CalcMode, label: "复式参与", desc: "多选号码" },
            { key: "bold" as CalcMode, label: "胆拖参与", desc: "胆码+拖码" },
          ].map(m => (
            <button key={m.key} onClick={() => { setMode(m.key); setResult(null); }}
              className={`flex-1 py-2 text-center rounded-[11px] text-xs font-medium transition-colors ${
                mode === m.key ? "bg-brand-teal text-white shadow-sm" : "text-text-secondary"
              }`}>
              <div className="font-semibold">{m.label}</div>
              <div className="text-[9px] opacity-70">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Compound mode */}
        {mode === "compound" && (
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
            <div className="text-xs font-semibold mb-3">📊 复式参与参数</div>
            {/* Front */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-text-tertiary">前区选号（选{cfg.frontPick}~{cfg.frontMax}个）</span>
                <span className="text-xs font-bold text-brand-coral">{frontCount} 个</span>
              </div>
              <input type="range" min={cfg.frontPick} max={Math.min(cfg.frontMax, 16)} value={frontCount}
                onChange={e => { setFrontCount(Number(e.target.value)); setResult(null); }}
                className="w-full accent-brand-teal" />
              <div className="flex justify-between text-[9px] text-text-tertiary mt-0.5">
                <span>至少{cfg.frontPick}个</span>
                <span>¥{(frontCount > cfg.frontPick ? calcPrice(frontCount, backCount, cfg) : cfg.price).toFixed(0)}</span>
              </div>
            </div>
            {/* Back */}
            {cfg.backMax > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-text-tertiary">后区选号（选{cfg.backPick}~{cfg.backMax}个）</span>
                  <span className="text-xs font-bold text-brand-teal-dark">{backCount} 个</span>
                </div>
                <input type="range" min={cfg.backPick} max={Math.min(cfg.backMax, 8)} value={backCount}
                  onChange={e => { setBackCount(Number(e.target.value)); setResult(null); }}
                  className="w-full accent-brand-teal" />
                <div className="flex justify-between text-[9px] text-text-tertiary mt-0.5">
                  <span>至少{cfg.backPick}个</span>
                  <span>¥{calcPrice(frontCount, backCount, cfg).toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Quick preview: combinations */}
            <div className="bg-bg rounded-[8px] p-3 mb-3">
              <div className="text-[10px] text-text-tertiary">组合预览</div>
              <div className="text-base font-bold mt-0.5">
                {calcCombos(frontCount, cfg.frontPick, cfg.backPick > 0 ? backCount : 0, cfg.backPick > 0 ? cfg.backPick : 0)} 注
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5">
                金额: ¥{(calcCombos(frontCount, cfg.frontPick, backCount, cfg.backPick) * cfg.price * bets).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Bold-Drag mode */}
        {mode === "bold" && (
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
            <div className="text-xs font-semibold mb-3">🎯 胆拖参与参数</div>
            <div className="text-[10px] text-text-tertiary mb-3">胆码：每注必选的号码 / 拖码：与胆码组合的号码</div>

            {/* Front bold */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-text-tertiary">前区胆码</span>
                <span className="text-xs font-bold text-brand-coral">{boldFront} 个</span>
              </div>
              <input type="range" min={1} max={cfg.frontPick - 1} value={boldFront}
                onChange={e => setBoldFront(Number(e.target.value))} className="w-full accent-brand-coral" />
            </div>
            {/* Front drag */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-text-tertiary">前区拖码</span>
                <span className="text-xs font-bold">{dragFront} 个</span>
              </div>
              <input type="range" min={1} max={cfg.frontMax - boldFront} value={dragFront}
                onChange={e => setDragFront(Number(e.target.value))} className="w-full accent-brand-teal" />
            </div>
            {/* Back bold */}
            {cfg.backMax > 0 && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-text-tertiary">后区胆码</span>
                  <span className="text-xs font-bold text-brand-gold-dark">{boldBack} 个</span>
                </div>
                <input type="range" min={0} max={cfg.backPick - 1} value={boldBack}
                  onChange={e => setBoldBack(Number(e.target.value))} className="w-full accent-brand-gold" />
              </div>
            )}
            {/* Back drag */}
            {cfg.backMax > 0 && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-text-tertiary">后区拖码</span>
                  <span className="text-xs font-bold">{dragBack} 个</span>
                </div>
                <input type="range" min={cfg.backPick - boldBack} max={cfg.backMax - boldBack} value={dragBack}
                  onChange={e => setDragBack(Number(e.target.value))} className="w-full accent-brand-teal" />
              </div>
            )}

            {/* Preview */}
            <div className="bg-bg rounded-[8px] p-3">
              <div className="text-[10px] text-text-tertiary">胆拖组合</div>
              <div className="text-sm font-bold mt-0.5">
                胆码 {boldFront}{boldBack > 0 ? `+${boldBack}` : ""} /
                拖码 {dragFront}{dragBack > 0 ? `+${dragBack}` : ""}
                = {calcBoldCombos(boldFront, dragFront, cfg.frontPick, boldBack, dragBack, cfg.backPick)} 注
              </div>
            </div>
          </div>
        )}

        {/* Bets */}
        <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">💰 倍数设置</span>
            <span className="text-sm font-bold text-brand-coral">{bets} 倍</span>
          </div>
          <input type="range" min={1} max={99} value={bets}
            onChange={e => setBets(Number(e.target.value))} className="w-full accent-brand-coral" />
          <div className="flex justify-between text-[9px] text-text-tertiary mt-0.5">
            <span>1倍</span><span>50倍</span><span>99倍</span>
          </div>
        </div>

        {/* Calculate button */}
        <button onClick={handleCalc} disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20">
          <Calculator className="w-4 h-4" /> {loading ? "计算中..." : "计算参与金额"}
        </button>

        {/* Result */}
        {result && (
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold">✅ 计算结果</span>
              <button onClick={() => setShowDetail(!showDetail)} className="text-[10px] text-brand-teal flex items-center gap-1">
                <Info className="w-3 h-3" /> {showDetail ? "收起" : "详情"}
              </button>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-bg rounded-[8px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">组合数</div>
                <div className="text-lg font-bold">{result.total_notes} 注</div>
              </div>
              <div className="bg-bg rounded-[8px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">参与倍数</div>
                <div className="text-lg font-bold">{bets}x</div>
              </div>
              <div className="bg-gradient-to-br from-brand-coral/10 to-brand-gold/10 rounded-[8px] p-3 text-center border border-brand-coral/20">
                <div className="text-[10px] text-text-tertiary">总金额</div>
                <div className="text-xl font-bold text-brand-coral">¥{result.total_amount.toFixed(2)}</div>
              </div>
            </div>

            {/* Formulas */}
            <details className="bg-bg rounded-[8px] p-3">
              <summary className="text-[11px] font-medium cursor-pointer">参与方案公式</summary>
              <div className="mt-2 text-[10px] text-text-tertiary space-y-1">
                <p>前区选 {frontCount} 个 → C({frontCount},{cfg.frontPick}) = {combFormula(frontCount, cfg.frontPick)}</p>
                {cfg.backMax > 0 && <p>后区选 {backCount} 个 → C({backCount},{cfg.backPick}) = {combFormula(backCount, cfg.backPick)}</p>}
                <p>总组合: {result.combinations}</p>
                <p className="text-brand-coral font-semibold">总金额: {result.total_notes}注 × ¥{cfg.price}/注 × {bets}倍 = ¥{result.total_amount.toFixed(2)}</p>
              </div>
            </details>
          </div>
        )}

        {/* Probability info */}
        <details className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
          <summary className="text-[11px] font-semibold cursor-pointer">📖 中奖概率参考</summary>
          <div className="mt-3 text-[10px] text-text-tertiary space-y-1.5 leading-relaxed">
            <p>• 大乐透头奖概率: 1/21,425,712</p>
            <p>• 双色球头奖概率: 1/17,721,088</p>
            <p>• 复式参与会按选择号码数组合成多注单式票</p>
            <p>• 胆拖参与: 胆码+拖码组合成多注 (胆码每注必含)</p>
            <p>• 参与金额 = 组合数 × 2元/注 × 倍数</p>
          </div>
        </details>
      </div>
    </main>
  );
}

/* ─── Helper functions ─── */

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function combination(n: number, k: number): number {
  if (k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function calcCombos(front: number, fPick: number, back: number, bPick: number): number {
  return combination(front, fPick) * (bPick > 0 ? combination(back, bPick) : 1);
}

function calcBoldCombos(bF: number, dF: number, fPick: number, bB: number, dB: number, bPick: number): number {
  return combination(dF, fPick - bF) * (bPick > 0 ? combination(dB, bPick - bB) : 1);
}

function calcPrice(front: number, back: number, cfg: typeof LOTTERY_TYPES[string]): number {
  return calcCombos(front, cfg.frontPick, back, cfg.backPick) * cfg.price;
}

function combFormula(n: number, k: number): string {
  if (k > n) return "0";
  return `${combination(n, k).toLocaleString()}`;
}
