// ─── PK创建草稿自动管理 ───
// 使用 localStorage 自动保存/恢复创建表单草稿，30分钟有效

import { useEffect, useCallback, useState } from "react";
import type { PKDraft, PKCreateFormData, CreatorStep, CreateMode } from "./pk-creator-types";
import { DEFAULT_CREATE_FORM } from "./pk-creator-types";

const DRAFT_KEY = "pk_create_draft";
const DRAFT_TTL = 30 * 60 * 1000; // 30分钟

export interface DraftState {
  exists: boolean;
  draft: PKDraft | null;
}

/**
 * 草稿管理 Hook
 */
export function useDraftManager() {
  const [draftState, setDraftState] = useState<DraftState>({ exists: false, draft: null });

  // 初始化时检查是否有草稿
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed: PKDraft = JSON.parse(raw);
      const elapsed = Date.now() - parsed.savedAt;
      if (elapsed < DRAFT_TTL && parsed.form.title) {
        setDraftState({ exists: true, draft: parsed });
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch { /* ignore corrupt draft */ }
  }, []);

  /** 保存草稿 */
  const saveDraft = useCallback((form: PKCreateFormData, step: CreatorStep, mode: CreateMode) => {
    try {
      const draft: PKDraft = { form, step, mode, savedAt: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* storage full */ }
  }, []);

  /** 恢复草稿 */
  const restoreDraft = useCallback((): { form: PKCreateFormData; step: CreatorStep; mode: CreateMode } | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed: PKDraft = JSON.parse(raw);
      const elapsed = Date.now() - parsed.savedAt;
      if (elapsed < DRAFT_TTL && parsed.form.title) {
        setDraftState({ exists: false, draft: null });
        return { form: parsed.form, step: parsed.step, mode: parsed.mode };
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  /** 丢弃草稿 */
  const discardDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setDraftState({ exists: false, draft: null });
  }, []);

  /** 发布成功清除草稿 */
  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setDraftState({ exists: false, draft: null });
  }, []);

  /** 获取新的默认表单 */
  const getDefaultForm = useCallback((category?: string): PKCreateFormData => {
    const form = { ...DEFAULT_CREATE_FORM };
    if (category) form.category = category;
    // 按品类优化默认值
    switch (category) {
      case "sports":       form.end_time = "1h"; form.min_bet = "10";  form.max_bet = "1000"; break;
      case "social":       form.end_time = "3d"; form.min_bet = "100"; form.max_bet = "5000"; break;
      case "event":        form.end_time = "today"; form.min_bet = "50"; form.max_bet = "2000"; break;
      case "general":      form.end_time = "7d"; form.min_bet = "10";  form.max_bet = "1000"; break;
      case "consumption":  form.end_time = "3d"; form.min_bet = "50";  form.max_bet = "1000"; break;
    }
    return form;
  }, []);

  return {
    draftState,
    saveDraft,
    restoreDraft,
    discardDraft,
    clearDraft,
    getDefaultForm,
  };
}
