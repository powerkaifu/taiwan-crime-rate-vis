import * as d3 from 'd3'

// 區域色（色盲友善；顏色只輔助，圖例與 Tooltip 都有文字）（規格書 §4.1）
export const REGION_COLORS = {
  北部: '#4e79a7',
  中部: '#f28e2b',
  南部: '#59a14f',
  東部: '#b07aa1',
  離島: '#8c8c8c',
}

// 件數模式的灰色（與 style.css 的 --count 相同）
export const COUNT_COLOR = '#7f8c92'

// 每十萬人犯罪率的分級色階：圖 A 橫條與圖 B 方塊共用，同一縣市兩張圖顏色一致。
// 依老師建議改為 5 級區間；用分位數分級（scaleQuantile），每級約 4-5 個縣市。
// 不用等距分級：金門、連江、澎湖特別低，會把範圍拉寬，多數縣市擠在最深兩級。
// 最淺一級比舊版深，白底上的短橫條也看得到。
export const RATE_RAMP = ['#B7D3D6', '#0E6F7A']
export const RATE_STEPS = 5
export const RATE_STEP_COLORS = d3.range(RATE_STEPS).map((i) => d3.interpolateLab(...RATE_RAMP)(i / (RATE_STEPS - 1)))
/** 依該案類 22 縣市犯罪率的分位數分成 5 級（篩選不影響分級，永遠以全國 22 縣市計算） */
export function rateColorScale(rates) {
  return d3.scaleQuantile().domain(rates).range(RATE_STEP_COLORS)
}
/** 圖例：每一級的顏色與數值範圍 [下界, 上界) */
export function rateLegend(rates) {
  const q = rateColorScale(rates)
  const cuts = [d3.min(rates), ...q.quantiles(), d3.max(rates)]
  return RATE_STEP_COLORS.map((color, i) => ({ color, from: cuts[i], to: cuts[i + 1] }))
}
