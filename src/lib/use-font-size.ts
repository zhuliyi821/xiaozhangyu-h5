"use client";

/**
 * 📏 大字模式 Hook
 *
 * 在 `data-font-size="large"` 和默认之间切换。
 * 偏好存入 localStorage，全局生效。
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "xiaozhangyu_font_size";

type FontSize = "normal" | "large";

/** 同步 data-attribute 到 html 根元素 */
function applyFontSize(size: FontSize) {
  if (typeof document === "undefined") return;
  if (size === "large") {
    document.documentElement.setAttribute("data-font-size", "large");
  } else {
    document.documentElement.removeAttribute("data-font-size");
  }
}

/** 读取保存的偏好 */
function getStoredSize(): FontSize {
  if (typeof window === "undefined") return "normal";
  return (localStorage.getItem(STORAGE_KEY) as FontSize) || "normal";
}

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(getStoredSize);

  // 初始化时应用
  useEffect(() => {
    applyFontSize(size);
  }, []);

  const toggle = useCallback(() => {
    setSize((prev) => {
      const next: FontSize = prev === "normal" ? "large" : "normal";
      localStorage.setItem(STORAGE_KEY, next);
      applyFontSize(next);
      return next;
    });
  }, []);

  return { size, toggle, isLarge: size === "large" };
}
