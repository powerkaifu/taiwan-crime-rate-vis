// npm run check：用規格書 §3.4 的驗收數字核對資料處理結果
import { readFileSync } from 'node:fs'
import { buildCrimeData } from '../src/utils/crimeModel.js'
import { poissonCI } from '../src/utils/stats.js'
import { validateTileLayout } from '../src/utils/tileLayout.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const { counties, meta } = buildCrimeData(
  read('data/csv/各縣市刑案數據.csv'),
  read('data/csv/01_表1_主要警政指標_全國歷年走勢_2005_2025.csv'),
)
const by = (id) => counties.find((c) => c.id === id)

let failed = 0
function check(label, actual, expected, tol = 1e-6) {
  const ok =
    typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) <= tol
      : actual === expected
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${label}：${actual}${ok ? '' : `（應為 ${expected}）`}`)
}

const clearances = counties.map((c) => ({ id: c.id, v: c.全般.clearance }))
const minC = clearances.reduce((a, b) => (b.v < a.v ? b : a))
const maxC = clearances.reduce((a, b) => (b.v > a.v ? b : a))
const [ci8lo, ci8hi] = poissonCI(8)

check('縣市數', counties.length, 22)
check('六都數', counties.filter((c) => c.isSixCity).length, 6)
check('全般犯罪率中位數', meta.types.全般.medianRate, 2440.0)
check('全般破獲率中位數', meta.types.全般.medianClearance, 73.285)
check('暴力犯罪率中位數', meta.types.暴力.medianRate, 2.445)
check('暴力破獲率中位數（排除連江）', meta.types.暴力.medianClearance, 100.0)
check('竊盜犯罪率中位數', meta.types.竊盜.medianRate, 323.325)
check('竊盜破獲率中位數', meta.types.竊盜.medianClearance, 75.235)
check('花蓮 全般件數名次', by('花蓮縣').全般.rankCount, 17)
check('花蓮 全般犯罪率名次', by('花蓮縣').全般.rankRate, 1)
check('花蓮 全般犯罪率', by('花蓮縣').全般.rate, 2889.93)
check('花蓮 全般破獲率', by('花蓮縣').全般.clearance, 59.58)
check('新北 全般件數名次', by('新北市').全般.rankCount, 1)
check('新北 全般犯罪率名次', by('新北市').全般.rankRate, 3)
check('彰化 全般件數名次', by('彰化縣').全般.rankCount, 7)
check('彰化 全般犯罪率名次', by('彰化縣').全般.rankRate, 18)
check('全般破獲率最低', `${minC.id} ${minC.v}`, '新竹縣 57.78')
check('全般破獲率最高', `${maxC.id} ${maxC.v}`, '嘉義縣 91.34')
check('澎湖 暴力件數', by('澎湖縣').暴力.count, 8)
check('澎湖 暴力犯罪率', by('澎湖縣').暴力.rate, 7.46)
check('澎湖 暴力犯罪率名次', by('澎湖縣').暴力.rankRate, 1)
check('連江 暴力件數', by('連江縣').暴力.count, 0)
check('連江 暴力破獲率（應為 null）', by('連江縣').暴力.clearance, null)
check('連江 暴力區間下限', by('連江縣').暴力.ciLow, 0)
check('Poisson 區間 k=8 下限', ci8lo, 3.4538, 1e-3)
check('Poisson 區間 k=8 上限', ci8hi, 15.7632, 1e-3)
check('全國 2025 全般件數', meta.national.全般.count, 608717)
check('等積地圖座標（錯誤數）', validateTileLayout(counties.map((c) => c.id)).length, 0)

console.log(failed ? `\n${failed} 項不符` : '\n全部通過')
process.exit(failed ? 1 : 0)
