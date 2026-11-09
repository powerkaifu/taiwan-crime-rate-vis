// 數字格式統一（第 13 步，審查意見「精度不一」）：
// 每十萬人犯罪率：全般刑案、竊盜到整數；暴力犯罪數值小，到小數兩位。百分比一律小數一位。
// 例外：資料表保留原始兩位小數，作為查詢原值用。
import * as d3 from 'd3'

const f0 = d3.format(',.0f')
const f2 = d3.format(',.2f')
const f1 = d3.format('.1f')
const fc = d3.format(',')

export const fmtRate = (v, type) => (type === '暴力' ? f2(v) : f0(v))
export const fmtPct = (v) => `${f1(v)}%`
export const fmtCount = (v) => fc(v)
