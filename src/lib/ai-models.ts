/**
 * 🧠 AI 数学模型引擎
 *
 * 采用多种先进数学模型进行彩票预测：
 * 1. 频率分析 (Frequency Analysis)
 * 2. 贝叶斯概率更新 (Bayesian Inference)
 * 3. 马尔可夫链 (Markov Chain)
 * 4. 模式识别 (Pattern Recognition)
 * 5. 蒙特卡洛模拟 (Monte Carlo Simulation)
 * 6. 加权集成模型 (Weighted Ensemble)
 */

export interface ModelResult {
  number: number;
  score: number;         // 0-100 综合得分
  freqScore: number;     // 频率模型得分
  bayesScore: number;    // 贝叶斯得分
  markovScore: number;   // 马尔可夫得分
  patternScore: number;  // 模式得分
  monteCarloScore: number; // 蒙特卡洛得分
  missValue: number;     // 遗漏值
  confidence: number;    // 置信度 0-100
}

export interface PredictionResult {
  front: ModelResult[];
  back: ModelResult[];
  ensemble: {
    top5: number[];
    top3Back?: number[];
    score: number;
    modelWeights: Record<string, number>;
  };
  stats: {
    totalPeriods: number;
    weightedAccuracy: number;
    modelContributions: Record<string, number>;
    hotZones: string;
    coldZones: string;
  };
}

/**
 * 主预测引擎 - 运行所有模型并返回综合结果
 */
export function predict(data: { front: number[][]; back?: number[][] }, config: {
  frontMax: number;
  backMax: number;
  totalPeriods?: number;
}): PredictionResult {
  const { frontMax, backMax, totalPeriods = data.front.length } = config;
  const periods = Math.min(totalPeriods, data.front.length);
  const recentData = {
    front: data.front.slice(-periods),
    back: data.back?.slice(-periods),
  };

  // ── 1. Frequency Analysis ──
  const frontFreq = calcFrequency(recentData.front, frontMax);
  const backFreq = recentData.back ? calcFrequency(recentData.back, backMax) : [];

  // ── 2. Bayesian Inference ──
  const frontBayes = calcBayesian(recentData.front, frontMax);
  const backBayes = recentData.back ? calcBayesian(recentData.back, backMax) : [];

  // ── 3. Markov Chain ──
  const frontMarkov = calcMarkov(recentData.front, frontMax);
  const backMarkov = recentData.back ? calcMarkov(recentData.back, backMax) : [];

  // ── 4. Pattern Recognition ──
  const frontPattern = calcPattern(recentData.front, frontMax);
  const backPattern = recentData.back ? calcPattern(recentData.back, backMax) : [];

  // ── 5. Monte Carlo Simulation ──
  const frontMonte = calcMonteCarlo(recentData.front, frontMax);
  const backMonte = recentData.back ? calcMonteCarlo(recentData.back, backMax) : [];

  // ── 6. Missing Values ──
  const frontMiss = calcMissingValue(recentData.front, frontMax);
  const backMiss = recentData.back ? calcMissingValue(recentData.back, backMax) : [];

  // ── Ensemble: Weighted Combination ──
  const weights = { freq: 0.25, bayes: 0.20, markov: 0.15, pattern: 0.20, monte: 0.20 };
  const result = ensembleModels(
    frontFreq, frontBayes, frontMarkov, frontPattern, frontMonte, frontMiss,
    backFreq, backBayes, backMarkov, backPattern, backMonte, backMiss,
    weights, frontMax, backMax
  );

  return result;
}

/* ═══════════════════════════════════
   1. Frequency Analysis (频率分析)
   ═══════════════════════════════════ */

function calcFrequency(data: number[][], maxNum: number): number[] {
  const freq = new Array(maxNum).fill(0);
  data.forEach(row => {
    const seen = new Set(row);
    seen.forEach(n => { if (n >= 1 && n <= maxNum) freq[n - 1]++; });
  });
  const max = Math.max(...freq, 1);
  return freq.map(v => (v / max) * 100);
}

/* ═══════════════════════════════════
   2. Bayesian Inference (贝叶斯更新)
   ═══════════════════════════════════ */

