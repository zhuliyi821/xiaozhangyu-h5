"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, SwitchCamera, Scan } from "lucide-react";
import { verifyNumbers, VerifyResult } from "@/lib/api";

const prizeTiers: Record<string, { name: string; match: string; color: string }> = {
  "一等奖": { name: "一等奖", match: "5+2", color: "from-red-500 to-red-700" },
  "二等奖": { name: "二等奖", match: "5+1", color: "from-orange-500 to-orange-700" },
  "三等奖": { name: "三等奖", match: "5+0", color: "from-amber-500 to-amber-700" },
  "四等奖": { name: "四等奖", match: "4+2", color: "from-yellow-500 to-yellow-700" },
  "五等奖": { name: "五等奖", match: "4+1", color: "from-green-500 to-green-700" },
  "六等奖": { name: "六等奖", match: "3+2", color: "from-teal-500 to-teal-700" },
  "七等奖": { name: "七等奖", match: "4+0", color: "from-blue-500 to-blue-700" },
  "八等奖": { name: "八等奖", match: "3+1/2+2", color: "from-indigo-500 to-indigo-700" },
  "九等奖": { name: "九等奖", match: "3+0/2+1/1+2/0+2", color: "from-purple-500 to-purple-700" },
};

const quickInputs = [
  { label: "随机生成", gen: true },
  { label: "清空", clear: true },
];

