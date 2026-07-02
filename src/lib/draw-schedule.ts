/**
 * 🎯 彩票开奖日历 & 数据新鲜度管理
 *
 * 每种彩票的开奖时间不同，预测必须基于最新数据，
 * 每次开奖后自动刷新。
 */

export interface LotterySchedule {
  key: string;
  name: string;
  /** 开奖日: 0=周日, 1=周一 ... 6=周六 */
  drawDays: number[];
  /** 开奖时间 HH:mm */
  drawTime: string;
  frontCount: number;
  backCount: number;
}

/** 所有彩种的开奖日历 */
export const DRAW_SCHEDULES: Record<string, LotterySchedule> = {
  dlt: { key: "dlt", name: "大乐透", drawDays: [1, 3, 6], drawTime: "21:25", frontCount: 35, backCount: 12 },
  ssq: { key: "ssq", name: "双色球", drawDays: [2, 4, 0], drawTime: "21:15", frontCount: 33, backCount: 16 },
  pl3: { key: "pl3", name: "排列3", drawDays: [0,1,2,3,4,5,6], drawTime: "20:30", frontCount: 10, backCount: 0 },
  fc3d: { key: "fc3d", name: "3D", drawDays: [0,1,2,3,4,5,6], drawTime: "21:15", frontCount: 10, backCount: 0 },
  qxc: { key: "qxc", name: "七星彩", drawDays: [2, 5, 0], drawTime: "21:25", frontCount: 10, backCount: 0 },
};

/** 时区偏移（北京时间 +8） */
const TZ_OFFSET = 8;

/**
 * 获取下一期开奖信息
 */
export function getNextDraw(type: string): {
  nextDate: Date;
  nextPeriodLabel: string;
  isDrawDay: boolean;
  hoursUntilDraw: number;
  minutesUntilDraw: number;
} {
  const schedule = DRAW_SCHEDULES[type];
  if (!schedule) return { nextDate: new Date(), nextPeriodLabel: "", isDrawDay: false, hoursUntilDraw: 0, minutesUntilDraw: 0 };

  const now = new Date();
  const today = now.getDay();
  const [drawHour, drawMin] = schedule.drawTime.split(":").map(Number);

  // Check if today is a draw day and the draw hasn't happened yet
  const isDrawDay = schedule.drawDays.includes(today);
  const todayDraw = new Date(now);
  todayDraw.setHours(drawHour, drawMin, 0, 0);

  let nextDraw: Date;
  if (isDrawDay && now < todayDraw) {
    nextDraw = todayDraw;
  } else {
    // Find next draw day
    let daysToAdd = 1;
    while (true) {
      const checkDay = (today + daysToAdd) % 7;
      if (schedule.drawDays.includes(checkDay)) break;
      daysToAdd++;
    }
    nextDraw = new Date(now);
    nextDraw.setDate(nextDraw.getDate() + daysToAdd);
    nextDraw.setHours(drawHour, drawMin, 0, 0);
  }

  const diffMs = nextDraw.getTime() - now.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const nextDayName = dayNames[nextDraw.getDay()];
  const nextPeriodLabel = `${nextDraw.getMonth() + 1}/${nextDraw.getDate()} ${nextDayName} ${schedule.drawTime}`;

  return {
    nextDate: nextDraw,
    nextPeriodLabel,
    isDrawDay: isDrawDay && now < todayDraw,
    hoursUntilDraw: hours,
    minutesUntilDraw: mins,
  };
}

/**
 * 判断当前预测是否过期（基于最近开奖日期）
 */
export function isPredictionStale(lastDrawDate: string): boolean {
  if (!lastDrawDate) return true;
  const lastDraw = new Date(lastDrawDate);
  const now = new Date();
  // 如果最近开奖超过3天，认为数据已陈旧
  const diffDays = (now.getTime() - lastDraw.getTime()) / (1000 * 86400);
  return diffDays > 3;
}

/**
 * 格式化为"X小时Y分钟"或"X天Y小时"
 */
export function formatCountdown(hours: number, minutes: number): string {
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}天${hours % 24}小时`;
  }
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}

/**
 * 获取所有彩种最近一次开奖日期
 */
export function getLatestDrawDates(): Record<string, string> {
  const dates: Record<string, string> = {};
  const now = new Date();
  for (const [key, schedule] of Object.entries(DRAW_SCHEDULES)) {
    // 找最近的过去开奖日
    const [drawHour, drawMin] = schedule.drawTime.split(":").map(Number);
    for (let lookback = 0; lookback < 14; lookback++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - lookback);
      if (schedule.drawDays.includes(checkDate.getDay())) {
        checkDate.setHours(drawHour, drawMin, 0, 0);
        if (checkDate <= now) {
          dates[key] = checkDate.toISOString();
          break;
        }
      }
    }
  }
  return dates;
}