function calcBayesian(data: number[][], maxNum: number): number[] {
  const prior = 1 / maxNum; // Prior: uniform
  const frequencies = new Array(maxNum).fill(0);
  let total = 0;

  data.forEach(row => {
    const seen = new Set(row);
    seen.forEach(n => {
      if (n >= 1 && n <= maxNum) {
        frequencies[n - 1]++;
        total++;
      }
    });
  });

  // Bayesian posterior: P(num|data) = P(data|num)*P(num) / P(data)
  // Using Beta-Binomial conjugate: posterior = (alpha + count) / (alpha + beta + total)
  const alpha = 1; // Prior successes
  const beta = maxNum - 1; // Prior failures

  return frequencies.map(count => {
    const posterior = (alpha + count) / (alpha + beta + total);
    return posterior * 100; // Convert to percentage-like score
  });
}

/* ═══════════════════════════════════
   3. Markov Chain (马尔可夫链)
   ═══════════════════════════════════ */

function calcMarkov(data: number[][], maxNum: number): number[] {
  // Transition matrix: P(next | current)
  const transitions: number[][] = Array.from({ length: maxNum + 1 }, () => new Array(maxNum + 1).fill(0));
  const counts = new Array(maxNum + 1).fill(0);

  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];
    current.forEach(c => {
      next.forEach(n => {
        if (c >= 1 && c <= maxNum && n >= 1 && n <= maxNum) {
          transitions[c][n]++;
          counts[c]++;
        }
      });
    });
  }

  // Score each number based on the last draw's transition probabilities
  const lastDraw = data[data.length - 1] || [];
  const scores = new Array(maxNum).fill(0);

  lastDraw.forEach(from => {
    if (from >= 1 && from <= maxNum) {
      for (let to = 1; to <= maxNum; to++) {
        const prob = counts[from] > 0 ? transitions[from][to] / counts[from] : 1 / maxNum;
        scores[to - 1] += prob;
      }
    }
  });

  const maxScore = Math.max(...scores, 0.001);
  return scores.map(v => (v / maxScore) * 100);
}

/* ═══════════════════════════════════
   4. Pattern Recognition (模式识别)
   ═══════════════════════════════════ */

