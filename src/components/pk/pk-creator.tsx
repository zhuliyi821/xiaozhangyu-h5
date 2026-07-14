"use client";

// ─── 统一PK创建组件 PKCreator ───
// 三步渐进向导：选类型(模板) → 写话题(基本信息) → 设规则(高级配置) → 预览发布

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import {
  CreatorStep, CreateMode, PKCreateFormData, PKCreateResult,
  STEP_LABELS, DEFAULT_CREATE_FORM,
  type PKTemplate, type CelebrationConfig,
} from "./pk-creator-types";
import { useDraftManager } from "./pk-draft-manager";
import { TEMPLATE_GROUPS, applyTemplate } from "./pk-templates";
import PKCelebration from "./pk-celebration";
import {
  PKMode, CharityMode, PoolMode,
  CATEGORY_CONFIG, CATEGORY_OPTIONS,
  TIME_OPTIONS, CHARITY_LABELS, CHARITY_PROJECTS,
  PK_MODE_LABELS, PK_MODE_DESCS,
  POOL_MODE_LABELS, POOL_MODE_DESCS,
} from "@/app/pk-hall/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";

// ─── 步骤顺序 ───
const STEPS: CreatorStep[] = ["template", "basic", "settings", "preview"];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
  entryPoint?: "fab" | "bottom_cta" | "category_page" | "template" | "empty_state";
  onPublished?: (topicId: number) => void;
}

