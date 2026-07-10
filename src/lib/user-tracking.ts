/**
 * 📊 数字碰 · 用户行为追踪
 * 基于 localStorage 的核心指标埋点，无外部依赖
 */

const TRACK_KEY = "szp_track";
const SESSION_KEY = "szp_session";

interface TrackEvent {
  type: string;
  ts: number;
  data?: any;
}

interface TrackingData {
  sessions: number;          // 会话次数
  totalBets: number;         // 总投注数
  modeSwitches: number;      // 模式切换次数
  quickPickCount: number;    // 机选次数
  manualPickCount: number;   // 手动选号次数
  rebetCount: number;        // 再来一注使用次数
  historyViewCount: number;  // 查看历史次数
  lastVisitDate: string;     // 上次访问日期
  visitDates: string[];      // 所有访问日期(去重用)
  totalWin: number;          // 总盈利
  totalCost: number;         // 总投注额
  firstVisit: number;        // 首次访问时间戳
  lastRebetTime: number;     // 上次使用"再来一注"时间
  conDay: number;            // 连续访问天数
}

const DEFAULT_TRACK: TrackingData = {
  sessions: 0, totalBets: 0, modeSwitches: 0,
  quickPickCount: 0, manualPickCount: 0, rebetCount: 0,
  historyViewCount: 0, lastVisitDate: "", visitDates: [],
  totalWin: 0, totalCost: 0, firstVisit: Date.now(),
  lastRebetTime: 0, conDay: 0,
};

function load(): TrackingData {
  try {
    const raw = localStorage.getItem(TRACK_KEY);
    return raw ? { ...DEFAULT_TRACK, ...JSON.parse(raw) } : { ...DEFAULT_TRACK };
  } catch { return { ...DEFAULT_TRACK }; }
}

function save(data: TrackingData) {
  try { localStorage.setItem(TRACK_KEY, JSON.stringify(data)); } catch {}
}

/** 每次打开页面时调用，记录会话+连续天数 */
export function trackSession() {
  const data = load();
  data.sessions++;
  const today = new Date().toISOString().slice(0, 10);
  if (!data.visitDates.includes(today)) {
    data.visitDates.push(today);
    // 连续天数计算
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (data.visitDates.includes(yesterday)) {
      data.conDay++;
    } else {
      data.conDay = 1;
    }
  }
  data.lastVisitDate = today;
  save(data);
}

/** 记录投注 */
export function trackBet(cost: number, win: number) {
  const data = load();
  data.totalBets++;
  data.totalCost += cost;
  data.totalWin += win;
  save(data);
}

/** 记录模式切换 */
export function trackModeSwitch() {
  const data = load();
  data.modeSwitches++;
  save(data);
}

/** 记录机选 */
export function trackQuickPick() {
  const data = load();
  data.quickPickCount++;
  save(data);
}

/** 记录手动选号 */
export function trackManualPick() {
  const data = load();
  data.manualPickCount++;
  save(data);
}

/** 记录"再来一注" */
export function trackRebet() {
  const data = load();
  data.rebetCount++;
  data.lastRebetTime = Date.now();
  save(data);
}

/** 记录查看历史 */
export function trackHistoryView() {
  const data = load();
  data.historyViewCount++;
  save(data);
}

/** 获取追踪数据摘要（用于导出） */
export function getTrackingSummary(): TrackingData & { streakDays: number } {
  const data = load();
  return { ...data, streakDays: data.visitDates.length };
}

/** 获取近期关键指标（用于页面显示） */
export function getQuickStats() {
  const data = load();
  return {
    bets: data.totalBets,
    winRate: data.totalBets > 0 ? (data.totalWin > data.totalCost ? 1 : 0) : 0,
    favPick: data.quickPickCount > data.manualPickCount ? "机选" : "手动",
    conDay: data.conDay,
  };
}