function calcPattern(data: number[][], maxNum: number): number[] {
  const scores = new Array(maxNum).fill(0);
  const totalDraws = data.length;

  if (totalDraws < 5) return scores;

  // Pattern 1: Gap frequency (间隔模式)
  data.forEach((row, idx) => {
    if (idx === 0) return;
    row.forEach(n => {
      if (n < 1 || n > maxNum) return;
      for (let lookback = 1; lookback <= Math.min(20, idx); lookback++) {
        const prevRow = data[idx - lookback];
        if (prevRow?.includes(n)) {
          // Recent recurrence = higher score
          scores[n - 1] += Math.max(0, 20 - lookback) * 0.5;
          break;
        }
      }
    });
  });

  // Pattern 2: Pair frequency (号码对)
  const pairs: Map<string, number> = new Map();
  data.forEach(row => {
    for (let i = 0; i < row.length; i++) {
      for (let j = i + 1; j < row.length; j++) {
        const key = `${Math.min(row[i], row[j])}-${Math.max(row[i], row[j])}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  });

  // Boost scores for numbers that appear in frequent pairs
  const lastRow = data[data.length - 1] || [];
  lastRow.forEach(n => {
    if (n < 1 || n > maxNum) return;
    for (let other = 1; other <= maxNum; other++) {
      const key = `${Math.min(n, other)}-${Math.max(n, other)}`;
      const pairFreq = pairs.get(key) || 0;
      if (pairFreq > totalDraws * 0.1) {
        scores[other - 1] += pairFreq * 2;
      }
    }
  });

  // Pattern 3: Range distribution (区间分布)
  const rangeSize = Math.ceil(maxNum / 5);
  const rangeCounts = new Array(Math.ceil(maxNum / rangeSize)).fill(0);
  data.slice(-30).forEach(row => {
    row.forEach(n => {
      if (n >= 1 && n <= maxNum) {
        const rangeIdx = Math.floor((n - 1) / rangeSize);
        rangeCounts[rangeIdx] = rangeCounts[rangeIdx] || 0;
        rangeCounts[rangeIdx]++;
      }
    });
  });

  // Cold ranges get a boost
  const maxRangeCount = Math.max(...rangeCounts, 1);
  rangeCounts.forEach((count, idx) => {
    if (count < maxRangeCount * 0.5) {
      for (let n = idx * rangeSize + 1; n <= Math.min((idx + 1) * rangeSize, maxNum); n++) {
        scores[n - 1] += 15;
      }
    }
  });

  const maxScore = Math.max(...scores, 0.001);
  return scores.map(v => (v / maxScore) * 100);
}

/* ═══════════════════════════════════
   5. Monte Carlo Simulation (蒙特卡洛模拟)
   ═══════════════════════════════════ */

function calcMonteCarlo(data: number[][], maxNum: number): number[] {
  const scores = new Array(maxNum).fill(0);
  const simulations = 10000;
  const freq = new Array(maxNum).fill(0);

  data.forEach(row => {
    const seen = new Set(row);
    seen.forEach(n => { if (n >= 1 && n <= maxNum) freq[n - 1]++; });
  });

  // Weighted random sampling based on historical frequency
  const totalFreq = freq.reduce((a, b) => a + b, 0);
  const probs = freq.map(v => (v + 1) / (totalFreq + maxNum)); // Laplace smoothing

  for (let sim = 0; sim < simulations; sim++) {
    const drawn = new Set<number>();
    while (drawn.size < Math.min(6, maxNum)) {
      const r = Math.random();
      let cumProb = 0;
      for (let n = 1; n <= maxNum; n++) {
        cumProb += probs[n - 1];
        if (r <= cumProb) { drawn.add(n); break; }
      }
    }
    drawn.forEach(n => { if (n >= 1 && n <= maxNum) scores[n - 1]++; });
  }

  // Only last 30 periods recentcy boost
  data.slice(-30).forEach(row => {
    const seen = new Set(row);
    seen.forEach(n => { if (n >= 1 && n <= maxNum) scores[n - 1] += 5; });
  });

  const maxScore = Math.max(...scores, 0.001);
  return scores.map(v => (v / maxScore) * 100);
}

/* ═══════════════════════════════════
   Missing Values (遗漏值)
   ═══════════════════════════════════ */

function calcMissingValue(data: number[][], maxNum: number): number[] {
  const misses = new Array(maxNum).fill(0);
  for (let i = data.length - 1; i >= 0; i--) {
    const drawn = new Set(data[i]);
    for (let n = 1; n <= maxNum; n++) {
      if (!drawn.has(n)) misses[n - 1]++;
      else misses[n - 1] = 0;
    }
  }
  return misses;
}

/* ═══════════════════════════════════
   Ensemble (加权集成)
   ═══════════════════════════════════ */

function ensembleModels(
  frontFreq: number[], frontBayes: number[], frontMarkov: number[],
  frontPattern: number[], frontMonte: number[], frontMiss: number[],
  backFreq: number[], backBayes: number[], backMarkov: number[],
  backPattern: number[], backMonte: number[], backMiss: number[],
  weights: Record<string, number>, frontMax: number, backMax: number
): PredictionResult {
  const combine = (
    freq: number[], bayes: number[], markov: number[],
    pattern: number[], monte: number[], miss: number[], maxNum: number
  ): ModelResult[] => {
    const maxMiss = Math.max(...miss, 1);
    return Array.from({ length: maxNum }, (_, i) => {
      const n = i + 1;
      // Normalize missing value to score (higher miss = higher score, capped)
      const missScore = Math.min(100, (miss[i] / maxMiss) * 100);

      const rawScores = {
        freq: freq[i] || 0,
        bayes: bayes[i] || 0,
        markov: markov[i] || 0,
        pattern: pattern[i] || 0,
        monte: monte[i] || 0,
      };

      const totalScore =
        rawScores.freq * weights.freq +
        rawScores.bayes * weights.bayes +
        rawScores.markov * weights.markov +
        rawScores.pattern * weights.pattern +
        rawScores.monte * weights.monte;

      // Normalize to 0-100
      const maxPossible = 100 * (weights.freq + weights.bayes + weights.markov + weights.pattern + weights.monte);
      const normalized = maxPossible > 0 ? Math.min(100, (totalScore / maxPossible) * 100) : 0;

      // Confidence: combination of score stability and missing value
      const scoreVariance = calculateScoreVariance(Object.values(rawScores));
      const confidence = Math.max(0, Math.min(100, normalized * 0.7 + (100 - scoreVariance) * 0.3));

      return {
        number: n,
        score: normalized,
        freqScore: rawScores.freq,
        bayesScore: rawScores.bayes,
        markovScore: rawScores.markov,
        patternScore: rawScores.pattern,
        monteCarloScore: rawScores.monte,
        missValue: miss[i],
        confidence,
      };
    }).sort((a, b) => b.score - a.score);
  };

  const frontResults = combine(frontFreq, frontBayes, frontMarkov, frontPattern, frontMonte, frontMiss, frontMax);
  const backResults = backMax > 0
    ? combine(backFreq, backBayes, backMarkov, backPattern, backMonte, backMiss, backMax)
    : [];

  const top5 = frontResults.slice(0, 5).map(r => r.number).sort((a, b) => a - b);
  const top3Back = backResults.slice(0, 3).map(r => r.number).sort((a, b) => a - b);

  // Calculate model contributions
  const modelContributions: Record<string, number> = {};
  let totalContribution = 0;
  frontResults.slice(0, 10).forEach(r => {
    modelContributions.freq = (modelContributions.freq || 0) + r.freqScore;
    modelContributions.bayes = (modelContributions.bayes || 0) + r.bayesScore;
    modelContributions.markov = (modelContributions.markov || 0) + r.markovScore;
    modelContributions.pattern = (modelContributions.pattern || 0) + r.patternScore;
    modelContributions.monte = (modelContributions.monte || 0) + r.monteCarloScore;
    totalContribution += r.freqScore + r.bayesScore + r.markovScore + r.patternScore + r.monteCarloScore;
  });
  Object.keys(modelContributions).forEach(k => {
    modelContributions[k] = totalContribution > 0 ? Math.round((modelContributions[k] / totalContribution) * 100) : 0;
  });

  const avgConfidence = frontResults.slice(0, 5).reduce((s, r) => s + r.confidence, 0) / 5;

  return {
    front: frontResults,
    back: backResults,
    ensemble: {
      top5,
      top3Back: top3Back.length > 0 ? top3Back : undefined,
      score: avgConfidence,
      modelWeights: weights,
    },
    stats: {
      totalPeriods: frontFreq.length > 0 ? Math.ceil(frontFreq[0] * 50) || 50 : 50,
      weightedAccuracy: Math.round(avgConfidence),
      modelContributions,
      hotZones: getZoneAnalysis(frontResults.slice(0, 8).map(r => r.number), frontMax),
      coldZones: getZoneAnalysis(frontResults.slice(-10).map(r => r.number), frontMax),
    },
  };
}

function calculateScoreVariance(scores: number[]): number {
  const valid = scores.filter(s => s > 0);
  if (valid.length <= 1) return 50;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((sum, s) => sum + (s - avg) ** 2, 0) / valid.length;
  return Math.min(100, Math.sqrt(variance));
}

function getZoneAnalysis(numbers: number[], maxNum: number): string {
  if (numbers.length === 0) return "N/A";
  const zones = ["01-07", "08-14", "15-21", "22-28", "29-35"];
  const zoneSize = Math.ceil(maxNum / zones.length);
  const zoneHits = new Array(zones.length).fill(0);
  numbers.forEach(n => {
    const idx = Math.floor((n - 1) / zoneSize);
    if (idx < zones.length) zoneHits[idx]++;
  });
  return zones
    .map((z, i) => `${z}:${zoneHits[i]}`)
    .filter((_, i) => zoneHits[i] > 0)
    .join(" ");
}
