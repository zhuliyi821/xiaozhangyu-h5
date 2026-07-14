// ⚽ 省超足球竞猜 — 类型定义

// ─── 比赛状态 ───
export type MatchStatus = "upcoming" | "open" | "live" | "finished" | "settled";

export interface Match {
  id: string;                   // "M20260715_001"
  league: string;               // "湖北省超"
  round: string;                // "第15轮"
  homeTeam: string;             // "武汉江城"
  awayTeam: string;             // "长沙星城"
  matchTime: string;            // "2026-07-15 19:30"
  deadline: string;             // "2026-07-15 19:25" (赛前5分钟)
  status: MatchStatus;
  
  // 比分（比赛结束后填入）
  homeScore?: number;
  awayScore?: number;
  firstHalfHome?: number;
  firstHalfAway?: number;
  
  // 统计数据
  participants: number;
  totalPool: number;            // 总奖池(水晶石)
}

// ─── 玩法类型 ───
export type PlayTypeId = 
  | "1X2"           // 胜平负
  | "handicap"      // 让球胜平负
  | "half_time"     // 半场胜平负
  | "double_chance" // 双重机会
  | "draw_refund"   // 平局退款
  | "advance"       // 晋级预测
  | "total_goals"   // 总进球数
  | "over_under"    // 大小球
  | "both_score"    // 双方都进球
  | "home_goals"    // 主队进球数
  | "away_goals"    // 客队进球数
  | "team_scores";  // 进球/不进球队

// ─── 每个玩法在单场比赛的实例 ───
export interface PlayTypeInstance {
  id: PlayTypeId;
  name: string;                 // "胜平负"
  category: "胜负" | "进球";
  difficulty: "simple" | "medium" | "hard";
  stars: 1 | 2 | 3;
  multiplier: number;           // ×1 / ×2 / ×4
  options: PlayOption[];        // 该玩法的可选选项
  totalBets: number;            // 该玩法总参与
  participants: number;         // 参与人数
  config?: PlayTypeConfig;      // 额外配置（让球线、大小球线等）
}

export interface PlayOption {
  key: string;                  // "home"/"draw"/"away"
  label: string;                // "主胜"
  subLabel?: string;            // "江城胜"
  betCount: number;             // 参与人数
  betAmount: number;            // 总参与额
  pct: number;                  // 参与占比
}

export interface PlayTypeConfig {
  handicapLine?: number;        // 让球线 例：-1
  overUnderLine?: number;       // 大小球线 例：2.5
  targetTeam?: "home" | "away"; // 目标球队（玩法12）
}

// ─── 参与 ───
export interface SportsBet {
  id: string;
  matchId: string;
  playType: PlayTypeId;
  option: string;               // 选的选项key
  amount: number;               // 参与🎮
  estimatedReward: number;      // 预估⛏️
  status: "pending" | "won" | "lost" | "draw_refunded";
  reward?: number;              // 实际赢得⛏️
  settledAt?: string;
}

