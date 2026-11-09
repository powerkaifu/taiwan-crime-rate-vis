// 統計工具：中位數、競賽排名、Poisson 精確信賴區間（規格書 §3.3）

/** 中位數；忽略 null／NaN */
export function median(values) {
  const v = values.filter((x) => x !== null && !Number.isNaN(x)).sort((a, b) => a - b)
  if (!v.length) return null
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

/**
 * 競賽排名（competition ranking）：由大到小，1 為最高，並列同名次（1, 2, 2, 4）。
 * 回傳與 values 同順序的名次陣列。
 */
export function competitionRank(values) {
  return values.map((x) => values.filter((y) => y > x).length + 1)
}

/** Poisson 累積機率 P(X ≤ k | λ)，以對數計算避免溢位 */
function poissonCdf(k, lambda) {
  if (k < 0) return 0
  if (lambda === 0) return 1
  let logTerm = -lambda // log P(X=0)
  let sum = Math.exp(logTerm)
  for (let i = 1; i <= k; i++) {
    logTerm += Math.log(lambda) - Math.log(i)
    sum += Math.exp(logTerm)
  }
  return Math.min(sum, 1)
}

/** 在 [lo, hi] 以二分搜尋找出遞減函數 f(λ) = target 的 λ */
function bisect(f, target, lo, hi) {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) > target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * 件數 k 的 Poisson 精確 95% 信賴區間（Garwood 法）。
 * 下限：P(X ≥ k | λ) = 0.025；上限：P(X ≤ k | λ) = 0.025；k = 0 時下限為 0。
 */
export function poissonCI(k, alpha = 0.05) {
  const hi = k * 3 + 20
  const upper = bisect((l) => poissonCdf(k, l), alpha / 2, 0, hi)
  const lower = k === 0 ? 0 : bisect((l) => poissonCdf(k - 1, l), 1 - alpha / 2, 0, hi)
  return [lower, upper]
}
