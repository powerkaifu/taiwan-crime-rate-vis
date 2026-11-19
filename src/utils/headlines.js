// 每張圖標題上的一句結論與縣市摘要：全部由資料計算，不寫死縣市名稱（規格書 §4.5）
// 第 13 步：結論跟著篩選走——只在目前篩選的縣市中找，名次仍是全國 22 縣市的名次。
import { passesFilter } from '../composables/useViewState.js'
import { fmtCount, fmtPct, fmtRate } from './format.js'
import { rateColorScale } from './colors.js'

const byRate = (type) => (a, b) => b[type].rate - a[type].rate
const byCount = (type) => (a, b) => b[type].count - a[type].count
const SCOPE = { all: '', six: '六都中，', nonSix: '非六都中，' }
const subset = (counties, filter) => counties.filter((c) => passesFilter(c, filter))

/** 圖 A：依目前排序依據，第 1 名是誰、換另一種排法是第幾名 */
export function headlineA(counties, type, mode, filter = 'all') {
  const list = subset(counties, filter)
  const topRate = [...list].sort(byRate(type))[0]
  const topCount = [...list].sort(byCount(type))[0]
  const scope = SCOPE[filter]
  const nat = filter === 'all' ? '' : '全國'
  if (topRate.id === topCount.id)
    return `${scope}${topRate.id}件數與犯罪率都最高（${nat}件數第 ${topRate[type].rankCount}、犯罪率第 ${topRate[type].rankRate}）`
  if (mode === 'count')
    return `${scope}件數最多是${topCount.id}，換成犯罪率排${nat}第 ${topCount[type].rankRate}；犯罪率最高是${topRate.id}`
  return `${scope}犯罪率最高是${topRate.id}（${nat}件數第 ${topRate[type].rankCount}）；件數最多的${topCount.id}犯罪率排${nat}第 ${topCount[type].rankRate}`
}

/** 犯罪率高於中位數、破獲率低於中位數的縣市，依犯罪率排序（中位數以全國 22 縣市計算） */
export function scatterHits(counties, meta, type, filter = 'all') {
  const { medianRate, medianClearance } = meta.types[type]
  return subset(counties, filter)
    .filter((c) => c[type].clearance !== null && c[type].rate > medianRate && c[type].clearance < medianClearance)
    .sort(byRate(type))
}

/** 圖 C（散佈圖）標題：點名上面那些縣市（4 個以內全列，超過列前 3 個） */
export function headlineScatter(counties, meta, type, filter = 'all') {
  const hit = scatterHits(counties, meta, type, filter)
  const scope = SCOPE[filter]
  if (hit.length === 0) return `${scope}沒有縣市同時犯罪率高於、破獲率低於全國中位數`
  const names = hit.length <= 4 ? hit.map((c) => c.id).join('、') : `${hit.slice(0, 3).map((c) => c.id).join('、')}等`
  return `${scope}犯罪率高於中位數、破獲率低於中位數：${names} ${hit.length} 縣市`
}

/** 圖 B（等積方塊地圖）：目前篩選中顏色最深那一級的縣市（分級以全國 22 縣市計算） */
export function headlineTile(counties, type, filter = 'all') {
  const level = rateColorScale(counties.map((c) => c[type].rate))
  const list = [...subset(counties, filter)].sort(byRate(type))
  const top = list.filter((c) => level(c[type].rate) === level(list[0][type].rate))
  return `${SCOPE[filter]}顏色最深：${top.map((c) => c.id).join('、')}`
}

/** 控制列的縣市摘要：犯罪率、件數、破獲率與全國中位數 */
export function countySummary(county, meta, type) {
  const d = county[type]
  const med = meta.types[type].medianClearance
  const clr = d.clearance === null ? '破獲率無法計算（0 件）' : `破獲率 ${fmtPct(d.clearance)}（中位數 ${fmtPct(med)}）`
  return [
    county.id,
    `犯罪率 ${fmtRate(d.rate, type)}（第 ${d.rankRate}）`,
    `件數 ${fmtCount(d.count)}（第 ${d.rankCount}）`,
    clr,
  ]
}
