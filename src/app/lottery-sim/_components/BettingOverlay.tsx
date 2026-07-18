"use client";

import { useEffect, useState } from "react";

interface BettingOverlayProps {
  show: boolean;
  cost: number;
  tickets: number;
  onComplete: () => void;
}

export default function BettingOverlay({ show, cost, tickets, onComplete }: BettingOverlayProps) {
  const [animStage, setAnimStage] = useState<"enter" | "active" | "exit" | "hidden">("hidden");

  useEffect(() => {
    if (!show) {
      setAnimStage("hidden");
      return;
    }
    // Enter animation
    setAnimStage("enter");
    const t1 = setTimeout(() => setAnimStage("active"), 300);
    // Exit after 1.2s total
    const t2 = setTimeout(() => {
      setAnimStage("exit");
      setTimeout(() => {
        setAnimStage("hidden");
        onComplete();
      }, 400);
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  if (animStage === "hidden") return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: animStage === "enter" || animStage === "active"
      ? "rgba(0,0,0,0.45)"
      : "rgba(0,0,0,0)",
    backdropFilter: animStage === "enter" || animStage === "active"
      ? "blur(6px)"
      : "blur(0px)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: animStage === "exit" ? 0 : 1,
  };

  const cardScale = animStage === "enter" ? 0.7 : animStage === "active" ? 1 : 0.5;
  const cardOpacity = animStage === "exit" ? 0 : 1;

  return (
    <div style={overlayStyle}>
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "32px 40px",
          textAlign: "center",
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Spinning coin */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #F27152, #D45435)",
              animation: "spinCoin 0.8s ease-in-out infinite",
            }}
          >
            🎮
          </div>
          <style>{`
            @keyframes spinCoin {
              0% { transform: rotateY(0deg) scale(1); }
              50% { transform: rotateY(180deg) scale(1.1); }
              100% { transform: rotateY(360deg) scale(1); }
            }
            @keyframes dotsPulse {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>

        <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1C1E", margin: "0 0 4px 0" }}>
          扣豆中
        </p>
        <p style={{ fontSize: 12, color: "#888780", margin: 0 }}>
          {tickets} 注 · {cost.toLocaleString()} 🎮
        </p>
      </div>
    </div>
  );
}
