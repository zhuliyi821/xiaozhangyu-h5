"use client";

/**
 * Agent Persona 管理页面
 * 每个用户可以拥有独立的 AI Agent（养虾/养马/占卜/炒股）
 */
import { useState, useEffect } from "react";
import { API_V2 } from "@/config/api";
import { ArrowLeft, MessageCircle, Zap, Plus, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { C } from "@/lib/brand-colors";

// ── 类型 ──

interface Agent {
  persona_id: number;
  agent_type: string;
  store_id: number | null;
  last_active: string | null;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

// ── Agent 配置 ──

const AGENT_CONFIG: Record<string, { icon: string; name: string; color: string; desc: string }> = {
  shrimp: { icon: "🦞", name: "小龙虾", color: C.coral, desc: "门店AI员工，7x24在线客服" },
  horse: { icon: "🐎", name: "赛马预测师", color: C.gold, desc: "赔率扫描+期望值计算" },
  fortune: { icon: "🔮", name: "占卜师", color: C.teal, desc: "周易推演+运势分析" },
  stock: { icon: "📈", name: "股市分析师", color: C.tealDark, desc: "技术面+资金面分析" },
};

// ── 组件 ──

export default function AgentPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState("shrimp");
  const [skillAgent, setSkillAgent] = useState<Agent | null>(null);
  const [installedSkills, setInstalledSkills] = useState<Record<number, string[]>>({});
  const [skillLoading, setSkillLoading] = useState(false);

  // 加载用户的 Agent 列表
  const loadAgents = async () => {
    try {
      const res = await fetch(`${API_V2}/agent/mine`);
      const d = await res.json();
      if (d.code === 0) setAgents(d.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  // 加载技能市场
  const loadSkills = async () => {
    try {
      const res = await fetch(`${API_V2}/skills/market`);
      const d = await res.json();
      if (d.code === 0) setSkills(d.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadAgents(); loadSkills(); }, []);

  // 加载已安装技能
  const loadInstalled = async (personaId: number) => {
    try {
      const res = await fetch(`${API_V2}/skills/installed?persona_id=${personaId}`);
      const d = await res.json();
      if (d.code === 0) {
        setInstalledSkills(prev => ({ ...prev, [personaId]: d.data.map((s: Skill) => s.id) }));
      }
    } catch { /* ignore */ }
  };

  // 打开技能管理
  const openSkills = async (agent: Agent) => {
    setSkillAgent(agent);
    setSkillLoading(true);
    await loadInstalled(agent.persona_id);
    setSkillLoading(false);
  };

  // 安装/卸载技能
  const toggleSkill = async (skillId: string, install: boolean) => {
    if (!skillAgent) return;
    const url = install ? `${API_V2}/skills/install` : `${API_V2}/skills/uninstall`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona_id: skillAgent.persona_id, skill_id: skillId }),
    });
    const d = await res.json();
    if (d.code === 0) {
      loadInstalled(skillAgent.persona_id);
    }
  };

  // 创建 Agent
  const createAgent = async () => {
    const res = await fetch(`${API_V2}/agent/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_type: selectedType }),
    });
    const d = await res.json();
    if (d.code === 0) {
      setShowCreate(false);
      loadAgents();
    }
  };

  // 打开聊天
  const openChat = (agent: Agent) => {
    setChatAgent(agent);
    setChatHistory([]);
    setChatMsg("");
  };

  // 发送聊天消息
  const sendChat = async () => {
    if (!chatMsg.trim() || !chatAgent) return;
    const msg = chatMsg;
    setChatMsg("");
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API_V2}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona_id: chatAgent.persona_id, message: msg }),
      });
      const d = await res.json();
      if (d.code === 0) {
        setChatHistory(h => [...h, { role: "assistant", content: d.data.reply }]);
      }
    } catch { /* ignore */ }
    setChatLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-12">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold">
            <ArrowLeft className="w-4 h-4" />
            我的 AI Agent
          </Link>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-[11px] bg-brand-teal text-white px-3 py-1.5 rounded-full font-bold active:scale-95 transition-transform">
            <Plus className="w-3 h-3" /> 创建 Agent
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-[12px] p-4 shadow-soft border border-brand-teal/10 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-50 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          /* ── 空状态 ── */
          <div className="text-center pt-16">
            <div className="text-5xl mb-4">🤖</div>
            <div className="text-base font-bold mb-2">还没有 AI Agent</div>
            <div className="text-[12px] text-text-tertiary mb-6 leading-relaxed">
              创建你的第一个 AI Agent<br />
              养虾 🦞 · 养马 🐎 · 占卜 🔮 · 炒股 📈
            </div>
            <button onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-brand-teal to-brand-gold text-white px-6 py-2.5 rounded-full text-[13px] font-bold active:scale-95 transition-transform shadow-soft">
              + 创建我的 Agent
            </button>
          </div>
        ) : (
          /* ── Agent 列表 ── */
          <div className="space-y-3">
            {agents.map(agent => {
              const cfg = AGENT_CONFIG[agent.agent_type] || AGENT_CONFIG.shrimp;
              return (
                <div key={agent.persona_id}
                  className="bg-white rounded-[12px] p-4 shadow-soft border border-brand-teal/10 active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: `${cfg.color}20` }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{cfg.name}</div>
                      <div className="text-[10px] text-text-tertiary truncate">{cfg.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openSkills(agent)}
                        className="flex items-center gap-1 text-[11px] border border-brand-teal/20 text-brand-teal-dark px-3 py-1.5 rounded-full font-bold active:scale-95">
                        <Zap className="w-3 h-3" /> 技能
                      </button>
                      <button onClick={() => openChat(agent)}
                        className="flex items-center gap-1 text-[11px] bg-brand-teal text-white px-3 py-1.5 rounded-full font-bold active:scale-95">
                        <MessageCircle className="w-3 h-3" /> 对话
                      </button>
                    </div>
                  </div>
                  {/* 已安装技能 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {skills.filter(s => s.category === agent.agent_type).slice(0, 3).map(skill => (
                      <span key={skill.id}
                        className="text-[9px] bg-brand-teal-light/20 text-brand-teal-dark px-2 py-0.5 rounded-full">
                        {skill.name}
                      </span>
                    ))}
                    {agent.last_active && (
                      <span className="text-[9px] text-text-tertiary ml-auto">
                        最后活跃: {agent.last_active.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 创建 Agent 弹窗 ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-[20px] w-full max-w-lg p-6 pb-8" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-base font-bold">选择 Agent 类型</div>
              <div className="text-[11px] text-text-tertiary mt-1">创建后可以随时升级和安装技能</div>
            </div>
            <div className="space-y-2.5 mb-5">
              {Object.entries(AGENT_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setSelectedType(key)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border-2 transition-all text-left
                    ${selectedType === key ? "border-brand-teal bg-brand-teal-light/10" : "border-gray-100 bg-white"}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                    style={{ background: `${cfg.color}20` }}>{cfg.icon}</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">{cfg.name}</div>
                    <div className="text-[10px] text-text-tertiary">{cfg.desc}</div>
                  </div>
                  {selectedType === key && <div className="w-5 h-5 rounded-full bg-brand-teal flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>}
                </button>
              ))}
            </div>
            <button onClick={createAgent}
              className="w-full py-3 rounded-full bg-gradient-to-r from-brand-teal to-brand-gold text-white text-sm font-bold active:scale-[0.98] transition-transform shadow-soft">
              创建 {AGENT_CONFIG[selectedType]?.name}
            </button>
          </div>
        </div>
      )}

      {/* ── 技能管理弹窗 ── */}
      {skillAgent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setSkillAgent(null)}>
          <div className="bg-white rounded-t-[20px] w-full max-w-lg p-6 pb-8 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-base font-bold">
                {AGENT_CONFIG[skillAgent.agent_type]?.icon} {AGENT_CONFIG[skillAgent.agent_type]?.name} · 技能
              </div>
              <div className="text-[11px] text-text-tertiary mt-1">为你的 AI Agent 安装或卸载技能</div>
            </div>
            {skillLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-[12px] animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {skills.filter(s => s.category === skillAgent.agent_type).map(skill => {
                  const isInstalled = (installedSkills[skillAgent.persona_id] || []).includes(skill.id);
                  return (
                    <div key={skill.id}
                      className="flex items-center gap-3 p-3.5 rounded-[12px] border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold">{skill.name}</div>
                        <div className="text-[10px] text-text-tertiary">{skill.description}</div>
                      </div>
                      <button onClick={() => toggleSkill(skill.id, !isInstalled)}
                        className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full font-bold active:scale-95 transition-all ${
                          isInstalled
                            ? "bg-brand-teal-light/20 text-brand-teal-dark border border-brand-teal/20"
                            : "bg-brand-teal text-white"
                        }`}>
                        {isInstalled ? "已安装" : "安装"}
                      </button>
                    </div>
                  );
                })}
                {skills.filter(s => s.category === skillAgent.agent_type).length === 0 && (
                  <div className="text-center py-8 text-text-tertiary text-[12px]">
                    该类型暂无可用技能
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 聊天弹窗 ── */}
      {chatAgent && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <header className="flex items-center gap-3 px-4 h-12 border-b border-gray-100 shrink-0">
            <button onClick={() => setChatAgent(null)} className="text-text-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-sm font-bold flex-1">
              {AGENT_CONFIG[chatAgent.agent_type]?.icon} {AGENT_CONFIG[chatAgent.agent_type]?.name || "AI 助手"}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center pt-12 text-text-tertiary">
                <div className="text-4xl mb-3">{AGENT_CONFIG[chatAgent.agent_type]?.icon}</div>
                <div className="text-[13px] font-bold mb-1">开始对话</div>
                <div className="text-[11px]">有什么想问的？</div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-[12px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-teal text-white"
                    : "bg-gray-50 text-text-primary border border-gray-100"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-[12px] px-3.5 py-2.5 text-[13px] text-text-tertiary border border-gray-100">
                  思考中...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="输入消息..."
                className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-[13px] outline-none border border-gray-100 focus:border-brand-teal/30 transition-colors" />
              <button onClick={sendChat} disabled={!chatMsg.trim() || chatLoading}
                className="w-9 h-9 rounded-full bg-brand-teal text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
