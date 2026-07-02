/**
 * useDrawRefresh — 开奖数据新鲜度管理 Hook
 *
 * 功能:
 * 1. 计算距离下次开奖的倒计时
 * 2. 标记数据是否过期
 * 3. 开奖后自动触发刷新回调
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { getNextDraw, formatCountdown, DRAW_SCHEDULES } from "./draw-schedule";

export interface DrawRefreshState {
  /** 距离下次开奖的描述 */
  countdown: string;
  /** 距离下次开奖的小时数 */
  hoursUntilDraw: number;
  /** 最后开奖期号（如 "24070"） */
  lastPeriod: number;
  /** 最后开奖日期 */
  lastDrawDate: string;
  /** 数据是否已过时（需要刷新） */
  isStale: boolean;
  /** 下次开奖的标签 */
  nextDrawLabel: string;
  /** 手动立即刷新 */
  refresh: () => void;
}

/**
 * 数据新鲜度 Hook
 * @param type 彩种 key (dlt/ssq/pl3/fc3d/qxc)
 * @param lastPeriod 最后一次从API获取到的期号
 * @param lastDrawDate 最后一次开奖日期
 * @param onRefresh 需要刷新时的回调
 */
export function useDrawRefresh(
  type: string,
  lastPeriod: number,
  lastDrawDate: string,
  onRefresh?: () => void
): DrawRefreshState {
  const [now, setNow] = useState(new Date());
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  // 每分钟更新倒计时
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 检查是否应该自动刷新（开奖后5分钟）
  useEffect(() => {
    if (!lastDrawDate || !onRefresh) return;
    const schedule = DRAW_SCHEDULES[type];
    if (!schedule) return;

    const [drawHour, drawMin] = schedule.drawTime.split(":").map(Number);

    // 检查今天是否是开奖日，且当前时间刚过开奖时间
    const today = now.getDay();
    const isDrawDay = schedule.drawDays.includes(today);
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const drawMinute = drawHour * 60 + drawMin;
    const fiveMinAfterDraw = drawMinute + 5;

    if (isDrawDay && currentMinute >= fiveMinAfterDraw && currentMinute < fiveMinAfterDraw + 2) {
      // 开奖后5分钟内，触发刷新
      onRefresh();
      setAutoRefreshCount(c => c + 1);
    }
  }, [now, type, lastDrawDate, onRefresh]);

  const nextDraw = getNextDraw(type);
  const isStale = !lastDrawDate || (now.getTime() - new Date(lastDrawDate).getTime()) > 3 * 86400000;

  const refresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return {
    countdown: formatCountdown(nextDraw.hoursUntilDraw, nextDraw.minutesUntilDraw),
    hoursUntilDraw: nextDraw.hoursUntilDraw,
    lastPeriod,
    lastDrawDate,
    isStale,
    nextDrawLabel: nextDraw.nextPeriodLabel,
    refresh,
  };
}
