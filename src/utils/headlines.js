// 每張圖標題上的一句結論與縣市摘要：全部由資料計算，不寫死縣市名稱（規格書 §4.5）
import * as d3 from 'd3'

const fmtRate = d3.format(',.2f')
const fmtCount = d3.format(',')
const fmtPct = d3.format('.1f')

const byRate = (type) => (a, b) => b[type].rate - a[type].rate
const byCount = (type) => (a, b) => b[type].count - a[type].count

/** 圖 A：依目前排序依據，第 1 名是誰、換另一種排法是第幾名 */
export function headlineA(counties, type, mode) {
  const topRate = [...counties].sort(byRate(type))[0]
  const topCount = [...counties].sort(byCount(type))[0]
  if (topRate.id === topCount.id) return `${topRate.id}件數與犯罪率都是第 1 名`
  if (mode === 'count')
    return `件數最多是${topCount.id}，換成犯罪率排第 ${topCount[type].rankRate}；犯罪率第 1 是${topRate.id}`
  return `犯罪率最高是${topRate.id}（件數第 ${topRate[type].rankCount}）；件數最多的${topCount.id}排第 ${topCount[type].rankRate}`
}

/** 圖 B：犯罪率高於中位數、破獲率低於中位數的縣市 */
export function headlineB(counties, meta, type) {
  const { medianRate, medianClearance } = meta.types[type]
  const hit = counties
    .filter((c) => c[type].clearance !== null && c[type].rate > medianRate && c[type].clearance < medianClearance)
    .sort(byRate(type))
  if (hit.length === 0) return '沒有縣市同時犯罪率高於中位數、破獲率低於中位數'
  const names = hit.length <= 4 ? hit.map((c) => c.id).join('、') : `${hit.slice(0, 3).map((c) => c.id).join('、')}等`
  return `犯罪率高於中位數、破獲率低於中位數：${names} ${hit.length} 縣市`
}

/** 圖 C：顏色最深的 3 個縣市 */
export function headlineC(counties, type) {
  const top = [...counties].sort(byRate(type)).slice(0, 3)
  return `顏色最深：${top.map((c) => c.id).join('、')}`
}

/** 控制列的縣市摘要：犯罪率、件數、破獲率與全國中位數 */
export function countySummary(county, meta, type) {
  const d = county[type]
  const med = meta.types[type].medianClearance
  const clr = d.clearance === null ? '破獲率無法計算（0 件）' : `破獲率 ${fmtPct(d.clearance)}%（中位數 ${fmtPct(med)}%）`
  return [
    county.id,
    `犯罪率 ${fmtRate(d.rate)}（第 ${d.rankRate}）`,
    `件數 ${fmtCount(d.count)}（第 ${d.rankCount}）`,
    clr,
  ]
}