export default function ScanPage() {
  const [mode, setMode] = useState<"scan" | "manual">("manual");
  const [frontInput, setFrontInput] = useState("");
  const [backInput, setBackInput] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch { alert("无法启动相机，请在浏览器设置中允许相机权限"); }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const genRandom = () => {
    const f = Array.from({ length: 5 }, () => String(Math.floor(Math.random() * 35) + 1).padStart(2, "0")).join(",");
    const b = Array.from({ length: 2 }, () => String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")).join(",");
    setFrontInput(f); setBackInput(b);
  };

  const handleVerify = async () => {
    const input = `${frontInput}+${backInput}`;
    if (!frontInput.trim() || !backInput.trim()) return;
    setLoading(true);
    try {
      const res = await verifyNumbers(input);
      setResult(res);
    } catch {
      setResult({ matched_front: 0, matched_back: 0, result: "lose", prize: "查询失败" });
    }
    setLoading(false);
  };

  const getPrizeTier = (matched: string): string => {
    for (const [tier, cfg] of Object.entries(prizeTiers)) {
      if (cfg.match === matched) return tier;
    }
    return "";
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => window.history.back()} className="text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-semibold flex-1">扫码验奖</h1>
        </div>
        {/* Mode Tabs */}
        <div className="flex mx-3 mb-2 bg-surface rounded-[14px] p-[3px]">
          {[
            { key: "scan" as const, icon: Scan, label: "扫码" },
            { key: "manual" as const, icon: Camera, label: "手动输入" },
          ].map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); if (t.key === "scan") startCamera(); else stopCamera(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[11px] text-xs font-medium transition-colors ${
                mode === t.key ? "bg-brand-teal text-white shadow-sm" : "text-text-secondary"
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {/* Scanner */}
        {mode === "scan" && (
          <div className="bg-black rounded-[24px] overflow-hidden relative min-h-[300px]">
            {cameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {/* Scan frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <div className="absolute inset-0 border-2 border-white/50 rounded-[20px]" />
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-[16px]" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-[16px]" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-[16px]" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-[16px]" />
                    {/* Scan line animation */}
                    <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ top: "30%" }} />
                  </div>
                </div>
                <button onClick={stopCamera}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-[12px] text-xs">
                  关闭相机
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Scan className="w-8 h-8 text-white/60" />
                </div>
                <p className="text-white/70 text-sm mb-4">点击下方按钮启动扫码</p>
                <button onClick={startCamera}
                  className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-[14px] text-sm font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" /> 启动扫码
                </button>
                <p className="text-white/40 text-xs mt-3">扫码识别后自动验奖</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        {mode === "manual" && (
          <div className="bg-surface rounded-[24px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
            <div className="text-xs font-semibold mb-3">输入彩票号码</div>
            {/* Front numbers */}
            <div className="mb-3">
              <div className="text-[10px] text-text-tertiary mb-1.5">前区号码（5个，01-35）</div>
              <input value={frontInput} onChange={e => setFrontInput(e.target.value)}
                placeholder="例: 07,13,28,29,34"
                className="w-full bg-bg rounded-[14px] px-4 py-3 text-sm border border-[rgba(69,204,213,0.15)] outline-none focus:border-brand-teal transition-all" />
            </div>
            {/* Back numbers */}
            <div className="mb-3">
              <div className="text-[10px] text-text-tertiary mb-1.5">后区号码（2个，01-12）</div>
              <input value={backInput} onChange={e => setBackInput(e.target.value)}
                placeholder="例: 06,11"
                className="w-full bg-bg rounded-[14px] px-4 py-3 text-sm border border-[rgba(69,204,213,0.15)] outline-none focus:border-brand-teal transition-all" />
            </div>
            {/* Quick actions */}
            <div className="flex gap-2 mb-3">
              <button onClick={genRandom} className="flex-1 py-2 bg-bg rounded-[12px] text-xs text-text-secondary border border-[rgba(69,204,213,0.1)] hover:bg-brand-teal/5">
                🎲 随机生成
              </button>
              <button onClick={() => { setFrontInput(""); setBackInput(""); setResult(null); }}
                className="flex-1 py-2 bg-bg rounded-[12px] text-xs text-text-secondary border border-[rgba(69,204,213,0.1)] hover:bg-red-50">
                🗑️ 清空
              </button>
            </div>
            <button onClick={handleVerify} disabled={loading || !frontInput.trim() || !backInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">
              {loading ? "验奖中..." : "立即验奖"}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-[24px] p-5 shadow-sm border overflow-hidden ${
            result.result === "win"
              ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
              : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200"
          }`}>
            {/* Win/Lose header */}
            <div className="text-center mb-4">
              <span className="text-4xl block mb-2">{result.result === "win" ? "🎉" : "😅"}</span>
              <div className="text-lg font-bold">{result.result === "win" ? "恭喜中奖！" : "未中奖"}</div>
              {result.result === "win" ? (
                <div className="text-[11px] text-amber-600 mt-1">祝您继续好运！</div>
              ) : (
                <div className="text-[11px] text-text-tertiary mt-1">下次好运！</div>
              )}
            </div>

            {/* Match stats */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-white/80 rounded-[14px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">前区匹配</div>
                <div className={`text-xl font-bold ${result.matched_front > 0 ? "text-brand-coral" : "text-text-tertiary"}`}>
                  {result.matched_front}
                </div>
              </div>
              <div className="flex-1 bg-white/80 rounded-[14px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">后区匹配</div>
                <div className={`text-xl font-bold ${result.matched_back > 0 ? "text-brand-teal" : "text-text-tertiary"}`}>
                  {result.matched_back}
                </div>
              </div>
            </div>

            {/* Prize info */}
            {result.prize && (
              <div className="bg-white/80 rounded-[14px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary mb-1">中奖信息</div>
                <div className="text-base font-bold text-brand-coral">{result.prize}</div>
              </div>
            )}
          </div>
        )}

        {/* How to use guide */}
        <details className="bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
          <summary className="text-[11px] font-semibold cursor-pointer">💡 使用说明</summary>
          <div className="mt-3 text-[10px] text-text-tertiary space-y-1.5 leading-relaxed">
            <p>1. 选择「扫码」模式，将相机对准彩票上的二维码</p>
            <p>2. 或选择「手动输入」模式，在输入框中填写彩票号码</p>
            <p>3. 前区号码用逗号分隔（如: 07,13,28,29,34）</p>
            <p>4. 后区号码用逗号分隔（如: 06,11）</p>
            <p>5. 点击「立即验奖」查看结果</p>
          </div>
        </details>
      </div>
    </main>
  );
}