// ─── 玩法配置表（数据驱动） ───
export const PLAY_TYPE_CONFIGS: Record<PlayTypeId, Omit<PlayTypeInstance, "totalBets" | "participants" | "options"> & { defaultOptions: PlayOption[] }> = {
  "1X2": {
    id: "1X2", name: "胜平负", category: "胜负",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "home", label: "主胜", subLabel: "主队胜", betCount: 0, betAmount: 0, pct: 0 },
      { key: "draw", label: "平局", subLabel: "双方平", betCount: 0, betAmount: 0, pct: 0 },
      { key: "away", label: "客胜", subLabel: "客队胜", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "handicap": {
    id: "handicap", name: "让球胜平负", category: "胜负",
    difficulty: "medium", stars: 2, multiplier: 2,
    defaultOptions: [
      { key: "home", label: "主胜", subLabel: "净胜2球+", betCount: 0, betAmount: 0, pct: 0 },
      { key: "draw", label: "平局", subLabel: "刚好赢1球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "away", label: "客胜", subLabel: "不败或小负", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "half_time": {
    id: "half_time", name: "半场胜平负", category: "胜负",
    difficulty: "medium", stars: 2, multiplier: 2,
    defaultOptions: [
      { key: "home", label: "主胜", betCount: 0, betAmount: 0, pct: 0 },
      { key: "draw", label: "平局", betCount: 0, betAmount: 0, pct: 0 },
      { key: "away", label: "客胜", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "double_chance": {
    id: "double_chance", name: "双重机会", category: "胜负",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "home_draw", label: "主胜/平", subLabel: "主队不败", betCount: 0, betAmount: 0, pct: 0 },
      { key: "home_away", label: "主胜/客胜", subLabel: "必分胜负", betCount: 0, betAmount: 0, pct: 0 },
      { key: "draw_away", label: "平/客胜", subLabel: "客队不败", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "draw_refund": {
    id: "draw_refund", name: "平局退款", category: "胜负",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "home", label: "主胜", betCount: 0, betAmount: 0, pct: 0 },
      { key: "away", label: "客胜", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "advance": {
    id: "advance", name: "晋级预测", category: "胜负",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "home", label: "主队晋级", betCount: 0, betAmount: 0, pct: 0 },
      { key: "away", label: "客队晋级", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "total_goals": {
    id: "total_goals", name: "总进球数", category: "进球",
    difficulty: "medium", stars: 2, multiplier: 2,
    defaultOptions: [
      { key: "0", label: "0球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "1", label: "1球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "2", label: "2球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "3", label: "3球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "4", label: "4球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "5", label: "5+球", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "over_under": {
    id: "over_under", name: "大小球", category: "进球",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "over", label: "大球", subLabel: ">界线", betCount: 0, betAmount: 0, pct: 0 },
      { key: "under", label: "小球", subLabel: "<界线", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "both_score": {
    id: "both_score", name: "双方都进球", category: "进球",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "yes", label: "是", subLabel: "两队都进球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "no", label: "否", subLabel: "至少一队0球", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "home_goals": {
    id: "home_goals", name: "主队进球数", category: "进球",
    difficulty: "medium", stars: 2, multiplier: 2,
    defaultOptions: [
      { key: "0", label: "0球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "1", label: "1球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "2", label: "2球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "3", label: "3球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "4", label: "4+球", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "away_goals": {
    id: "away_goals", name: "客队进球数", category: "进球",
    difficulty: "medium", stars: 2, multiplier: 2,
    defaultOptions: [
      { key: "0", label: "0球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "1", label: "1球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "2", label: "2球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "3", label: "3球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "4", label: "4+球", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
  "team_scores": {
    id: "team_scores", name: "球队进球", category: "进球",
    difficulty: "simple", stars: 1, multiplier: 1,
    defaultOptions: [
      { key: "yes", label: "能进球", betCount: 0, betAmount: 0, pct: 0 },
      { key: "no", label: "不能进球", betCount: 0, betAmount: 0, pct: 0 },
    ],
  },
};

// ─── 判定结果 ───
export interface PlayTypeResult {
  playType: PlayTypeId;
  winnerKey: string;            // 赢家选项key
  loserKeys: string[];          // 输家选项keys
  isDrawRefund?: boolean;       // 是否平局退款
}

// ─── 模拟数据 ───
export const MOCK_MATCHES: Match[] = [
  {
    id: "M20260715_001",
    league: "湖北省超",
    round: "第15轮",
    homeTeam: "武汉江城",
    awayTeam: "长沙星城",
    matchTime: "2026-07-15 19:30",
    deadline: "2026-07-15 19:25",
    status: "open",
    participants: 328,
    totalPool: 500000,
  },
  {
    id: "M20260716_001",
    league: "广东省超",
    round: "第12轮",
    homeTeam: "广州恒达",
    awayTeam: "深圳鹏城",
    matchTime: "2026-07-16 20:00",
    deadline: "2026-07-16 19:55",
    status: "upcoming",
    participants: 156,
    totalPool: 320000,
  },
  {
    id: "M20260714_001",
    league: "浙江省超",
    round: "第10轮",
    homeTeam: "杭州绿城",
    awayTeam: "宁波甬城",
    matchTime: "2026-07-14 19:30",
    deadline: "2026-07-14 19:25",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
    firstHalfHome: 1,
    firstHalfAway: 0,
    participants: 412,
    totalPool: 680000,
  },
];
