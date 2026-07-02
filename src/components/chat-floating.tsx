"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surplus.hi.cn";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

const WELCOME = "Hi！我是小章鱼AI助手 🐙 有什么可以帮你的？关于预测、投注、彩票分析、账户问题都可以问我~";

const QUICK_QS = [
  "如何充值游戏币？",
  "推荐一注大乐透号码",
  "闲豆和游戏币区别？",
  "怎么联系人工客服？",
];

export default function ChatFloating() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ role: "assistant", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs((p) => [...p, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "你是小章鱼AI助手，回答简洁专业，每次控制在150字以内。" },
            ...msgs.filter((m) => m.role === "user").slice(-6).map((m) => ({ role: "user", content: m.text })),
            { role: "user", content: text },
          ],
        }),
      });
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || data?.response || "😅 我暂时回答不了这个问题，请转人工客服~";
      setMsgs((p) => [...p, { role: "assistant", text: reply }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", text: "😅 网络开小差了，稍后再试~" }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-20 right-3 z-50">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white shadow-lg
                     hover:scale-105 active:scale-90 transition-all flex items-center justify-center"
          aria-label="AI 助手">
          <MessageCircle className="w-5 h-5" />
        </button>
      ) : (
        <div className="w-[320px] sm:w-[360px] h-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-brand-teal/10 to-brand-teal-dark/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI 助手</p>
                <p className="text-[10px] text-green-600">🟢 在线</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-br-md"
                    : "bg-white text-gray-700 rounded-bl-md shadow-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {msgs.length <= 2 && (
            <div className="px-3 py-2 border-t bg-white flex flex-wrap gap-1.5">
              {QUICK_QS.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="px-2.5 py-1 text-[10px] bg-gray-100 rounded-full text-gray-500 hover:bg-brand-teal/10 hover:text-brand-teal transition whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t p-2 bg-white flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="输入问题..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/30" />
            <button onClick={() => send(input)} disabled={loading || !input.trim()}
              className="px-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium disabled:opacity-40 hover:opacity-90 transition flex items-center gap-1">
              <Send className="w-3 h-3" /> 发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