export default function PKCreator({ open, onClose, defaultCategory, entryPoint = "fab", onPublished }: Props) {
  const { user } = useAuth();
  const uid = user?.uid || 0;
  const [showLogin, setShowLogin] = useState(false);

  // ── 向导状态 ──
  const [createMode, setCreateMode] = useState<CreateMode>("quick");
  const [currentStep, setCurrentStep] = useState<CreatorStep>("template");

  // ── 表单数据 ──
  const { draftState, saveDraft, restoreDraft, discardDraft, clearDraft, getDefaultForm } = useDraftManager();
  const [form, setForm] = useState<PKCreateFormData>(() => getDefaultForm(defaultCategory));
  const [selectedTemplate, setSelectedTemplate] = useState<PKTemplate | null>(null);

  // ── 提交状态 ──
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── 庆祝 ──
  const [celebration, setCelebration] = useState<CelebrationConfig | null>(null);

  // ── 入口追踪 ──
  const stepStartTime = useMemo(() => Date.now(), [currentStep]);
  const stepDurations = useMemo(() => ({} as Record<CreatorStep, number>), []);

  // ── 打开时检测草稿 ──
  useEffect(() => {
    if (!open) return;
    if (draftState.exists && draftState.draft) {
      // 有草稿自动恢复
      const restored = restoreDraft();
      if (restored) {
        setForm(restored.form);
        setCurrentStep(restored.step);
        setCreateMode(restored.mode);
      }
    } else {
      // 无草稿，重置
      resetForm();
    }
  }, [open]);

  // ── 自动保存草稿 ──
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      if (form.title || form.options.some(o => o.trim())) {
        saveDraft(form, currentStep, createMode);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [open, form, currentStep, createMode]);

  const resetForm = useCallback(() => {
    setForm(getDefaultForm(defaultCategory));
    setCurrentStep("template");
    setCreateMode("quick");
    setSelectedTemplate(null);
    setError("");
    setSubmitting(false);
  }, [defaultCategory]);

  // ── 导航 ──
  const goToStep = (step: CreatorStep) => {
    const idx = STEPS.indexOf(step);
    if (idx < 0) return;
    setCurrentStep(step);
  };

  const goNext = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    }
  };

  // ── 选择模板 ──
  const handleSelectTemplate = (template: PKTemplate) => {
    setSelectedTemplate(template);
    const data = applyTemplate(template);
    setForm(prev => ({ ...prev, ...data }));
    setCurrentStep("basic");
  };

  const handleCustomCreate = () => {
    setSelectedTemplate(null);
    setCreateMode("advanced");
    setCurrentStep("basic");
  };

  // ── 提交创建 ──
  const handleCreate = async () => {
    if (!uid) { setShowLogin(true); return; }
    const validOptions = form.options.filter(o => o.trim());
    if (!form.title || validOptions.length < 2) { setError("请填写标题和至少2个选项"); return; }

    setSubmitting(true);
    setError("");

    const endTimeMap: Record<string, number> = {
      "1h": Math.floor(Date.now() / 1000) + 3600,
      "3h": Math.floor(Date.now() / 1000) + 10800,
      "today": Math.floor(Date.now() / 1000) + 86400,
      "tomorrow": Math.floor(Date.now() / 1000) + 86400,
      "3d": Math.floor(Date.now() / 1000) + 259200,
      "5d": Math.floor(Date.now() / 1000) + 432000,
      "7d": Math.floor(Date.now() / 1000) + 604800,
      "30d": Math.floor(Date.now() / 1000) + 2592000,
    };
    const endTime = endTimeMap[form.end_time] || (Math.floor(Date.now() / 1000) + 604800);

    try {
      const res = await fetch(`${API_BASE}/api/pk?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: form.title,
          options: validOptions,
          mode: form.mode,
          category: form.category,
          charity: form.charity,
          pool_distribution: form.pool_distribution,
          end_time: endTime,
          min_bet: parseInt(form.min_bet) || 10,
          max_bet: parseInt(form.max_bet) || 10000,
          ...(form.charity === "percentage" ? { charity_ratio: form.charity_ratio } : {}),
          ...(form.mode === "1vN" ? { challenger_limit: form.challenger_limit, challenger_pool_limit: form.challenger_pool_limit } : {}),
        }),
      });
      const j = await res.json();
      if (j.code === 0) {
        const topicId = j.data?.id || j.data?.topic_id || 0;
        clearDraft();
        setCelebration({
          topicTitle: form.title,
          topicId,
          category: form.category,
          mode: form.mode,
          poolTotal: 0,
        });
        if (onPublished) onPublished(topicId);
      } else {
        setError(j.msg || "创建失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 庆祝后操作 ──
  const handleViewTopic = () => {
    if (celebration) {
      onClose();
      window.location.href = `/pk-hall/${celebration.category}/${celebration.topicId}`;
    }
  };

  const handleAnotherOne = () => {
    setCelebration(null);
    resetForm();
  };

  // ── 字段更新辅助 ──
  const updateForm = (partial: Partial<PKCreateFormData>) => setForm(prev => ({ ...prev, ...partial }));
  const updateOption = (index: number, value: string) => {
    const newOpts = [...form.options];
    newOpts[index] = value;
    updateForm({ options: newOpts });
  };
  const addOption = () => updateForm({ options: [...form.options, ""] });
  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    updateForm({ options: form.options.filter((_, i) => i !== index) });
  };

  // ── 品类配置 ──
  const catCfg = CATEGORY_CONFIG[form.category];

  if (!open) return null;

  // ═══════════════════════════════════════
  //  渲染区域
  // ═══════════════════════════════════════

  return (
    <>
      <div className="fixed inset-0 z-[900] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-[16px] w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}>

          {/* ─── 头部: 步骤指示器 ─── */}
          <div className="sticky top-0 bg-white z-10 pt-5 pb-3 px-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const stepIdx = STEPS.indexOf(currentStep);
                const isActive = s === currentStep;
                const isCompleted = stepIdx > i;
                const isPending = stepIdx < i;
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                      ${isActive ? 'bg-brand-teal-dark text-white shadow-md scale-110' : ''}
                      ${isCompleted ? 'bg-brand-gold text-white' : ''}
                      ${isPending ? 'bg-gray-200 text-gray-400' : ''}`}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div className="hidden sm:block text-[9px] font-medium text-gray-400">
                      {STEP_LABELS[s].label}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-[2px] rounded-full ${isCompleted ? 'bg-brand-gold' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── 内容区 ─── */}
          <div className="p-5 min-h-[300px]">

            {/* ═══════ Step 0: 模板选择 ═══════ */}
            {currentStep === "template" && (
              <div>

                {/* 草稿恢复横幅 */}
                {draftState.exists && draftState.draft && (
                  <div className="mb-4 px-3 py-2 bg-amber-50 rounded-[10px] flex items-center justify-between">
                    <span className="text-[11px] text-amber-700">📝 发现未发布的草稿</span>
                    <div className="flex gap-2">
                      <button onClick={() => { const r = restoreDraft(); if (r) { setForm(r.form); setCurrentStep(r.step); setCreateMode(r.mode); }}}
                        className="text-[10px] text-brand-teal-dark font-semibold">恢复</button>
                      <button onClick={discardDraft}
                        className="text-[10px] text-gray-400">丢弃</button>
                    </div>
                  </div>
                )}

                {/* 闪电创建：热门模板 */}
                <div className="mb-3">
                  <div className="text-[11px] text-gray-500 mb-2">🚀 从模板开始，1分钟搞定</div>
                  <div className="space-y-2">
                    {TEMPLATE_GROUPS[0].templates.map(t => (
                      <button key={t.id} onClick={() => handleSelectTemplate(t)}
                        className="w-full text-left p-3 rounded-[12px] border border-gray-100 hover:border-brand-teal/30 hover:shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{t.title}</div>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {t.options.map((o, i) => (
                                <span key={i}>
                                  {i > 0 && <span className="mx-1">|</span>}
                                  {o}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[18px] text-gray-300">›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自定义创建 */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] text-gray-300 flex-shrink-0">或者</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <button onClick={handleCustomCreate}
                    className="w-full py-3 rounded-[12px] border-2 border-dashed border-gray-200 text-xs text-gray-500 font-medium hover:border-brand-teal/50 hover:text-brand-teal-dark transition-colors active:scale-[0.98]">
                    ✍️ 自定义创建 — 全部配置自己定
                  </button>
                </div>
              </div>
            )}

            {/* ═══════ Step 1: 基本信息 ═══════ */}
            {currentStep === "basic" && (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 mb-3">
                  {selectedTemplate ? `基于模板「${selectedTemplate.title}」编辑` : '填写PK基本信息'}
                </div>

                {/* 话题标题 */}
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">📝 话题标题</label>
                  <input type="text" placeholder="例：周末去哪吃？明天BTC涨跌？"
                    value={form.title}
                    onChange={e => updateForm({ title: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" />
                </div>

                {/* 选项 */}
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">⚖️ 选项（至少2个）</label>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text"
                          placeholder={`选项 ${i + 1}`}
                          value={opt}
                          onChange={e => updateOption(i, e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" />
                        {form.options.length > 2 && (
                          <button onClick={() => removeOption(i)}
                            className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-xs flex items-center justify-center active:scale-90 transition-transform">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {form.options.length < 6 && (
                    <button onClick={addOption}
                      className="mt-2 px-3 py-1.5 rounded-[8px] border border-dashed border-gray-200 text-[10px] text-gray-400 hover:border-brand-teal/50 hover:text-brand-teal-dark transition-colors">
                      + 添加选项
                    </button>
                  )}
                </div>

                {/* 品类 + 截止时间 并排 */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">🏷️ 品类</label>
                    <select value={form.category} onChange={e => updateForm({ category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30 appearance-none">
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">⏱ 截止时间</label>
                    <select value={form.end_time} onChange={e => updateForm({ end_time: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30 appearance-none">
                      {TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ Step 2: 高级设置 ═══════ */}
            {currentStep === "settings" && (
              <div className="space-y-4">

                {/* PK形态 */}
                <div>
                  <label className="text-[10px] text-gray-400 mb-1.5 block">⚔️ PK形态</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(PK_MODE_LABELS) as [PKMode, string][]).map(([mode, label]) => (
                      <button key={mode} onClick={() => updateForm({ mode })}
                        className={`p-2.5 rounded-[10px] text-[10px] text-center transition-all
                          ${form.mode === mode ? 'bg-brand-teal-dark text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <div className="font-semibold">{label.split(' ')[1] || label}</div>
                        <div className="text-[8px] mt-0.5 opacity-70">{PK_MODE_DESCS[mode].slice(0, 10)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 参与范围 */}
                <div>
                  <label className="text-[10px] text-gray-400 mb-1.5 block">💰 参与范围</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="text-[9px] text-gray-400 mb-1">最低参与</div>
                      <div className="flex gap-1">
                        {[10, 50, 100].map(v => (
                          <button key={v} onClick={() => updateForm({ min_bet: v.toString() })}
                            className={`flex-1 py-2 rounded-[8px] text-[10px] font-medium transition-all
                              ${form.min_bet === v.toString() ? 'bg-brand-teal-dark text-white' : 'bg-gray-50 text-gray-500'}`}>
                            {v}豆
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] text-gray-400 mb-1">最高参与</div>
                      <div className="flex gap-1">
                        {[1000, 5000, 10000].map(v => (
                          <button key={v} onClick={() => updateForm({ max_bet: v.toString() })}
                            className={`flex-1 py-2 rounded-[8px] text-[10px] font-medium transition-all
                              ${form.max_bet === v.toString() ? 'bg-brand-teal-dark text-white' : 'bg-gray-50 text-gray-500'}`}>
                            {v >= 1000 ? `${v / 1000}k` : v}豆
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 奖池分配 */}
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">🏆 奖池分配</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(POOL_MODE_LABELS) as [PoolMode, string][]).map(([mode, label]) => (
                      <button key={mode} onClick={() => updateForm({ pool_distribution: mode })}
                        className={`p-2 rounded-[8px] text-[10px] text-left transition-all
                          ${form.pool_distribution === mode ? 'bg-brand-teal-dark text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <div className="font-medium">{label}</div>
                        <div className="text-[8px] mt-0.5 opacity-70 truncate">{POOL_MODE_DESCS[mode]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 公益模式（折叠） */}
                <details className="group">
                  <summary className="text-[10px] text-gray-400 cursor-pointer list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    ❤️ 公益模式（可选）
                  </summary>
                  <div className="mt-2 space-y-2 pl-3">
                    <div className="flex gap-2">
                      {(Object.entries(CHARITY_LABELS) as [CharityMode, string][]).map(([mode, label]) => (
                        <button key={mode} onClick={() => updateForm({ charity: mode })}
                          className={`flex-1 py-2 rounded-[8px] text-[10px] font-medium transition-all
                            ${form.charity === mode ? 'bg-brand-teal-dark text-white' : 'bg-gray-50 text-gray-500'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {form.charity === "percentage" && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">抽成比例</span>
                        <input type="range" min={5} max={50} step={5}
                          value={form.charity_ratio}
                          onChange={e => updateForm({ charity_ratio: parseInt(e.target.value) })}
                          className="flex-1" />
                        <span className="text-[10px] font-medium text-brand-teal-dark">{form.charity_ratio}%</span>
                      </div>
                    )}
                    {form.charity === "percentage" && form.charity_ratio > 0 && (
                      <div>
                        <label className="text-[9px] text-gray-400 mb-1 block">受益项目</label>
                        <select value={form.charity_project} onChange={e => updateForm({ charity_project: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 rounded-[8px] text-[10px] outline-none">
                          {CHARITY_PROJECTS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </details>

                {/* 擂台限制（仅 1vN 时显示） */}
                {form.mode === "1vN" && (
                  <details className="group">
                    <summary className="text-[10px] text-gray-400 cursor-pointer list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      🛡️ 擂台限制（仅1vN）
                    </summary>
                    <div className="mt-2 space-y-2 pl-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">最多挑战者:</span>
                        <input type="number" min={1} max={1000}
                          value={form.challenger_limit}
                          onChange={e => updateForm({ challenger_limit: parseInt(e.target.value) || 100 })}
                          className="w-16 px-2 py-1 bg-gray-50 rounded-[6px] text-[10px] outline-none text-center" />
                        <span className="text-[9px] text-gray-400">人</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">总豆上限:</span>
                        <input type="number" min={100} max={1000000} step={1000}
                          value={form.challenger_pool_limit}
                          onChange={e => updateForm({ challenger_pool_limit: parseInt(e.target.value) || 10000 })}
                          className="w-20 px-2 py-1 bg-gray-50 rounded-[6px] text-[10px] outline-none text-center" />
                        <span className="text-[9px] text-gray-400">豆</span>
                      </div>
                    </div>
                  </details>
                )}

                {/* 邀请好友（仅 1v1 时显示） */}
                {form.mode === "1v1" && (
                  <details className="group">
                    <summary className="text-[10px] text-gray-400 cursor-pointer list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      👤 邀请好友应战（仅1v1）
                    </summary>
                    <div className="mt-2 pl-3">
                      <input type="text" placeholder="输入好友UID或昵称"
                        value={form.invite_user}
                        onChange={e => updateForm({ invite_user: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 rounded-[8px] text-[10px] outline-none" />
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* ═══════ Step 3: 预览发布 ═══════ */}
            {currentStep === "preview" && (
              <div className="space-y-4">
                <div className="text-[10px] text-gray-500">确认无误后发布</div>

                {/* 预览卡片 */}
                <div className={`bg-gradient-to-r ${catCfg?.color || 'from-brand-teal to-brand-teal-dark'} rounded-[16px] p-[2px]`}>
                  <div className="bg-white rounded-[14px] p-4">
                    {/* 品类标签 */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-gray-100 text-gray-500">
                        {catCfg?.icon} {catCfg?.name || form.category}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {form.mode === "1v1" ? "⚔️ 1v1" : form.mode === "1vN" ? "🥊 打擂" : "👥 阵营"}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {POOL_MODE_LABELS[form.pool_distribution]?.split(' ')[0] || '🏆'}
                      </span>
                    </div>

                    {/* 标题 */}
                    <div className="text-sm font-bold mb-3">{form.title || <span className="text-gray-300">未填写标题</span>}</div>

                    {/* 选项进度条模拟 */}
                    {form.options.filter(o => o.trim()).length >= 2 && (
                      <div className="space-y-2.5">
                        {(() => {
                          const validOpts = form.options.filter(o => o.trim());
                          const total = validOpts.length;
                          return validOpts.map((opt, i) => {
                            const pct = 100 / total; // 演示均分
                            const colors = ['bg-brand-teal', 'bg-brand-coral', 'bg-brand-gold', 'bg-blue-400', 'bg-purple-400', 'bg-green-400'];
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                  <span className="font-medium text-gray-600">{opt}</span>
                                  <span className="text-gray-400">{Math.round(pct)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400">
                      <span>起投 {form.min_bet}豆 · 最高 {form.max_bet}豆</span>
                      <span>{TIME_OPTIONS.find(t => t.value === form.end_time)?.label || form.end_time}截止</span>
                    </div>
                  </div>
                </div>

                {/* 激励信息 */}
                <div className="bg-amber-50 rounded-[10px] p-3 flex items-center gap-2">
                  <span>🏆</span>
                  <div className="text-[10px] text-amber-700">
                    <div className="font-medium">发起人奖励：总奖池5%</div>
                    <div className="text-[9px] opacity-75">参与人数越多，你的收益越高</div>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="px-3 py-2 bg-red-50 rounded-[8px] text-[10px] text-red-600 text-center">{error}</div>
                )}
              </div>
            )}

          </div>

          {/* ─── 底部按钮栏 ─── */}
          <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
            <div className="flex gap-3">
              {currentStep !== "template" ? (
                <button onClick={goBack}
                  className="px-4 py-2.5 rounded-[10px] bg-gray-100 text-gray-500 text-xs font-medium active:scale-95 transition-transform">
                  ← 上一步
                </button>
              ) : (
                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-[10px] bg-gray-100 text-gray-500 text-xs font-medium active:scale-95 transition-transform">
                  取消
                </button>
              )}

              {currentStep !== "preview" ? (
                <button onClick={goNext}
                  disabled={
                    (currentStep === "basic" && (!form.title || form.options.filter(o => o.trim()).length < 2))
                  }
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[10px] text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40 shadow-sm">
                  {currentStep === "template" ? "跳过模板 · 下一步 →" : "下一步 →"}
                </button>
              ) : (
                <button onClick={handleCreate}
                  disabled={submitting || !form.title || form.options.filter(o => o.trim()).length < 2}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white rounded-[10px] text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40 shadow-sm">
                  {submitting ? "⏳ 发布中..." : "🚀 发起PK"}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 庆祝弹窗 */}
      {celebration && (
        <PKCelebration
          config={celebration}
          onViewTopic={handleViewTopic}
          onAnotherOne={handleAnotherOne}
          onClose={() => setCelebration(null)}
        />
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
