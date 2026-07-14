"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, SwitchCamera, Scan, Zap } from "lucide-react";
import { verifyNumbers, VerifyResult } from "@/lib/api";
import jsQR from "jsqr";

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

export default function ScanPage() {
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [frontInput, setFrontInput] = useState("");
  const [backInput, setBackInput] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    };
  }, []);

  const startCamera = async (facingMode: VideoFacingModeEnum = "environment") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      torchTrackRef.current = stream.getVideoTracks()[0];
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }
      setCameraActive(true);
      setScanSuccess(false);
      setResult(null);
      // Start scanning loop after camera is ready
      setTimeout(() => { setScanning(true); scanLoop(); }, 500);
    } catch {
      alert("无法启动相机，请在浏览器设置中允许相机权限");
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    scanTimerRef.current = null;
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    torchTrackRef.current = null;
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!torchTrackRef.current) return;
    try {
      await torchTrackRef.current.applyConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch { /* torch not supported */ }
  };

  /** 核心扫码循环：每一帧从 video 取帧 → jsQR 检测二维码 */
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      setScanning(false);
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      scanTimerRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      scanTimerRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      // QR code detected! Parse the data
      const text = code.data.trim();
      console.log("QR detected:", text);
      setScanning(false);
      setScanSuccess(true);

      // Try to parse as lottery numbers (e.g. "07,13,28,29,34+06,11")
      const parts = text.replace(/[（(]/g, "+").replace(/[）)]/g, "").split(/[+＋]/);
      if (parts.length === 2) {
        setFrontInput(parts[0].trim());
        setBackInput(parts[1].trim());
        // Auto-verify after setting numbers
        setTimeout(() => {
          const f = parts[0].trim();
          const b = parts[1].trim();
          if (f && b) {
            setLoading(true);
            verifyNumbers(`${f}+${b}`)
              .then(res => setResult(res))
              .catch(() => setResult({ matched_front: 0, matched_back: 0, result: "lose", prize: "查询失败" }))
              .finally(() => setLoading(false));
          }
        }, 300);
      } else {
        // QR text doesn't look like lottery numbers - just show it
        alert("扫码结果: " + text);
      }
      return;
    }

    scanTimerRef.current = requestAnimationFrame(scanLoop);
  }, []);

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

  const genRandom = () => {
    const f = Array.from({ length: 5 }, () => String(Math.floor(Math.random() * 35) + 1).padStart(2, "0")).join(",");
    const b = Array.from({ length: 2 }, () => String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")).join(",");
    setFrontInput(f); setBackInput(b);
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-brand-teal/10">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => window.history.back()} className="text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-semibold flex-1">扫码验奖</h1>
        </div>
        {/* Mode Tabs */}
        <div className="flex mx-3 mb-2 bg-surface rounded-[8px] p-[3px]">
          {[
            { key: "scan" as const, icon: Scan, label: "扫码" },
            { key: "manual" as const, icon: Camera, label: "手动输入" },
          ].map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); setResult(null); if (t.key === "scan") startCamera(); else stopCamera(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[11px] text-xs font-medium transition-colors ${
                mode === t.key ? "bg-brand-teal text-white shadow-sm" : "text-text-secondary"
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden canvas for QR scanning */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="px-4 mt-3 space-y-3">
        {/* ── Scanner Mode ── */}
        {mode === "scan" && (
          <div className="bg-black rounded-[8px] overflow-hidden relative min-h-[340px]">
            {cameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover min-h-[340px]" />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-brand-teal rounded-tl-[18px]" />
                    <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-brand-teal rounded-tr-[18px]" />
                    <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-brand-teal rounded-bl-[18px]" />
                    <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-brand-teal rounded-br-[18px]" />
                    {/* Scan line */}
                    {scanning && !scanSuccess && (
                      <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-brand-teal to-transparent animate-pulse" 
                           style={{ top: "40%", boxShadow: "0 0 8px rgba(69,204,213,0.6)" }} />
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] ${scanSuccess ? 'bg-green-500/80' : 'bg-black/40'} text-white px-2.5 py-1 rounded-full backdrop-blur-sm`}>
                    {scanSuccess ? "✅ 已识别" : scanning ? "🔄 扫描中..." : "⏸️ 已暂停"}
                  </span>
                </div>

                {/* Torch button */}
                {torchTrackRef.current && (
                  <button onClick={toggleTorch}
                    className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center">
                    <Zap className={`w-4 h-4 ${torchOn ? 'text-yellow-400' : 'text-white/60'}`} />
                  </button>
                )}

                {/* Bottom controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button onClick={stopCamera}
                    className="bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-[8px] text-xs font-medium">
                    关闭
                  </button>
                  <button onClick={() => { startCamera(); }}
                    className="bg-brand-teal/80 backdrop-blur-md text-white px-5 py-2.5 rounded-[8px] text-xs font-medium">
                    重新扫描
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[340px] bg-gradient-to-b from-gray-900 to-black">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Scan className="w-8 h-8 text-white/60" />
                </div>
                <p className="text-white/70 text-sm mb-5">将彩票二维码对准扫描框</p>
                <button onClick={() => startCamera()}
                  className="bg-brand-teal text-white px-8 py-3.5 rounded-[10px] text-sm font-semibold flex items-center gap-2 shadow-lg active:scale-[0.97] transition-transform">
                  <Camera className="w-4 h-4" /> 启动扫码
                </button>
                <p className="text-white/40 text-xs mt-4 px-6 text-center leading-relaxed">
                  扫码识别后自动验奖<br />
                  支持大乐透二维码
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Manual Input ── */}
        {mode === "manual" && (
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-brand-teal/10">
            <div className="text-xs font-semibold mb-3">输入彩票号码</div>
            <div className="mb-3">
              <div className="text-[10px] text-text-tertiary mb-1.5">前区号码（5个，01-35）</div>
              <input value={frontInput} onChange={e => setFrontInput(e.target.value)}
                placeholder="例: 07,13,28,29,34"
                className="w-full bg-bg rounded-[8px] px-4 py-3 text-sm border border-brand-teal/10 outline-none focus:border-brand-teal transition-all" />
            </div>
            <div className="mb-3">
              <div className="text-[10px] text-text-tertiary mb-1.5">后区号码（2个，01-12）</div>
              <input value={backInput} onChange={e => setBackInput(e.target.value)}
                placeholder="例: 06,11"
                className="w-full bg-bg rounded-[8px] px-4 py-3 text-sm border border-brand-teal/10 outline-none focus:border-brand-teal transition-all" />
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={genRandom} className="flex-1 py-2 bg-bg rounded-[8px] text-xs text-text-secondary border border-brand-teal/10">
                🎲 随机生成
              </button>
              <button onClick={() => { setFrontInput(""); setBackInput(""); setResult(null); }}
                className="flex-1 py-2 bg-bg rounded-[8px] text-xs text-text-secondary border border-brand-teal/10">
                🗑️ 清空
              </button>
            </div>
            <button onClick={handleVerify} disabled={loading || !frontInput.trim() || !backInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform">
              {loading ? "验奖中..." : "立即验奖"}
            </button>
          </div>
        )}

        {/* ═══ Result ═══ */}
        {result && (
          <div className={`rounded-[8px] p-5 shadow-sm border overflow-hidden ${
            result.result === "win"
              ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
              : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200"
          }`}>
            <div className="text-center mb-4">
              <span className="text-4xl block mb-2">{result.result === "win" ? "🎉" : "😅"}</span>
              <div className="text-lg font-bold">{result.result === "win" ? "恭喜中奖！" : "未中奖"}</div>
              {result.result === "win" ? (
                <div className="text-[11px] text-amber-600 mt-1">祝您继续好运！</div>
              ) : (
                <div className="text-[11px] text-text-tertiary mt-1">下次好运！</div>
              )}
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-white/80 rounded-[8px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">前区匹配</div>
                <div className={`text-xl font-bold ${result.matched_front > 0 ? "text-brand-coral" : "text-text-tertiary"}`}>
                  {result.matched_front}
                </div>
              </div>
              <div className="flex-1 bg-white/80 rounded-[8px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary">后区匹配</div>
                <div className={`text-xl font-bold ${result.matched_back > 0 ? "text-brand-teal" : "text-text-tertiary"}`}>
                  {result.matched_back}
                </div>
              </div>
            </div>
            {result.prize && (
              <div className="bg-white/80 rounded-[8px] p-3 text-center">
                <div className="text-[10px] text-text-tertiary mb-1">中奖信息</div>
                <div className="text-base font-bold text-brand-coral">{result.prize}</div>
              </div>
            )}
          </div>
        )}

        {/* How to use */}
        <details className="bg-surface rounded-[8px] p-4 shadow-sm border border-brand-teal/5">
          <summary className="text-[11px] font-semibold cursor-pointer">💡 使用说明</summary>
          <div className="mt-3 text-[10px] text-text-tertiary space-y-1.5 leading-relaxed">
            <p>1. 选择「扫码」模式，将彩票二维码对准扫描框，自动识别验奖</p>
            <p>2. 或选择「手动输入」模式，手动填写彩票号码</p>
            <p>3. 前区号码用逗号分隔（如: 07,13,28,29,34）</p>
            <p>4. 后区号码用逗号分隔（如: 06,11）</p>
            <p>5. 扫码识别后自动验奖，无需额外操作</p>
          </div>
        </details>
      </div>
    </main>
  );
}
